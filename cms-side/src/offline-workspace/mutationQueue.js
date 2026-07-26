import {
  offlineStores,
  openOfflineDatabase,
} from "./offlineDatabase";
import { notifyOfflineWorkspaceChanged } from "./offlineEvents";

export const supportedOfflineMutationTypes = new Set([
  "attendance.update",
  "journal.create",
]);

function normalizeTeacherId(value) {
  const teacherId = Number(value);
  if (!Number.isSafeInteger(teacherId) || teacherId < 1) {
    throw new Error("teacherId must be a positive integer.");
  }
  return teacherId;
}

function normalizeStudentId(value) {
  const studentId = Number(value);
  if (!Number.isSafeInteger(studentId) || studentId < 1) {
    throw new Error("studentId must be a positive integer.");
  }
  return studentId;
}

export function generateClientMutationId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  if (globalThis.crypto?.getRandomValues) {
    const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = [...bytes].map((value) => value.toString(16).padStart(2, "0"));
    return [
      hex.slice(0, 4).join(""),
      hex.slice(4, 6).join(""),
      hex.slice(6, 8).join(""),
      hex.slice(8, 10).join(""),
      hex.slice(10).join(""),
    ].join("-");
  }
  throw new Error("Secure client mutation ID generation is unavailable.");
}

function sanitizeAttendanceMutation(payload, baseVersion) {
  const studentId = normalizeStudentId(payload?.studentId);
  const version = Number(baseVersion);
  if (!Number.isSafeInteger(version) || version < 1) {
    throw new Error("Attendance baseVersion must be a positive integer.");
  }
  if (
    typeof payload?.attendanceDate !== "string"
    || !payload.attendanceDate.trim()
    || typeof payload?.status !== "string"
    || !payload.status.trim()
  ) {
    throw new Error("Attendance mutation payload is invalid.");
  }
  return {
    baseVersion: version,
    entityKey: `attendance:${studentId}:${payload.attendanceDate.trim()}`,
    payload: {
      studentId,
      attendanceDate: payload.attendanceDate.trim(),
      status: payload.status.trim(),
    },
  };
}

function sanitizeJournalMutation(payload, clientMutationId) {
  if (Object.prototype.hasOwnProperty.call(payload || {}, "evidenceId")) {
    throw new Error("Offline journal mutation does not support evidenceId.");
  }
  const studentId = normalizeStudentId(payload?.studentId);
  if (
    typeof payload?.type !== "string"
    || !payload.type.trim()
    || typeof payload?.content !== "string"
    || !payload.content.trim()
    || typeof payload?.observedAt !== "string"
    || !payload.observedAt.trim()
  ) {
    throw new Error("Journal mutation payload is invalid.");
  }
  return {
    baseVersion: null,
    entityKey: `journal:${clientMutationId}`,
    payload: {
      studentId,
      type: payload.type.trim(),
      content: payload.content.trim(),
      voiceCaptureType: payload.voiceCaptureType ?? null,
      observedAt: payload.observedAt.trim(),
    },
  };
}

function notifyMutationEnqueued(mutation) {
  if (typeof window === "undefined" || !window.dispatchEvent) return;
  window.dispatchEvent(new CustomEvent("issa:offline-mutation-enqueued", {
    detail: {
      clientMutationId: mutation.clientMutationId,
      teacherId: mutation.teacherId,
    },
  }));
  notifyOfflineWorkspaceChanged({
    entityKey: mutation.entityKey,
    teacherId: mutation.teacherId,
  });
}

function buildStoredMutation({
  clientMutationId,
  teacherId,
  type,
  payload,
  baseVersion = null,
  createdAt,
  resolutionOf = null,
}, {
  idGenerator = generateClientMutationId,
  now = () => new Date(),
} = {}) {
  if (!supportedOfflineMutationTypes.has(type)) {
    throw new Error("Unsupported offline mutation type.");
  }

  const mutationId = clientMutationId || idGenerator();
  if (
    typeof mutationId !== "string"
    || !mutationId.trim()
    || mutationId.trim().length > 128
  ) {
    throw new Error(
      "clientMutationId must be a non-empty string up to 128 characters."
    );
  }
  const normalizedTeacherId = normalizeTeacherId(teacherId);
  const normalizedCreatedAt = createdAt || now().toISOString();
  if (Number.isNaN(new Date(normalizedCreatedAt).getTime())) {
    throw new Error("createdAt must be a valid date.");
  }

  const domainMutation = type === "attendance.update"
    ? sanitizeAttendanceMutation(payload, baseVersion)
    : sanitizeJournalMutation(payload, mutationId.trim());
  const timestamp = now().toISOString();
  const storedMutation = {
    clientMutationId: mutationId.trim(),
    teacherId: normalizedTeacherId,
    type,
    entityKey: domainMutation.entityKey,
    payload: domainMutation.payload,
    baseVersion: domainMutation.baseVersion,
    createdAt: new Date(normalizedCreatedAt).toISOString(),
    attemptCount: 0,
    nextAttemptAt: timestamp,
    status: "pending",
    lastErrorCode: null,
    lastErrorMessage: null,
    updatedAt: timestamp,
    ...(resolutionOf ? { resolutionOf } : {}),
  };
  return storedMutation;
}

async function putCompactedAttendanceMutation(storedMutation) {
  void "ISSA:CMS.OFFLINE_ATTENDANCE.COMPACT_MUTATION";
  const database = await openOfflineDatabase();
  const transaction = database.transaction(
    offlineStores.pendingMutations,
    "readwrite"
  );
  const matchingMutations = (
    await transaction.store.index("entityKey").getAll(storedMutation.entityKey)
  ).filter((mutation) => (
    mutation.teacherId === storedMutation.teacherId
    && mutation.type === "attendance.update"
  ));
  const syncingMutation = matchingMutations.find(
    (mutation) => mutation.status === "syncing"
  );
  if (syncingMutation) {
    await transaction.done;
    throw new Error("Attendance sedang disinkronkan. Coba kembali sesaat lagi.");
  }

  const reusableMutation = matchingMutations
    .sort((left, right) => (
      new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
    ))[0];
  const compactedMutation = reusableMutation
    ? {
      ...storedMutation,
      clientMutationId: reusableMutation.clientMutationId,
      baseVersion: reusableMutation.baseVersion,
      createdAt: reusableMutation.createdAt,
    }
    : storedMutation;

  await transaction.store.put(compactedMutation);
  await Promise.all(matchingMutations
    .filter((mutation) => (
      mutation.clientMutationId !== compactedMutation.clientMutationId
    ))
    .map((mutation) => transaction.store.delete(mutation.clientMutationId)));
  await transaction.done;
  return compactedMutation;
}

export async function enqueueMutation(mutationInput, options = {}) {
  void "ISSA:CMS.OFFLINE_WORKSPACE.ENQUEUE_MUTATION";
  const storedMutation = buildStoredMutation(mutationInput, options);

  const persistedMutation = storedMutation.type === "attendance.update"
    ? await putCompactedAttendanceMutation(storedMutation)
    : await (async () => {
      const database = await openOfflineDatabase();
      await database.put(offlineStores.pendingMutations, storedMutation);
      return storedMutation;
    })();
  notifyMutationEnqueued(persistedMutation);
  return persistedMutation;
}

async function listMutationsForTeacher(teacherId) {
  const database = await openOfflineDatabase();
  return database.getAllFromIndex(
    offlineStores.pendingMutations,
    "teacherId",
    normalizeTeacherId(teacherId)
  );
}

export async function listTeacherMutations(teacherId) {
  const mutations = await listMutationsForTeacher(teacherId);
  return mutations.sort((left, right) => (
    new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
  ));
}

export async function listPendingMutations(teacherId, {
  dueAt = null,
  limit = Number.POSITIVE_INFINITY,
} = {}) {
  const mutations = await listMutationsForTeacher(teacherId);
  const dueTimestamp = dueAt ? new Date(dueAt).getTime() : null;
  return mutations
    .filter((mutation) => (
      mutation.status === "pending"
      && (
        dueTimestamp === null
        || new Date(mutation.nextAttemptAt).getTime() <= dueTimestamp
      )
    ))
    .sort((left, right) => (
      new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
    ))
    .slice(0, limit);
}

export async function listFailedMutations(teacherId) {
  const mutations = await listMutationsForTeacher(teacherId);
  return mutations
    .filter((mutation) => mutation.status === "failed")
    .sort((left, right) => (
      new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
    ));
}

export async function markMutationSyncing(clientMutationId, updatedAt) {
  const database = await openOfflineDatabase();
  const transaction = database.transaction(
    offlineStores.pendingMutations,
    "readwrite"
  );
  const mutation = await transaction.store.get(clientMutationId);
  if (mutation) {
    await transaction.store.put({
      ...mutation,
      status: "syncing",
      updatedAt: updatedAt || new Date().toISOString(),
    });
  }
  await transaction.done;
  if (mutation) {
    notifyOfflineWorkspaceChanged({
      entityKey: mutation.entityKey,
      teacherId: mutation.teacherId,
    });
  }
  return mutation || null;
}

export async function markMutationPending(clientMutationId, {
  incrementAttempt = false,
  nextAttemptAt,
  lastErrorCode = null,
  lastErrorMessage = null,
  updatedAt,
} = {}) {
  const database = await openOfflineDatabase();
  const transaction = database.transaction(
    offlineStores.pendingMutations,
    "readwrite"
  );
  const mutation = await transaction.store.get(clientMutationId);
  if (!mutation) {
    await transaction.done;
    return null;
  }
  const nextMutation = {
    ...mutation,
    attemptCount: mutation.attemptCount + (incrementAttempt ? 1 : 0),
    nextAttemptAt: nextAttemptAt || mutation.nextAttemptAt,
    status: "pending",
    lastErrorCode,
    lastErrorMessage,
    updatedAt: updatedAt || new Date().toISOString(),
  };
  await transaction.store.put(nextMutation);
  await transaction.done;
  notifyOfflineWorkspaceChanged({
    entityKey: nextMutation.entityKey,
    teacherId: nextMutation.teacherId,
  });
  return nextMutation;
}

export async function markMutationFailed(clientMutationId, error = {}) {
  const database = await openOfflineDatabase();
  const transaction = database.transaction(
    offlineStores.pendingMutations,
    "readwrite"
  );
  const mutation = await transaction.store.get(clientMutationId);
  if (!mutation) {
    await transaction.done;
    return null;
  }
  const failedMutation = {
    ...mutation,
    status: "failed",
    lastErrorCode: error.code || "mutation_rejected",
    lastErrorMessage: safeRejectedMutationMessage(error, mutation.type),
    updatedAt: new Date().toISOString(),
  };
  await transaction.store.put(failedMutation);
  await transaction.done;
  notifyOfflineWorkspaceChanged({
    entityKey: failedMutation.entityKey,
    teacherId: failedMutation.teacherId,
  });
  return failedMutation;
}

export async function removeMutation(clientMutationId) {
  const database = await openOfflineDatabase();
  const mutation = await database.get(
    offlineStores.pendingMutations,
    clientMutationId
  );
  await database.delete(offlineStores.pendingMutations, clientMutationId);
  if (mutation) {
    notifyOfflineWorkspaceChanged({
      entityKey: mutation.entityKey,
      teacherId: mutation.teacherId,
    });
  }
}

export async function saveConflict({
  mutation,
  conflict,
  createdAt = new Date().toISOString(),
}) {
  const database = await openOfflineDatabase();
  const conflictRecord = {
    clientMutationId: mutation.clientMutationId,
    teacherId: normalizeTeacherId(mutation.teacherId),
    mutation,
    conflict,
    createdAt,
    updatedAt: new Date().toISOString(),
  };
  await database.put(offlineStores.syncConflicts, conflictRecord);
  notifyOfflineWorkspaceChanged({
    entityKey: mutation.entityKey,
    teacherId: mutation.teacherId,
  });
  return conflictRecord;
}

export async function removeConflict(clientMutationId) {
  const database = await openOfflineDatabase();
  const conflict = await database.get(
    offlineStores.syncConflicts,
    clientMutationId
  );
  await database.delete(offlineStores.syncConflicts, clientMutationId);
  if (conflict) {
    notifyOfflineWorkspaceChanged({
      entityKey: conflict.mutation?.entityKey,
      teacherId: conflict.teacherId,
    });
  }
}

export async function listSyncConflicts(teacherId) {
  const database = await openOfflineDatabase();
  const conflicts = await database.getAllFromIndex(
    offlineStores.syncConflicts,
    "teacherId",
    normalizeTeacherId(teacherId)
  );
  return conflicts.sort((left, right) => (
    new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
  ));
}

export async function getSyncMetadata(teacherId) {
  const database = await openOfflineDatabase();
  return database.get(
    offlineStores.syncMetadata,
    normalizeTeacherId(teacherId)
  );
}

export async function updateSyncMetadata(teacherId, metadata) {
  const normalizedTeacherId = normalizeTeacherId(teacherId);
  const database = await openOfflineDatabase();
  const existing = await database.get(
    offlineStores.syncMetadata,
    normalizedTeacherId
  );
  const nextMetadata = {
    teacherId: normalizedTeacherId,
    lastSyncAttemptAt: null,
    lastSuccessfulSyncAt: null,
    authRequired: false,
    lastBatchStatus: null,
    lastErrorCode: null,
    ...existing,
    ...metadata,
    updatedAt: new Date().toISOString(),
  };
  await database.put(offlineStores.syncMetadata, nextMetadata);
  return nextMetadata;
}

export async function resetInterruptedSyncingMutations(teacherId) {
  void "ISSA:CMS.OFFLINE_WORKSPACE.RECOVER_INTERRUPTED_MUTATION";
  const normalizedTeacherId = normalizeTeacherId(teacherId);
  const database = await openOfflineDatabase();
  const transaction = database.transaction(
    offlineStores.pendingMutations,
    "readwrite"
  );
  const mutations = await transaction.store.index("teacherId")
    .getAll(normalizedTeacherId);
  let recoveredCount = 0;
  for (const mutation of mutations) {
    if (mutation.status !== "syncing") continue;
    recoveredCount += 1;
    await transaction.store.put({
      ...mutation,
      status: "pending",
      updatedAt: new Date().toISOString(),
    });
  }
  await transaction.done;
  if (recoveredCount > 0) {
    notifyOfflineWorkspaceChanged({ teacherId: normalizedTeacherId });
  }
  return recoveredCount;
}

function safeRejectedMutationMessage(error = {}, mutationType) {
  if (mutationType !== "attendance.update") {
    return error.message || "Mutation perlu ditinjau.";
  }
  if (error.code === "student_access_denied") {
    return "Perubahan tidak dapat disinkronkan karena akses ke siswa telah berubah.";
  }
  if (error.code === "attendance_not_found") {
    return "Record kehadiran tidak lagi tersedia di server.";
  }
  if (error.code === "invalid_mutation") {
    return "Perubahan kehadiran tidak valid dan perlu diperiksa.";
  }
  return "Perubahan kehadiran gagal disinkronkan dan perlu ditinjau.";
}

export async function replaceAttendanceConflictWithMutation({
  conflictRecord,
  clientMutationId,
  now = () => new Date(),
}) {
  void "ISSA:CMS.OFFLINE_ATTENDANCE.RESOLVE_CONFLICT_WITH_LOCAL";
  const local = conflictRecord?.conflict?.local;
  const server = conflictRecord?.conflict?.server;
  const storedMutation = buildStoredMutation({
    clientMutationId,
    teacherId: conflictRecord?.teacherId,
    type: "attendance.update",
    baseVersion: server?.version,
    payload: {
      studentId: local?.studentId,
      attendanceDate: local?.attendanceDate,
      status: local?.status,
    },
    createdAt: now().toISOString(),
    resolutionOf: conflictRecord?.clientMutationId,
  }, { now });
  const database = await openOfflineDatabase();
  const transaction = database.transaction([
    offlineStores.pendingMutations,
    offlineStores.syncConflicts,
  ], "readwrite");
  await transaction.objectStore(offlineStores.pendingMutations)
    .put(storedMutation);
  await transaction.objectStore(offlineStores.syncConflicts)
    .delete(conflictRecord.clientMutationId);
  await transaction.done;
  notifyMutationEnqueued(storedMutation);
  return storedMutation;
}

export async function clearTeacherOfflineData(teacherId) {
  const normalizedTeacherId = normalizeTeacherId(teacherId);
  const database = await openOfflineDatabase();
  const storeNames = [
    offlineStores.workspaceSnapshots,
    offlineStores.pendingMutations,
    offlineStores.syncConflicts,
    offlineStores.syncMetadata,
  ];
  const transaction = database.transaction(storeNames, "readwrite");

  const snapshots = await transaction
    .objectStore(offlineStores.workspaceSnapshots)
    .index("teacherId")
    .getAllKeys(normalizedTeacherId);
  const mutations = await transaction
    .objectStore(offlineStores.pendingMutations)
    .index("teacherId")
    .getAllKeys(normalizedTeacherId);
  const conflicts = await transaction
    .objectStore(offlineStores.syncConflicts)
    .index("teacherId")
    .getAllKeys(normalizedTeacherId);

  await Promise.all([
    ...snapshots.map((key) => transaction
      .objectStore(offlineStores.workspaceSnapshots).delete(key)),
    ...mutations.map((key) => transaction
      .objectStore(offlineStores.pendingMutations).delete(key)),
    ...conflicts.map((key) => transaction
      .objectStore(offlineStores.syncConflicts).delete(key)),
    transaction.objectStore(offlineStores.syncMetadata)
      .delete(normalizedTeacherId),
  ]);
  await transaction.done;
  notifyOfflineWorkspaceChanged({ teacherId: normalizedTeacherId });
}

export { safeRejectedMutationMessage };

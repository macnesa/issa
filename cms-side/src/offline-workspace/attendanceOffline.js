import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  enqueueMutation,
  generateClientMutationId,
  listSyncConflicts,
  listTeacherMutations,
  markMutationPending,
  removeConflict,
  removeMutation,
  replaceAttendanceConflictWithMutation,
} from "./mutationQueue";
import {
  getWorkspaceSnapshot,
  mergeAttendanceServerRecord,
} from "./workspaceSnapshots";
import { subscribeToOfflineWorkspaceChanges } from "./offlineEvents";

export const attendanceStatuses = ["Hadir", "Sakit", "Izin", "Alfa"];

export const attendanceSyncLabels = Object.freeze({
  conflict: "Perlu ditinjau",
  failed: "Gagal disinkronkan",
  pending: "Menunggu sinkronisasi",
  syncing: "Menyinkronkan",
  synced: "Tersimpan di server",
});

export function attendanceEntityKey(studentId, attendanceDate) {
  return `attendance:${Number(studentId)}:${attendanceDate}`;
}

function isAttendanceForStudent(record, studentId) {
  return (
    record?.type === "attendance.update"
    && Number(record.payload?.studentId) === Number(studentId)
  );
}

export function applyAttendanceOverlays({
  serverRecords = [],
  mutations = [],
  conflicts = [],
}) {
  void "ISSA:CMS.OFFLINE_ATTENDANCE.APPLY_LOCAL_OVERLAY";
  const overlays = new Map();

  mutations.forEach((mutation) => {
    if (mutation.type !== "attendance.update") return;
    overlays.set(mutation.entityKey, {
      clientMutationId: mutation.clientMutationId,
      errorMessage: mutation.lastErrorMessage || null,
      status: mutation.status,
      value: mutation.payload.status,
    });
  });
  conflicts.forEach((conflictRecord) => {
    const mutation = conflictRecord.mutation;
    if (mutation?.type !== "attendance.update") return;
    overlays.set(mutation.entityKey, {
      clientMutationId: conflictRecord.clientMutationId,
      conflictRecord,
      errorMessage: null,
      status: "conflict",
      value: conflictRecord.conflict?.local?.status
        ?? mutation.payload.status,
    });
  });

  return serverRecords.map((serverRecord) => {
    const studentId = Number(
      serverRecord.studentId ?? serverRecord.StudentId
    );
    const entityKey = attendanceEntityKey(
      studentId,
      serverRecord.attendanceDate
    );
    const overlay = overlays.get(entityKey) || null;
    return {
      ...serverRecord,
      studentId,
      StudentId: studentId,
      entityKey,
      status: overlay?.value ?? serverRecord.status,
      serverStatus: serverRecord.status,
      serverVersion: Number(serverRecord.version),
      syncState: overlay?.status || "synced",
      syncLabel: attendanceSyncLabels[overlay?.status || "synced"],
      syncErrorMessage: overlay?.status === "failed"
        ? overlay.errorMessage
        : null,
      clientMutationId: overlay?.clientMutationId || null,
      conflictRecord: overlay?.conflictRecord || null,
    };
  });
}

export async function loadAttendanceOverlayState({
  teacherId,
  studentId,
  serverRecords,
}) {
  if (!teacherId) {
    return applyAttendanceOverlays({ serverRecords });
  }
  const [snapshot, mutations, conflicts] = await Promise.all([
    getWorkspaceSnapshot(teacherId, studentId).catch(() => null),
    listTeacherMutations(teacherId),
    listSyncConflicts(teacherId),
  ]);
  const studentMutations = mutations.filter((record) => (
    isAttendanceForStudent(record, studentId)
  ));
  const studentConflicts = conflicts.filter((record) => (
    isAttendanceForStudent(record.mutation, studentId)
  ));
  const localEntityKeys = new Set([
    ...studentMutations.map((record) => record.entityKey),
    ...studentConflicts.map((record) => record.mutation?.entityKey),
  ]);
  const explicitServerRecords = Array.isArray(serverRecords)
    ? serverRecords
    : null;
  const serverEntityKeys = new Set((explicitServerRecords || []).map((record) => (
    attendanceEntityKey(
      record.studentId ?? record.StudentId,
      record.attendanceDate
    )
  )));
  const unsyncedSnapshotRecords = (snapshot?.attendanceRecords || []).filter((record) => {
    const entityKey = attendanceEntityKey(
      record.studentId ?? record.StudentId,
      record.attendanceDate
    );
    return localEntityKeys.has(entityKey) && !serverEntityKeys.has(entityKey);
  });
  const baseline = explicitServerRecords
    ? [...explicitServerRecords, ...unsyncedSnapshotRecords]
    : (snapshot?.attendanceRecords || []);
  return applyAttendanceOverlays({
    serverRecords: baseline,
    mutations: studentMutations,
    conflicts: studentConflicts,
  });
}

export async function queueAttendanceUpdate({
  teacherId,
  serverRecord,
  status,
}) {
  if (!attendanceStatuses.includes(status)) {
    throw new Error("Status kehadiran tidak didukung.");
  }
  const studentId = Number(
    serverRecord?.studentId ?? serverRecord?.StudentId
  );
  return enqueueMutation({
    teacherId,
    type: "attendance.update",
    baseVersion: Number(serverRecord?.serverVersion ?? serverRecord?.version),
    payload: {
      studentId,
      attendanceDate: serverRecord?.attendanceDate,
      status,
    },
  });
}

export async function useAttendanceServerConflict(conflictRecord) {
  void "ISSA:CMS.OFFLINE_ATTENDANCE.RESOLVE_CONFLICT_WITH_SERVER";
  const serverRecord = conflictRecord?.conflict?.server;
  const studentId = Number(
    serverRecord?.studentId
      ?? conflictRecord?.mutation?.payload?.studentId
  );
  await mergeAttendanceServerRecord({
    teacherId: conflictRecord?.teacherId,
    studentId,
    serverRecord,
  });
  await removeConflict(conflictRecord.clientMutationId);
}

export async function applyAttendanceLocalConflict(conflictRecord, {
  idGenerator = generateClientMutationId,
  now = () => new Date(),
} = {}) {
  return replaceAttendanceConflictWithMutation({
    conflictRecord,
    clientMutationId: idGenerator(),
    now,
  });
}

export function retryAttendanceMutation(mutation, now = () => new Date()) {
  return markMutationPending(mutation.clientMutationId, {
    nextAttemptAt: now().toISOString(),
    updatedAt: now().toISOString(),
  });
}

export function discardAttendanceMutation(mutation) {
  return removeMutation(mutation.clientMutationId);
}

export async function hasUnsyncedAttendanceChanges(teacherId) {
  const [mutations, conflicts] = await Promise.all([
    listTeacherMutations(teacherId),
    listSyncConflicts(teacherId),
  ]);
  return mutations.some((mutation) => (
    mutation.type === "attendance.update"
  )) || conflicts.some((record) => (
    record.mutation?.type === "attendance.update"
  ));
}

export function useAttendanceOfflineRecords({
  teacherId,
  studentId,
  serverRecords,
}) {
  const [records, setRecords] = useState(() => (
    applyAttendanceOverlays({ serverRecords })
  ));
  const [savingEntityKey, setSavingEntityKey] = useState(null);
  const [message, setMessage] = useState("");
  const serverRecordsRef = useRef(serverRecords);
  serverRecordsRef.current = serverRecords;
  const serverSignature = useMemo(() => (
    JSON.stringify((serverRecords || []).map((record) => [
      record.id,
      record.attendanceDate,
      record.status,
      record.version,
    ]))
  ), [serverRecords]);

  const refresh = useCallback(async () => {
    const nextRecords = await loadAttendanceOverlayState({
      teacherId,
      studentId,
      serverRecords: serverRecordsRef.current,
    });
    setRecords(nextRecords);
    return nextRecords;
  }, [serverSignature, studentId, teacherId]);

  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh, serverSignature]);

  useEffect(() => subscribeToOfflineWorkspaceChanges((event) => {
    if (Number(event.detail?.teacherId) !== Number(teacherId)) return;
    refresh().catch(() => {});
  }), [refresh, teacherId]);

  const updateAttendance = useCallback(async (record, status) => {
    setSavingEntityKey(record.entityKey);
    setMessage("");
    try {
      const mutation = await queueAttendanceUpdate({
        teacherId,
        serverRecord: record,
        status,
      });
      await refresh();
      setMessage(
        "Perubahan tersimpan di perangkat dan akan disinkronkan saat koneksi tersedia."
      );
      return mutation;
    } catch (error) {
      setMessage(error.message || "Perubahan kehadiran belum dapat disimpan.");
      throw error;
    } finally {
      setSavingEntityKey(null);
    }
  }, [refresh, teacherId]);

  return {
    message,
    records,
    refresh,
    savingEntityKey,
    updateAttendance,
  };
}

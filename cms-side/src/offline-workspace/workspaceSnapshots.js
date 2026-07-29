import {
  offlineStores,
  openOfflineDatabase,
} from "./offlineDatabase";
import { assertTeacherMutationAllowed } from "../auth/demoAccess";

export const maximumSnapshotsPerTeacher = 10;

function normalizeIdentifier(value, fieldName) {
  const numericValue = Number(value);
  if (!Number.isSafeInteger(numericValue) || numericValue < 1) {
    throw new Error(`${fieldName} must be a positive integer.`);
  }
  return numericValue;
}

function copyDateValue(value) {
  return typeof value === "string" ? value : null;
}

function sanitizeStudentSummary(studentSummary) {
  if (!studentSummary || typeof studentSummary !== "object") return null;
  return {
    id: Number(studentSummary.id),
    NIM: studentSummary.NIM || "",
    name: studentSummary.name || "",
    Class: studentSummary.Class
      ? {
        id: Number(studentSummary.Class.id),
        name: studentSummary.Class.name || "",
      }
      : null,
  };
}

function sanitizeAttendanceRecord(attendanceRecord) {
  const studentId = Number(
    attendanceRecord.studentId ?? attendanceRecord.StudentId
  );
  return {
    id: Number(attendanceRecord.id),
    studentId,
    StudentId: studentId,
    status: attendanceRecord.status,
    attendanceDate: attendanceRecord.attendanceDate,
    version: Number(attendanceRecord.version),
    createdAt: copyDateValue(attendanceRecord.createdAt),
    updatedAt: copyDateValue(attendanceRecord.updatedAt),
  };
}

function sanitizeJournalEvidence(evidence) {
  if (!evidence || typeof evidence !== "object") return null;
  return {
    id: Number(evidence.id),
    title: evidence.title || "",
    category: evidence.category || "",
    observedAt: copyDateValue(evidence.observedAt),
    availability: evidence.availability || "available",
    file: null,
  };
}

function sanitizeJournalEntry(journalEntry) {
  return {
    id: Number(journalEntry.id),
    studentId: Number(journalEntry.studentId),
    type: journalEntry.type,
    content: journalEntry.content,
    voiceCaptureType: journalEntry.voiceCaptureType ?? null,
    observedAt: copyDateValue(journalEntry.observedAt),
    teacher: journalEntry.teacher
      ? {
        id: Number(journalEntry.teacher.id),
        name: journalEntry.teacher.name || "",
      }
      : null,
    evidence: sanitizeJournalEvidence(journalEntry.evidence),
    createdAt: copyDateValue(journalEntry.createdAt),
    updatedAt: copyDateValue(journalEntry.updatedAt),
    wasEdited: Boolean(journalEntry.wasEdited),
  };
}

function sanitizeSlice(snapshotSlice) {
  const sanitized = {};
  if (Object.prototype.hasOwnProperty.call(snapshotSlice, "studentSummary")) {
    sanitized.studentSummary = sanitizeStudentSummary(
      snapshotSlice.studentSummary
    );
  }
  if (Array.isArray(snapshotSlice.attendanceRecords)) {
    sanitized.attendanceRecords = snapshotSlice.attendanceRecords
      .map(sanitizeAttendanceRecord);
  }
  if (Array.isArray(snapshotSlice.journalEntries)) {
    sanitized.journalEntries = snapshotSlice.journalEntries
      .map(sanitizeJournalEntry);
  }
  return sanitized;
}

export async function pruneWorkspaceSnapshots(
  teacherId,
  maximumSnapshots = maximumSnapshotsPerTeacher
) {
  assertTeacherMutationAllowed();
  const normalizedTeacherId = normalizeIdentifier(teacherId, "teacherId");
  const database = await openOfflineDatabase();
  const transaction = database.transaction(
    offlineStores.workspaceSnapshots,
    "readwrite"
  );
  const index = transaction.store.index("teacherId");
  const snapshots = await index.getAll(normalizedTeacherId);
  const excessSnapshots = snapshots
    .sort((left, right) => (
      new Date(left.updatedAt).getTime() - new Date(right.updatedAt).getTime()
    ))
    .slice(0, Math.max(0, snapshots.length - maximumSnapshots));

  await Promise.all(excessSnapshots.map((snapshot) => (
    transaction.store.delete([snapshot.teacherId, snapshot.studentId])
  )));
  await transaction.done;
  return excessSnapshots.length;
}

export async function mergeWorkspaceSnapshot({
  teacherId,
  studentId,
  cachedAt,
  ...snapshotSlice
}) {
  void "ISSA:CMS.OFFLINE_WORKSPACE.SAVE_WORKSPACE_SNAPSHOT";
  assertTeacherMutationAllowed();
  const normalizedTeacherId = normalizeIdentifier(teacherId, "teacherId");
  const normalizedStudentId = normalizeIdentifier(studentId, "studentId");
  const database = await openOfflineDatabase();
  const existing = await database.get(
    offlineStores.workspaceSnapshots,
    [normalizedTeacherId, normalizedStudentId]
  );
  const timestamp = new Date().toISOString();
  const nextSnapshot = {
    teacherId: normalizedTeacherId,
    studentId: normalizedStudentId,
    studentSummary: null,
    attendanceRecords: [],
    journalEntries: [],
    cachedAt: cachedAt || timestamp,
    ...existing,
    ...sanitizeSlice(snapshotSlice),
    cachedAt: cachedAt || timestamp,
    updatedAt: timestamp,
  };

  await database.put(offlineStores.workspaceSnapshots, nextSnapshot);
  await pruneWorkspaceSnapshots(normalizedTeacherId);
  return nextSnapshot;
}

export function saveWorkspaceSnapshot(snapshot) {
  return mergeWorkspaceSnapshot(snapshot);
}

export async function getWorkspaceSnapshot(teacherId, studentId) {
  const normalizedTeacherId = normalizeIdentifier(teacherId, "teacherId");
  const normalizedStudentId = normalizeIdentifier(studentId, "studentId");
  const database = await openOfflineDatabase();
  return database.get(
    offlineStores.workspaceSnapshots,
    [normalizedTeacherId, normalizedStudentId]
  );
}

export async function mergeAttendanceServerRecord({
  teacherId,
  studentId,
  serverRecord,
}) {
  void "ISSA:CMS.OFFLINE_ATTENDANCE.RECONCILE_SERVER_RECORD";
  const normalizedStudentId = normalizeIdentifier(studentId, "studentId");
  const existing = await getWorkspaceSnapshot(teacherId, normalizedStudentId);
  const normalizedRecord = sanitizeAttendanceRecord({
    ...serverRecord,
    studentId: serverRecord?.studentId
      ?? serverRecord?.StudentId
      ?? normalizedStudentId,
  });
  const existingRecords = existing?.attendanceRecords || [];
  const attendanceRecords = existingRecords.some((record) => (
    record.attendanceDate === normalizedRecord.attendanceDate
  ))
    ? existingRecords.map((record) => (
      record.attendanceDate === normalizedRecord.attendanceDate
        ? normalizedRecord
        : record
    ))
    : [...existing.attendanceRecords, normalizedRecord];
  return mergeWorkspaceSnapshot({
    teacherId,
    studentId: normalizedStudentId,
    attendanceRecords,
  });
}

export const workspaceSnapshotSanitizers = {
  sanitizeAttendanceRecord,
  sanitizeJournalEntry,
  sanitizeStudentSummary,
};

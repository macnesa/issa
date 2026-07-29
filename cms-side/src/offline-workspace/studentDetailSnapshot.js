import { isNetworkFailure } from "./networkErrors";
import {
  getWorkspaceSnapshot,
  mergeWorkspaceSnapshot,
} from "./workspaceSnapshots";
import { reportApiConnection } from "./connectionStatus";

export function studentFromSnapshot(snapshot) {
  return {
    ...(snapshot.studentSummary || {}),
    Attendances: snapshot.attendanceRecords || [],
    Scores: [],
  };
}

export async function loadStudentDetailWorkspace({
  teacherId,
  studentId,
  onlineHint,
  fetchStudent,
  readSnapshot = getWorkspaceSnapshot,
  saveSnapshot = mergeWorkspaceSnapshot,
}) {
  const snapshotPromise = teacherId
    ? readSnapshot(teacherId, studentId).catch(() => null)
    : Promise.resolve(null);

  try {
    const student = await fetchStudent();
    reportApiConnection(true);
    const existingSnapshot = await snapshotPromise;
    if (!teacherId) {
      return { source: "online", student, snapshot: existingSnapshot };
    }
    const snapshot = await saveSnapshot({
      teacherId,
      studentId,
      studentSummary: student,
      attendanceRecords: student.Attendances || [],
    }).catch(() => existingSnapshot);
    return { source: "online", student, snapshot };
  } catch (error) {
    const snapshot = await snapshotPromise;
    if (!isNetworkFailure(error)) throw error;
    reportApiConnection(false);
    if (snapshot) {
      return {
        source: "snapshot",
        student: studentFromSnapshot(snapshot),
        snapshot,
      };
    }
    if (!teacherId && !onlineHint) {
      throw new Error(
        "Workspace offline belum tersedia. Buka dan login saat online terlebih dahulu."
      );
    }
    throw new Error("Workspace siswa ini belum tersedia secara offline.");
  }
}

import "fake-indexeddb/auto";
import {
  closeOfflineDatabase,
  deleteOfflineDatabaseForTests,
  offlineStores,
  openOfflineDatabase,
} from "./offlineDatabase";
import {
  getWorkspaceSnapshot,
  mergeWorkspaceSnapshot,
  pruneWorkspaceSnapshots,
} from "./workspaceSnapshots";
import {
  clearTeacherOfflineData,
  enqueueMutation,
  getSyncMetadata,
  listPendingMutations,
  markMutationSyncing,
  resetInterruptedSyncingMutations,
  saveConflict,
  updateSyncMetadata,
} from "./mutationQueue";

const attendanceMutation = {
  clientMutationId: "attendance-offline-1",
  teacherId: 1,
  type: "attendance.update",
  baseVersion: 3,
  payload: {
    studentId: 7,
    attendanceDate: "2026-07-26",
    status: "Izin",
  },
  createdAt: "2026-07-26T08:00:00.000Z",
};

describe("offline workspace IndexedDB", () => {
  beforeEach(async () => {
    await deleteOfflineDatabaseForTests();
  });

  afterAll(async () => {
    await deleteOfflineDatabaseForTests();
  });

  test("creates the four stores with deterministic keys and indexes", async () => {
    const database = await openOfflineDatabase();
    expect([...database.objectStoreNames].sort()).toEqual(
      Object.values(offlineStores).sort()
    );

    const transaction = database.transaction([
      offlineStores.workspaceSnapshots,
      offlineStores.pendingMutations,
      offlineStores.syncConflicts,
      offlineStores.syncMetadata,
    ]);
    expect([
      ...transaction.objectStore(offlineStores.workspaceSnapshots).indexNames,
    ].sort()).toEqual(["studentId", "teacherId", "updatedAt"]);
    expect([
      ...transaction.objectStore(offlineStores.pendingMutations).indexNames,
    ].sort()).toEqual([
      "createdAt",
      "entityKey",
      "nextAttemptAt",
      "status",
      "teacherId",
    ]);
    expect([
      ...transaction.objectStore(offlineStores.syncConflicts).indexNames,
    ].sort()).toEqual(["createdAt", "teacherId"]);
    await transaction.done;
  });

  test("snapshot is Teacher-scoped, partially merged, sanitized, and durable", async () => {
    await mergeWorkspaceSnapshot({
      teacherId: 1,
      studentId: 7,
      studentSummary: {
        id: 7,
        NIM: "2026071001",
        name: "Ari Wibowo",
        imgUrl: "https://res.cloudinary.com/demo/student.png",
        Class: { id: 1, name: "1A" },
        access_token: "must-not-persist",
      },
      attendanceRecords: [{
        id: 31,
        StudentId: 7,
        attendanceDate: "2026-07-26",
        status: "Hadir",
        version: 4,
      }],
    });
    await mergeWorkspaceSnapshot({
      teacherId: 1,
      studentId: 7,
      journalEntries: [{
        id: 41,
        studentId: 7,
        type: "observation",
        content: "Catatan aman.",
        observedAt: "2026-07-26",
        evidence: {
          id: 8,
          title: "Evidence",
          file: { url: "https://res.cloudinary.com/demo/evidence.png" },
        },
      }],
    });

    const first = await getWorkspaceSnapshot(1, 7);
    expect(first.attendanceRecords[0].version).toBe(4);
    expect(first.journalEntries[0].content).toBe("Catatan aman.");
    expect(first.journalEntries[0].evidence.file).toBeNull();
    expect(first.studentSummary).not.toHaveProperty("imgUrl");
    expect(JSON.stringify(first)).not.toContain("access_token");
    expect(await getWorkspaceSnapshot(2, 7)).toBeUndefined();

    await closeOfflineDatabase();
    const reopened = await getWorkspaceSnapshot(1, 7);
    expect(reopened).toEqual(first);
  });

  test("pruning removes only the oldest snapshot for the same Teacher", async () => {
    const database = await openOfflineDatabase();
    for (let studentId = 1; studentId <= 11; studentId += 1) {
      await database.put(offlineStores.workspaceSnapshots, {
        teacherId: 1,
        studentId,
        studentSummary: { id: studentId, name: `Student ${studentId}` },
        attendanceRecords: [],
        journalEntries: [],
        cachedAt: `2026-07-${String(studentId).padStart(2, "0")}T00:00:00.000Z`,
        updatedAt: `2026-07-${String(studentId).padStart(2, "0")}T00:00:00.000Z`,
      });
    }
    await database.put(offlineStores.workspaceSnapshots, {
      teacherId: 2,
      studentId: 1,
      studentSummary: { id: 1, name: "Other Teacher Student" },
      attendanceRecords: [],
      journalEntries: [],
      cachedAt: "2026-07-01T00:00:00.000Z",
      updatedAt: "2026-07-01T00:00:00.000Z",
    });

    expect(await pruneWorkspaceSnapshots(1)).toBe(1);
    expect(await getWorkspaceSnapshot(1, 1)).toBeUndefined();
    expect(await getWorkspaceSnapshot(1, 11)).toBeDefined();
    expect(await getWorkspaceSnapshot(2, 1)).toBeDefined();
  });

  test("queue persists, rejects unsupported data, and recovers interrupted sync", async () => {
    const stored = await enqueueMutation(attendanceMutation);
    expect(stored).toEqual(expect.objectContaining({
      clientMutationId: attendanceMutation.clientMutationId,
      entityKey: "attendance:7:2026-07-26",
      status: "pending",
      attemptCount: 0,
    }));
    expect(stored).not.toHaveProperty("token");
    expect(JSON.stringify(stored)).not.toContain("access_token");

    await closeOfflineDatabase();
    expect(await listPendingMutations(1)).toHaveLength(1);
    await markMutationSyncing(attendanceMutation.clientMutationId);
    expect(await resetInterruptedSyncingMutations(1)).toBe(1);
    expect((await listPendingMutations(1))[0].attemptCount).toBe(0);

    await expect(enqueueMutation({
      ...attendanceMutation,
      clientMutationId: "unsupported",
      type: "score.create",
    })).rejects.toThrow("Unsupported offline mutation type");
    await expect(enqueueMutation({
      clientMutationId: "journal-with-evidence",
      teacherId: 1,
      type: "journal.create",
      payload: {
        studentId: 7,
        type: "observation",
        content: "Tidak disimpan.",
        observedAt: "2026-07-26",
        evidenceId: 9,
      },
    })).rejects.toThrow("does not support evidenceId");
  });

  test("Teacher cleanup removes only the active Teacher namespace", async () => {
    await enqueueMutation(attendanceMutation);
    await enqueueMutation({
      ...attendanceMutation,
      clientMutationId: "attendance-other-teacher",
      teacherId: 2,
    });
    await mergeWorkspaceSnapshot({
      teacherId: 1,
      studentId: 7,
      studentSummary: { id: 7, name: "Ari" },
    });
    await mergeWorkspaceSnapshot({
      teacherId: 2,
      studentId: 8,
      studentSummary: { id: 8, name: "Other" },
    });
    await saveConflict({
      mutation: { ...attendanceMutation, teacherId: 1 },
      conflict: { type: "attendance_version_mismatch" },
    });
    await updateSyncMetadata(1, { lastBatchStatus: "processed" });
    await updateSyncMetadata(2, { lastBatchStatus: "processed" });

    await clearTeacherOfflineData(1);

    expect(await listPendingMutations(1)).toEqual([]);
    expect(await getWorkspaceSnapshot(1, 7)).toBeUndefined();
    expect(await getSyncMetadata(1)).toBeUndefined();
    expect(await listPendingMutations(2)).toHaveLength(1);
    expect(await getWorkspaceSnapshot(2, 8)).toBeDefined();
    expect(await getSyncMetadata(2)).toBeDefined();
  });
});

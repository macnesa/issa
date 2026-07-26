import "fake-indexeddb/auto";
import {
  closeOfflineDatabase,
  deleteOfflineDatabaseForTests,
} from "./offlineDatabase";
import {
  enqueueMutation,
  listSyncConflicts,
  listTeacherMutations,
  saveConflict,
} from "./mutationQueue";
import {
  getWorkspaceSnapshot,
  mergeWorkspaceSnapshot,
} from "./workspaceSnapshots";
import {
  applyAttendanceLocalConflict,
  applyAttendanceOverlays,
  discardAttendanceMutation,
  hasUnsyncedAttendanceChanges,
  loadAttendanceOverlayState,
  queueAttendanceUpdate,
  useAttendanceServerConflict,
} from "./attendanceOffline";
import {
  createTeacherSyncEngine,
  reconcileSyncResults,
} from "./syncEngine";

const fixedNow = new Date("2026-07-27T08:00:00.000Z");
const attendanceRecord = {
  id: 31,
  StudentId: 7,
  attendanceDate: "2026-07-21",
  status: "Hadir",
  version: 4,
  updatedAt: "2026-07-21T08:00:00.000Z",
};

async function saveBaseline(teacherId = 1) {
  return mergeWorkspaceSnapshot({
    teacherId,
    studentId: 7,
    studentSummary: {
      id: 7,
      NIM: "2026071001",
      name: "Ari Wibowo",
    },
    attendanceRecords: [attendanceRecord],
    journalEntries: [{
      id: 91,
      studentId: 7,
      type: "observation",
      content: "Journal tetap tersedia.",
      observedAt: "2026-07-20",
    }],
  });
}

function mutationInput(overrides = {}) {
  return {
    clientMutationId: "attendance-local-1",
    teacherId: 1,
    type: "attendance.update",
    baseVersion: 4,
    payload: {
      studentId: 7,
      attendanceDate: "2026-07-21",
      status: "Izin",
    },
    createdAt: fixedNow.toISOString(),
    ...overrides,
  };
}

function serverRecord(overrides = {}) {
  return {
    ...attendanceRecord,
    status: "Izin",
    version: 5,
    updatedAt: "2026-07-27T08:01:00.000Z",
    ...overrides,
  };
}

describe("Attendance offline durable workspace", () => {
  beforeEach(async () => {
    await deleteOfflineDatabaseForTests();
  });

  afterAll(async () => {
    await deleteOfflineDatabaseForTests();
  });

  test("persists an Attendance update before it is available for sync", async () => {
    await saveBaseline();
    const stored = await queueAttendanceUpdate({
      teacherId: 1,
      serverRecord: attendanceRecord,
      status: "Izin",
    });

    expect(await listTeacherMutations(1)).toEqual([
      expect.objectContaining({
        clientMutationId: stored.clientMutationId,
        baseVersion: 4,
        status: "pending",
      }),
    ]);
  });

  test("applies a pending local overlay without changing server version", () => {
    const [effective] = applyAttendanceOverlays({
      serverRecords: [attendanceRecord],
      mutations: [{
        ...mutationInput(),
        entityKey: "attendance:7:2026-07-21",
        lastErrorMessage: "Failed to fetch",
        status: "pending",
      }],
    });

    expect(effective).toEqual(expect.objectContaining({
      status: "Izin",
      serverStatus: "Hadir",
      serverVersion: 4,
      version: 4,
      syncState: "pending",
      syncLabel: "Menunggu sinkronisasi",
      syncErrorMessage: null,
    }));
  });

  test("restores the same pending overlay and clientMutationId after reopen", async () => {
    await saveBaseline();
    await enqueueMutation(mutationInput());
    await closeOfflineDatabase();

    const [effective] = await loadAttendanceOverlayState({
      teacherId: 1,
      studentId: 7,
    });

    expect(effective.status).toBe("Izin");
    expect(effective.clientMutationId).toBe("attendance-local-1");
  });

  test("never exposes another Teacher's overlay", async () => {
    await saveBaseline(1);
    await saveBaseline(2);
    await enqueueMutation(mutationInput());

    const [otherTeacherRecord] = await loadAttendanceOverlayState({
      teacherId: 2,
      studentId: 7,
    });

    expect(otherTeacherRecord.status).toBe("Hadir");
    expect(otherTeacherRecord.syncState).toBe("synced");
  });

  test("compacts repeated edits into one mutation with original ID and version", async () => {
    await enqueueMutation(mutationInput());
    await enqueueMutation(mutationInput({
      clientMutationId: "attendance-local-2",
      baseVersion: 99,
      payload: {
        studentId: 7,
        attendanceDate: "2026-07-21",
        status: "Sakit",
      },
    }));
    await enqueueMutation(mutationInput({
      clientMutationId: "attendance-local-3",
      baseVersion: 100,
      payload: {
        studentId: 7,
        attendanceDate: "2026-07-21",
        status: "Alfa",
      },
    }));

    const mutations = await listTeacherMutations(1);
    expect(mutations).toHaveLength(1);
    expect(mutations[0]).toEqual(expect.objectContaining({
      clientMutationId: "attendance-local-1",
      baseVersion: 4,
      payload: expect.objectContaining({ status: "Alfa" }),
    }));
  });

  test.each(["applied", "duplicate"])(
    "%s removes overlay and merges the returned server version",
    async (status) => {
      await saveBaseline();
      const mutation = await enqueueMutation(mutationInput());

      await reconcileSyncResults({
        teacherId: 1,
        mutations: [mutation],
        results: [{
          clientMutationId: mutation.clientMutationId,
          status,
          serverRecord: serverRecord(),
        }],
        now: () => new Date(fixedNow),
      });

      expect(await listTeacherMutations(1)).toEqual([]);
      const snapshot = await getWorkspaceSnapshot(1, 7);
      expect(snapshot.attendanceRecords[0]).toEqual(expect.objectContaining({
        status: "Izin",
        version: 5,
      }));
      expect(snapshot.journalEntries[0].content)
        .toBe("Journal tetap tersedia.");
    }
  );

  test("network retry retains the original clientMutationId and overlay", async () => {
    await saveBaseline();
    await enqueueMutation(mutationInput());
    const engine = createTeacherSyncEngine({
      teacherId: 1,
      isOnline: () => true,
      requestSync: vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
      now: () => new Date(fixedNow),
      random: () => 0.5,
      setTimer: vi.fn(() => 1),
      clearTimer: vi.fn(),
    });

    await engine.syncNow();

    const [mutation] = await listTeacherMutations(1);
    expect(mutation.clientMutationId).toBe("attendance-local-1");
    expect(mutation.attemptCount).toBe(1);
    const [effective] = await loadAttendanceOverlayState({
      teacherId: 1,
      studentId: 7,
    });
    expect(effective.status).toBe("Izin");
  });

  test("rejected Attendance remains failed with a safe authorization message", async () => {
    await saveBaseline();
    const mutation = await enqueueMutation(mutationInput());
    await reconcileSyncResults({
      teacherId: 1,
      mutations: [mutation],
      results: [{
        clientMutationId: mutation.clientMutationId,
        status: "rejected",
        error: {
          code: "student_access_denied",
          message: "raw backend detail",
        },
      }],
    });

    const [failed] = await listTeacherMutations(1);
    expect(failed.status).toBe("failed");
    expect(failed.lastErrorMessage).toBe(
      "Perubahan tidak dapat disinkronkan karena akses ke siswa telah berubah."
    );
    const [effective] = await loadAttendanceOverlayState({
      teacherId: 1,
      studentId: 7,
    });
    expect(effective.syncState).toBe("failed");

    await discardAttendanceMutation(failed);
    expect(await listTeacherMutations(1)).toEqual([]);
  });

  test("conflict remains visible and is never auto-retried", async () => {
    await saveBaseline();
    const mutation = await enqueueMutation(mutationInput());
    await reconcileSyncResults({
      teacherId: 1,
      mutations: [mutation],
      results: [{
        clientMutationId: mutation.clientMutationId,
        status: "conflict",
        conflict: {
          type: "attendance_version_mismatch",
          local: {
            studentId: 7,
            attendanceDate: "2026-07-21",
            status: "Izin",
            baseVersion: 4,
          },
          server: {
            ...serverRecord({ status: "Sakit" }),
            studentId: 7,
          },
        },
      }],
    });

    expect(await listTeacherMutations(1)).toEqual([]);
    expect(await listSyncConflicts(1)).toHaveLength(1);
    const [effective] = await loadAttendanceOverlayState({
      teacherId: 1,
      studentId: 7,
    });
    expect(effective).toEqual(expect.objectContaining({
      status: "Izin",
      serverStatus: "Hadir",
      syncState: "conflict",
    }));
  });

  test("using server data removes conflict and preserves Journal snapshot", async () => {
    await saveBaseline();
    const mutation = mutationInput();
    await saveConflict({
      mutation,
      conflict: {
        type: "attendance_version_mismatch",
        local: { ...mutation.payload, baseVersion: 4 },
        server: {
          ...serverRecord({ status: "Sakit" }),
          studentId: 7,
        },
      },
    });
    const [conflict] = await listSyncConflicts(1);

    await useAttendanceServerConflict(conflict);

    expect(await listSyncConflicts(1)).toEqual([]);
    const snapshot = await getWorkspaceSnapshot(1, 7);
    expect(snapshot.attendanceRecords[0].status).toBe("Sakit");
    expect(snapshot.attendanceRecords[0].version).toBe(5);
    expect(snapshot.journalEntries).toHaveLength(1);
  });

  test("applying local conflict creates a fresh ID on the latest server version", async () => {
    const mutation = mutationInput();
    await saveConflict({
      mutation,
      conflict: {
        type: "attendance_version_mismatch",
        local: { ...mutation.payload, baseVersion: 4 },
        server: {
          ...serverRecord({ status: "Sakit", version: 8 }),
          studentId: 7,
        },
      },
    });
    const [conflict] = await listSyncConflicts(1);

    const replacement = await applyAttendanceLocalConflict(conflict, {
      idGenerator: () => "attendance-resolution-2",
      now: () => new Date(fixedNow),
    });

    expect(replacement).toEqual(expect.objectContaining({
      clientMutationId: "attendance-resolution-2",
      baseVersion: 8,
      resolutionOf: "attendance-local-1",
    }));
    expect(replacement.payload.status).toBe("Izin");
    expect(await listSyncConflicts(1)).toEqual([]);
  });

  test("concurrent conflicts remain explicit instead of overwriting server state", async () => {
    await saveBaseline();
    await saveConflict({
      mutation: mutationInput(),
      conflict: {
        local: { ...mutationInput().payload, baseVersion: 4 },
        server: { ...serverRecord(), studentId: 7 },
      },
    });
    await saveConflict({
      mutation: mutationInput({ clientMutationId: "attendance-local-2" }),
      conflict: {
        local: {
          ...mutationInput().payload,
          status: "Alfa",
          baseVersion: 4,
        },
        server: { ...serverRecord(), studentId: 7 },
      },
    });

    expect(await listSyncConflicts(1)).toHaveLength(2);
    expect((await getWorkspaceSnapshot(1, 7)).attendanceRecords[0].status)
      .toBe("Hadir");
  });

  test("detects unsynced Attendance without counting Journal-only queue", async () => {
    await enqueueMutation({
      clientMutationId: "journal-only",
      teacherId: 1,
      type: "journal.create",
      payload: {
        studentId: 7,
        type: "observation",
        content: "Belum terhubung ke production form.",
        observedAt: "2026-07-27",
      },
    });
    expect(await hasUnsyncedAttendanceChanges(1)).toBe(false);

    await enqueueMutation(mutationInput());
    expect(await hasUnsyncedAttendanceChanges(1)).toBe(true);
  });
});

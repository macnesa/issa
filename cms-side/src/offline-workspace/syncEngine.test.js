import "fake-indexeddb/auto";
import {
  deleteOfflineDatabaseForTests,
} from "./offlineDatabase";
import {
  enqueueMutation,
  getSyncMetadata,
  listFailedMutations,
  listPendingMutations,
  listSyncConflicts,
} from "./mutationQueue";
import {
  calculateBackoffDelay,
  createTeacherSyncEngine,
  maximumSyncBatchSize,
} from "./syncEngine";

const fixedNow = new Date("2026-07-26T10:00:00.000Z");

function attendanceMutation(clientMutationId, teacherId = 1, index = 0) {
  return {
    clientMutationId,
    teacherId,
    type: "attendance.update",
    baseVersion: 1,
    payload: {
      studentId: 7,
      attendanceDate: `2026-06-${String(index + 1).padStart(2, "0")}`,
      status: "Izin",
    },
    createdAt: new Date(
      fixedNow.getTime() + (index * 1000)
    ).toISOString(),
  };
}

function journalMutation(clientMutationId, teacherId = 1) {
  return {
    clientMutationId,
    teacherId,
    type: "journal.create",
    payload: {
      studentId: 7,
      type: "observation",
      content: "Queued journal entry.",
      voiceCaptureType: null,
      observedAt: "2026-07-26",
    },
    createdAt: fixedNow.toISOString(),
  };
}

function engineOptions(overrides = {}) {
  return {
    teacherId: 1,
    isOnline: () => true,
    now: () => new Date(fixedNow),
    random: () => 0.5,
    setTimer: vi.fn(() => 1),
    clearTimer: vi.fn(),
    ...overrides,
  };
}

describe("Teacher offline sync engine", () => {
  beforeEach(async () => {
    await deleteOfflineDatabaseForTests();
  });

  afterAll(async () => {
    await deleteOfflineDatabaseForTests();
  });

  test("reconciles applied, duplicate, conflict, and rejected by mutation ID", async () => {
    const mutations = [
      attendanceMutation("applied-1", 1, 0),
      attendanceMutation("duplicate-1", 1, 1),
      attendanceMutation("conflict-1", 1, 2),
      journalMutation("rejected-1"),
    ];
    await Promise.all(mutations.map((mutation) => enqueueMutation(mutation, {
      now: () => new Date(fixedNow),
    })));
    const requestSync = vi.fn().mockResolvedValue({
      results: [
        {
          clientMutationId: "rejected-1",
          status: "rejected",
          error: { code: "journal_validation_failed", message: "Invalid." },
        },
        {
          clientMutationId: "conflict-1",
          status: "conflict",
          conflict: {
            type: "attendance_version_mismatch",
            local: { baseVersion: 1 },
            server: { version: 2 },
          },
        },
        {
          clientMutationId: "duplicate-1",
          status: "duplicate",
          serverRecord: { id: 32, version: 2 },
        },
        {
          clientMutationId: "applied-1",
          status: "applied",
          serverRecord: { id: 31, version: 2 },
        },
      ],
    });

    const result = await createTeacherSyncEngine(
      engineOptions({ requestSync })
    ).syncNow();

    expect(result.status).toBe("processed");
    expect(requestSync).toHaveBeenCalledTimes(1);
    expect(await listPendingMutations(1)).toEqual([]);
    expect(await listFailedMutations(1)).toEqual([
      expect.objectContaining({
        clientMutationId: "rejected-1",
        status: "failed",
        lastErrorCode: "journal_validation_failed",
      }),
    ]);
    expect(await listSyncConflicts(1)).toEqual([
      expect.objectContaining({
        clientMutationId: "conflict-1",
        mutation: expect.objectContaining({
          clientMutationId: "conflict-1",
          teacherId: 1,
        }),
        conflict: expect.objectContaining({
          type: "attendance_version_mismatch",
        }),
      }),
    ]);
    expect(await getSyncMetadata(1)).toEqual(expect.objectContaining({
      lastBatchStatus: "processed",
      authRequired: false,
      lastSuccessfulSyncAt: fixedNow.toISOString(),
    }));
  });

  test("network failure restores pending state, increments attempt, and schedules backoff", async () => {
    await enqueueMutation(attendanceMutation("network-1"), {
      now: () => new Date(fixedNow),
    });
    const requestSync = vi.fn().mockRejectedValue(
      new TypeError("Failed to fetch")
    );
    const setTimer = vi.fn(() => 7);
    const result = await createTeacherSyncEngine(engineOptions({
      requestSync,
      setTimer,
    })).syncNow();
    const pending = await listPendingMutations(1);

    expect(result.status).toBe("retry_scheduled");
    expect(pending[0]).toEqual(expect.objectContaining({
      status: "pending",
      attemptCount: 1,
      lastErrorCode: "network_error",
    }));
    expect(new Date(pending[0].nextAttemptAt).getTime())
      .toBeGreaterThan(fixedNow.getTime());
    expect(setTimer).toHaveBeenCalledTimes(1);
    expect(await getSyncMetadata(1)).toEqual(expect.objectContaining({
      lastBatchStatus: "retry_scheduled",
      authRequired: false,
    }));
  });

  test("authentication failure keeps queue without backoff or automatic retry", async () => {
    await enqueueMutation(attendanceMutation("auth-1"), {
      now: () => new Date(fixedNow),
    });
    const setTimer = vi.fn(() => 7);
    const result = await createTeacherSyncEngine(engineOptions({
      requestSync: vi.fn().mockRejectedValue(
        Object.assign(new Error("Invalid Token"), { status: 401 })
      ),
      setTimer,
    })).syncNow();
    const pending = await listPendingMutations(1);

    expect(result.status).toBe("auth_required");
    expect(pending[0].attemptCount).toBe(0);
    expect(setTimer).not.toHaveBeenCalled();
    expect(await getSyncMetadata(1)).toEqual(expect.objectContaining({
      authRequired: true,
      lastBatchStatus: "auth_required",
    }));
  });

  test("missing or unknown results never delete a mutation silently", async () => {
    await enqueueMutation(attendanceMutation("missing-1"), {
      now: () => new Date(fixedNow),
    });
    const result = await createTeacherSyncEngine(engineOptions({
      requestSync: vi.fn().mockResolvedValue({ results: [] }),
    })).syncNow();

    expect(result.reconciliation).toEqual([{
      clientMutationId: "missing-1",
      status: "pending",
    }]);
    expect(await listPendingMutations(1)).toEqual([
      expect.objectContaining({
        clientMutationId: "missing-1",
        attemptCount: 1,
        lastErrorCode: "missing_sync_result",
      }),
    ]);
  });

  test("one engine shares the active promise and sends at most 50 mutations", async () => {
    for (let index = 0; index < 51; index += 1) {
      await enqueueMutation(
        attendanceMutation(`batch-${index}`, 1, index),
        { now: () => new Date(fixedNow) }
      );
    }
    let resolveRequest;
    const requestSync = vi.fn().mockImplementation((mutations) => (
      new Promise((resolve) => {
        resolveRequest = () => resolve({
          results: mutations.map((mutation) => ({
            clientMutationId: mutation.clientMutationId,
            status: "applied",
            serverRecord: { id: mutation.clientMutationId },
          })),
        });
      })
    ));
    const engine = createTeacherSyncEngine(engineOptions({ requestSync }));
    const first = engine.syncNow();
    const second = engine.syncNow();

    expect(second).toBe(first);
    await vi.waitFor(() => expect(requestSync).toHaveBeenCalledTimes(1));
    expect(requestSync.mock.calls[0][0]).toHaveLength(maximumSyncBatchSize);
    resolveRequest();
    await first;
    expect(await listPendingMutations(1)).toHaveLength(1);
  });

  test("only mutations belonging to the active Teacher are selected", async () => {
    await enqueueMutation(attendanceMutation("teacher-1", 1), {
      now: () => new Date(fixedNow),
    });
    await enqueueMutation(attendanceMutation("teacher-2", 2), {
      now: () => new Date(fixedNow),
    });
    const requestSync = vi.fn().mockImplementation(async (mutations) => ({
      results: mutations.map((mutation) => ({
        clientMutationId: mutation.clientMutationId,
        status: "duplicate",
      })),
    }));

    await createTeacherSyncEngine(engineOptions({ requestSync })).syncNow();

    expect(requestSync.mock.calls[0][0].map(
      (mutation) => mutation.clientMutationId
    )).toEqual(["teacher-1"]);
    expect(await listPendingMutations(2)).toEqual([
      expect.objectContaining({ clientMutationId: "teacher-2" }),
    ]);
  });

  test("backoff is deterministic with injected jitter and capped", () => {
    expect(calculateBackoffDelay(1, () => 0.5)).toBe(1000);
    expect(calculateBackoffDelay(2, () => 0.5)).toBe(2000);
    expect(calculateBackoffDelay(3, () => 0.5)).toBe(4000);
    expect(calculateBackoffDelay(20, () => 1)).toBe(30000);
  });
});

import {
  submitTeacherSyncBatch,
  TeacherSyncApiError,
} from "./syncApi";

describe("Teacher sync API client", () => {
  beforeEach(() => {
    localStorage.setItem("access_token", "teacher-token");
  });

  afterEach(() => {
    localStorage.clear();
  });

  test("sends only the backend mutation contract without local queue fields", async () => {
    const fetchImplementation = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ results: [] }),
    });
    await submitTeacherSyncBatch([{
      clientMutationId: "attendance-1",
      teacherId: 9,
      type: "attendance.update",
      entityKey: "attendance:7:2026-07-26",
      baseVersion: 3,
      payload: {
        studentId: 7,
        attendanceDate: "2026-07-26",
        status: "Izin",
      },
      createdAt: "2026-07-26T08:00:00.000Z",
      attemptCount: 2,
      nextAttemptAt: "2026-07-26T08:01:00.000Z",
      status: "pending",
      lastErrorCode: "network_error",
    }], { fetchImplementation });

    const request = fetchImplementation.mock.calls[0][1];
    expect(request.headers.access_token).toBe("teacher-token");
    expect(JSON.parse(request.body)).toEqual({
      mutations: [{
        clientMutationId: "attendance-1",
        type: "attendance.update",
        baseVersion: 3,
        payload: {
          studentId: 7,
          attendanceDate: "2026-07-26",
          status: "Izin",
        },
        createdAt: "2026-07-26T08:00:00.000Z",
      }],
    });
    expect(request.body).not.toContain("teacherId");
    expect(request.body).not.toContain("entityKey");
    expect(request.body).not.toContain("attemptCount");
  });

  test("preserves top-level authentication status for the engine", async () => {
    const fetchImplementation = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ msg: "Invalid Token" }),
    });
    await expect(submitTeacherSyncBatch([{
      clientMutationId: "journal-1",
      type: "journal.create",
      baseVersion: null,
      payload: {
        studentId: 7,
        type: "observation",
        content: "Catatan.",
        voiceCaptureType: null,
        observedAt: "2026-07-26",
      },
      createdAt: "2026-07-26T08:00:00.000Z",
    }], { fetchImplementation })).rejects.toEqual(
      expect.objectContaining({
        name: "TeacherSyncApiError",
        status: 401,
        message: "Invalid Token",
      })
    );
    expect(TeacherSyncApiError).toBeDefined();
  });

  test("reports API reachability from real sync success and network failure", async () => {
    const connectionStates = [];
    const listener = (event) => connectionStates.push(
      event.detail.available
    );
    window.addEventListener("issa:api-connection-changed", listener);

    await submitTeacherSyncBatch([{
      clientMutationId: "attendance-connection",
      type: "attendance.update",
      baseVersion: 3,
      payload: {
        studentId: 7,
        attendanceDate: "2026-07-26",
        status: "Izin",
      },
      createdAt: "2026-07-26T08:00:00.000Z",
    }], {
      fetchImplementation: vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ results: [] }),
      }),
    });
    await expect(submitTeacherSyncBatch([{
      clientMutationId: "attendance-network",
      type: "attendance.update",
      baseVersion: 3,
      payload: {
        studentId: 7,
        attendanceDate: "2026-07-26",
        status: "Sakit",
      },
      createdAt: "2026-07-26T08:01:00.000Z",
    }], {
      fetchImplementation: vi.fn().mockRejectedValue(
        new TypeError("Failed to fetch")
      ),
    })).rejects.toThrow("Failed to fetch");

    window.removeEventListener("issa:api-connection-changed", listener);
    expect(connectionStates).toEqual([true, false]);
  });
});

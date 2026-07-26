import {
  loadStudentDetailWorkspace,
} from "./studentDetailSnapshot";

const snapshot = {
  teacherId: 1,
  studentId: 7,
  studentSummary: {
    id: 7,
    NIM: "2026071001",
    name: "Ari Wibowo",
    Class: { id: 1, name: "1A" },
  },
  attendanceRecords: [{ id: 31, status: "Hadir", version: 4 }],
  journalEntries: [{ id: 41, content: "Cached journal" }],
  cachedAt: "2026-07-26T08:00:00.000Z",
};

describe("Student Detail workspace fallback", () => {
  test("uses cached minimum workspace only when the request has a network failure", async () => {
    const result = await loadStudentDetailWorkspace({
      teacherId: 1,
      studentId: 7,
      onlineHint: false,
      fetchStudent: vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
      readSnapshot: vi.fn().mockResolvedValue(snapshot),
      saveSnapshot: vi.fn(),
    });

    expect(result.source).toBe("snapshot");
    expect(result.student.name).toBe("Ari Wibowo");
    expect(result.student.Attendances[0].version).toBe(4);
    expect(result.student.Scores).toEqual([]);
  });

  test.each([401, 403])(
    "does not use a cached snapshot for HTTP %s",
    async (status) => {
      const authenticationError = Object.assign(new Error("Invalid Token"), {
        status,
      });
      await expect(loadStudentDetailWorkspace({
        teacherId: 1,
        studentId: 7,
        onlineHint: true,
        fetchStudent: vi.fn().mockRejectedValue(authenticationError),
        readSnapshot: vi.fn().mockResolvedValue(snapshot),
        saveSnapshot: vi.fn(),
      })).rejects.toBe(authenticationError);
    }
  );

  test("returns explicit unavailable states when no cached workspace exists", async () => {
    await expect(loadStudentDetailWorkspace({
      teacherId: 1,
      studentId: 7,
      onlineHint: false,
      fetchStudent: vi.fn().mockRejectedValue(new TypeError("offline")),
      readSnapshot: vi.fn().mockResolvedValue(null),
      saveSnapshot: vi.fn(),
    })).rejects.toThrow("Workspace siswa ini belum tersedia secara offline.");

    await expect(loadStudentDetailWorkspace({
      teacherId: null,
      studentId: 7,
      onlineHint: false,
      fetchStudent: vi.fn().mockRejectedValue(new TypeError("offline")),
      readSnapshot: vi.fn(),
      saveSnapshot: vi.fn(),
    })).rejects.toThrow("Buka dan login saat online terlebih dahulu.");
  });

  test("snapshot write failure never breaks successful online data", async () => {
    const student = {
      id: 7,
      name: "Ari Wibowo",
      Attendances: [{ id: 31, version: 5 }],
    };
    const result = await loadStudentDetailWorkspace({
      teacherId: 1,
      studentId: 7,
      onlineHint: true,
      fetchStudent: vi.fn().mockResolvedValue(student),
      readSnapshot: vi.fn().mockResolvedValue(snapshot),
      saveSnapshot: vi.fn().mockRejectedValue(new Error("quota")),
    });

    expect(result).toEqual({
      source: "online",
      student,
      snapshot,
    });
  });
});

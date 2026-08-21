import {
  confirmClassroomDebriefDrafts,
  fetchDebriefLessons,
  generateClassroomDebriefDrafts,
} from "./classroomDebriefApi";

vi.mock("../../auth/demoAccess", async () => {
  const actual = await vi.importActual("../../auth/demoAccess");
  return {
    ...actual,
    assertTeacherMutationAllowed: vi.fn(),
  };
});

describe("Classroom Debrief API", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.setItem("access_token", "teacher-token");
  });

  test("loads unique lesson context from the class schedule", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => [
        { Lesson: { id: 5, name: "Matematika" } },
        { Lesson: { id: 5, name: "Matematika" } },
        { Lesson: { id: 6, name: "Bahasa" } },
      ],
    });
    await expect(fetchDebriefLessons()).resolves.toEqual([
      { id: 6, name: "Bahasa" },
      { id: 5, name: "Matematika" },
    ]);
  });

  test("uses separate generation and deterministic confirmation endpoints", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { drafts: [] } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { results: [] } }),
      });

    await generateClassroomDebriefDrafts({
      text: "Catatan kelas",
      lessonId: 5,
    });
    await confirmClassroomDebriefDrafts([{
      clientMutationId: "stable-item",
    }]);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toContain(
      "/teachers/me/classroom-debrief/drafts"
    );
    expect(fetchMock.mock.calls[1][0]).toContain(
      "/teachers/me/classroom-debrief/confirm"
    );
  });

  test("preserves safe error metadata and Retry-After for the UI", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 429,
      headers: { get: (name) => name === "Retry-After" ? "90" : null },
      json: async () => ({
        error: {
          code: "publicDemoRateLimitExceeded",
          message: "Public demo request limit reached.",
        },
      }),
    });

    await expect(generateClassroomDebriefDrafts({
      text: "Catatan kelas",
      lessonId: 5,
    })).rejects.toMatchObject({
      code: "publicDemoRateLimitExceeded",
      retryAfterSeconds: 90,
      status: 429,
    });
  });
});

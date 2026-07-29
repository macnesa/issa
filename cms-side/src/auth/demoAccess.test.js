import {
  DEMO_READ_ONLY_CODE,
  DEMO_READ_ONLY_MESSAGE,
  assertTeacherMutationAllowed,
  readApiError,
} from "./demoAccess";
import { updateStudentRecord } from "../store/action/ActionCreator";
import { enqueueMutation } from "../offline-workspace/mutationQueue";

function unsignedTeacherToken(payload) {
  return [
    btoa(JSON.stringify({ alg: "none", typ: "JWT" })),
    btoa(JSON.stringify(payload)),
    "signature",
  ].join(".");
}

describe("CMS demo mutation guard", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  test("rejects demo mutation before an API boundary", () => {
    localStorage.setItem(
      "access_token",
      unsignedTeacherToken({
        role: "teacher",
        teacherId: 9,
        accessMode: "demo",
      })
    );

    expect(() => assertTeacherMutationAllowed()).toThrow(
      DEMO_READ_ONLY_MESSAGE
    );
    try {
      assertTeacherMutationAllowed();
    } catch (error) {
      expect(error.status).toBe(403);
      expect(error.code).toBe(DEMO_READ_ONLY_CODE);
    }

    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect(() => updateStudentRecord(4, { feedback: "blocked" })(
      vi.fn(),
      vi.fn()
    )).toThrow(DEMO_READ_ONLY_MESSAGE);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("does not populate IndexedDB or the offline queue", async () => {
    localStorage.setItem(
      "access_token",
      unsignedTeacherToken({
        role: "teacher",
        teacherId: 9,
        accessMode: "demo",
      })
    );
    const indexedDbOpen = vi.fn();
    vi.stubGlobal("indexedDB", { open: indexedDbOpen });

    await expect(enqueueMutation({
      teacherId: 9,
      type: "journal.create",
      payload: {
        studentId: 4,
        type: "teacher_observation",
        content: "Tidak boleh tersimpan",
        observedAt: "2026-07-29",
      },
    })).rejects.toThrow(DEMO_READ_ONLY_MESSAGE);
    expect(indexedDbOpen).not.toHaveBeenCalled();
  });

  test("keeps normal authenticated sessions writable", () => {
    localStorage.setItem(
      "access_token",
      unsignedTeacherToken({
        role: "teacher",
        teacherId: 9,
      })
    );

    expect(() => assertTeacherMutationAllowed()).not.toThrow();
  });

  test("maps the stable backend 403 code to the factual demo message", () => {
    expect(readApiError({
      error: {
        code: "publicDemoReadOnly",
        message: "backend detail",
      },
    }, "generic failure", 403)).toEqual({
      code: "publicDemoReadOnly",
      message: "Perubahan data tidak tersedia dalam mode demo.",
    });
  });
});

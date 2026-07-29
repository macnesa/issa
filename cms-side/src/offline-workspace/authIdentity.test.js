import {
  clearLastKnownTeacherIdentity,
  getActiveTeacherIdentity,
  getTeacherAccessMode,
  isTeacherDemoSession,
  readTeacherIdentityFromToken,
  saveLastKnownTeacherIdentity,
  teacherIdentityStorageKey,
} from "./authIdentity";

function unsignedTeacherToken(payload) {
  return [
    btoa(JSON.stringify({ alg: "none", typ: "JWT" })),
    btoa(JSON.stringify(payload)),
    "signature",
  ].join(".");
}

describe("last-known Teacher identity", () => {
  afterEach(() => {
    localStorage.clear();
  });

  test("uses stable Teacher ID from the existing JWT only as local namespace", () => {
    const token = unsignedTeacherToken({
      role: "teacher",
      teacherId: 19,
      classId: 3,
    });
    localStorage.setItem("access_token", token);

    expect(readTeacherIdentityFromToken(token)).toEqual({ id: 19, name: "" });
    expect(getActiveTeacherIdentity()).toEqual({ id: 19, name: "" });
  });

  test("persists only minimum identity and never stores the token in metadata", () => {
    localStorage.setItem("access_token", "legacy-token");
    saveLastKnownTeacherIdentity({
      id: 9,
      name: "Guru Demo",
      access_token: "must-not-persist",
      password: "must-not-persist",
    });

    expect(JSON.parse(localStorage.getItem(teacherIdentityStorageKey))).toEqual({
      id: 9,
      name: "Guru Demo",
    });
    expect(getActiveTeacherIdentity()).toEqual({ id: 9, name: "Guru Demo" });
    expect(localStorage.getItem("access_token")).toBe("legacy-token");

    clearLastKnownTeacherIdentity();
    expect(localStorage.getItem(teacherIdentityStorageKey)).toBeNull();
    expect(localStorage.getItem("access_token")).toBe("legacy-token");
  });

  test("does not treat a Parent JWT as Teacher identity", () => {
    const token = unsignedTeacherToken({
      role: "parent",
      userId: 3,
      studentId: 7,
    });
    expect(readTeacherIdentityFromToken(token)).toBeNull();
  });

  test("derives demo mode only from the exact JWT accessMode claim", () => {
    const demoToken = unsignedTeacherToken({
      role: "teacher",
      teacherId: 19,
      accessMode: "demo",
    });

    expect(getTeacherAccessMode(demoToken)).toBe("demo");
    expect(isTeacherDemoSession(demoToken)).toBe(true);
    expect(isTeacherDemoSession(unsignedTeacherToken({
      role: "teacher",
      teacherId: 19,
      accessMode: "Demo",
    }))).toBe(false);
  });
});

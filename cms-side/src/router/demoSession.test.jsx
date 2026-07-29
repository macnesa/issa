import { requireTeacherAuthentication } from "./index";
import { saveLastKnownTeacherIdentity } from "../offline-workspace/authIdentity";

function unsignedTeacherToken(payload) {
  return [
    btoa(JSON.stringify({ alg: "none", typ: "JWT" })),
    btoa(JSON.stringify(payload)),
    "signature",
  ].join(".");
}

describe("expired CMS demo session", () => {
  afterEach(() => localStorage.clear());

  test("clears the session and redirects with the demo-expired reason", () => {
    localStorage.setItem("access_token", unsignedTeacherToken({
      role: "teacher",
      teacherId: 9,
      accessMode: "demo",
      exp: Math.floor(Date.now() / 1000) - 1,
    }));
    saveLastKnownTeacherIdentity({ id: 9, name: "Guru Demo" });

    const redirectResponse = requireTeacherAuthentication();

    expect(redirectResponse.headers.get("Location")).toBe(
      "/login?session=demo-expired"
    );
    expect(localStorage.getItem("access_token")).toBeNull();
  });
});

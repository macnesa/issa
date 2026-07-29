import {
  configureParentSessionEndHandler,
  endParentSession,
  getSessionAccessMode,
  isParentDemoSession,
} from "./session";

function unsignedToken(payload) {
  return [
    btoa(JSON.stringify({ alg: "none", typ: "JWT" })),
    btoa(JSON.stringify(payload)),
    "signature",
  ].join(".");
}

describe("Parent demo session claim", () => {
  afterEach(() => localStorage.clear());

  test("recognizes only the exact demo accessMode claim", () => {
    const demoToken = unsignedToken({ accessMode: "demo" });

    expect(getSessionAccessMode(demoToken)).toBe("demo");
    expect(isParentDemoSession(demoToken)).toBe(true);
    expect(isParentDemoSession(unsignedToken({ accessMode: "Demo" }))).toBe(false);
    expect(isParentDemoSession(unsignedToken({ demo: true }))).toBe(false);
  });

  test("survives refresh by deriving mode from the stored JWT", () => {
    localStorage.setItem(
      "access_token",
      unsignedToken({ accessMode: "demo" })
    );

    expect(isParentDemoSession()).toBe(true);
  });

  test("clears an expired demo session with the demo-specific reason", () => {
    localStorage.setItem(
      "access_token",
      unsignedToken({ accessMode: "demo" })
    );
    const sessionEndHandler = vi.fn();
    const removeHandler = configureParentSessionEndHandler(sessionEndHandler);

    endParentSession("expired");

    expect(localStorage.getItem("access_token")).toBeNull();
    expect(sessionEndHandler).toHaveBeenCalledWith("demo-expired");
    removeHandler();
  });
});

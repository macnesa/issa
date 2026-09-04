import { getAuthorizedClassName } from "./authorizedClass";

describe("authorized student class context", () => {
  test("uses the direct detail class when available", () => {
    expect(getAuthorizedClassName(
      { id: 7, Class: { name: "2B" } },
      { rows: [{ id: 8, Class: { name: "1A" } }] }
    )).toBe("2B");
  });

  test("falls back to the teacher-scoped student-list class", () => {
    expect(getAuthorizedClassName(
      { id: 7 },
      { rows: [{ id: 8, Class: { name: "1A" } }] }
    )).toBe("1A");
  });

});

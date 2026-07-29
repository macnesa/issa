import { readFileSync } from "node:fs";
import { getAuthorizedClassName } from "./authorizedClass";

const studentDetailSource = readFileSync("src/pages/AddStudent.jsx", "utf8");
const sharedUiCss = readFileSync("src/shared/ui/ui.css", "utf8");

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

  test("keeps the mobile header compact and the NIM unbroken", () => {
    expect(sharedUiCss).toContain(".issa-student-context__portrait");
    expect(sharedUiCss).toContain(".issa-no-wrap");
    expect(studentDetailSource).not.toContain("Kelas Anda");
  });
});

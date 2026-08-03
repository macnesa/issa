import { readFileSync } from "node:fs";
import { getAuthorizedClassName } from "./authorizedClass";

const studentDetailSource = readFileSync("src/pages/AddStudent.jsx", "utf8");
const sharedUiSource = readFileSync("src/shared/ui/ui.jsx", "utf8");

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
    expect(sharedUiSource).toContain("issa-student-context__portrait w-14 h-14");
    expect(sharedUiSource).toContain("issa-no-wrap whitespace-nowrap");
    expect(studentDetailSource).not.toContain("Kelas Anda");
  });
});

import {
  classAttendancePath,
  studentAssessmentPath,
  studentRecordPath,
  studentTimelinePath,
  workflowOwners,
} from "./workflowRoutes";

describe("workflowRoutes", () => {
  test("kehadiran selalu memiliki satu destination canonical di domain Kelas", () => {
    expect(workflowOwners.classAttendance).toBe("/attendance");
    expect(classAttendancePath()).toBe("/attendance");
    expect(classAttendancePath({
      studentId: 7,
      studentName: "Ayu Pratama",
      attendanceDate: "2026-07-29",
    })).toBe("/attendance?studentId=7&name=Ayu+Pratama&date=2026-07-29");
  });

  test("workspace siswa membentuk deep link yang konsisten", () => {
    expect(studentRecordPath(7)).toBe("/students/7");
    expect(studentTimelinePath(7)).toBe("/students/7?view=timeline");
    expect(studentAssessmentPath(7)).toBe("/students/7?view=assessment");
  });
});

export const workflowOwners = Object.freeze({
  today: "/",
  students: "/students",
  class: "/class",
  classAttendance: "/attendance",
  classSchedule: "/schedule",
  classCapture: "/classroom-debrief",
});

export function studentRecordPath(studentId, view = "summary") {
  if (!studentId) return workflowOwners.students;
  const normalizedView = ["summary", "timeline", "assessment"].includes(view)
    ? view
    : "summary";
  return normalizedView === "summary"
    ? `/students/${studentId}`
    : `/students/${studentId}?view=${normalizedView}`;
}

export function studentTimelinePath(studentId) {
  return studentRecordPath(studentId, "timeline");
}

export function studentAssessmentPath(studentId) {
  return studentRecordPath(studentId, "assessment");
}

export function classAttendancePath({ studentId, studentName, attendanceDate } = {}) {
  const params = new URLSearchParams();
  if (studentId != null && String(studentId).trim()) {
    params.set("studentId", String(studentId));
  }
  if (studentName?.trim()) {
    params.set("name", studentName.trim());
  }
  if (attendanceDate?.trim()) {
    params.set("date", attendanceDate.trim());
  }
  const search = params.toString();
  return `${workflowOwners.classAttendance}${search ? `?${search}` : ""}`;
}

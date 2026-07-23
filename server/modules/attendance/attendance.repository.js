const {
  Attendance,
  Class,
  History,
  Student,
  Teacher,
} = require('../../models');

function findStudentsInClass(classId, studentId) {
  const studentWhere = { ClassId: classId };
  if (studentId !== '' && studentId !== null && typeof studentId !== 'undefined') {
    studentWhere.id = studentId;
  }

  return Student.findAll({
    where: studentWhere,
    attributes: ['id'],
  });
}

function findStudentInClass(studentId, classId) {
  return Student.findOne({
    where: { id: studentId, ClassId: classId },
  });
}

function findStudentAttendanceRecords(studentIds) {
  return Attendance.findAll({
    where: { StudentId: studentIds },
  });
}

function findAttendanceByStudentAndDate(studentId, attendanceDate) {
  return Attendance.findOne({
    where: { StudentId: studentId, attendanceDate },
  });
}

function findTeacherClass(classId) {
  return Class.findByPk(classId, { include: Teacher });
}

function createAttendanceRecord(attendancePayload) {
  return Attendance.create(attendancePayload);
}

function createAttendanceHistory(attendanceHistoryPayload) {
  return History.create(attendanceHistoryPayload);
}

function updateAttendanceRecord(attendanceRecord, attendancePayload) {
  return attendanceRecord.update(attendancePayload);
}

module.exports = {
  createAttendanceHistory,
  createAttendanceRecord,
  findAttendanceByStudentAndDate,
  findStudentAttendanceRecords,
  findStudentInClass,
  findStudentsInClass,
  findTeacherClass,
  updateAttendanceRecord,
};

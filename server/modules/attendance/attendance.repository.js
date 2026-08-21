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

function findStudentInClass(studentId, classId, options = {}) {
  return Student.findOne({
    where: { id: studentId, ClassId: classId },
    ...options,
  });
}

function findStudentAttendanceRecords(studentIds) {
  return Attendance.findAll({
    where: { StudentId: studentIds },
  });
}

function findAttendanceByStudentAndDate(
  studentId,
  attendanceDate,
  options = {}
) {
  return Attendance.findOne({
    where: { StudentId: studentId, attendanceDate },
    ...options,
  });
}

function findTeacherClass(classId, options = {}) {
  return Class.findByPk(classId, { include: Teacher, ...options });
}

function createAttendanceRecord(attendancePayload, options = {}) {
  return Attendance.create(attendancePayload, options);
}

function createAttendanceHistory(attendanceHistoryPayload, options = {}) {
  return History.create(attendanceHistoryPayload, options);
}

function updateAttendanceRecord(
  attendanceRecord,
  attendancePayload,
  options = {}
) {
  return attendanceRecord.update(attendancePayload, options);
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

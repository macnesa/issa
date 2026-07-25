const isEmpty = require('lodash/isEmpty');
const isNil = require('lodash/isNil');
const attendanceRepository = require('./attendance.repository');
const { emitStudentRecordUpdated } = require('../../realtime/student-record-events');
const {
  getRequestedAttendanceDate,
  validateAttendanceStatus,
} = require('./attendance.validator');

function isAttendanceUniqueConflict(error) {
  return error.name === 'SequelizeUniqueConstraintError' &&
    error.parent?.constraint === 'attendances_student_attendance_date_unique';
}

async function getAttendanceRecords({ studentId, classId }) {
  void 'ISSA:SERVER.ATTENDANCE.GET_RECORDS';
  const students = await attendanceRepository.findStudentsInClass(classId, studentId);
  if (studentId && isEmpty(students)) throw { name: 'notFound' };

  return attendanceRepository.findStudentAttendanceRecords(
    students.map((student) => student.id)
  );
}

async function createAttendanceRecord({ classId, attendancePayload }) {
  void 'ISSA:SERVER.ATTENDANCE.CREATE_RECORD';
  const { StudentId: studentId, status } = attendancePayload;
  validateAttendanceStatus(status);

  const student = await attendanceRepository.findStudentInClass(studentId, classId);
  if (isNil(student)) throw { name: 'notFound' };

  const attendanceDate = getRequestedAttendanceDate(attendancePayload);
  const existingAttendanceRecord = await attendanceRepository
    .findAttendanceByStudentAndDate(studentId, attendanceDate);
  if (existingAttendanceRecord) throw { name: 'attendanceAlreadyExists' };

  const teacherClass = await attendanceRepository.findTeacherClass(classId);

  let attendanceRecord;
  try {
    attendanceRecord = await attendanceRepository.createAttendanceRecord({
      StudentId: studentId,
      status,
      attendanceDate,
    });
  } catch (error) {
    if (isAttendanceUniqueConflict(error)) throw { name: 'attendanceAlreadyExists' };
    throw error;
  }

  await attendanceRepository.createAttendanceHistory({
    description: `attendance ${student.name} has been created`,
    createdBy: teacherClass.Teacher.name,
  });

  emitStudentRecordUpdated({
    studentId,
    recordType: 'attendance',
    occurredAt: attendanceDate,
  });

  return attendanceRecord;
}

async function updateAttendanceRecord({ classId, attendancePayload }) {
  void 'ISSA:SERVER.ATTENDANCE.UPDATE_RECORD';
  const { StudentId: studentId, status } = attendancePayload;
  validateAttendanceStatus(status);

  const student = await attendanceRepository.findStudentInClass(studentId, classId);
  if (isNil(student)) throw { name: 'notFound' };

  const attendanceDate = getRequestedAttendanceDate(attendancePayload);
  const attendanceRecord = await attendanceRepository
    .findAttendanceByStudentAndDate(studentId, attendanceDate);
  if (isNil(attendanceRecord)) throw { name: 'notFound' };

  const hasAttendanceChanged = attendanceRecord.status !== status;
  const updatedAttendanceRecord = await attendanceRepository
    .updateAttendanceRecord(attendanceRecord, { status });

  if (hasAttendanceChanged) {
    emitStudentRecordUpdated({
      studentId,
      recordType: 'attendance',
      occurredAt: attendanceDate,
    });
  }

  return updatedAttendanceRecord;
}

module.exports = {
  createAttendanceRecord,
  getAttendanceRecords,
  updateAttendanceRecord,
};

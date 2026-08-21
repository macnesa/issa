const isEmpty = require('lodash/isEmpty');
const isNil = require('lodash/isNil');
const attendanceRepository = require('./attendance.repository');
const { emitStudentRecordUpdated } = require('../../realtime/student-record-events');
const { appendHistorySource } = require('../../helpers/history-source');
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

async function createAttendanceRecord({
  classId,
  attendancePayload,
  transaction = null,
  emitRealtime = true,
  historySource = null,
}) {
  void 'ISSA:SERVER.ATTENDANCE.CREATE_RECORD';
  const { StudentId: studentId, status } = attendancePayload;
  validateAttendanceStatus(status);

  const transactionOptions = transaction ? { transaction } : undefined;
  const student = transaction
    ? await attendanceRepository.findStudentInClass(
      studentId,
      classId,
      transactionOptions
    )
    : await attendanceRepository.findStudentInClass(studentId, classId);
  if (isNil(student)) throw { name: 'notFound' };

  const attendanceDate = getRequestedAttendanceDate(attendancePayload);
  const existingAttendanceRecord = transaction
    ? await attendanceRepository.findAttendanceByStudentAndDate(
      studentId,
      attendanceDate,
      transactionOptions
    )
    : await attendanceRepository.findAttendanceByStudentAndDate(
      studentId,
      attendanceDate
    );
  if (existingAttendanceRecord) throw { name: 'attendanceAlreadyExists' };

  const teacherClass = transaction
    ? await attendanceRepository.findTeacherClass(classId, transactionOptions)
    : await attendanceRepository.findTeacherClass(classId);

  let attendanceRecord;
  try {
    const recordPayload = { StudentId: studentId, status, attendanceDate };
    attendanceRecord = transaction
      ? await attendanceRepository.createAttendanceRecord(
        recordPayload,
        transactionOptions
      )
      : await attendanceRepository.createAttendanceRecord(recordPayload);
  } catch (error) {
    if (isAttendanceUniqueConflict(error)) throw { name: 'attendanceAlreadyExists' };
    throw error;
  }

  const historyPayload = {
    description: appendHistorySource(
      `attendance ${student.name} has been created`,
      historySource
    ),
    createdBy: teacherClass.Teacher.name,
  };
  if (transaction) {
    await attendanceRepository.createAttendanceHistory(
      historyPayload,
      transactionOptions
    );
  } else {
    await attendanceRepository.createAttendanceHistory(historyPayload);
  }

  if (emitRealtime) emitStudentRecordUpdated({
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
  if (!hasAttendanceChanged) return attendanceRecord;

  const currentVersion = Number.isInteger(attendanceRecord.version)
    ? attendanceRecord.version
    : 1;
  const updatedAttendanceRecord = await attendanceRepository
    .updateAttendanceRecord(attendanceRecord, {
      status,
      version: currentVersion + 1,
    });

  emitStudentRecordUpdated({
    studentId,
    recordType: 'attendance',
    occurredAt: attendanceDate,
  });

  return updatedAttendanceRecord;
}

module.exports = {
  createAttendanceRecord,
  getAttendanceRecords,
  updateAttendanceRecord,
};

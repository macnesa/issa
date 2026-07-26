const isNil = require('lodash/isNil');
const attendanceRepository = require('../../attendance/attendance.repository');
const {
  validateAttendanceDate,
  validateAttendanceStatus,
} = require('../../attendance/attendance.validator');
const {
  validateResourceId,
} = require('../../student-learning-journal/student-learning-journal.validator');

function rejectMutation(code, message) {
  throw { syncMutationCode: code, message };
}

function toPlainRecord(record) {
  if (record && typeof record.get === 'function') {
    return record.get({ plain: true });
  }
  if (record && typeof record.toJSON === 'function') return record.toJSON();
  return record;
}

function mapAttendanceRecord(attendanceRecord) {
  const attendance = toPlainRecord(attendanceRecord);
  return {
    id: attendance.id,
    StudentId: Number(attendance.StudentId),
    status: attendance.status,
    attendanceDate: attendance.attendanceDate,
    version: attendance.version,
    createdAt: attendance.createdAt,
    updatedAt: attendance.updatedAt,
  };
}

function validateAttendanceMutation(mutation) {
  const { payload } = mutation;
  let studentId;
  try {
    studentId = validateResourceId(String(payload.studentId));
    validateAttendanceStatus(payload.status);
    validateAttendanceDate(payload.attendanceDate);
  } catch (error) {
    rejectMutation(
      'invalid_mutation',
      'Attendance mutation payload is invalid.'
    );
  }

  if (!Number.isSafeInteger(mutation.baseVersion) || mutation.baseVersion < 1) {
    rejectMutation(
      'invalid_mutation',
      'Attendance baseVersion must be a positive integer.'
    );
  }

  return {
    attendanceDate: payload.attendanceDate,
    baseVersion: mutation.baseVersion,
    status: payload.status,
    studentId,
  };
}

async function applyAttendanceUpdate({
  mutation,
  requester,
  transaction,
}) {
  void 'ISSA:SERVER.TEACHER_SYNC.APPLY_ATTENDANCE';
  const local = validateAttendanceMutation(mutation);
  const student = await attendanceRepository.findStudentInClass(
    local.studentId,
    requester.classId,
    {
      lock: transaction.LOCK.UPDATE,
      transaction,
    }
  );
  if (isNil(student)) {
    rejectMutation(
      'student_access_denied',
      'Teacher no longer has access to this student.'
    );
  }

  const attendanceRecord = await attendanceRepository
    .findAttendanceByStudentAndDate(
      local.studentId,
      local.attendanceDate,
      {
        lock: transaction.LOCK.UPDATE,
        transaction,
      }
    );
  if (isNil(attendanceRecord)) {
    rejectMutation(
      'attendance_not_found',
      'Attendance record does not exist for this student and date.'
    );
  }

  if (local.baseVersion !== attendanceRecord.version) {
    void 'ISSA:SERVER.TEACHER_SYNC.DETECT_ATTENDANCE_CONFLICT';
    const serverRecord = mapAttendanceRecord(attendanceRecord);
    return {
      conflict: {
        type: 'attendance_version_mismatch',
        local: {
          studentId: local.studentId,
          attendanceDate: local.attendanceDate,
          status: local.status,
          baseVersion: local.baseVersion,
        },
        server: {
          id: serverRecord.id,
          studentId: serverRecord.StudentId,
          attendanceDate: serverRecord.attendanceDate,
          status: serverRecord.status,
          version: serverRecord.version,
          updatedAt: serverRecord.updatedAt,
        },
      },
      status: 'conflict',
    };
  }

  if (attendanceRecord.status === local.status) {
    return {
      realtimeEvent: null,
      serverRecord: mapAttendanceRecord(attendanceRecord),
      status: 'applied',
    };
  }

  const updatedAttendance = await attendanceRepository.updateAttendanceRecord(
    attendanceRecord,
    {
      status: local.status,
      version: attendanceRecord.version + 1,
    },
    { transaction }
  );

  return {
    realtimeEvent: {
      studentId: local.studentId,
      recordType: 'attendance',
      occurredAt: local.attendanceDate,
    },
    serverRecord: mapAttendanceRecord(updatedAttendance),
    status: 'applied',
  };
}

module.exports = {
  applyAttendanceUpdate,
  mapAttendanceRecord,
  validateAttendanceMutation,
};

jest.mock('../modules/attendance/attendance.repository', () => ({
  createAttendanceHistory: jest.fn(),
  createAttendanceRecord: jest.fn(),
  findAttendanceByStudentAndDate: jest.fn(),
  findStudentAttendanceRecords: jest.fn(),
  findStudentInClass: jest.fn(),
  findStudentsInClass: jest.fn(),
  findTeacherClass: jest.fn(),
  updateAttendanceRecord: jest.fn(),
}));
jest.mock('../realtime/student-record-events', () => ({
  emitStudentRecordUpdated: jest.fn(),
}));

const attendanceRepository = require('../modules/attendance/attendance.repository');
const attendanceService = require('../modules/attendance/attendance.service');
const {
  emitStudentRecordUpdated,
} = require('../realtime/student-record-events');
const {
  validateAttendanceDate,
  validateAttendanceStatus,
} = require('../modules/attendance/attendance.validator');

describe('attendance module service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    attendanceRepository.findStudentInClass.mockResolvedValue({
      id: 7,
      name: 'Student One',
    });
    attendanceRepository.findAttendanceByStudentAndDate.mockResolvedValue(null);
    attendanceRepository.findTeacherClass.mockResolvedValue({
      Teacher: { name: 'Teacher One' },
    });
    attendanceRepository.createAttendanceRecord.mockResolvedValue({ id: 31 });
    attendanceRepository.createAttendanceHistory.mockResolvedValue({ id: 41 });
  });

  test('creates attendance after checking student access and duplicate date', async () => {
    const attendancePayload = Object.freeze({
      StudentId: 7,
      status: 'Hadir',
      attendanceDate: '2026-07-23',
    });

    await expect(attendanceService.createAttendanceRecord({
      classId: 3,
      attendancePayload,
    })).resolves.toEqual({ id: 31 });

    expect(attendanceRepository.findStudentInClass).toHaveBeenCalledWith(7, 3);
    expect(attendanceRepository.findAttendanceByStudentAndDate)
      .toHaveBeenCalledWith(7, '2026-07-23');
    expect(attendanceRepository.createAttendanceRecord).toHaveBeenCalledWith({
      StudentId: 7,
      status: 'Hadir',
      attendanceDate: '2026-07-23',
    });
    expect(emitStudentRecordUpdated).toHaveBeenCalledTimes(1);
    expect(emitStudentRecordUpdated).toHaveBeenCalledWith({
      studentId: 7,
      recordType: 'attendance',
      occurredAt: '2026-07-23',
    });
    expect(attendancePayload.status).toBe('Hadir');
  });

  test('supports transactional Debrief writes without duplicate realtime', async () => {
    const transaction = { id: 'debrief-transaction' };

    await attendanceService.createAttendanceRecord({
      classId: 3,
      attendancePayload: {
        StudentId: 7,
        status: 'Hadir',
        attendanceDate: '2026-07-23',
      },
      transaction,
      emitRealtime: false,
      historySource: 'classroom_debrief',
    });

    expect(attendanceRepository.createAttendanceHistory).toHaveBeenCalledWith(
      expect.objectContaining({
        description: expect.stringContaining('[source: classroom_debrief]'),
      }),
      { transaction }
    );
    expect(attendanceRepository.createAttendanceRecord).toHaveBeenCalledWith(
      expect.any(Object),
      { transaction }
    );
    expect(emitStudentRecordUpdated).not.toHaveBeenCalled();
  });

  test('rejects a duplicate student and attendance date before create', async () => {
    attendanceRepository.findAttendanceByStudentAndDate.mockResolvedValue({ id: 31 });

    await expect(attendanceService.createAttendanceRecord({
      classId: 3,
      attendancePayload: {
        StudentId: 7,
        status: 'Hadir',
        attendanceDate: '2026-07-23',
      },
    })).rejects.toEqual({ name: 'attendanceAlreadyExists' });

    expect(attendanceRepository.createAttendanceRecord).not.toHaveBeenCalled();
    expect(emitStudentRecordUpdated).not.toHaveBeenCalled();
  });

  test('translates the known database unique conflict', async () => {
    attendanceRepository.createAttendanceRecord.mockRejectedValue({
      name: 'SequelizeUniqueConstraintError',
      parent: {
        constraint: 'attendances_student_attendance_date_unique',
      },
    });

    await expect(attendanceService.createAttendanceRecord({
      classId: 3,
      attendancePayload: {
        StudentId: 7,
        status: 'Hadir',
        attendanceDate: '2026-07-23',
      },
    })).rejects.toEqual({ name: 'attendanceAlreadyExists' });
  });

  test('updates an existing attendance record', async () => {
    const attendanceRecord = { id: 31, status: 'Hadir', version: 1 };
    attendanceRepository.findAttendanceByStudentAndDate.mockResolvedValue(attendanceRecord);
    attendanceRepository.updateAttendanceRecord.mockResolvedValue({
      id: 31,
      status: 'Izin',
      version: 2,
    });

    await expect(attendanceService.updateAttendanceRecord({
      classId: 3,
      attendancePayload: {
        StudentId: 7,
        status: 'Izin',
        attendanceDate: '2026-07-23',
      },
    })).resolves.toEqual({ id: 31, status: 'Izin', version: 2 });

    expect(attendanceRepository.updateAttendanceRecord)
      .toHaveBeenCalledWith(attendanceRecord, {
        status: 'Izin',
        version: 2,
      });
    expect(emitStudentRecordUpdated).toHaveBeenCalledTimes(1);
  });

  test('does not emit when an attendance update keeps the same status', async () => {
    const attendanceRecord = { id: 31, status: 'Hadir', version: 1 };
    attendanceRepository.findAttendanceByStudentAndDate.mockResolvedValue(attendanceRecord);
    attendanceRepository.updateAttendanceRecord.mockResolvedValue(attendanceRecord);

    await attendanceService.updateAttendanceRecord({
      classId: 3,
      attendancePayload: {
        StudentId: 7,
        status: 'Hadir',
        attendanceDate: '2026-07-23',
      },
    });

    expect(attendanceRepository.updateAttendanceRecord).not.toHaveBeenCalled();
    expect(emitStudentRecordUpdated).not.toHaveBeenCalled();
  });
});

describe('attendance validator', () => {
  test('rejects an impossible date', () => {
    expect.assertions(1);
    try {
      validateAttendanceDate('2026-02-30');
    } catch (error) {
      expect(error).toEqual({ name: 'invalidAttendanceDate' });
    }
  });

  test('rejects an unsupported status', () => {
    expect.assertions(1);
    try {
      validateAttendanceStatus('hadir');
    } catch (error) {
      expect(error).toEqual({ name: 'invalidAttendanceStatus' });
    }
  });
});

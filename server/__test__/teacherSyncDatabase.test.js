jest.mock('../realtime/student-record-events', () => ({
  emitStudentRecordUpdated: jest.fn(),
}));

const {
  Attendance,
  Class,
  Student,
  StudentLearningJournal,
  SyncMutationReceipt,
  Teacher,
} = require('../models');
const attendanceService = require('../modules/attendance/attendance.service');
const {
  processTeacherSyncBatch,
} = require('../modules/teacher-sync/teacher-sync.service');
const {
  emitStudentRecordUpdated,
} = require('../realtime/student-record-events');

const fixtureSuffix = `${Date.now()}-${process.pid}`;
let teacher;
let teacherClass;
let student;
let otherTeacher;
let otherClass;
let otherStudent;

function requester() {
  return {
    role: 'teacher',
    teacherId: teacher.id,
    classId: teacherClass.id,
  };
}

function attendanceMutation({
  clientMutationId,
  attendanceDate,
  status,
  baseVersion = 1,
}) {
  return {
    clientMutationId,
    type: 'attendance.update',
    baseVersion,
    payload: {
      studentId: student.id,
      attendanceDate,
      status,
    },
    createdAt: '2026-07-26T08:00:00.000Z',
  };
}

function journalMutation({
  clientMutationId,
  targetStudentId = student.id,
  overrides = {},
}) {
  return {
    clientMutationId,
    type: 'journal.create',
    payload: {
      studentId: targetStudentId,
      type: 'observation',
      content: `Teacher sync database journal ${fixtureSuffix}.`,
      voiceCaptureType: null,
      observedAt: '2026-07-26T08:00:00.000Z',
      ...overrides,
    },
    createdAt: '2026-07-26T08:10:00.000Z',
  };
}

async function sync(mutations) {
  return processTeacherSyncBatch({
    requester: requester(),
    syncPayload: { mutations },
  });
}

describe('Teacher sync database atomicity and concurrency', () => {
  beforeAll(async () => {
    teacher = await Teacher.create({
      NIP: `sync-${fixtureSuffix}`,
      name: 'Teacher Sync Test',
      password: 'sync-test-password',
    });
    teacherClass = await Class.create({
      name: `Sync ${fixtureSuffix}`,
      TeacherId: teacher.id,
      SPP: 1,
    });
    student = await Student.create({
      NIM: `sync-student-${fixtureSuffix}`,
      name: 'Student Sync Test',
      age: '10',
      gender: 'Male',
      birthDate: '2016-01-01',
      feedback: null,
      ClassId: teacherClass.id,
      imgUrl: 'https://example.test/student.png',
    });

    otherTeacher = await Teacher.create({
      NIP: `sync-other-${fixtureSuffix}`,
      name: 'Other Teacher Sync Test',
      password: 'sync-test-password',
    });
    otherClass = await Class.create({
      name: `Other Sync ${fixtureSuffix}`,
      TeacherId: otherTeacher.id,
      SPP: 1,
    });
    otherStudent = await Student.create({
      NIM: `sync-other-student-${fixtureSuffix}`,
      name: 'Other Student Sync Test',
      age: '10',
      gender: 'Female',
      birthDate: '2016-01-01',
      feedback: null,
      ClassId: otherClass.id,
      imgUrl: 'https://example.test/student.png',
    });
  });

  afterAll(async () => {
    await SyncMutationReceipt.destroy({
      where: { TeacherId: teacher.id },
      force: true,
    });
    await StudentLearningJournal.destroy({
      where: {
        StudentId: [student.id, otherStudent.id],
      },
      force: true,
    });
    await Attendance.destroy({
      where: { StudentId: student.id },
      force: true,
    });
    await Student.destroy({
      where: { id: [student.id, otherStudent.id] },
      force: true,
    });
    await Class.destroy({
      where: { id: [teacherClass.id, otherClass.id] },
      force: true,
    });
    await Teacher.destroy({
      where: { id: [teacher.id, otherTeacher.id] },
      force: true,
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Attendance defaults to version 1 and normal updates increment only on change', async () => {
    const attendance = await Attendance.create({
      StudentId: student.id,
      status: 'Hadir',
      attendanceDate: '2026-07-20',
    });
    expect(attendance.version).toBe(1);

    const updated = await attendanceService.updateAttendanceRecord({
      classId: teacherClass.id,
      attendancePayload: {
        StudentId: student.id,
        status: 'Izin',
        attendanceDate: '2026-07-20',
      },
    });
    expect(updated.version).toBe(2);
    expect(emitStudentRecordUpdated).toHaveBeenCalledTimes(1);

    const noOp = await attendanceService.updateAttendanceRecord({
      classId: teacherClass.id,
      attendancePayload: {
        StudentId: student.id,
        status: 'Izin',
        attendanceDate: '2026-07-20',
      },
    });
    expect(noOp.version).toBe(2);
    expect(emitStudentRecordUpdated).toHaveBeenCalledTimes(1);
  });

  test('Attendance retry is duplicate and reused identifier is rejected', async () => {
    await Attendance.create({
      StudentId: student.id,
      status: 'Hadir',
      attendanceDate: '2026-07-21',
    });
    const mutation = attendanceMutation({
      clientMutationId: `attendance-idempotent-${fixtureSuffix}`,
      attendanceDate: '2026-07-21',
      status: 'Sakit',
    });

    const first = await sync([mutation]);
    const duplicate = await sync([mutation]);
    const reused = await sync([{
      ...mutation,
      payload: { ...mutation.payload, status: 'Alfa' },
    }]);
    const attendance = await Attendance.findOne({
      where: {
        StudentId: student.id,
        attendanceDate: '2026-07-21',
      },
    });

    expect(first.results[0].status).toBe('applied');
    expect(first.results[0].serverRecord.version).toBe(2);
    expect(duplicate.results[0]).toEqual(expect.objectContaining({
      status: 'duplicate',
      serverRecord: expect.objectContaining({
        status: 'Sakit',
        version: 2,
      }),
    }));
    expect(reused.results[0].error.code).toBe('idempotency_key_reused');
    expect(attendance.status).toBe('Sakit');
    expect(attendance.version).toBe(2);
    expect(emitStudentRecordUpdated).toHaveBeenCalledTimes(1);
  });

  test('two concurrent updates with one baseVersion produce one applied and one conflict', async () => {
    await Attendance.create({
      StudentId: student.id,
      status: 'Hadir',
      attendanceDate: '2026-07-22',
    });
    const firstMutation = attendanceMutation({
      clientMutationId: `attendance-concurrent-a-${fixtureSuffix}`,
      attendanceDate: '2026-07-22',
      status: 'Izin',
    });
    const secondMutation = attendanceMutation({
      clientMutationId: `attendance-concurrent-b-${fixtureSuffix}`,
      attendanceDate: '2026-07-22',
      status: 'Sakit',
    });

    const responses = await Promise.all([
      sync([firstMutation]),
      sync([secondMutation]),
    ]);
    const statuses = responses
      .map((response) => response.results[0].status)
      .sort();
    const attendance = await Attendance.findOne({
      where: {
        StudentId: student.id,
        attendanceDate: '2026-07-22',
      },
    });

    expect(statuses).toEqual(['applied', 'conflict']);
    expect(attendance.version).toBe(2);
    expect(['Izin', 'Sakit']).toContain(attendance.status);
    expect(await SyncMutationReceipt.count({
      where: {
        TeacherId: teacher.id,
        clientMutationId: [
          firstMutation.clientMutationId,
          secondMutation.clientMutationId,
        ],
      },
    })).toBe(1);
    expect(emitStudentRecordUpdated).toHaveBeenCalledTimes(1);
    const conflict = responses
      .map((response) => response.results[0])
      .find((result) => result.status === 'conflict');
    expect(conflict.error).toEqual({
      code: 'attendance_version_conflict',
      message: 'Attendance changed on the server.',
    });
    expect(conflict.conflict).toEqual(expect.objectContaining({
      type: 'attendance_version_mismatch',
      local: expect.objectContaining({ baseVersion: 1 }),
      server: expect.objectContaining({ version: 2 }),
    }));
  });

  test('Journal retry creates one row, one receipt, and one event', async () => {
    const mutation = journalMutation({
      clientMutationId: `journal-idempotent-${fixtureSuffix}`,
    });

    const first = await sync([mutation]);
    const duplicate = await sync([mutation]);

    expect(first.results[0].status).toBe('applied');
    expect(first.results[0].serverRecord).toEqual(expect.objectContaining({
      studentId: student.id,
      type: 'observation',
    }));
    expect(duplicate.results[0]).toEqual(expect.objectContaining({
      status: 'duplicate',
      serverRecord: expect.objectContaining({
        id: first.results[0].serverRecord.id,
      }),
    }));
    expect(await StudentLearningJournal.count({
      where: {
        StudentId: student.id,
        content: mutation.payload.content,
      },
    })).toBe(1);
    expect(await SyncMutationReceipt.count({
      where: {
        TeacherId: teacher.id,
        clientMutationId: mutation.clientMutationId,
      },
    })).toBe(1);
    expect(emitStudentRecordUpdated).toHaveBeenCalledTimes(1);
  });

  test('Journal validation, evidence, and current authorization failures are isolated', async () => {
    const invalidReflection = journalMutation({
      clientMutationId: `journal-reflection-${fixtureSuffix}`,
      overrides: {
        type: 'student_reflection',
        voiceCaptureType: null,
      },
    });
    const evidenceMutation = journalMutation({
      clientMutationId: `journal-evidence-${fixtureSuffix}`,
      overrides: { evidenceId: 7 },
    });
    const deniedMutation = journalMutation({
      clientMutationId: `journal-denied-${fixtureSuffix}`,
      targetStudentId: otherStudent.id,
    });
    const validMutation = journalMutation({
      clientMutationId: `journal-after-rejected-${fixtureSuffix}`,
      overrides: { content: `Valid journal after rejected ${fixtureSuffix}.` },
    });

    const response = await sync([
      invalidReflection,
      evidenceMutation,
      deniedMutation,
      validMutation,
    ]);

    expect(response.results.map((result) => result.status)).toEqual([
      'rejected',
      'rejected',
      'rejected',
      'applied',
    ]);
    expect(response.results.map((result) => result.error?.code)).toEqual([
      'journal_validation_failed',
      'journal_evidence_not_supported',
      'student_access_denied',
      undefined,
    ]);
    expect(emitStudentRecordUpdated).toHaveBeenCalledTimes(1);
  });

  test('Journal domain write rolls back when receipt insert fails', async () => {
    const mutation = journalMutation({
      clientMutationId: `journal-rollback-${fixtureSuffix}`,
      overrides: { content: `Rollback journal ${fixtureSuffix}.` },
    });
    const createReceiptSpy = jest
      .spyOn(SyncMutationReceipt, 'create')
      .mockRejectedValueOnce(new Error('receipt insert failed'));

    await expect(sync([mutation])).rejects.toThrow('receipt insert failed');

    expect(await StudentLearningJournal.count({
      where: {
        StudentId: student.id,
        content: mutation.payload.content,
      },
    })).toBe(0);
    expect(await SyncMutationReceipt.count({
      where: {
        TeacherId: teacher.id,
        clientMutationId: mutation.clientMutationId,
      },
    })).toBe(0);
    expect(emitStudentRecordUpdated).not.toHaveBeenCalled();
    createReceiptSpy.mockRestore();
  });
});

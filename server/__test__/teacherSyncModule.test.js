const mockTransaction = {
  LOCK: { UPDATE: 'UPDATE' },
};

jest.mock('../models', () => ({
  sequelize: {
    transaction: jest.fn(async (transactionWork) =>
      transactionWork(mockTransaction)),
  },
}));
jest.mock('../modules/teacher-sync/teacher-sync.repository', () => ({
  createReceipt: jest.fn(),
  findReceipt: jest.fn(),
  lockTeacher: jest.fn(),
}));
jest.mock(
  '../modules/teacher-sync/mutation-handlers/attendance-update.handler',
  () => ({
    applyAttendanceUpdate: jest.fn(),
  })
);
jest.mock(
  '../modules/teacher-sync/mutation-handlers/journal-create.handler',
  () => ({
    applyJournalCreate: jest.fn(),
  })
);
jest.mock('../realtime/student-record-events', () => ({
  emitStudentRecordUpdated: jest.fn(),
}));

const {
  applyAttendanceUpdate,
} = require(
  '../modules/teacher-sync/mutation-handlers/attendance-update.handler'
);
const {
  applyJournalCreate,
} = require(
  '../modules/teacher-sync/mutation-handlers/journal-create.handler'
);
const { hashMutationRequest } = require(
  '../modules/teacher-sync/teacher-sync.hash'
);
const teacherSyncRepository = require(
  '../modules/teacher-sync/teacher-sync.repository'
);
const {
  processTeacherSyncBatch,
} = require('../modules/teacher-sync/teacher-sync.service');
const {
  emitStudentRecordUpdated,
} = require('../realtime/student-record-events');

const requester = {
  role: 'teacher',
  teacherId: 5,
  classId: 3,
};
const attendanceMutation = {
  clientMutationId: 'attendance-1',
  type: 'attendance.update',
  baseVersion: 1,
  payload: {
    studentId: 7,
    attendanceDate: '2026-07-26',
    status: 'Izin',
  },
  createdAt: '2026-07-26T08:00:00.000Z',
};
const journalMutation = {
  clientMutationId: 'journal-1',
  type: 'journal.create',
  payload: {
    studentId: 7,
    type: 'observation',
    content: 'Ari menjelaskan langkah pengerjaan.',
    voiceCaptureType: null,
    observedAt: '2026-07-26T08:00:00.000Z',
  },
  createdAt: '2026-07-26T08:10:00.000Z',
};

function attendanceApplied(overrides = {}) {
  return {
    status: 'applied',
    serverRecord: {
      id: 31,
      StudentId: 7,
      status: 'Izin',
      version: 2,
    },
    realtimeEvent: {
      studentId: 7,
      recordType: 'attendance',
      occurredAt: '2026-07-26',
    },
    ...overrides,
  };
}

describe('Teacher sync batch orchestration and idempotency', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    teacherSyncRepository.lockTeacher.mockResolvedValue({ id: 5 });
    teacherSyncRepository.findReceipt.mockResolvedValue(null);
    teacherSyncRepository.createReceipt.mockResolvedValue({ id: 91 });
    applyAttendanceUpdate.mockResolvedValue(attendanceApplied());
    applyJournalCreate.mockResolvedValue({
      status: 'applied',
      serverRecord: { id: 44, studentId: 7, type: 'observation' },
      realtimeEvent: {
        studentId: 7,
        recordType: 'journal',
        occurredAt: '2026-07-26T08:00:00.000Z',
      },
    });
  });

  test('valid Teacher batch returns applied result and stores receipt atomically', async () => {
    const response = await processTeacherSyncBatch({
      requester,
      syncPayload: { mutations: [attendanceMutation] },
    });

    expect(response.results).toEqual([
      expect.objectContaining({
        clientMutationId: 'attendance-1',
        status: 'applied',
        serverRecord: expect.objectContaining({ version: 2 }),
        conflict: null,
        error: null,
      }),
    ]);
    expect(teacherSyncRepository.lockTeacher)
      .toHaveBeenCalledWith(5, mockTransaction);
    expect(teacherSyncRepository.createReceipt).toHaveBeenCalledWith(
      expect.objectContaining({
        TeacherId: 5,
        clientMutationId: 'attendance-1',
        mutationType: 'attendance.update',
        status: 'applied',
        result: {
          serverRecord: expect.objectContaining({ version: 2 }),
        },
      }),
      mockTransaction
    );
    expect(emitStudentRecordUpdated).toHaveBeenCalledTimes(1);
  });

  test('empty and oversized batches are rejected before transaction work', async () => {
    await expect(processTeacherSyncBatch({
      requester,
      syncPayload: { mutations: [] },
    })).rejects.toEqual({ name: 'invalidSyncBatch' });
    await expect(processTeacherSyncBatch({
      requester,
      syncPayload: {
        mutations: Array.from({ length: 51 }, (_, index) => ({
          ...attendanceMutation,
          clientMutationId: `mutation-${index}`,
        })),
      },
    })).rejects.toEqual({ name: 'invalidSyncBatch' });

    expect(teacherSyncRepository.lockTeacher).not.toHaveBeenCalled();
  });

  test('unsupported and rejected mutations do not stop later mutations or reorder results', async () => {
    applyAttendanceUpdate.mockRejectedValueOnce({
      syncMutationCode: 'attendance_not_found',
      message: 'Attendance record does not exist.',
    });
    const unsupportedMutation = {
      clientMutationId: 'unsupported-1',
      type: 'score.create',
      payload: {},
      createdAt: '2026-07-26T08:00:00.000Z',
    };

    const response = await processTeacherSyncBatch({
      requester,
      syncPayload: {
        mutations: [
          unsupportedMutation,
          attendanceMutation,
          journalMutation,
        ],
      },
    });

    expect(response.results.map((result) => result.clientMutationId)).toEqual([
      'unsupported-1',
      'attendance-1',
      'journal-1',
    ]);
    expect(response.results.map((result) => result.status)).toEqual([
      'rejected',
      'rejected',
      'applied',
    ]);
    expect(response.results[0].error.code).toBe('unsupported_mutation_type');
    expect(response.results[1].error.code).toBe('attendance_not_found');
    expect(teacherSyncRepository.createReceipt).toHaveBeenCalledTimes(1);
    expect(emitStudentRecordUpdated).toHaveBeenCalledTimes(1);
  });

  test('same receipt hash returns stable duplicate without write or event', async () => {
    const serverRecord = {
      id: 31,
      StudentId: 7,
      status: 'Izin',
      version: 2,
    };
    teacherSyncRepository.findReceipt.mockResolvedValue({
      mutationType: 'attendance.update',
      requestHash: hashMutationRequest(attendanceMutation),
      result: { serverRecord },
    });

    const response = await processTeacherSyncBatch({
      requester,
      syncPayload: { mutations: [attendanceMutation] },
    });

    expect(response.results[0]).toEqual({
      clientMutationId: 'attendance-1',
      status: 'duplicate',
      serverRecord,
      conflict: null,
      error: null,
    });
    expect(applyAttendanceUpdate).not.toHaveBeenCalled();
    expect(teacherSyncRepository.createReceipt).not.toHaveBeenCalled();
    expect(emitStudentRecordUpdated).not.toHaveBeenCalled();
  });

  test('reused identifier with different data is rejected without replacing receipt', async () => {
    teacherSyncRepository.findReceipt.mockResolvedValue({
      mutationType: 'attendance.update',
      requestHash: hashMutationRequest(attendanceMutation),
      result: { serverRecord: { id: 31, version: 2 } },
    });
    const changedMutation = {
      ...attendanceMutation,
      payload: { ...attendanceMutation.payload, status: 'Sakit' },
    };

    const response = await processTeacherSyncBatch({
      requester,
      syncPayload: { mutations: [changedMutation] },
    });

    expect(response.results[0]).toEqual(expect.objectContaining({
      status: 'rejected',
      error: {
        code: 'idempotency_key_reused',
        message: 'Mutation identifier has already been used with different data.',
      },
    }));
    expect(teacherSyncRepository.createReceipt).not.toHaveBeenCalled();
    expect(emitStudentRecordUpdated).not.toHaveBeenCalled();
  });

  test('conflict and applied no-op create only the permitted receipt and no event', async () => {
    applyAttendanceUpdate
      .mockResolvedValueOnce({
        status: 'conflict',
        conflict: {
          type: 'attendance_version_mismatch',
          local: { baseVersion: 1 },
          server: { version: 2 },
        },
      })
      .mockResolvedValueOnce(attendanceApplied({
        realtimeEvent: null,
      }));

    const response = await processTeacherSyncBatch({
      requester,
      syncPayload: {
        mutations: [
          attendanceMutation,
          { ...attendanceMutation, clientMutationId: 'attendance-no-op' },
        ],
      },
    });

    expect(response.results.map((result) => result.status)).toEqual([
      'conflict',
      'applied',
    ]);
    expect(response.results[0].error).toEqual({
      code: 'attendance_version_conflict',
      message: 'Attendance changed on the server.',
    });
    expect(teacherSyncRepository.createReceipt).toHaveBeenCalledTimes(1);
    expect(emitStudentRecordUpdated).not.toHaveBeenCalled();
  });
});

jest.mock('../modules/attendance/attendance.repository', () => ({
  findAttendanceByStudentAndDate: jest.fn(),
  findStudentInClass: jest.fn(),
  updateAttendanceRecord: jest.fn(),
}));
jest.mock(
  '../modules/student-learning-journal/student-learning-journal.service',
  () => ({
    createJournalEntry: jest.fn(),
  })
);

const attendanceRepository = require(
  '../modules/attendance/attendance.repository'
);
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
const studentLearningJournalService = require(
  '../modules/student-learning-journal/student-learning-journal.service'
);

const requester = {
  role: 'teacher',
  teacherId: 5,
  classId: 3,
};
const transaction = {
  LOCK: { UPDATE: 'UPDATE' },
};
const attendanceMutation = {
  type: 'attendance.update',
  baseVersion: 1,
  payload: {
    studentId: 7,
    attendanceDate: '2026-07-26',
    status: 'Izin',
  },
};

function buildAttendance(overrides = {}) {
  return {
    id: 31,
    StudentId: 7,
    status: 'Hadir',
    attendanceDate: '2026-07-26',
    version: 1,
    createdAt: new Date('2026-07-26T07:00:00.000Z'),
    updatedAt: new Date('2026-07-26T07:00:00.000Z'),
    ...overrides,
  };
}

describe('Teacher sync attendance handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    attendanceRepository.findStudentInClass.mockResolvedValue({ id: 7 });
    attendanceRepository.findAttendanceByStudentAndDate.mockResolvedValue(
      buildAttendance()
    );
    attendanceRepository.updateAttendanceRecord.mockResolvedValue(
      buildAttendance({ status: 'Izin', version: 2 })
    );
  });

  test('matching version applies status, increments version, and prepares one event', async () => {
    const result = await applyAttendanceUpdate({
      mutation: attendanceMutation,
      requester,
      transaction,
    });

    expect(attendanceRepository.findAttendanceByStudentAndDate)
      .toHaveBeenCalledWith(7, '2026-07-26', {
        lock: 'UPDATE',
        transaction,
      });
    expect(attendanceRepository.updateAttendanceRecord).toHaveBeenCalledWith(
      expect.objectContaining({ version: 1 }),
      { status: 'Izin', version: 2 },
      { transaction }
    );
    expect(result).toEqual(expect.objectContaining({
      status: 'applied',
      serverRecord: expect.objectContaining({ status: 'Izin', version: 2 }),
      realtimeEvent: {
        studentId: 7,
        recordType: 'attendance',
        occurredAt: '2026-07-26',
      },
    }));
  });

  test('same status is applied no-op without database update or event', async () => {
    const result = await applyAttendanceUpdate({
      mutation: {
        ...attendanceMutation,
        payload: { ...attendanceMutation.payload, status: 'Hadir' },
      },
      requester,
      transaction,
    });

    expect(result.status).toBe('applied');
    expect(result.serverRecord.version).toBe(1);
    expect(result.realtimeEvent).toBeNull();
    expect(attendanceRepository.updateAttendanceRecord).not.toHaveBeenCalled();
  });

  test('version mismatch returns safe conflict without write', async () => {
    attendanceRepository.findAttendanceByStudentAndDate.mockResolvedValue(
      buildAttendance({ status: 'Sakit', version: 3 })
    );

    const result = await applyAttendanceUpdate({
      mutation: attendanceMutation,
      requester,
      transaction,
    });

    expect(result).toEqual({
      status: 'conflict',
      conflict: {
        type: 'attendance_version_mismatch',
        local: {
          studentId: 7,
          attendanceDate: '2026-07-26',
          status: 'Izin',
          baseVersion: 1,
        },
        server: expect.objectContaining({
          id: 31,
          studentId: 7,
          status: 'Sakit',
          version: 3,
        }),
      },
    });
    expect(result.conflict.server).not.toHaveProperty('updatedBy');
    expect(attendanceRepository.updateAttendanceRecord).not.toHaveBeenCalled();
  });

  test('current authorization and record existence are rechecked', async () => {
    attendanceRepository.findStudentInClass.mockResolvedValueOnce(null);

    await expect(applyAttendanceUpdate({
      mutation: attendanceMutation,
      requester,
      transaction,
    })).rejects.toEqual(expect.objectContaining({
      syncMutationCode: 'student_access_denied',
    }));
    expect(attendanceRepository.findAttendanceByStudentAndDate)
      .not.toHaveBeenCalled();

    attendanceRepository.findStudentInClass.mockResolvedValueOnce({ id: 7 });
    attendanceRepository.findAttendanceByStudentAndDate.mockResolvedValueOnce(
      null
    );
    await expect(applyAttendanceUpdate({
      mutation: attendanceMutation,
      requester,
      transaction,
    })).rejects.toEqual(expect.objectContaining({
      syncMutationCode: 'attendance_not_found',
    }));
  });
});

describe('Teacher sync journal handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    studentLearningJournalService.createJournalEntry.mockResolvedValue({
      id: 44,
      studentId: 7,
      type: 'observation',
      content: 'Ari menjelaskan langkah pengerjaan.',
      observedAt: new Date('2026-07-26T08:00:00.000Z'),
    });
  });

  const journalMutation = {
    type: 'journal.create',
    payload: {
      studentId: 7,
      type: 'observation',
      content: 'Ari menjelaskan langkah pengerjaan.',
      voiceCaptureType: null,
      observedAt: '2026-07-26T08:00:00.000Z',
    },
  };

  test('uses normal Journal validation/service with transaction and no early event', async () => {
    const result = await applyJournalCreate({
      mutation: journalMutation,
      requester,
      transaction,
    });

    expect(studentLearningJournalService.createJournalEntry).toHaveBeenCalledWith({
      studentId: '7',
      requester,
      journalPayload: {
        type: 'observation',
        content: 'Ari menjelaskan langkah pengerjaan.',
        voiceCaptureType: null,
        observedAt: '2026-07-26T08:00:00.000Z',
      },
      transaction,
      emitRealtime: false,
    });
    expect(result.status).toBe('applied');
    expect(result.realtimeEvent).toEqual(expect.objectContaining({
      studentId: 7,
      recordType: 'journal',
    }));
  });

  test('rejects evidence relation before Journal write', async () => {
    await expect(applyJournalCreate({
      mutation: {
        ...journalMutation,
        payload: { ...journalMutation.payload, evidenceId: 9 },
      },
      requester,
      transaction,
    })).rejects.toEqual(expect.objectContaining({
      syncMutationCode: 'journal_evidence_not_supported',
    }));
    expect(studentLearningJournalService.createJournalEntry)
      .not.toHaveBeenCalled();
  });

  test('maps current access and Journal validation failures to result errors', async () => {
    studentLearningJournalService.createJournalEntry
      .mockRejectedValueOnce({ name: 'unauthorized' });
    await expect(applyJournalCreate({
      mutation: journalMutation,
      requester,
      transaction,
    })).rejects.toEqual(expect.objectContaining({
      syncMutationCode: 'student_access_denied',
    }));

    studentLearningJournalService.createJournalEntry
      .mockRejectedValueOnce({ name: 'invalidJournalVoiceCaptureType' });
    await expect(applyJournalCreate({
      mutation: journalMutation,
      requester,
      transaction,
    })).rejects.toEqual(expect.objectContaining({
      syncMutationCode: 'journal_validation_failed',
    }));
  });
});

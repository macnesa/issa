const express = require('express');
const request = require('supertest');
const narrativeProvider = require(
  '../modules/ai-learning-narrative/narrative-provider'
);
const {
  createClassroomDebriefConfirmationService,
} = require(
  '../modules/classroom-debrief/classroom-debrief-confirmation.service'
);
const {
  createClassroomDebriefRouter,
} = require('../modules/classroom-debrief/classroom-debrief.route');
const { errorHandler } = require('../middlewares/errorHandler');

const requester = {
  accessMode: 'standard',
  classId: 7,
  isDemo: false,
  role: 'teacher',
  teacherId: 11,
};

function baseItem(overrides = {}) {
  return {
    clientMutationId: 'classroom-debrief:test:feedback',
    draftId: 'debrief-draft-1',
    recordType: 'feedback',
    sourceExcerpt: 'Alya lebih mandiri hari ini',
    studentId: 1,
    payload: {
      content: 'Alya menunjukkan kemandirian yang lebih baik.',
      observedAt: '2026-08-20T08:00:00Z',
    },
    ...overrides,
  };
}

function allDomainItems() {
  return [
    baseItem(),
    baseItem({
      clientMutationId: 'classroom-debrief:test:journal',
      draftId: 'debrief-draft-2',
      recordType: 'journal',
      payload: {
        content: 'Rafi aktif berdiskusi setelah masuk kelas.',
        observedAt: '2026-08-20T08:05:00Z',
        type: 'observation',
        voiceCaptureType: null,
      },
      studentId: 2,
    }),
    baseItem({
      clientMutationId: 'classroom-debrief:test:score',
      draftId: 'debrief-draft-3',
      recordType: 'score',
      payload: {
        assignmentId: 9,
        description: 'Classroom Debrief',
        lessonId: 5,
        recordedAt: '2026-08-20T08:10:00Z',
        value: 82,
      },
      studentId: 3,
    }),
    baseItem({
      clientMutationId: 'classroom-debrief:test:attendance',
      draftId: 'debrief-draft-4',
      recordType: 'attendance',
      payload: {
        attendanceDate: '2026-08-20',
        status: 'Hadir',
      },
      studentId: 2,
    }),
  ];
}

function createDependencies() {
  const receiptRecords = new Map();
  const database = {
    transaction: jest.fn(async (work) => work({ id: Symbol('transaction') })),
  };
  const repository = {
    findAssignmentForClassLesson: jest.fn().mockResolvedValue({ id: 9 }),
    findLessonForClass: jest.fn().mockResolvedValue({ id: 5 }),
    findStudentInClass: jest.fn(async ({ studentId }) => (
      studentId === 99 ? null : { id: studentId }
    )),
    findTeacherClass: jest.fn().mockResolvedValue({ id: 7 }),
  };
  const receipts = {
    lockTeacher: jest.fn().mockResolvedValue({ id: 11 }),
    findReceipt: jest.fn(async ({ teacherId, clientMutationId }) => (
      receiptRecords.get(`${teacherId}:${clientMutationId}`) || null
    )),
    createReceipt: jest.fn(async (receipt) => {
      receiptRecords.set(
        `${receipt.TeacherId}:${receipt.clientMutationId}`,
        receipt
      );
      return receipt;
    }),
  };
  const services = {
    attendance: {
      createAttendanceRecord: jest.fn().mockResolvedValue({ id: 104 }),
    },
    feedback: {
      updateStudentFeedback: jest.fn().mockResolvedValue({
        data: { id: 1 },
        feedbackChanged: true,
        feedbackRecord: { id: 101 },
        occurredAt: new Date('2026-08-20T08:00:00Z'),
      }),
    },
    journal: {
      createJournalEntry: jest.fn().mockResolvedValue({
        id: 102,
        observedAt: new Date('2026-08-20T08:05:00Z'),
      }),
    },
    score: {
      createStudentScore: jest.fn().mockResolvedValue({
        data: {
          id: 103,
          recordedAt: new Date('2026-08-20T08:10:00Z'),
        },
      }),
    },
  };
  const emitRealtime = jest.fn();
  const confirmationService = createClassroomDebriefConfirmationService({
    clock: () => new Date('2026-08-20T09:00:00Z'),
    database,
    emitRealtime,
    receipts,
    repository,
    services,
  });
  return {
    confirmationService,
    database,
    emitRealtime,
    receiptRecords,
    receipts,
    repository,
    services,
  };
}

describe('Classroom Debrief confirmation', () => {
  test('commits all four domains through canonical services with zero AI calls', async () => {
    const dependencies = createDependencies();
    const providerSpy = jest.spyOn(
      narrativeProvider,
      'generateClassroomDebrief'
    );

    const result = await dependencies.confirmationService.confirmDrafts({
      requester,
      requestBody: { items: allDomainItems() },
    });

    expect(result.results).toEqual([
      expect.objectContaining({
        draftId: 'debrief-draft-1',
        recordId: 101,
        recordType: 'feedback',
        status: 'committed',
      }),
      expect.objectContaining({
        recordId: 102,
        recordType: 'journal',
        status: 'committed',
      }),
      expect.objectContaining({
        recordId: 103,
        recordType: 'score',
        status: 'committed',
      }),
      expect.objectContaining({
        recordId: 104,
        recordType: 'attendance',
        status: 'committed',
      }),
    ]);
    expect(dependencies.services.feedback.updateStudentFeedback)
      .toHaveBeenCalledWith(expect.objectContaining({
        emitRealtime: false,
        historySource: 'classroom_debrief',
      }));
    expect(dependencies.services.score.createStudentScore)
      .toHaveBeenCalledWith(expect.objectContaining({
        emitRealtime: false,
        historySource: 'classroom_debrief',
      }));
    expect(dependencies.services.attendance.createAttendanceRecord)
      .toHaveBeenCalledWith(expect.objectContaining({
        emitRealtime: false,
        historySource: 'classroom_debrief',
      }));
    expect(dependencies.services.journal.createJournalEntry)
      .toHaveBeenCalledWith(expect.objectContaining({ emitRealtime: false }));
    expect(providerSpy).not.toHaveBeenCalled();
    expect(dependencies.emitRealtime).toHaveBeenCalledTimes(4);
    expect(dependencies.receipts.createReceipt).toHaveBeenCalledTimes(4);
    providerSpy.mockRestore();
  });

  test('duplicate confirmation returns stable records without duplicate writes or events', async () => {
    const dependencies = createDependencies();
    const requestBody = { items: allDomainItems().slice(0, 1) };

    const first = await dependencies.confirmationService.confirmDrafts({
      requester,
      requestBody,
    });
    const duplicate = await dependencies.confirmationService.confirmDrafts({
      requester,
      requestBody,
    });

    expect(first.results[0]).toEqual(expect.objectContaining({
      recordId: 101,
      status: 'committed',
    }));
    expect(duplicate.results[0]).toEqual(expect.objectContaining({
      recordId: 101,
      status: 'duplicate',
    }));
    expect(dependencies.services.feedback.updateStudentFeedback)
      .toHaveBeenCalledTimes(1);
    expect(dependencies.emitRealtime).toHaveBeenCalledTimes(1);
    expect(dependencies.receipts.createReceipt).toHaveBeenCalledTimes(1);
  });

  test('partial failure keeps successful siblings idempotent on retry', async () => {
    const dependencies = createDependencies();
    const requestBody = {
      items: [
        baseItem(),
        baseItem({
          clientMutationId: 'classroom-debrief:test:outside-student',
          draftId: 'debrief-draft-outside',
          studentId: 99,
        }),
      ],
    };

    const first = await dependencies.confirmationService.confirmDrafts({
      requester,
      requestBody,
    });
    const retry = await dependencies.confirmationService.confirmDrafts({
      requester,
      requestBody,
    });

    expect(first.results.map(({ status }) => status)).toEqual([
      'committed',
      'failed',
    ]);
    expect(first.results[1].code).toBe('student_not_found');
    expect(retry.results.map(({ status }) => status)).toEqual([
      'duplicate',
      'failed',
    ]);
    expect(dependencies.services.feedback.updateStudentFeedback)
      .toHaveBeenCalledTimes(1);
    expect(dependencies.emitRealtime).toHaveBeenCalledTimes(1);
  });

  test.each([
    ['student', baseItem({ studentId: 99 }), 'student_not_found'],
    ['lesson', allDomainItems()[2], 'lesson_not_found'],
    ['assignment', allDomainItems()[2], 'assessment_not_found'],
  ])('rejects inaccessible %s context', async (name, item, code) => {
    const dependencies = createDependencies();
    if (name === 'lesson') {
      dependencies.repository.findLessonForClass.mockResolvedValue(null);
    }
    if (name === 'assignment') {
      dependencies.repository.findAssignmentForClassLesson
        .mockResolvedValue(null);
    }

    const result = await dependencies.confirmationService.confirmDrafts({
      requester,
      requestBody: { items: [item] },
    });

    expect(result.results[0]).toEqual(expect.objectContaining({
      code,
      status: 'failed',
    }));
    Object.values(dependencies.services).forEach((service) => {
      Object.values(service).forEach((method) => {
        expect(method).not.toHaveBeenCalled();
      });
    });
  });

  test('rejects malformed envelopes and returns safe item validation failures', async () => {
    const dependencies = createDependencies();
    await expect(dependencies.confirmationService.confirmDrafts({
      requester,
      requestBody: { items: [] },
    })).rejects.toMatchObject({
      name: 'invalid_classroom_debrief_confirmation',
    });

    const result = await dependencies.confirmationService.confirmDrafts({
      requester,
      requestBody: {
        items: [
          baseItem({ recordType: 'evidence' }),
          baseItem({
            clientMutationId: 'classroom-debrief:test:bad-score',
            recordType: 'score',
            payload: { assignmentId: 9, lessonId: 5, value: 101 },
          }),
          baseItem({ studentId: null }),
        ],
      },
    });

    expect(result.results).toHaveLength(3);
    expect(result.results.every((item) => (
      item.status === 'failed' && item.code === 'invalid_draft'
    ))).toBe(true);
    expect(dependencies.receipts.createReceipt).not.toHaveBeenCalled();
  });

  test('public demo is blocked by both service and route before writes', async () => {
    const dependencies = createDependencies();
    const demoRequester = {
      ...requester,
      accessMode: 'demo',
      isDemo: true,
    };
    await expect(dependencies.confirmationService.confirmDrafts({
      requester: demoRequester,
      requestBody: { items: [baseItem()] },
    })).rejects.toMatchObject({ name: 'publicDemoReadOnly' });

    const app = express();
    app.use(express.json());
    app.use('/teachers', createClassroomDebriefRouter({
      authenticateTeacher(req, res, next) {
        req.user = demoRequester;
        next();
      },
      confirmationService: dependencies.confirmationService,
      rateLimit: (req, res, next) => next(),
    }));
    app.use(errorHandler);

    const response = await request(app)
      .post('/teachers/me/classroom-debrief/confirm')
      .send({ items: [baseItem()] });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('publicDemoReadOnly');
    expect(dependencies.services.feedback.updateStudentFeedback)
      .not.toHaveBeenCalled();
  });
});

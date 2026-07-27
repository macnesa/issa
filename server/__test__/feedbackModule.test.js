jest.mock('../modules/feedback/feedback.repository', () => ({
  createFeedbackHistory: jest.fn(),
  createStudentUpdateHistory: jest.fn(),
  findFeedbackHistory: jest.fn(),
  findStudentInClass: jest.fn(),
  findTeacherClass: jest.fn(),
  updateStudent: jest.fn(),
}));

jest.mock('../models', () => ({
  sequelize: {
    transaction: jest.fn(async (transactionWork) => transactionWork({ id: 'feedback-transaction' })),
  },
}));
jest.mock('../realtime/student-record-events', () => ({
  emitStudentRecordUpdated: jest.fn(),
}));

const { sequelize } = require('../models');
const feedbackRepository = require('../modules/feedback/feedback.repository');
const feedbackService = require('../modules/feedback/feedback.service');
const {
  emitStudentRecordUpdated,
} = require('../realtime/student-record-events');
const {
  validateFeedbackUpdate,
  validateObservedAt,
} = require('../modules/feedback/feedback.validator');

describe('feedback module service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    feedbackRepository.findTeacherClass.mockResolvedValue({
      Teacher: { name: 'Teacher One' },
    });
    feedbackRepository.findStudentInClass.mockResolvedValue({
      id: 7,
      name: 'Student One',
      feedback: 'Previous feedback',
    });
    feedbackRepository.updateStudent.mockResolvedValue({ id: 7 });
    feedbackRepository.createFeedbackHistory.mockResolvedValue({ id: 12 });
    feedbackRepository.createStudentUpdateHistory.mockResolvedValue({ id: 21 });
  });

  test('writes a changed snapshot, feedback history, and update history in one transaction', async () => {
    const studentUpdatePayload = Object.freeze({
      name: 'Updated Student',
      feedback: '  Meaningful feedback  ',
      observedAt: '2026-07-23',
    });

    await feedbackService.updateStudentFeedback({
      studentId: 7,
      classId: 3,
      teacherId: 5,
      studentUpdatePayload,
    });

    const databaseTransaction = expect.objectContaining({ id: 'feedback-transaction' });
    expect(sequelize.transaction).toHaveBeenCalledTimes(1);
    expect(feedbackRepository.updateStudent).toHaveBeenCalledWith(
      expect.any(Object),
      {
        name: 'Updated Student',
        feedback: 'Meaningful feedback',
      },
      databaseTransaction
    );
    expect(feedbackRepository.createFeedbackHistory).toHaveBeenCalledWith(
      expect.objectContaining({
        StudentId: 7,
        TeacherId: 5,
        content: 'Meaningful feedback',
      }),
      databaseTransaction
    );
    expect(feedbackRepository.createStudentUpdateHistory).toHaveBeenCalledWith(
      {
        description: 'student with name Student One has been edited',
        createdBy: 'Teacher One',
      },
      databaseTransaction
    );
    expect(emitStudentRecordUpdated).toHaveBeenCalledTimes(1);
    expect(emitStudentRecordUpdated).toHaveBeenCalledWith({
      studentId: 7,
      recordType: 'feedback',
      occurredAt: new Date('2026-07-23'),
    });
    expect(studentUpdatePayload.feedback).toBe('  Meaningful feedback  ');
  });

  test('keeps identical feedback without writing another feedback history record', async () => {
    feedbackRepository.findStudentInClass.mockResolvedValue({
      id: 7,
      name: 'Student One',
      feedback: 'Same feedback',
    });

    await feedbackService.updateStudentFeedback({
      studentId: 7,
      classId: 3,
      teacherId: 5,
      studentUpdatePayload: { feedback: 'Same feedback' },
    });

    expect(feedbackRepository.updateStudent).toHaveBeenCalledWith(
      expect.any(Object),
      {},
      expect.any(Object)
    );
    expect(feedbackRepository.createFeedbackHistory).not.toHaveBeenCalled();
    expect(feedbackRepository.createStudentUpdateHistory).toHaveBeenCalledTimes(1);
    expect(emitStudentRecordUpdated).not.toHaveBeenCalled();
  });

  test('rejects the operation when a transactional write fails', async () => {
    feedbackRepository.createStudentUpdateHistory.mockRejectedValue(
      new Error('history write failed')
    );

    await expect(feedbackService.updateStudentFeedback({
      studentId: 7,
      classId: 3,
      teacherId: 5,
      studentUpdatePayload: { feedback: 'Changed feedback' },
    })).rejects.toThrow('history write failed');

    expect(emitStudentRecordUpdated).not.toHaveBeenCalled();
  });

  test('reads history only after finding the student in the teacher class', async () => {
    const feedbackHistory = [{ id: 12 }];
    feedbackRepository.findFeedbackHistory.mockResolvedValue(feedbackHistory);

    await expect(feedbackService.getStudentFeedbackHistory({
      studentId: 7,
      classId: 3,
    })).resolves.toBe(feedbackHistory);

    expect(feedbackRepository.findStudentInClass).toHaveBeenCalledWith(7, 3);
    expect(feedbackRepository.findFeedbackHistory).toHaveBeenCalledWith(7);
  });
});

describe('feedback validator', () => {
  test('accepts feedback longer than 255 characters up to 5,000', () => {
    const feedback = 'Perkembangan siswa teramati dengan baik. '.repeat(10);

    expect(validateFeedbackUpdate({ feedback })).toEqual(expect.objectContaining({
      hasFeedback: true,
      feedback,
    }));
    expect(feedback.length).toBeGreaterThan(255);
  });

  test('rejects feedback longer than 5,000 characters without truncating', () => {
    expect(() => validateFeedbackUpdate({
      feedback: 'A'.repeat(5001),
    })).toThrow(expect.objectContaining({ name: 'feedbackTooLong' }));
  });

  test('accepts a real ISO date', () => {
    expect(validateObservedAt('2026-07-23')).toEqual(new Date('2026-07-23'));
  });

  test('rejects an impossible date', () => {
    expect.assertions(1);
    try {
      validateObservedAt('2026-02-30');
    } catch (error) {
      expect(error).toEqual({ name: 'invalidObservedAt' });
    }
  });
});

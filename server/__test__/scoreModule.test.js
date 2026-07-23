jest.mock('../modules/score/score.repository', () => ({
  createScoreHistory: jest.fn(),
  createStudentScore: jest.fn(),
  findAssignmentById: jest.fn(),
  findLessonById: jest.fn(),
  findScoreById: jest.fn(),
  findScoreByStudentLessonAndAssignment: jest.fn(),
  findStudentInClass: jest.fn(),
  findTeacherClass: jest.fn(),
  updateStudentScore: jest.fn(),
}));

const scoreRepository = require('../modules/score/score.repository');
const scoreService = require('../modules/score/score.service');
const {
  validateScoreRecordedAt,
  validateScoreValue,
} = require('../modules/score/score.validator');

function expectValidationError(validationWork, errorName) {
  expect.assertions(1);
  try {
    validationWork();
  } catch (error) {
    expect(error).toEqual({ name: errorName });
  }
}

describe('score module service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    scoreRepository.findStudentInClass.mockResolvedValue({
      id: 7,
      name: 'Student One',
    });
    scoreRepository.findLessonById.mockResolvedValue({
      id: 11,
      name: 'Mathematics',
      KKM: 70,
    });
    scoreRepository.findAssignmentById.mockResolvedValue({
      id: 13,
      name: 'Midterm',
    });
    scoreRepository.findScoreByStudentLessonAndAssignment.mockResolvedValue(null);
    scoreRepository.findTeacherClass.mockResolvedValue({
      Teacher: { name: 'Teacher One' },
    });
    scoreRepository.createStudentScore.mockResolvedValue({ id: 31 });
    scoreRepository.createScoreHistory.mockResolvedValue({ id: 41 });
  });

  test('creates a valid score without mutating the caller payload', async () => {
    const scorePayload = Object.freeze({
      StudentId: 7,
      LessonId: 11,
      AssignmentId: 13,
      value: 80,
      desc: 'Good work',
      recordedAt: '2026-07-23T08:00:00Z',
    });

    await expect(scoreService.createStudentScore({
      classId: 3,
      scorePayload,
    })).resolves.toEqual({
      data: { id: 31 },
      history: { id: 41 },
    });

    expect(scoreRepository.findStudentInClass).toHaveBeenCalledWith(7, 3);
    expect(scoreRepository.createStudentScore).toHaveBeenCalledWith({
      StudentId: 7,
      LessonId: 11,
      AssignmentId: 13,
      value: 80,
      desc: 'Good work',
      category: 'B',
      status: true,
      recordedAt: new Date('2026-07-23T08:00:00Z'),
    });
    expect(scorePayload.value).toBe(80);
  });

  test('updates a valid score using the stored academic context', async () => {
    const scoreRecord = {
      id: 31,
      StudentId: 7,
      LessonId: 11,
      AssignmentId: 13,
    };
    scoreRepository.findScoreById.mockResolvedValue(scoreRecord);
    scoreRepository.updateStudentScore.mockResolvedValue({
      ...scoreRecord,
      value: 65,
      status: false,
    });

    await expect(scoreService.updateStudentScore({
      classId: 3,
      scorePayload: {
        ScoreId: 31,
        StudentId: 999,
        LessonId: 999,
        AssignmentId: 999,
        value: 65,
      },
    })).resolves.toEqual({
      data: expect.objectContaining({ id: 31, value: 65, status: false }),
      history: { id: 41 },
    });

    expect(scoreRepository.findStudentInClass).toHaveBeenCalledWith(7, 3);
    expect(scoreRepository.updateStudentScore).toHaveBeenCalledWith(
      scoreRecord,
      {
        value: 65,
        category: 'C',
        status: false,
      }
    );
  });

  test('returns the existing failing status below Lesson KKM', () => {
    expect(scoreService.calculateScoreStatus(69, { KKM: 70 })).toBe(false);
  });

  test.each([70, 71])(
    'returns the existing passing status at or above Lesson KKM: %s',
    (scoreValue) => {
      expect(scoreService.calculateScoreStatus(scoreValue, { KKM: 70 })).toBe(true);
    }
  );

  test('rejects an invalid Lesson KKM', () => {
    expectValidationError(
      () => scoreService.calculateScoreStatus(80, { KKM: 'not-a-number' }),
      'invalidLessonKkm'
    );
  });

  test('preserves notFound when Lesson does not exist', async () => {
    scoreRepository.findLessonById.mockResolvedValue(null);

    await expect(scoreService.createStudentScore({
      classId: 3,
      scorePayload: {
        StudentId: 7,
        LessonId: 999,
        AssignmentId: 13,
        value: 80,
      },
    })).rejects.toEqual({ name: 'notFound' });
  });

  test('preserves notFound when Assignment does not exist', async () => {
    scoreRepository.findAssignmentById.mockResolvedValue(null);

    await expect(scoreService.createStudentScore({
      classId: 3,
      scorePayload: {
        StudentId: 7,
        LessonId: 11,
        AssignmentId: 999,
        value: 80,
      },
    })).rejects.toEqual({ name: 'notFound' });
  });

  test('rejects a student outside the authenticated teacher class', async () => {
    scoreRepository.findStudentInClass.mockResolvedValue(null);

    await expect(scoreService.createStudentScore({
      classId: 3,
      scorePayload: {
        StudentId: 99,
        LessonId: 11,
        AssignmentId: 13,
        value: 80,
      },
    })).rejects.toEqual({ name: 'notFound' });

    expect(scoreRepository.findStudentInClass).toHaveBeenCalledWith(99, 3);
  });

  test('rejects a duplicate Student, Lesson, and Assignment before create', async () => {
    scoreRepository.findScoreByStudentLessonAndAssignment.mockResolvedValue({ id: 31 });

    await expect(scoreService.createStudentScore({
      classId: 3,
      scorePayload: {
        StudentId: 7,
        LessonId: 11,
        AssignmentId: 13,
        value: 80,
      },
    })).rejects.toEqual({ name: 'duplicateScore' });

    expect(scoreRepository.createStudentScore).not.toHaveBeenCalled();
  });

  test('translates the known database unique conflict', async () => {
    scoreRepository.createStudentScore.mockRejectedValue({
      name: 'SequelizeUniqueConstraintError',
      parent: {
        constraint: 'scores_student_lesson_assignment_unique',
      },
    });

    await expect(scoreService.createStudentScore({
      classId: 3,
      scorePayload: {
        StudentId: 7,
        LessonId: 11,
        AssignmentId: 13,
        value: 80,
      },
    })).rejects.toEqual({ name: 'duplicateScore' });
  });
});

describe('score validator', () => {
  test('rejects a score below zero', () => {
    expectValidationError(() => validateScoreValue(-1), 'invalidScoreValue');
  });

  test('rejects a score above 100', () => {
    expectValidationError(() => validateScoreValue(101), 'invalidScoreValue');
  });

  test.each([NaN, Infinity, -Infinity, '80'])(
    'rejects a non-finite or non-number score: %s',
    (scoreValue) => {
      expectValidationError(
        () => validateScoreValue(scoreValue),
        'invalidScoreValue'
      );
    }
  );

  test('rejects an invalid recordedAt value', () => {
    expectValidationError(
      () => validateScoreRecordedAt('not-a-date'),
      'invalidRecordedAt'
    );
  });
});

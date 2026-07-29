jest.mock('../modules/student-insight/student-insight.repository', () => ({
  findAttendanceRecords: jest.fn(),
  findFeedbackRecords: jest.fn(),
  findScoreRecords: jest.fn(),
  findStudentForRequester: jest.fn(),
  findStudentsForTeacher: jest.fn(),
}));

const studentInsightRepository = require(
  '../modules/student-insight/student-insight.repository'
);
const {
  calculateAcademicInsight,
  calculateAttendanceInsight,
  composeStudentInsights,
  composeTeacherAttentionQueue,
  getStudentInsights,
  getTeacherAttention,
} = require('../modules/student-insight/student-insight.service');

const requestedAt = new Date('2026-07-25T12:00:00.000Z');

function buildStudent(id, name = `Student ${id}`) {
  return {
    id,
    name,
    NIM: `NIM-${id}`,
    imgUrl: `https://example.test/student-${id}.png`,
  };
}

function buildAttendance(StudentId, status, attendanceDate, id) {
  return { id, StudentId, status, attendanceDate };
}

function buildScore({
  id,
  StudentId = 1,
  LessonId = 11,
  lessonName = 'Mathematics',
  kkm = 75,
  value,
  recordedAt,
}) {
  return {
    id,
    StudentId,
    LessonId,
    value,
    recordedAt,
    Lesson: {
      id: LessonId,
      name: lessonName,
      KKM: kkm,
    },
  };
}

function buildFeedback(StudentId, observedAt, id = StudentId, content = 'Observed') {
  return { id, StudentId, observedAt, content };
}

describe('student insight access', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    studentInsightRepository.findStudentForRequester
      .mockResolvedValue(buildStudent(1, 'Student One'));
    studentInsightRepository.findAttendanceRecords.mockResolvedValue([]);
    studentInsightRepository.findScoreRecords.mockResolvedValue([]);
    studentInsightRepository.findFeedbackRecords.mockResolvedValue([
      buildFeedback(1, '2026-07-24T08:00:00.000Z'),
    ]);
  });

  test('parent can read the insight of their linked student', async () => {
    await expect(getStudentInsights({
      studentId: '1',
      requester: { role: 'parent', studentId: 1, classId: 3 },
      requestedAt,
    })).resolves.toEqual(expect.objectContaining({
      student: expect.objectContaining({ id: 1, nim: 'NIM-1' }),
    }));

    expect(studentInsightRepository.findStudentForRequester).toHaveBeenCalledWith({
      studentId: 1,
      requesterRole: 'parent',
      requesterClassId: 3,
      requesterStudentId: 1,
    });
  });

  test('parent is denied when requesting another student', async () => {
    await expect(getStudentInsights({
      studentId: '2',
      requester: { role: 'parent', studentId: 1, classId: 3 },
      requestedAt,
    })).rejects.toEqual({ name: 'unauthorized' });

    expect(studentInsightRepository.findStudentForRequester).not.toHaveBeenCalled();
    expect(studentInsightRepository.findAttendanceRecords).not.toHaveBeenCalled();
    expect(studentInsightRepository.findScoreRecords).not.toHaveBeenCalled();
    expect(studentInsightRepository.findFeedbackRecords).not.toHaveBeenCalled();
  });

  test('teacher can read a student resolved inside their class scope', async () => {
    await expect(getStudentInsights({
      studentId: '1',
      requester: { role: 'teacher', teacherId: 8, classId: 3 },
      requestedAt,
    })).resolves.toEqual(expect.objectContaining({
      student: expect.objectContaining({ id: 1 }),
    }));

    expect(studentInsightRepository.findStudentForRequester).toHaveBeenCalledWith({
      studentId: 1,
      requesterRole: 'teacher',
      requesterClassId: 3,
      requesterStudentId: undefined,
    });
  });

  test('teacher is denied when the student is outside their class scope', async () => {
    studentInsightRepository.findStudentForRequester.mockResolvedValue(null);

    await expect(getStudentInsights({
      studentId: '99',
      requester: { role: 'teacher', teacherId: 8, classId: 3 },
      requestedAt,
    })).rejects.toEqual({ name: 'unauthorized' });
  });
});

describe('attendance insight', () => {
  test('rate uses only recorded attendance inside the 30-day window', () => {
    const { insight, flag } = calculateAttendanceInsight([
      buildAttendance(1, 'Hadir', '2026-07-24', 1),
      buildAttendance(1, 'Hadir', '2026-07-22', 2),
      buildAttendance(1, 'Izin', '2026-07-20', 3),
      buildAttendance(1, 'Alfa', '2026-06-20', 4),
    ], requestedAt);

    expect(insight).toEqual({
      windowDays: 30,
      recordedDays: 3,
      present: 2,
      permission: 1,
      sick: 0,
      absent: 0,
      rate: 66.7,
    });
    expect(flag).toBeNull();
  });

  test('rate below 85 percent with at least five records creates a flag', () => {
    const { insight, flag } = calculateAttendanceInsight([
      buildAttendance(1, 'Hadir', '2026-07-24', 1),
      buildAttendance(1, 'Hadir', '2026-07-23', 2),
      buildAttendance(1, 'Hadir', '2026-07-22', 3),
      buildAttendance(1, 'Hadir', '2026-07-21', 4),
      buildAttendance(1, 'Hadir', '2026-07-20', 5),
      buildAttendance(1, 'Sakit', '2026-07-19', 6),
    ], requestedAt);

    expect(insight.rate).toBe(83.3);
    expect(flag).toEqual({
      type: 'attendance_attention',
      rate: 83.3,
      recordedDays: 6,
    });
  });
});

describe('academic insight', () => {
  test('two latest scores below Lesson KKM create academic attention', () => {
    const { insight, flags } = calculateAcademicInsight([
      buildScore({ id: 1, value: 80, recordedAt: '2026-07-01T08:00:00.000Z' }),
      buildScore({ id: 2, value: 70, recordedAt: '2026-07-10T08:00:00.000Z' }),
      buildScore({ id: 3, value: 72, recordedAt: '2026-07-20T08:00:00.000Z' }),
    ]);

    expect(insight.subjectsNeedingAttention).toEqual([{
      lessonId: 11,
      lessonName: 'Mathematics',
      kkm: 75,
      latestScores: [72, 70],
      latestRecordedAt: '2026-07-20T08:00:00.000Z',
    }]);
    expect(flags).toEqual([{
      type: 'academic_attention',
      ...insight.subjectsNeedingAttention[0],
    }]);
  });

  test('strictly increasing latest three scores produce improving trend', () => {
    const { insight } = calculateAcademicInsight([
      buildScore({ id: 1, value: 60, recordedAt: '2026-07-01T08:00:00.000Z' }),
      buildScore({ id: 2, value: 70, recordedAt: '2026-07-10T08:00:00.000Z' }),
      buildScore({ id: 3, value: 80, recordedAt: '2026-07-20T08:00:00.000Z' }),
    ]);

    expect(insight.overallTrend).toBe('improving');
  });

  test('strictly decreasing latest three scores produce declining trend', () => {
    const { insight } = calculateAcademicInsight([
      buildScore({ id: 1, value: 90, recordedAt: '2026-07-01T08:00:00.000Z' }),
      buildScore({ id: 2, value: 80, recordedAt: '2026-07-10T08:00:00.000Z' }),
      buildScore({ id: 3, value: 70, recordedAt: '2026-07-20T08:00:00.000Z' }),
    ]);

    expect(insight.overallTrend).toBe('declining');
  });
});

describe('feedback and recent changes', () => {
  test('feedback older than 30 days creates a stale flag', () => {
    const insights = composeStudentInsights({
      student: buildStudent(1),
      attendanceRecords: [],
      scoreRecords: [],
      feedbackRecords: [
        buildFeedback(1, '2026-06-20T08:00:00.000Z'),
      ],
      requestedAt,
    });

    expect(insights.feedback).toEqual({
      latestObservedAt: '2026-06-20T08:00:00.000Z',
      daysSinceLatest: 35,
    });
    expect(insights.attentionFlags).toContainEqual({
      type: 'feedback_stale',
      latestObservedAt: '2026-06-20T08:00:00.000Z',
      daysSinceLatest: 35,
    });
  });

  test('recent changes are merged, structured, and limited to six', () => {
    const insights = composeStudentInsights({
      student: buildStudent(1),
      attendanceRecords: [
        buildAttendance(1, 'Hadir', '2026-07-24', 11),
        buildAttendance(1, 'Izin', '2026-07-23', 12),
      ],
      scoreRecords: [
        buildScore({
          id: 21,
          value: 70,
          recordedAt: '2026-07-20T08:00:00.000Z',
        }),
        buildScore({
          id: 22,
          value: 80,
          recordedAt: '2026-07-25T08:00:00.000Z',
        }),
      ],
      feedbackRecords: [
        buildFeedback(1, '2026-07-22T08:00:00.000Z', 31),
        buildFeedback(1, '2026-07-21T08:00:00.000Z', 32),
        buildFeedback(1, '2026-07-19T08:00:00.000Z', 33),
      ],
      requestedAt,
    });

    expect(insights.recentChanges).toHaveLength(6);
    expect(insights.recentChanges[0]).toEqual(expect.objectContaining({
      type: 'score',
      value: 80,
      previousValue: 70,
      direction: 'improved',
    }));
    expect(insights.recentChanges.map((change) => change.type))
      .toEqual(['score', 'attendance', 'attendance', 'feedback', 'feedback', 'score']);
  });
});

describe('teacher attention queue', () => {
  const recentFeedbacks = [
    buildFeedback(1, '2026-07-24T08:00:00.000Z', 101),
    buildFeedback(2, '2026-07-24T08:00:00.000Z', 102),
    buildFeedback(3, '2026-07-24T08:00:00.000Z', 103),
    buildFeedback(5, '2026-07-24T08:00:00.000Z', 105),
  ];
  const attentionAttendance = (studentId, lastDate = 24) => [
    buildAttendance(studentId, 'Hadir', `2026-07-${lastDate}`, studentId * 10 + 1),
    buildAttendance(studentId, 'Hadir', '2026-07-20', studentId * 10 + 2),
    buildAttendance(studentId, 'Hadir', '2026-07-19', studentId * 10 + 3),
    buildAttendance(studentId, 'Hadir', '2026-07-18', studentId * 10 + 4),
    buildAttendance(studentId, 'Alfa', '2026-07-17', studentId * 10 + 5),
  ];

  test('priority and sorting are correct, and students without flags are omitted', () => {
    const students = [
      buildStudent(1, 'High Student'),
      buildStudent(2, 'Older Medium'),
      buildStudent(3, 'Newer Medium'),
      buildStudent(4, 'Low Student'),
      buildStudent(5, 'Healthy Student'),
    ];
    const queue = composeTeacherAttentionQueue({
      students,
      attendanceRecords: [
        ...attentionAttendance(1),
        ...attentionAttendance(2, 22),
        ...Array.from({ length: 5 }, (_, index) =>
          buildAttendance(
            5,
            'Hadir',
            `2026-07-${String(20 + index).padStart(2, '0')}`,
            50 + index
          )
        ),
      ],
      scoreRecords: [
        buildScore({
          id: 201,
          StudentId: 1,
          value: 70,
          recordedAt: '2026-07-21T08:00:00.000Z',
        }),
        buildScore({
          id: 202,
          StudentId: 1,
          value: 72,
          recordedAt: '2026-07-23T08:00:00.000Z',
        }),
        buildScore({
          id: 301,
          StudentId: 3,
          value: 70,
          recordedAt: '2026-07-23T08:00:00.000Z',
        }),
        buildScore({
          id: 302,
          StudentId: 3,
          value: 72,
          recordedAt: '2026-07-25T08:00:00.000Z',
        }),
        buildScore({
          id: 501,
          StudentId: 5,
          value: 80,
          recordedAt: '2026-07-25T07:00:00.000Z',
        }),
      ],
      feedbackRecords: recentFeedbacks,
      requestedAt,
    });

    expect(queue.map((item) => [item.student.id, item.priority])).toEqual([
      [1, 'high'],
      [3, 'medium'],
      [2, 'medium'],
      [4, 'low'],
    ]);
    expect(queue.some((item) => item.student.id === 5)).toBe(false);
  });

  test('teacher attention loads each record domain once for all accessible students', async () => {
    studentInsightRepository.findStudentsForTeacher.mockResolvedValue([
      buildStudent(1),
      buildStudent(2),
    ]);
    studentInsightRepository.findAttendanceRecords.mockResolvedValue([]);
    studentInsightRepository.findScoreRecords.mockResolvedValue([]);
    studentInsightRepository.findFeedbackRecords.mockResolvedValue([]);

    await getTeacherAttention({ classId: 3, requestedAt });

    expect(studentInsightRepository.findStudentsForTeacher).toHaveBeenCalledTimes(1);
    expect(studentInsightRepository.findAttendanceRecords)
      .toHaveBeenCalledWith([1, 2]);
    expect(studentInsightRepository.findScoreRecords).toHaveBeenCalledWith([1, 2]);
    expect(studentInsightRepository.findFeedbackRecords).toHaveBeenCalledWith([1, 2]);
  });
});

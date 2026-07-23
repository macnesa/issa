jest.mock('../modules/public-student/public-student.repository', () => ({
  findClassmatesForParentClass: jest.fn(),
  findScheduleForParentClass: jest.fn(),
  findSchoolActivities: jest.fn(),
  findStudentForAuthenticatedParent: jest.fn(),
}));

const publicStudentRepository = require(
  '../modules/public-student/public-student.repository'
);
const publicStudentService = require(
  '../modules/public-student/public-student.service'
);
const {
  buildPublicStudentDetailResponse,
} = require('../modules/public-student/public-student.mapper');

function buildStudentModel(overrides = {}) {
  const studentData = {
    id: 7,
    NIM: '10001',
    name: 'Student One',
    age: '9',
    gender: 'Female',
    birthDate: '2017-01-01',
    feedback: 'Consistent progress',
    imgUrl: 'https://example.test/student.png',
    ClassId: 3,
    createdAt: '2026-07-23T00:00:00.000Z',
    updatedAt: '2026-07-23T00:00:00.000Z',
    Class: {
      id: 3,
      name: 'Class 3',
      Teacher: {
        id: 5,
        NIP: 'T-5',
        name: 'Teacher One',
      },
    },
    Attendances: [
      {
        id: 21,
        status: 'Hadir',
        attendanceDate: '2026-07-23',
      },
    ],
    Scores: [
      {
        id: 31,
        value: 80,
        category: 'B',
        status: true,
        Lesson: {
          id: 11,
          name: 'Mathematics',
          KKM: 70,
        },
        Assignment: {
          id: 13,
          name: 'Midterm',
          desc: 'Midterm exam',
        },
      },
    ],
    ...overrides,
  };

  return {
    toJSON: () => studentData,
  };
}

describe('public student service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    publicStudentRepository.findStudentForAuthenticatedParent
      .mockResolvedValue(buildStudentModel());
    publicStudentRepository.findClassmatesForParentClass.mockResolvedValue([
      { id: 7 },
      { id: 8 },
    ]);
    publicStudentRepository.findScheduleForParentClass.mockResolvedValue([
      {
        id: 51,
        day: 'monday',
        Lesson: { id: 11, name: 'Mathematics' },
      },
    ]);
    publicStudentRepository.findSchoolActivities.mockResolvedValue([
      { id: 61, name: 'School Event' },
    ]);
  });

  test('reads only the student linked to the authenticated parent', async () => {
    await publicStudentService.getPublicStudentDetail({ studentId: 7 });

    expect(publicStudentRepository.findStudentForAuthenticatedParent)
      .toHaveBeenCalledWith(7);
  });

  test('preserves the public student response shape', async () => {
    await expect(publicStudentService.getPublicStudentDetail({
      studentId: 7,
    })).resolves.toEqual(expect.objectContaining({
      id: 7,
      NIM: '10001',
      feedback: 'Consistent progress',
      Class: expect.objectContaining({
        Teacher: expect.objectContaining({ name: 'Teacher One' }),
      }),
      Attendances: expect.any(Array),
      Scores: expect.any(Array),
    }));
  });

  test('preserves attendance data', async () => {
    const studentDetail = await publicStudentService.getPublicStudentDetail({
      studentId: 7,
    });

    expect(studentDetail.Attendances).toEqual([
      expect.objectContaining({ status: 'Hadir' }),
    ]);
  });

  test('preserves score, Lesson KKM, and Assignment context', async () => {
    const studentDetail = await publicStudentService.getPublicStudentDetail({
      studentId: 7,
    });

    expect(studentDetail.Scores).toEqual([
      expect.objectContaining({
        value: 80,
        Lesson: expect.objectContaining({ KKM: 70 }),
        Assignment: expect.objectContaining({ desc: 'Midterm exam' }),
      }),
    ]);
  });

  test('preserves the latest feedback snapshot', async () => {
    const studentDetail = await publicStudentService.getPublicStudentDetail({
      studentId: 7,
    });

    expect(studentDetail.feedback).toBe('Consistent progress');
  });

  test('reads schedule in the authenticated parent class', async () => {
    await expect(publicStudentService.getPublicClassSchedule({
      classId: 3,
    })).resolves.toEqual([
      expect.objectContaining({ day: 'monday' }),
    ]);

    expect(publicStudentRepository.findScheduleForParentClass)
      .toHaveBeenCalledWith(3);
  });

  test('reads school activities', async () => {
    await expect(publicStudentService.getSchoolActivities()).resolves.toEqual([
      expect.objectContaining({ name: 'School Event' }),
    ]);
  });

  test('preserves empty collection fallbacks for parent detail', async () => {
    publicStudentRepository.findStudentForAuthenticatedParent.mockResolvedValue(
      buildStudentModel({ Attendances: undefined, Scores: null })
    );

    await expect(publicStudentService.getPublicStudentDetail({
      studentId: 7,
    })).resolves.toEqual(expect.objectContaining({
      Attendances: [],
      Scores: [],
    }));
  });

  test('preserves empty arrays for classmates, schedule, and activities', async () => {
    publicStudentRepository.findClassmatesForParentClass.mockResolvedValue([]);
    publicStudentRepository.findScheduleForParentClass.mockResolvedValue([]);
    publicStudentRepository.findSchoolActivities.mockResolvedValue([]);

    await expect(publicStudentService.getClassmates({ classId: 3 }))
      .resolves.toEqual([]);
    await expect(publicStudentService.getPublicClassSchedule({ classId: 3 }))
      .resolves.toEqual([]);
    await expect(publicStudentService.getSchoolActivities()).resolves.toEqual([]);
  });

  test('preserves notFound when the linked student does not exist', async () => {
    publicStudentRepository.findStudentForAuthenticatedParent.mockResolvedValue(null);

    await expect(publicStudentService.getPublicStudentDetail({
      studentId: 999,
    })).rejects.toEqual({ name: 'notFound' });
  });

  test('does not expose authentication or internal relation fields', () => {
    const publicStudentDetail = buildPublicStudentDetailResponse(
      buildStudentModel({
        password: 'password-hash',
        token: 'session-token',
        access_token: 'access-token',
        User: { id: 77, email: 'parent@example.test' },
        Histories: [{ id: 88 }],
        Class: {
          id: 3,
          name: 'Class 3',
          Teacher: {
            id: 5,
            NIP: 'T-5',
            name: 'Teacher One',
            password: 'teacher-password-hash',
            createdAt: 'internal-created-at',
            updatedAt: 'internal-updated-at',
          },
        },
      })
    );

    expect(publicStudentDetail).not.toHaveProperty('password');
    expect(publicStudentDetail).not.toHaveProperty('token');
    expect(publicStudentDetail).not.toHaveProperty('access_token');
    expect(publicStudentDetail).not.toHaveProperty('User');
    expect(publicStudentDetail).not.toHaveProperty('Histories');
    expect(publicStudentDetail.Class.Teacher).not.toHaveProperty('password');
    expect(publicStudentDetail.Class.Teacher).not.toHaveProperty('createdAt');
    expect(publicStudentDetail.Class.Teacher).not.toHaveProperty('updatedAt');
  });

  test('keeps the public flow read-only', async () => {
    await Promise.all([
      publicStudentService.getClassmates({ classId: 3 }),
      publicStudentService.getPublicStudentDetail({ studentId: 7 }),
      publicStudentService.getPublicClassSchedule({ classId: 3 }),
      publicStudentService.getSchoolActivities(),
    ]);

    expect(Object.keys(publicStudentRepository).every(
      (repositoryMethod) => repositoryMethod.startsWith('find')
    )).toBe(true);
  });

  test('propagates repository errors to the existing error flow', async () => {
    const repositoryError = new Error('database unavailable');
    publicStudentRepository.findStudentForAuthenticatedParent
      .mockRejectedValue(repositoryError);

    await expect(publicStudentService.getPublicStudentDetail({
      studentId: 7,
    })).rejects.toBe(repositoryError);
  });
});

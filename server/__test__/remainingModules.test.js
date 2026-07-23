jest.mock('../helpers', () => ({
  createToken: jest.fn(),
  isPasswordMatch: jest.fn(),
}));

jest.mock('../modules/parent/parent.repository', () => ({
  findParentAccountByNim: jest.fn(),
}));

jest.mock('../modules/teacher/teacher.repository', () => ({
  findClassByTeacherId: jest.fn(),
  findPublicTeacherList: jest.fn(),
  findTeacherByNip: jest.fn(),
}));

jest.mock('../modules/schedule/schedule.repository', () => ({
  findClassSchedule: jest.fn(),
}));

jest.mock('../modules/lesson/lesson.repository', () => ({
  findAllLessons: jest.fn(),
}));

jest.mock('../modules/assignment/assignment.repository', () => ({
  findAllAssignments: jest.fn(),
}));

const { createToken, isPasswordMatch } = require('../helpers');
const authenticationService = require(
  '../modules/authentication/authentication.service'
);
const {
  validateParentCredentials,
  validateTeacherCredentials,
} = require('../modules/authentication/authentication.validator');
const parentRepository = require('../modules/parent/parent.repository');
const teacherRepository = require('../modules/teacher/teacher.repository');
const teacherService = require('../modules/teacher/teacher.service');
const scheduleRepository = require('../modules/schedule/schedule.repository');
const scheduleService = require('../modules/schedule/schedule.service');
const lessonRepository = require('../modules/lesson/lesson.repository');
const lessonService = require('../modules/lesson/lesson.service');
const assignmentRepository = require('../modules/assignment/assignment.repository');
const assignmentService = require('../modules/assignment/assignment.service');

function getThrownError(validationWork) {
  try {
    validationWork();
  } catch (error) {
    return error;
  }

  return undefined;
}

describe('authentication module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    isPasswordMatch.mockReturnValue(true);
    createToken.mockReturnValue('signed-token');
    parentRepository.findParentAccountByNim.mockResolvedValue({
      id: 17,
      StudentId: 7,
      password: 'parent-password-hash',
      Student: {
        Class: {
          TeacherId: 5,
        },
      },
    });
    teacherRepository.findTeacherByNip.mockResolvedValue({
      id: 5,
      password: 'teacher-password-hash',
    });
    teacherRepository.findClassByTeacherId.mockResolvedValue({ id: 3 });
  });

  test('authenticates a valid Parent with the existing response and JWT claims', async () => {
    await expect(authenticationService.authenticateParent({
      NIM: '10001',
      password: 'parent-password',
    })).resolves.toEqual({
      access_token: 'signed-token',
      id: 17,
      teacherId: 5,
    });

    expect(parentRepository.findParentAccountByNim).toHaveBeenCalledWith('10001');
    expect(isPasswordMatch).toHaveBeenCalledWith(
      'parent-password',
      'parent-password-hash'
    );
    expect(createToken).toHaveBeenCalledWith({
      role: 'parent',
      userId: 17,
      studentId: 7,
    });
  });

  test('authenticates a valid Teacher with the existing response and JWT claims', async () => {
    await expect(authenticationService.authenticateTeacher({
      NIP: 'T-5',
      password: 'teacher-password',
    })).resolves.toEqual({
      id: 5,
      access_token: 'signed-token',
      ClassId: 3,
    });

    expect(teacherRepository.findTeacherByNip).toHaveBeenCalledWith('T-5');
    expect(createToken).toHaveBeenCalledWith({
      role: 'teacher',
      teacherId: 5,
      classId: 3,
    });
  });

  test('validators preserve loginError for missing credentials', () => {
    expect(getThrownError(
      () => validateParentCredentials({ NIM: '', password: '' })
    )).toEqual({ name: 'loginError' });
    expect(getThrownError(
      () => validateTeacherCredentials({ NIP: '', password: '' })
    )).toEqual({ name: 'loginError' });
  });

  test('rejects a Parent password mismatch with loginError', async () => {
    isPasswordMatch.mockReturnValue(false);

    await expect(authenticationService.authenticateParent({
      NIM: '10001',
      password: 'wrong-password',
    })).rejects.toEqual({ name: 'loginError' });

    expect(createToken).not.toHaveBeenCalled();
  });

  test('preserves notFound when a Teacher has no class', async () => {
    teacherRepository.findClassByTeacherId.mockResolvedValue(null);

    await expect(authenticationService.authenticateTeacher({
      NIP: 'T-5',
      password: 'teacher-password',
    })).rejects.toEqual({ name: 'notFound' });

    expect(isPasswordMatch).not.toHaveBeenCalled();
  });

  test('propagates Parent repository failures', async () => {
    const repositoryError = new Error('database unavailable');
    parentRepository.findParentAccountByNim.mockRejectedValue(repositoryError);

    await expect(authenticationService.authenticateParent({
      NIM: '10001',
      password: 'parent-password',
    })).rejects.toBe(repositoryError);
  });

  test('rejects a Teacher password mismatch with loginError', async () => {
    isPasswordMatch.mockReturnValue(false);

    await expect(authenticationService.authenticateTeacher({
      NIP: 'T-5',
      password: 'wrong-password',
    })).rejects.toEqual({ name: 'loginError' });

    expect(createToken).not.toHaveBeenCalled();
  });
});

describe('teacher module', () => {
  test('returns the existing public Teacher list', async () => {
    const teachers = [{ id: 5, NIP: 'T-5', name: 'Teacher One' }];
    teacherRepository.findPublicTeacherList.mockResolvedValue(teachers);

    await expect(teacherService.getTeacherList()).resolves.toBe(teachers);
    expect(teacherRepository.findPublicTeacherList).toHaveBeenCalledTimes(1);
  });

  test('propagates Teacher repository failures', async () => {
    const repositoryError = new Error('teacher read failed');
    teacherRepository.findPublicTeacherList.mockRejectedValue(repositoryError);

    await expect(teacherService.getTeacherList()).rejects.toBe(repositoryError);
  });
});

describe('schedule module', () => {
  test('reads Schedule entries only for the authenticated Teacher class', async () => {
    const scheduleEntries = [
      {
        id: 51,
        day: 'Monday',
        Lesson: { id: 11, name: 'Mathematics' },
      },
    ];
    scheduleRepository.findClassSchedule.mockResolvedValue(scheduleEntries);

    await expect(scheduleService.getClassSchedule({ classId: 3 }))
      .resolves.toBe(scheduleEntries);
    expect(scheduleRepository.findClassSchedule).toHaveBeenCalledWith(3);
  });

  test('preserves empty Schedule lists', async () => {
    scheduleRepository.findClassSchedule.mockResolvedValue([]);

    await expect(scheduleService.getClassSchedule({ classId: 3 }))
      .resolves.toEqual([]);
  });
});

describe('lesson module', () => {
  test('returns the existing Lesson list', async () => {
    const lessons = [{ id: 11, name: 'Mathematics', KKM: 70 }];
    lessonRepository.findAllLessons.mockResolvedValue(lessons);

    await expect(lessonService.getLessonList()).resolves.toBe(lessons);
  });
});

describe('assignment module', () => {
  test('returns the existing Assignment list', async () => {
    const assignments = [{ id: 13, name: 'Midterm', type: 'Exam' }];
    assignmentRepository.findAllAssignments.mockResolvedValue(assignments);

    await expect(assignmentService.getAssignmentList()).resolves.toBe(assignments);
  });
});

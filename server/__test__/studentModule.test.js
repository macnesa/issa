jest.mock('../modules/student/student.repository', () => ({
  createStudentHistory: jest.fn(),
  createStudentRecord: jest.fn(),
  findStudentByIdForTeacher: jest.fn(),
  findStudentsForTeacher: jest.fn(),
  findTeacherClass: jest.fn(),
}));

const studentRepository = require('../modules/student/student.repository');
const studentService = require('../modules/student/student.service');

describe('student module service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    studentRepository.findStudentsForTeacher.mockResolvedValue({
      count: 15,
      rows: [{ id: 1 }, { id: 2 }],
    });
    studentRepository.findStudentByIdForTeacher.mockResolvedValue({
      id: 7,
      Scores: [
        {
          value: 80,
          Assignment: { type: 'Task' },
        },
      ],
    });
    studentRepository.findTeacherClass.mockResolvedValue({
      id: 3,
      Teacher: { name: 'Teacher One' },
    });
    studentRepository.createStudentRecord.mockResolvedValue({
      id: 7,
      name: 'Student One',
    });
    studentRepository.createStudentHistory.mockResolvedValue({ id: 41 });
  });

  test('preserves the student list response contract and pagination', async () => {
    await expect(studentService.getStudentList({
      classId: 3,
      pageIndex: 2,
      name: undefined,
    })).resolves.toEqual({
      count: 15,
      rows: [{ id: 1 }, { id: 2 }],
      page: 2,
      pageSize: 7,
      totalPages: 3,
    });

    expect(studentRepository.findStudentsForTeacher).toHaveBeenCalledWith({
      classId: 3,
      name: undefined,
      pageSize: 7,
      offset: 7,
    });
  });

  test('preserves search and teacher class scope', async () => {
    await studentService.getStudentList({
      classId: 9,
      pageIndex: undefined,
      name: 'Ayu',
    });

    expect(studentRepository.findStudentsForTeacher).toHaveBeenCalledWith({
      classId: 9,
      name: 'Ayu',
      pageSize: 7,
      offset: 0,
    });
  });

  test('defaults to the first page and preserves its offset calculation', async () => {
    await studentService.getStudentList({
      classId: 3,
      pageIndex: undefined,
      name: '',
    });

    expect(studentRepository.findStudentsForTeacher).toHaveBeenCalledWith(
      expect.objectContaining({ pageSize: 7, offset: 0 })
    );
  });

  test('returns student detail within the teacher class', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await expect(studentService.getStudentDetail({
      studentId: 7,
      classId: 3,
    })).resolves.toEqual(expect.objectContaining({ id: 7 }));

    expect(studentRepository.findStudentByIdForTeacher).toHaveBeenCalledWith(7, 3);
    consoleSpy.mockRestore();
  });

  test('preserves notFound for a missing student', async () => {
    studentRepository.findStudentByIdForTeacher.mockResolvedValue(null);

    await expect(studentService.getStudentDetail({
      studentId: 999,
      classId: 3,
    })).rejects.toEqual({ name: 'notFound' });
  });

  test('rejects a student outside the teacher class with existing notFound behavior', async () => {
    studentRepository.findStudentByIdForTeacher.mockResolvedValue(null);

    await expect(studentService.getStudentDetail({
      studentId: 7,
      classId: 99,
    })).rejects.toEqual({ name: 'notFound' });

    expect(studentRepository.findStudentByIdForTeacher).toHaveBeenCalledWith(7, 99);
  });

  test('creates a student in the authenticated teacher class', async () => {
    const studentPayload = Object.freeze({
      NIM: '10001',
      name: 'Student One',
      age: 9,
      gender: 'Female',
      birthDate: '2017-01-01',
      feedback: 'Initial feedback',
      imgUrl: 'https://example.test/student.png',
      ClassId: 999,
      createdAt: 'caller-controlled',
    });

    await expect(studentService.createStudent({
      classId: 3,
      studentPayload,
    })).resolves.toEqual({
      data: { id: 7, name: 'Student One' },
      history: { id: 41 },
    });

    expect(studentRepository.createStudentRecord).toHaveBeenCalledWith({
      NIM: '10001',
      name: 'Student One',
      age: 9,
      gender: 'Female',
      birthDate: '2017-01-01',
      feedback: 'Initial feedback',
      imgUrl: 'https://example.test/student.png',
      ClassId: 3,
    });
    expect(studentPayload.ClassId).toBe(999);
  });

  test('preserves repository validation errors for invalid create fields', async () => {
    const validationError = {
      name: 'SequelizeValidationError',
      errors: [{ message: 'NIM is required' }],
    };
    studentRepository.createStudentRecord.mockRejectedValue(validationError);

    await expect(studentService.createStudent({
      classId: 3,
      studentPayload: {
        name: 'Student One',
      },
    })).rejects.toBe(validationError);
  });
});

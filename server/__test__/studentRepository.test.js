jest.mock('../models', () => ({
  Assignment: {},
  Attendance: {},
  Class: {},
  History: { create: jest.fn() },
  Lesson: {},
  Score: {},
  Student: {
    create: jest.fn(),
    findAndCountAll: jest.fn(),
    findOne: jest.fn(),
  },
  Teacher: {},
}));

const { Student } = require('../models');
const studentRepository = require('../modules/student/student.repository');

describe('student repository class-scoped pagination', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Student.findAndCountAll.mockResolvedValue({
      count: 7,
      rows: [],
    });
  });

  test('counts distinct students inside the authenticated teacher class', async () => {
    await studentRepository.findStudentsForTeacher({
      classId: 3,
      name: undefined,
      pageSize: 7,
      offset: 0,
    });

    expect(Student.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { ClassId: 3 },
        distinct: true,
        limit: 7,
        offset: 0,
      })
    );
  });

  test('keeps search inside the same teacher class scope', async () => {
    await studentRepository.findStudentsForTeacher({
      classId: 3,
      name: 'Ayu',
      pageSize: 7,
      offset: 7,
    });

    const query = Student.findAndCountAll.mock.calls[0][0];
    expect(query.where.ClassId).toBe(3);
    expect(query.where.name).toBeDefined();
    expect(query.distinct).toBe(true);
    expect(query.offset).toBe(7);
  });
});

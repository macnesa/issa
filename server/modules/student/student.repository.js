const { Op } = require('sequelize');
const {
  Assignment,
  Attendance,
  Class,
  History,
  Lesson,
  Score,
  Student,
  Teacher,
} = require('../../models');
const isNil = require('lodash/isNil');

function findStudentsForTeacher({
  classId,
  name,
  pageSize,
  offset,
}) {
  const studentWhere = { ClassId: classId };
  if (name !== '' && !isNil(name)) {
    studentWhere.name = { [Op.iLike]: `%${name}%` };
  }

  const studentListQuery = {
    where: studentWhere,
    include: [
      {
        model: Attendance,
      },
      {
        model: Class,
        include: {
          model: Teacher,
          attributes: { exclude: ['password', 'createdAt', 'updatedAt'] },
        },
      },
      {
        model: Score,
        attributes: { exclude: ['createdAt', 'updatedAt'] },
        include: {
          model: Lesson,
          attributes: { exclude: ['createdAt', 'updatedAt'] },
        },
      },
    ],
    limit: pageSize,
  };
  if (typeof offset !== 'undefined') studentListQuery.offset = offset;

  return Student.findAndCountAll(studentListQuery);
}

function findStudentByIdForTeacher(studentId, classId) {
  return Student.findOne({
    where: { id: studentId, ClassId: classId },
    include: [
      {
        model: Attendance,
      },
      {
        model: Score,
        attributes: { exclude: ['createdAt', 'updatedAt'] },
        include: [
          {
            model: Assignment,
            attributes: { exclude: ['createdAt', 'updatedAt'] },
          },
          {
            model: Lesson,
            attributes: { exclude: ['createdAt', 'updatedAt'] },
          },
        ],
      },
    ],
  });
}

function findTeacherClass(classId) {
  return Class.findByPk(classId, { include: Teacher });
}

function createStudentRecord(studentPayload) {
  return Student.create(studentPayload);
}

function createStudentHistory(studentHistoryPayload) {
  return History.create(studentHistoryPayload);
}

module.exports = {
  createStudentHistory,
  createStudentRecord,
  findStudentByIdForTeacher,
  findStudentsForTeacher,
  findTeacherClass,
};

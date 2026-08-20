'use strict';

const {
  Assignment,
  Class,
  Lesson,
  Schedule,
  Score,
  Student,
} = require('../../models');

const MAXIMUM_ROSTER_SIZE = 100;
const MAXIMUM_ASSIGNMENT_CANDIDATES = 25;

function findTeacherClass({ teacherId, classId }) {
  return Class.findOne({
    where: { id: classId, TeacherId: teacherId },
    attributes: ['id', 'name', 'TeacherId'],
  });
}

function findClassRoster(classId) {
  return Student.findAll({
    where: { ClassId: classId },
    attributes: ['id', 'name'],
    order: [['name', 'ASC'], ['id', 'ASC']],
    limit: MAXIMUM_ROSTER_SIZE + 1,
  });
}

function findLessonForClass({ lessonId, classId }) {
  return Lesson.findOne({
    where: { id: lessonId },
    attributes: ['id', 'name'],
    include: {
      model: Schedule,
      attributes: [],
      required: true,
      where: { ClassId: classId },
    },
  });
}

function findAssignmentCandidates({ classId, lessonId }) {
  const scoreScope = {};
  if (lessonId) scoreScope.LessonId = lessonId;

  return Assignment.findAll({
    attributes: ['id', 'name', 'type', 'desc'],
    include: {
      model: Score,
      attributes: [],
      required: true,
      where: scoreScope,
      include: {
        model: Student,
        attributes: [],
        required: true,
        where: { ClassId: classId },
      },
    },
    group: ['Assignment.id'],
    order: [['name', 'ASC'], ['id', 'ASC']],
    subQuery: false,
    limit: MAXIMUM_ASSIGNMENT_CANDIDATES,
  });
}

module.exports = {
  MAXIMUM_ASSIGNMENT_CANDIDATES,
  MAXIMUM_ROSTER_SIZE,
  findAssignmentCandidates,
  findClassRoster,
  findLessonForClass,
  findTeacherClass,
};

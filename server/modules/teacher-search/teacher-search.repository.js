const { Op } = require('sequelize');
const {
  Activity,
  Class,
  Lesson,
  Schedule,
  Student,
  StudentLearningJournal,
} = require('../../models');

function findStudentCandidates({ classId, pattern, candidateLimit }) {
  return Student.findAll({
    where: {
      ClassId: classId,
      [Op.or]: [
        { name: { [Op.iLike]: pattern } },
        { NIM: { [Op.iLike]: pattern } },
        { '$Class.name$': { [Op.iLike]: pattern } },
      ],
    },
    attributes: ['id', 'name', 'NIM', 'updatedAt'],
    include: {
      model: Class,
      attributes: ['id', 'name'],
      required: true,
    },
    order: [['updatedAt', 'DESC'], ['id', 'ASC']],
    subQuery: false,
    limit: candidateLimit,
  });
}

function findJournalCandidates({
  classId,
  pattern,
  matchingJournalTypes,
  candidateLimit,
}) {
  const searchableFields = [
    { content: { [Op.iLike]: pattern } },
    { '$Student.name$': { [Op.iLike]: pattern } },
  ];
  if (matchingJournalTypes.length > 0) {
    searchableFields.push({ type: { [Op.in]: matchingJournalTypes } });
  }

  return StudentLearningJournal.findAll({
    where: {
      [Op.or]: searchableFields,
    },
    attributes: [
      'id',
      'StudentId',
      'type',
      'content',
      'observedAt',
      'updatedAt',
    ],
    include: {
      model: Student,
      attributes: ['id', 'name'],
      required: true,
      where: { ClassId: classId },
    },
    order: [['observedAt', 'DESC'], ['id', 'ASC']],
    subQuery: false,
    limit: candidateLimit,
  });
}

function findFeedbackCandidates({ classId, pattern, candidateLimit }) {
  return Student.findAll({
    where: {
      ClassId: classId,
      feedback: { [Op.not]: null },
      [Op.or]: [
        { feedback: { [Op.iLike]: pattern } },
        { name: { [Op.iLike]: pattern } },
      ],
    },
    attributes: ['id', 'name', 'feedback', 'updatedAt'],
    order: [['updatedAt', 'DESC'], ['id', 'ASC']],
    limit: candidateLimit,
  });
}

function findLessonCandidates({ classId, pattern, candidateLimit }) {
  return Lesson.findAll({
    where: {
      [Op.or]: [
        { name: { [Op.iLike]: pattern } },
        { desc: { [Op.iLike]: pattern } },
      ],
    },
    attributes: ['id', 'name', 'desc', 'updatedAt'],
    include: {
      model: Schedule,
      attributes: [],
      required: true,
      where: { ClassId: classId },
    },
    group: ['Lesson.id'],
    order: [['updatedAt', 'DESC'], ['id', 'ASC']],
    subQuery: false,
    limit: candidateLimit,
  });
}

function findActivityCandidates({ pattern, candidateLimit }) {
  return Activity.findAll({
    where: {
      [Op.or]: [
        { name: { [Op.iLike]: pattern } },
        { desc: { [Op.iLike]: pattern } },
      ],
    },
    attributes: ['id', 'name', 'desc', 'date', 'updatedAt'],
    order: [['date', 'DESC'], ['id', 'ASC']],
    limit: candidateLimit,
  });
}

module.exports = {
  findActivityCandidates,
  findFeedbackCandidates,
  findJournalCandidates,
  findLessonCandidates,
  findStudentCandidates,
};

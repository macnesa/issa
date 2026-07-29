const { Op } = require('sequelize');
const {
  Assignment,
  Attendance,
  Lesson,
  Score,
  Student,
  StudentEvidence,
  StudentFeedback,
  StudentLearningJournal,
} = require('../../models');

const sourceLimit = 8;

function dateTimeRange(dateFrom, dateTo) {
  return {
    [Op.between]: [
      new Date(`${dateFrom}T00:00:00.000Z`),
      new Date(`${dateTo}T23:59:59.999Z`),
    ],
  };
}

function findStudentById(studentId) {
  return Student.findByPk(studentId, {
    attributes: ['id', 'name', 'ClassId', 'feedback', 'updatedAt'],
  });
}

function findAttendanceSources({ studentId, dateFrom, dateTo }) {
  return Attendance.findAll({
    where: {
      StudentId: studentId,
      attendanceDate: { [Op.between]: [dateFrom, dateTo] },
    },
    attributes: ['id', 'status', 'attendanceDate'],
    order: [['attendanceDate', 'DESC'], ['id', 'DESC']],
    limit: sourceLimit,
  });
}

function findScoreSources({ studentId, dateFrom, dateTo }) {
  return Score.findAll({
    where: {
      StudentId: studentId,
      recordedAt: dateTimeRange(dateFrom, dateTo),
    },
    attributes: [
      'id',
      'value',
      'recordedAt',
      'LessonId',
      'AssignmentId',
    ],
    include: [
      {
        model: Lesson,
        attributes: ['id', 'name', 'KKM'],
        required: true,
      },
      {
        model: Assignment,
        attributes: ['id', 'name'],
        required: true,
      },
    ],
    order: [['recordedAt', 'DESC'], ['id', 'DESC']],
    limit: sourceLimit,
  });
}

function findJournalSources({ studentId, dateFrom, dateTo }) {
  return StudentLearningJournal.findAll({
    where: {
      StudentId: studentId,
      observedAt: dateTimeRange(dateFrom, dateTo),
    },
    attributes: [
      'id',
      'type',
      'voiceCaptureType',
      'content',
      'observedAt',
      'createdAt',
      'updatedAt',
    ],
    order: [['observedAt', 'DESC'], ['id', 'DESC']],
    limit: sourceLimit,
  });
}

function findEvidenceSources({ studentId, dateFrom, dateTo }) {
  return StudentEvidence.findAll({
    where: {
      StudentId: studentId,
      observedAt: dateTimeRange(dateFrom, dateTo),
      retractedAt: null,
    },
    attributes: [
      'id',
      'title',
      'category',
      'description',
      'observedAt',
    ],
    order: [['observedAt', 'DESC'], ['id', 'DESC']],
    limit: sourceLimit,
  });
}

function findFeedbackSources({ studentId, dateFrom, dateTo }) {
  return StudentFeedback.findAll({
    where: {
      StudentId: studentId,
      observedAt: dateTimeRange(dateFrom, dateTo),
    },
    attributes: ['id', 'content', 'observedAt'],
    order: [['observedAt', 'DESC'], ['id', 'DESC']],
    limit: sourceLimit,
  });
}

module.exports = {
  findAttendanceSources,
  findEvidenceSources,
  findFeedbackSources,
  findJournalSources,
  findScoreSources,
  findStudentById,
};

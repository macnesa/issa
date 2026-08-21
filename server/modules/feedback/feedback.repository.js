const {
  Class,
  History,
  Student,
  StudentFeedback,
  Teacher,
} = require('../../models');

function findTeacherClass(classId, options = {}) {
  return Class.findByPk(classId, { include: Teacher, ...options });
}

function findStudentInClass(studentId, classId, options = {}) {
  return Student.findOne({
    where: { id: studentId, ClassId: classId },
    ...options,
  });
}

function findFeedbackHistory(studentId) {
  return StudentFeedback.findAll({
    where: { StudentId: studentId },
    attributes: ['id', 'content', 'observedAt', 'createdAt'],
    include: {
      model: Teacher,
      attributes: ['id', 'name'],
    },
    order: [['observedAt', 'DESC'], ['createdAt', 'DESC']],
  });
}

function updateStudent(student, studentUpdatePayload, databaseTransaction) {
  return student.update(studentUpdatePayload, { transaction: databaseTransaction });
}

function createFeedbackHistory(feedbackHistoryPayload, databaseTransaction) {
  return StudentFeedback.create(feedbackHistoryPayload, {
    transaction: databaseTransaction,
  });
}

function createStudentUpdateHistory(updateHistoryPayload, databaseTransaction) {
  return History.create(updateHistoryPayload, {
    transaction: databaseTransaction,
  });
}

module.exports = {
  createFeedbackHistory,
  createStudentUpdateHistory,
  findFeedbackHistory,
  findStudentInClass,
  findTeacherClass,
  updateStudent,
};

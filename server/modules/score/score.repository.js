const {
  Assignment,
  Class,
  History,
  Lesson,
  Score,
  Student,
  Teacher,
} = require('../../models');

function findStudentInClass(studentId, classId, options = {}) {
  return Student.findOne({
    where: { id: studentId, ClassId: classId },
    ...options,
  });
}

function findLessonById(lessonId, options = {}) {
  return Lesson.findByPk(lessonId, options);
}

function findAssignmentById(assignmentId, options = {}) {
  return Assignment.findByPk(assignmentId, options);
}

function findScoreById(scoreId) {
  return Score.findByPk(scoreId);
}

function findScoreByStudentLessonAndAssignment(
  studentId,
  lessonId,
  assignmentId,
  options = {}
) {
  return Score.findOne({
    where: {
      StudentId: studentId,
      LessonId: lessonId,
      AssignmentId: assignmentId,
    },
    ...options,
  });
}

function findTeacherClass(classId, options = {}) {
  return Class.findByPk(classId, { include: Teacher, ...options });
}

function createStudentScore(scoreRecordPayload, options = {}) {
  return Score.create(scoreRecordPayload, options);
}

function updateStudentScore(scoreRecord, scoreUpdatePayload) {
  return scoreRecord.update(scoreUpdatePayload);
}

function createScoreHistory(scoreHistoryPayload, options = {}) {
  return History.create(scoreHistoryPayload, options);
}

module.exports = {
  createScoreHistory,
  createStudentScore,
  findAssignmentById,
  findLessonById,
  findScoreById,
  findScoreByStudentLessonAndAssignment,
  findStudentInClass,
  findTeacherClass,
  updateStudentScore,
};

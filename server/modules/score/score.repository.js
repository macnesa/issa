const {
  Assignment,
  Class,
  History,
  Lesson,
  Score,
  Student,
  Teacher,
} = require('../../models');

function findStudentInClass(studentId, classId) {
  return Student.findOne({
    where: { id: studentId, ClassId: classId },
  });
}

function findLessonById(lessonId) {
  return Lesson.findByPk(lessonId);
}

function findAssignmentById(assignmentId) {
  return Assignment.findByPk(assignmentId);
}

function findScoreById(scoreId) {
  return Score.findByPk(scoreId);
}

function findScoreByStudentLessonAndAssignment(studentId, lessonId, assignmentId) {
  return Score.findOne({
    where: {
      StudentId: studentId,
      LessonId: lessonId,
      AssignmentId: assignmentId,
    },
  });
}

function findTeacherClass(classId) {
  return Class.findByPk(classId, { include: Teacher });
}

function createStudentScore(scoreRecordPayload) {
  return Score.create(scoreRecordPayload);
}

function updateStudentScore(scoreRecord, scoreUpdatePayload) {
  return scoreRecord.update(scoreUpdatePayload);
}

function createScoreHistory(scoreHistoryPayload) {
  return History.create(scoreHistoryPayload);
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

const isNil = require('lodash/isNil');
const scoreRepository = require('./score.repository');
const { emitStudentRecordUpdated } = require('../../realtime/student-record-events');
const { appendHistorySource } = require('../../helpers/history-source');
const {
  getCreateRecordedAt,
  validateScoreRecordedAt,
  validateScoreValue,
} = require('./score.validator');

function calculateScoreCategory(scoreValue) {
  if (scoreValue >= 85) return 'A';
  if (scoreValue >= 75) return 'B';
  if (scoreValue >= 60) return 'C';
  if (scoreValue >= 50) return 'D';
  return 'E';
}

function calculateScoreStatus(scoreValue, lesson) {
  void 'ISSA:SERVER.SCORE.CALCULATE_STATUS';
  const minimumPassingScore = Number(lesson.KKM);
  if (!Number.isFinite(minimumPassingScore)) throw { name: 'invalidLessonKkm' };

  return scoreValue >= minimumPassingScore;
}

function isScoreUniqueConflict(error) {
  return error.name === 'SequelizeUniqueConstraintError' &&
    error.parent?.constraint === 'scores_student_lesson_assignment_unique';
}

async function findScoreContext({
  studentId,
  lessonId,
  assignmentId,
  classId,
  transaction = null,
}) {
  const options = transaction ? { transaction } : undefined;
  const [student, lesson, assignment] = await Promise.all([
    transaction
      ? scoreRepository.findStudentInClass(studentId, classId, options)
      : scoreRepository.findStudentInClass(studentId, classId),
    transaction
      ? scoreRepository.findLessonById(lessonId, options)
      : scoreRepository.findLessonById(lessonId),
    transaction
      ? scoreRepository.findAssignmentById(assignmentId, options)
      : scoreRepository.findAssignmentById(assignmentId),
  ]);

  if (isNil(student) || isNil(lesson) || isNil(assignment)) {
    throw { name: 'notFound' };
  }

  return { student, lesson };
}

async function createStudentScore({
  classId,
  scorePayload,
  transaction = null,
  emitRealtime = true,
  historySource = null,
}) {
  void 'ISSA:SERVER.SCORE.CREATE_STUDENT_SCORE';
  const {
    StudentId: studentId,
    LessonId: lessonId,
    AssignmentId: assignmentId,
    value: scoreValue,
    desc,
  } = scorePayload;
  validateScoreValue(scoreValue);

  const { student, lesson } = await findScoreContext({
    studentId,
    lessonId,
    assignmentId,
    classId,
    transaction,
  });

  const transactionOptions = transaction ? { transaction } : undefined;
  const existingScore = transaction
    ? await scoreRepository.findScoreByStudentLessonAndAssignment(
      studentId,
      lessonId,
      assignmentId,
      transactionOptions
    )
    : await scoreRepository.findScoreByStudentLessonAndAssignment(
      studentId,
      lessonId,
      assignmentId
    );
  if (existingScore) throw { name: 'duplicateScore' };

  const scoreRecordPayload = {
    StudentId: studentId,
    LessonId: lessonId,
    AssignmentId: assignmentId,
    value: scoreValue,
    desc,
    category: calculateScoreCategory(scoreValue),
    status: calculateScoreStatus(scoreValue, lesson),
    recordedAt: getCreateRecordedAt(scorePayload),
  };

  let scoreRecord;
  try {
    scoreRecord = transaction
      ? await scoreRepository.createStudentScore(
        scoreRecordPayload,
        transactionOptions
      )
      : await scoreRepository.createStudentScore(scoreRecordPayload);
  } catch (error) {
    if (isScoreUniqueConflict(error)) throw { name: 'duplicateScore' };
    throw error;
  }

  const teacherClass = transaction
    ? await scoreRepository.findTeacherClass(classId, transactionOptions)
    : await scoreRepository.findTeacherClass(classId);
  const historyPayload = {
    description: appendHistorySource(
      `Score ${student.name} lesson ${lesson.name} has been created`,
      historySource
    ),
    createdBy: teacherClass.Teacher.name,
  };
  const history = transaction
    ? await scoreRepository.createScoreHistory(
      historyPayload,
      transactionOptions
    )
    : await scoreRepository.createScoreHistory(historyPayload);

  if (emitRealtime) emitStudentRecordUpdated({
    studentId,
    recordType: 'score',
    occurredAt: scoreRecord.recordedAt || scoreRecordPayload.recordedAt,
  });

  return { data: scoreRecord, history };
}

async function findScoreForUpdate(scorePayload) {
  if (scorePayload.ScoreId) {
    return scoreRepository.findScoreById(scorePayload.ScoreId);
  }

  return scoreRepository.findScoreByStudentLessonAndAssignment(
    scorePayload.StudentId,
    scorePayload.LessonId,
    scorePayload.AssignmentId
  );
}

async function updateStudentScore({ classId, scorePayload }) {
  void 'ISSA:SERVER.SCORE.UPDATE_STUDENT_SCORE';
  const { value: scoreValue } = scorePayload;
  validateScoreValue(scoreValue);

  const scoreRecord = await findScoreForUpdate(scorePayload);
  if (isNil(scoreRecord)) throw { name: 'notFound' };

  const { student, lesson } = await findScoreContext({
    studentId: scoreRecord.StudentId,
    lessonId: scoreRecord.LessonId,
    assignmentId: scoreRecord.AssignmentId,
    classId,
  });

  const scoreUpdatePayload = {
    value: scoreValue,
    category: calculateScoreCategory(scoreValue),
    status: calculateScoreStatus(scoreValue, lesson),
  };
  if (typeof scorePayload.recordedAt !== 'undefined') {
    scoreUpdatePayload.recordedAt = validateScoreRecordedAt(scorePayload.recordedAt);
  }

  const storedRecordedAt = scoreRecord.recordedAt
    ? new Date(scoreRecord.recordedAt).getTime()
    : null;
  const updatedRecordedAt = scoreUpdatePayload.recordedAt
    ? scoreUpdatePayload.recordedAt.getTime()
    : storedRecordedAt;
  const hasScoreChanged =
    Number(scoreRecord.value) !== scoreValue ||
    storedRecordedAt !== updatedRecordedAt;

  const updatedScore = await scoreRepository.updateStudentScore(
    scoreRecord,
    scoreUpdatePayload
  );
  const teacherClass = await scoreRepository.findTeacherClass(classId);
  const history = await scoreRepository.createScoreHistory({
    description: `Score ${student.name} lesson ${lesson.name} has been edited`,
    createdBy: teacherClass.Teacher.name,
  });

  if (hasScoreChanged) {
    emitStudentRecordUpdated({
      studentId: scoreRecord.StudentId,
      recordType: 'score',
      occurredAt: updatedScore.recordedAt || scoreUpdatePayload.recordedAt ||
        scoreRecord.recordedAt,
    });
  }

  return { data: updatedScore, history };
}

module.exports = {
  calculateScoreCategory,
  calculateScoreStatus,
  createStudentScore,
  updateStudentScore,
};

const isEqual = require('lodash/isEqual');
const isNil = require('lodash/isNil');
const { sequelize } = require('../../models');
const feedbackRepository = require('./feedback.repository');
const { emitStudentRecordUpdated } = require('../../realtime/student-record-events');
const { validateFeedbackUpdate } = require('./feedback.validator');
const { appendHistorySource } = require('../../helpers/history-source');

async function getStudentFeedbackHistory({ studentId, classId }) {
  void 'ISSA:SERVER.FEEDBACK.GET_HISTORY';
  const student = await feedbackRepository.findStudentInClass(studentId, classId);
  if (isNil(student)) throw { name: 'notFound' };

  return feedbackRepository.findFeedbackHistory(student.id);
}

function buildStudentUpdatePayload(studentUpdatePayload) {
  const fields = ['NIM', 'name', 'age', 'gender', 'birthDate', 'imgUrl'];

  return Object.fromEntries(
    fields
      .filter((field) => Object.prototype.hasOwnProperty.call(studentUpdatePayload, field))
      .map((field) => [field, studentUpdatePayload[field]])
  );
}

async function updateStudentFeedback({
  studentId,
  classId,
  teacherId,
  studentUpdatePayload,
  transaction = null,
  emitRealtime = true,
  historySource = null,
}) {
  void 'ISSA:SERVER.FEEDBACK.UPDATE_HISTORY';
  const performUpdate = async (databaseTransaction) => {
    const transactionOptions = { transaction: databaseTransaction };
    const teacherClass = await feedbackRepository.findTeacherClass(
      classId,
      transactionOptions
    );
    const existingStudent = await feedbackRepository.findStudentInClass(
      studentId,
      classId,
      transactionOptions
    );
    if (isNil(existingStudent)) throw { name: 'notFound' };

    const feedbackUpdate = validateFeedbackUpdate(studentUpdatePayload);
    const studentFieldsToUpdate = buildStudentUpdatePayload(studentUpdatePayload);
    const hasFeedbackChanged = feedbackUpdate.hasFeedback &&
      !isEqual(feedbackUpdate.feedback, existingStudent.feedback);

    if (hasFeedbackChanged) {
      studentFieldsToUpdate.feedback = feedbackUpdate.feedback;
    }

    const updatedStudent = await feedbackRepository.updateStudent(
      existingStudent,
      studentFieldsToUpdate,
      databaseTransaction
    );

    let feedbackRecord = null;
    if (hasFeedbackChanged) {
      feedbackRecord = await feedbackRepository.createFeedbackHistory({
        StudentId: existingStudent.id,
        TeacherId: teacherId,
        content: feedbackUpdate.feedback,
        observedAt: feedbackUpdate.observedAt,
      }, databaseTransaction);
    }

    const updateHistory = await feedbackRepository.createStudentUpdateHistory({
      description: appendHistorySource(
        `student with name ${existingStudent.name} has been edited`,
        historySource
      ),
      createdBy: teacherClass.Teacher.name,
    }, databaseTransaction);

    return {
      data: updatedStudent,
      feedbackChanged: hasFeedbackChanged,
      feedbackRecord,
      history: updateHistory,
      occurredAt: feedbackUpdate.observedAt,
    };
  };
  const feedbackResult = transaction
    ? await performUpdate(transaction)
    : await sequelize.transaction(performUpdate);

  if (emitRealtime && feedbackResult.feedbackChanged) {
    emitStudentRecordUpdated({
      studentId,
      recordType: 'feedback',
      occurredAt: feedbackResult.occurredAt,
    });
  }

  return feedbackResult;
}

module.exports = {
  getStudentFeedbackHistory,
  updateStudentFeedback,
};

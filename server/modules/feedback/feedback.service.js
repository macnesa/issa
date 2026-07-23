const isEqual = require('lodash/isEqual');
const isNil = require('lodash/isNil');
const { sequelize } = require('../../models');
const feedbackRepository = require('./feedback.repository');
const { validateFeedbackUpdate } = require('./feedback.validator');

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
}) {
  void 'ISSA:SERVER.FEEDBACK.UPDATE_HISTORY';
  const teacherClass = await feedbackRepository.findTeacherClass(classId);
  const existingStudent = await feedbackRepository.findStudentInClass(studentId, classId);
  if (isNil(existingStudent)) throw { name: 'notFound' };

  const feedbackUpdate = validateFeedbackUpdate(studentUpdatePayload);
  const studentFieldsToUpdate = buildStudentUpdatePayload(studentUpdatePayload);
  const hasFeedbackChanged = feedbackUpdate.hasFeedback &&
    !isEqual(feedbackUpdate.feedback, existingStudent.feedback);

  if (hasFeedbackChanged) {
    studentFieldsToUpdate.feedback = feedbackUpdate.feedback;
  }

  return sequelize.transaction(async (databaseTransaction) => {
    const updatedStudent = await feedbackRepository.updateStudent(
      existingStudent,
      studentFieldsToUpdate,
      databaseTransaction
    );

    if (hasFeedbackChanged) {
      await feedbackRepository.createFeedbackHistory({
        StudentId: existingStudent.id,
        TeacherId: teacherId,
        content: feedbackUpdate.feedback,
        observedAt: feedbackUpdate.observedAt,
      }, databaseTransaction);
    }

    const updateHistory = await feedbackRepository.createStudentUpdateHistory({
      description: `student with name ${existingStudent.name} has been edited`,
      createdBy: teacherClass.Teacher.name,
    }, databaseTransaction);

    return { data: updatedStudent, history: updateHistory };
  });
}

module.exports = {
  getStudentFeedbackHistory,
  updateStudentFeedback,
};

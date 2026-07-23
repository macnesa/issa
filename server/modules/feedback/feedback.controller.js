const feedbackService = require('./feedback.service');

async function getStudentFeedbackHistory(req, res, next) {
  try {
    const feedbackHistory = await feedbackService.getStudentFeedbackHistory({
      studentId: req.params.id,
      classId: req.user.classId,
    });

    res.status(200).json(feedbackHistory);
  } catch (error) {
    next(error);
  }
}

async function updateStudentFeedback(req, res, next) {
  try {
    const { data, history } = await feedbackService.updateStudentFeedback({
      studentId: req.params.id,
      classId: req.user.classId,
      teacherId: req.user.teacherId,
      studentUpdatePayload: { ...req.body },
    });

    res.status(200).json({ status: 'updated', data, history });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getStudentFeedbackHistory,
  updateStudentFeedback,
};

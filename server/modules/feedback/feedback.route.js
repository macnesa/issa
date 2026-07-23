const express = require('express');
const { authenticateTeacherRequest } = require('../../middlewares/authentication');
const feedbackController = require('./feedback.controller');

const router = express.Router();

router.get(
  '/:id/feedbacks',
  authenticateTeacherRequest,
  feedbackController.getStudentFeedbackHistory
);

router.put(
  '/:id',
  authenticateTeacherRequest,
  feedbackController.updateStudentFeedback
);

module.exports = router;

const express = require('express');
const { authenticateActorRequest, authenticateTeacherRequest } = require('../../middlewares/authentication');
const {
  requireWritableAccount,
} = require('../../middlewares/public-demo-access');
const feedbackController = require('./feedback.controller');

const router = express.Router();

router.get(
  '/:id/feedbacks',
  authenticateActorRequest,
  feedbackController.getStudentFeedbackHistory
);

router.put(
  '/:id',
  authenticateTeacherRequest,
  requireWritableAccount,
  feedbackController.updateStudentFeedback
);

module.exports = router;

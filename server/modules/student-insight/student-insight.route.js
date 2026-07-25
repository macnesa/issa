const express = require('express');
const {
  authenticateActorRequest,
  authenticateTeacherRequest,
} = require('../../middlewares/authentication');
const studentInsightController = require('./student-insight.controller');

const router = express.Router();

router.get(
  '/students/:studentId/insights',
  authenticateActorRequest,
  studentInsightController.getStudentInsights
);

router.get(
  '/teachers/me/attention',
  authenticateTeacherRequest,
  studentInsightController.getTeacherAttention
);

module.exports = router;

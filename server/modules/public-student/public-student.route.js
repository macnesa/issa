const express = require('express');
const { authenticateParentRequest } = require('../../middlewares/authentication');
const publicStudentController = require('./public-student.controller');

const router = express.Router();

router.get(
  '/classmate',
  authenticateParentRequest,
  publicStudentController.getClassmates
);

router.get(
  '/detail',
  authenticateParentRequest,
  publicStudentController.getPublicStudentDetail
);

router.get(
  '/schedule',
  authenticateParentRequest,
  publicStudentController.getPublicClassSchedule
);

router.get(
  '/activity',
  authenticateParentRequest,
  publicStudentController.getSchoolActivities
);

module.exports = router;

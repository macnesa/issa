const express = require('express');
const { authenticateTeacherRequest } = require('../../middlewares/authentication');
const scheduleController = require('./schedule.controller');

const router = express.Router();

router.get(
  '/',
  authenticateTeacherRequest,
  scheduleController.getClassSchedule
);

module.exports = router;

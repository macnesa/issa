const express = require('express');
const { authenticateTeacherRequest } = require('../../middlewares/authentication');
const attendanceController = require('./attendance.controller');

const router = express.Router();

router.get(
  '/',
  authenticateTeacherRequest,
  attendanceController.getAttendanceRecords
);

router.post(
  '/',
  authenticateTeacherRequest,
  attendanceController.createAttendanceRecord
);

router.put(
  '/',
  authenticateTeacherRequest,
  attendanceController.updateAttendanceRecord
);

module.exports = router;

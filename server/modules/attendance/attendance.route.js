const express = require('express');
const { authenticateTeacherRequest } = require('../../middlewares/authentication');
const {
  requireWritableAccount,
} = require('../../middlewares/public-demo-access');
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
  requireWritableAccount,
  attendanceController.createAttendanceRecord
);

router.put(
  '/',
  authenticateTeacherRequest,
  requireWritableAccount,
  attendanceController.updateAttendanceRecord
);

module.exports = router;

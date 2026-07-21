const express = require('express');
const AttendanceController = require('../controllers/attendance');
const router = express.Router();

router.get('/', AttendanceController.allAttendance)

router.post('/', AttendanceController.addAttendance);
router.put('/', AttendanceController.editAttendance);


module.exports = router
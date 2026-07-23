const express = require('express');
const AttendanceController = require('../controllers/attendance');
const router = express.Router();

router.get('/', AttendanceController.getAttendanceRecords)

router.post('/', AttendanceController.createAttendanceRecord);
router.put('/', AttendanceController.updateAttendanceRecord);


module.exports = router

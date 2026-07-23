const express = require('express');
const router = express.Router();
const ScheduleController = require('../controllers/scheduleController');

router.get('/', ScheduleController.getClassSchedule);

module.exports = router;

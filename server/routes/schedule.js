const express = require('express');
const router = express.Router();
const ScheduleController = require('../controllers/scheduleController');

router.get('/', ScheduleController.schedules);
router.get('/:id', ScheduleController.scheduleById);

router.post('/', ScheduleController.addSchedule)
router.put('/:id', ScheduleController.editSchedule)
router.delete('/:id', ScheduleController.deleteSchedule)


module.exports = router;

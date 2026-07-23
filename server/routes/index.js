const express = require('express');
const router = express.Router();
const userRouter = require('./user');
const studentRouter = require('./student');
const teacherRouter = require('./teacher');
const lessonRouter = require('./lesson');
const attendanceRouter = require('./attendance');
const scoreRouter = require('./score');
const assignmentRouter = require('./assignment');
const scheduleRouter = require('./schedule');
const publicRouter = require('./public');
const { authenticateTeacherRequest } = require('../middlewares/authentication');

router.use('/public', publicRouter);
router.use('/users', userRouter);
router.use('/teachers', teacherRouter);

router.use('/students', authenticateTeacherRequest, studentRouter);
router.use('/assignments', authenticateTeacherRequest, assignmentRouter);
router.use('/lessons', authenticateTeacherRequest, lessonRouter);
router.use('/scores', authenticateTeacherRequest, scoreRouter);
router.use('/attendances', authenticateTeacherRequest, attendanceRouter);
router.use('/schedules', authenticateTeacherRequest, scheduleRouter);

router.get('/', (req, res) => {
  res.json({ status: 'ok' });
});

router.use((req, res) => {
  res.status(404).json({ msg: 'Route not available in the public demo' });
});

module.exports = router;

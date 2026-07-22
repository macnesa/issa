const express = require('express');
const router = express.Router();
const user = require('./user');
const student = require('./student');
const teacher = require('./teacher');
const lesson = require('./lesson');
const attendance = require('./attendance');
const score = require('./score');
const assignment = require('./assignment');
const schedule = require('./schedule');
const publicRouter = require('./public');
const { teacherAuth } = require('../middlewares/authentication');

router.use('/public', publicRouter);
router.use('/users', user);
router.use('/teachers', teacher);

router.use('/students', teacherAuth, student);
router.use('/assignments', teacherAuth, assignment);
router.use('/lessons', teacherAuth, lesson);
router.use('/scores', teacherAuth, score);
router.use('/attendances', teacherAuth, attendance);
router.use('/schedules', teacherAuth, schedule);

router.get('/', (req, res) => {
  res.json({ status: 'ok' });
});

router.use((req, res) => {
  res.status(404).json({ msg: 'Route not available in the public demo' });
});

module.exports = router;

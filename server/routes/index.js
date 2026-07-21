const express = require('express');
const router = express.Router();
const user = require('./user');
const student = require('./student');
const teacher = require('./teacher');
const lesson = require('./lesson');
const activity = require('./activity');
const attendance = require('./attendance');
const score = require('./score');

const assignment = require('./assignment')
const chatTeacher = require('./chatTeacher');
const chatParent = require('./chatParent');
const schedule = require('./schedule');
const classes = require('./class');
const publicRouter = require('./public');
const history = require('./history');
const transaction = require('./transactions');
const { teacherAuth, userAuth } = require('../middlewares/authentication');

router.use('/public', publicRouter);

router.use('/users', user);
router.use('/teachers', teacher);
router.use('/chatTeacher', teacherAuth, chatTeacher);
router.use('/chatParent', userAuth, chatParent);

router.use(teacherAuth);

router.use('/students', student);
router.use('/assignments', assignment)
router.use('/lessons', lesson);
router.use('/scores', score);
router.use('/activities', activity);
router.use('/attendances', attendance);
router.use('/schedules', schedule);
router.use('/histories', history);
router.use('/classes', classes);
router.use('/transactions', transaction);

router.get('/', (req, res) => {
  res.send(`
======================================
🚀  ISSA SERVER STATUS : CONNECTED 🚀
======================================
    `);
});

module.exports = router;

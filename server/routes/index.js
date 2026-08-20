const express = require('express');
const router = express.Router();
const aiLearningNarrativeRouter = require(
  '../modules/ai-learning-narrative/ai-learning-narrative.route'
);
const attendanceRouter = require('../modules/attendance/attendance.route');
const assignmentRouter = require('../modules/assignment/assignment.route');
const classroomDebriefRouter = require(
  '../modules/classroom-debrief/classroom-debrief.route'
);
const feedbackRouter = require('../modules/feedback/feedback.route');
const lessonRouter = require('../modules/lesson/lesson.route');
const parentRouter = require('../modules/parent/parent.route');
const publicStudentRouter = require('../modules/public-student/public-student.route');
const scheduleRouter = require('../modules/schedule/schedule.route');
const scoreRouter = require('../modules/score/score.route');
const studentRouter = require('../modules/student/student.route');
const studentEvidenceRouter = require('../modules/student-evidence/student-evidence.route');
const studentInsightRouter = require('../modules/student-insight/student-insight.route');
const studentLearningJournalRouter = require(
  '../modules/student-learning-journal/student-learning-journal.route'
);
const teacherRouter = require('../modules/teacher/teacher.route');
const teacherSearchRouter = require('../modules/teacher-search/teacher-search.route');
const teacherSyncRouter = require('../modules/teacher-sync/teacher-sync.route');

router.use('/', studentInsightRouter);
router.use('/public', publicStudentRouter);
router.use('/users', parentRouter);
router.use('/teachers', teacherRouter);
router.use('/teachers', teacherSearchRouter);
router.use('/teachers', teacherSyncRouter);
router.use('/teachers', classroomDebriefRouter);

router.use('/students', aiLearningNarrativeRouter);
router.use('/students', feedbackRouter);
router.use('/students', studentEvidenceRouter);
router.use('/students', studentLearningJournalRouter);
router.use('/students', studentRouter);
router.use('/assignments', assignmentRouter);
router.use('/lessons', lessonRouter);
router.use('/scores', scoreRouter);
router.use('/attendances', attendanceRouter);
router.use('/schedules', scheduleRouter);

router.get('/', (req, res) => {
  res.json({ status: 'ok' });
});

router.use((req, res) => {
  res.status(404).json({ msg: 'Route not available in the public demo' });
});

module.exports = router;

const express = require('express');
const LessonController = require('../controllers/lessonController');
const router = express.Router();

router.get('/', LessonController.allLessons);

module.exports = router;

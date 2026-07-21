const express = require('express');
const LessonController = require('../controllers/lessonController');
const router = express.Router();

router.get('/', LessonController.allLessons);
router.get('/:id', LessonController.lessonById);

router.post('/', LessonController.addLesson);
router.put('/:id', LessonController.editLesson);

router.delete('/:id', LessonController.deleteLesson)


module.exports = router
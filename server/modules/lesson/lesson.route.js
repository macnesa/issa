const express = require('express');
const { authenticateTeacherRequest } = require('../../middlewares/authentication');
const lessonController = require('./lesson.controller');

const router = express.Router();

router.get(
  '/',
  authenticateTeacherRequest,
  lessonController.getLessonList
);

module.exports = router;

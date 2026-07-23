const express = require('express');
const { authenticateTeacherRequest } = require('../../middlewares/authentication');
const teacherController = require('./teacher.controller');

const router = express.Router();

router.post(
  '/login',
  teacherController.authenticateTeacher
);

router.get(
  '/',
  authenticateTeacherRequest,
  teacherController.getTeacherList
);

module.exports = router;

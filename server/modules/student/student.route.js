const express = require('express');
const { authenticateTeacherRequest } = require('../../middlewares/authentication');
const studentController = require('./student.controller');

const router = express.Router();

router.get(
  '/',
  authenticateTeacherRequest,
  studentController.getStudentList
);

router.get(
  '/:id',
  authenticateTeacherRequest,
  studentController.getStudentDetail
);

router.post(
  '/',
  authenticateTeacherRequest,
  studentController.createStudent
);

module.exports = router;

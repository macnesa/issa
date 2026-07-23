const express = require('express');
const { authenticateTeacherRequest } = require('../../middlewares/authentication');
const scoreController = require('./score.controller');

const router = express.Router();

router.post(
  '/',
  authenticateTeacherRequest,
  scoreController.createStudentScore
);

router.put(
  '/',
  authenticateTeacherRequest,
  scoreController.updateStudentScore
);

module.exports = router;

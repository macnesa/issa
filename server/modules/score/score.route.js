const express = require('express');
const { authenticateTeacherRequest } = require('../../middlewares/authentication');
const {
  requireWritableAccount,
} = require('../../middlewares/public-demo-access');
const scoreController = require('./score.controller');

const router = express.Router();

router.post(
  '/',
  authenticateTeacherRequest,
  requireWritableAccount,
  scoreController.createStudentScore
);

router.put(
  '/',
  authenticateTeacherRequest,
  requireWritableAccount,
  scoreController.updateStudentScore
);

module.exports = router;

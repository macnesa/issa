const express = require('express');
const { authenticateTeacherRequest } = require('../../middlewares/authentication');
const assignmentController = require('./assignment.controller');

const router = express.Router();

router.get(
  '/',
  authenticateTeacherRequest,
  assignmentController.getAssignmentList
);

module.exports = router;

const express = require('express');
const {
  authenticateTeacherRequest,
} = require('../../middlewares/authentication');
const teacherSearchController = require('./teacher-search.controller');

const router = express.Router();

router.get(
  '/me/search',
  authenticateTeacherRequest,
  teacherSearchController.searchTeacherRecords
);

module.exports = router;

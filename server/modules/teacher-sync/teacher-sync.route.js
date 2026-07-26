const express = require('express');
const {
  authenticateTeacherRequest,
} = require('../../middlewares/authentication');
const teacherSyncController = require('./teacher-sync.controller');

const router = express.Router();

router.post(
  '/me/sync',
  authenticateTeacherRequest,
  teacherSyncController.processTeacherSyncBatch
);

module.exports = router;

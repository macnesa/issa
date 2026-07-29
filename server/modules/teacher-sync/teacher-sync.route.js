const express = require('express');
const {
  authenticateTeacherRequest,
} = require('../../middlewares/authentication');
const {
  requireWritableAccount,
} = require('../../middlewares/public-demo-access');
const teacherSyncController = require('./teacher-sync.controller');

const router = express.Router();

router.post(
  '/me/sync',
  authenticateTeacherRequest,
  requireWritableAccount,
  teacherSyncController.processTeacherSyncBatch
);

module.exports = router;

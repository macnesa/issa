'use strict';

const express = require('express');
const {
  authenticateTeacherRequest,
} = require('../../middlewares/authentication');
const {
  publicDemoAiRateLimiter,
} = require('../../middlewares/public-demo-ai-rate-limit');
const {
  requireWritableAccount,
} = require('../../middlewares/public-demo-access');
const {
  createClassroomDebriefController,
} = require('./classroom-debrief.controller');
const classroomDebriefService = require('./classroom-debrief.service');
const classroomDebriefConfirmationService = require(
  './classroom-debrief-confirmation.service'
);
const {
  enforceClassroomDebriefRequestSize,
} = require('./classroom-debrief.validator');

function createClassroomDebriefRouter({
  service = classroomDebriefService,
  authenticateTeacher = authenticateTeacherRequest,
  confirmationService = classroomDebriefConfirmationService,
  rateLimit,
} = {}) {
  const router = express.Router();
  const controller = createClassroomDebriefController(
    service,
    confirmationService
  );
  const limitPublicDemoAi = rateLimit || publicDemoAiRateLimiter;

  router.post(
    '/me/classroom-debrief/drafts',
    authenticateTeacher,
    limitPublicDemoAi,
    enforceClassroomDebriefRequestSize,
    controller.createDrafts
  );

  router.post(
    '/me/classroom-debrief/confirm',
    authenticateTeacher,
    requireWritableAccount,
    controller.confirmDrafts
  );

  return router;
}

module.exports = createClassroomDebriefRouter();
module.exports.createClassroomDebriefRouter = createClassroomDebriefRouter;

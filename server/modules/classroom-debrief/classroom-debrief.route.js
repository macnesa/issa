'use strict';

const express = require('express');
const {
  authenticateTeacherRequest,
} = require('../../middlewares/authentication');
const {
  publicDemoAiRateLimiter,
} = require('../../middlewares/public-demo-ai-rate-limit');
const {
  createClassroomDebriefController,
} = require('./classroom-debrief.controller');
const classroomDebriefService = require('./classroom-debrief.service');
const {
  enforceClassroomDebriefRequestSize,
} = require('./classroom-debrief.validator');

function createClassroomDebriefRouter({
  service = classroomDebriefService,
  authenticateTeacher = authenticateTeacherRequest,
  rateLimit,
} = {}) {
  const router = express.Router();
  const controller = createClassroomDebriefController(service);
  const limitPublicDemoAi = rateLimit || publicDemoAiRateLimiter;

  router.post(
    '/me/classroom-debrief/drafts',
    authenticateTeacher,
    limitPublicDemoAi,
    enforceClassroomDebriefRequestSize,
    controller.createDrafts
  );

  return router;
}

module.exports = createClassroomDebriefRouter();
module.exports.createClassroomDebriefRouter = createClassroomDebriefRouter;

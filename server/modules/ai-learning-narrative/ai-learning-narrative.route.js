const express = require('express');
const {
  authenticateTeacherRequest,
} = require('../../middlewares/authentication');
const {
  createAiLearningNarrativeController,
} = require(
  './ai-learning-narrative.controller'
);
const aiLearningNarrativeService = require(
  './ai-learning-narrative.service'
);
const {
  enforceNarrativeRequestSize,
} = require('./ai-learning-narrative.validator');
const {
  publicDemoAiRateLimiter,
} = require('../../middlewares/public-demo-ai-rate-limit');

function createAiLearningNarrativeRouter({
  service = aiLearningNarrativeService,
  authenticateTeacher = authenticateTeacherRequest,
  rateLimit,
} = {}) {
  const router = express.Router();
  const controller = createAiLearningNarrativeController(service);
  const limitPublicDemoAi = rateLimit || publicDemoAiRateLimiter;

  router.post(
    '/:studentId/ai/narrative-draft',
    authenticateTeacher,
    limitPublicDemoAi,
    enforceNarrativeRequestSize,
    controller.generateNarrativeDraft
  );

  return router;
}

module.exports = createAiLearningNarrativeRouter();
module.exports.createAiLearningNarrativeRouter =
  createAiLearningNarrativeRouter;

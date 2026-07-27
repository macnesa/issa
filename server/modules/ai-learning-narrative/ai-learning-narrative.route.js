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

function createAiLearningNarrativeRouter({
  service = aiLearningNarrativeService,
  authenticateTeacher = authenticateTeacherRequest,
} = {}) {
  const router = express.Router();
  const controller = createAiLearningNarrativeController(service);

  router.post(
    '/:studentId/ai/narrative-draft',
    authenticateTeacher,
    enforceNarrativeRequestSize,
    controller.generateNarrativeDraft
  );

  return router;
}

module.exports = createAiLearningNarrativeRouter();
module.exports.createAiLearningNarrativeRouter =
  createAiLearningNarrativeRouter;

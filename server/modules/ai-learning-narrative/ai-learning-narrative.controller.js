const aiLearningNarrativeService = require(
  './ai-learning-narrative.service'
);

function createAiLearningNarrativeController(
  service = aiLearningNarrativeService
) {
  async function generateNarrativeDraft(req, res, next) {
    try {
      const narrativeDraft = await service.generateNarrativeDraft({
        studentId: req.params.studentId,
        classId: req.user.classId,
        requestBody: req.body,
      });
      return res.status(200).json({ data: narrativeDraft });
    } catch (error) {
      return next(error);
    }
  }

  return { generateNarrativeDraft };
}

module.exports = createAiLearningNarrativeController();
module.exports.createAiLearningNarrativeController =
  createAiLearningNarrativeController;

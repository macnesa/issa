const narrativeRepository = require('./ai-learning-narrative.repository');
const narrativeProvider = require('./narrative-provider');
const {
  aiNarrativeError,
  validateNarrativeRequest,
} = require('./ai-learning-narrative.validator');
const {
  buildSourcePacket,
  safeSourceReference,
  sourceSummary,
} = require('./narrative-source-builder');
const {
  validateGroundedNarrative,
} = require('./narrative-output-validator');

const sourceRepositoryMethods = {
  attendance: 'findAttendanceSources',
  score: 'findScoreSources',
  journal: 'findJournalSources',
  evidence: 'findEvidenceSources',
  feedback: 'findFeedbackSources',
};

function createAiLearningNarrativeService({
  repository = narrativeRepository,
  provider = narrativeProvider,
  clock = () => new Date(),
} = {}) {
  async function loadRequestedSourceRecords(request) {
    const sourceEntries = await Promise.all(
      request.sourceTypes.map(async (sourceType) => {
        const repositoryMethod = sourceRepositoryMethods[sourceType];
        const records = await repository[repositoryMethod]({
          studentId: request.studentId,
          dateFrom: request.dateFrom,
          dateTo: request.dateTo,
        });
        return [sourceType, records];
      })
    );
    return Object.fromEntries(sourceEntries);
  }

  async function generateNarrativeDraft({
    studentId,
    classId,
    requestBody,
  }) {
    const request = validateNarrativeRequest({ studentId, requestBody });
    const student = await repository.findStudentById(request.studentId);
    if (!student) throw aiNarrativeError('student_not_found');
    if (Number(student.ClassId) !== Number(classId)) {
      throw aiNarrativeError('student_access_denied');
    }

    provider.assertAvailable();

    const recordsByType = await loadRequestedSourceRecords(request);
    const sourcePacket = buildSourcePacket({
      student,
      dateFrom: request.dateFrom,
      dateTo: request.dateTo,
      purpose: request.purpose,
      sourceTypes: request.sourceTypes,
      recordsByType,
    });
    if (sourcePacket.sources.length === 0) {
      throw aiNarrativeError('insufficient_narrative_sources');
    }

    const generationResult = await provider.generateLearningNarrative({
      sourcePacket,
      length: request.length,
    });
    let narrative;
    try {
      narrative = validateGroundedNarrative(
        generationResult.narrative,
        sourcePacket
      );
    } catch (error) {
      const nodeEnvironment = String(process.env.NODE_ENV || '').toLowerCase();
      if (
        error?.name === 'ai_generation_invalid_output' &&
        nodeEnvironment !== 'production' &&
        nodeEnvironment !== 'test'
      ) {
        console.error('[AI narrative validation]', {
          reason: error.diagnosticReason,
          paths: error.diagnosticPaths,
          details: error.diagnosticDetails,
          model: generationResult.providerMetadata?.model,
        });
      }
      throw error;
    }

    return {
      generatedAt: clock().toISOString(),
      student: {
        id: sourcePacket.student.id,
        name: sourcePacket.student.displayName,
      },
      period: sourcePacket.period,
      sourceSummary: sourceSummary(sourcePacket.sources),
      sources: sourcePacket.sources.map(safeSourceReference),
      narrative,
      warnings: [],
    };
  }

  return { generateNarrativeDraft };
}

module.exports = createAiLearningNarrativeService();
module.exports.createAiLearningNarrativeService =
  createAiLearningNarrativeService;

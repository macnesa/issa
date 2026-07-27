const { z } = require('zod');

const sourceTypes = [
  'attendance',
  'score',
  'journal',
  'evidence',
  'feedback',
];

function isValidIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() + 1 === month &&
    parsed.getUTCDate() === day
  );
}

const isoDateSchema = z.string().refine(isValidIsoDate);

const narrativeRequestBodySchema = z.object({
  dateFrom: isoDateSchema,
  dateTo: isoDateSchema,
  sourceTypes: z.array(z.enum(sourceTypes)).min(1).max(sourceTypes.length),
  length: z.enum(['short', 'medium']),
}).strict().superRefine((payload, context) => {
  const dateFrom = new Date(`${payload.dateFrom}T00:00:00.000Z`);
  const dateTo = new Date(`${payload.dateTo}T00:00:00.000Z`);
  const rangeMilliseconds = dateTo.getTime() - dateFrom.getTime();

  if (rangeMilliseconds < 0 || rangeMilliseconds > 90 * 24 * 60 * 60 * 1000) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['dateTo'],
      message: 'Date range must be ordered and no longer than 90 days',
    });
  }

  if (new Set(payload.sourceTypes).size !== payload.sourceTypes.length) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['sourceTypes'],
      message: 'Source types must be unique',
    });
  }
});

function aiNarrativeError(code) {
  return { name: code, code };
}

function validateNarrativeRequest({ studentId, requestBody }) {
  if (typeof studentId !== 'string' || !/^[1-9]\d*$/.test(studentId)) {
    throw aiNarrativeError('invalid_ai_narrative_request');
  }

  const parsedStudentId = Number(studentId);
  if (!Number.isSafeInteger(parsedStudentId)) {
    throw aiNarrativeError('invalid_ai_narrative_request');
  }

  const validationResult = narrativeRequestBodySchema.safeParse(requestBody);
  if (!validationResult.success) {
    throw aiNarrativeError('invalid_ai_narrative_request');
  }

  return {
    studentId: parsedStudentId,
    purpose: 'parent_progress_update',
    ...validationResult.data,
  };
}

function enforceNarrativeRequestSize(req, res, next) {
  const maximumRequestBytes = 8 * 1024;
  const contentLength = Number(req.headers['content-length'] || 0);
  let parsedBodyBytes = 0;

  try {
    parsedBodyBytes = Buffer.byteLength(JSON.stringify(req.body || {}), 'utf8');
  } catch (error) {
    return next(aiNarrativeError('invalid_ai_narrative_request'));
  }

  if (
    (Number.isFinite(contentLength) && contentLength > maximumRequestBytes) ||
    parsedBodyBytes > maximumRequestBytes
  ) {
    return next(aiNarrativeError('invalid_ai_narrative_request'));
  }

  return next();
}

module.exports = {
  aiNarrativeError,
  enforceNarrativeRequestSize,
  narrativeRequestBodySchema,
  sourceTypes,
  validateNarrativeRequest,
};

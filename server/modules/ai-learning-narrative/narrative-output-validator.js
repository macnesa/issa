const { z } = require('zod');
const {
  aiNarrativeError,
} = require('./ai-learning-narrative.validator');

const sectionTypes = [
  'summary',
  'strength',
  'recent_change',
  'student_reflection',
  'support_context',
];

const directQuoteSchema = z.object({
  sourceRef: z.string().min(1),
  text: z.string().min(1).max(1500),
}).strict();

const narrativeSectionSchema = z.object({
  sectionType: z.enum(sectionTypes),
  text: z.string().min(20).max(800),
  sourceRefs: z.array(z.string().min(1)).min(1).max(5).superRefine(
    (sourceRefs, context) => {
      if (new Set(sourceRefs).size !== sourceRefs.length) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'sourceRefs must be unique',
        });
      }
    }
  ),
  directQuote: z.union([z.null(), directQuoteSchema]),
}).strict();

const narrativeSchema = z.object({
  title: z.string().min(3).max(120),
  sections: z.array(narrativeSectionSchema).min(1).max(6),
  missingContext: z.array(z.string().min(1).max(240)).max(5),
}).strict();

const NARRATIVE_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'sections', 'missingContext'],
  properties: {
    title: { type: 'string', minLength: 3, maxLength: 120 },
    sections: {
      type: 'array',
      minItems: 1,
      maxItems: 6,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['sectionType', 'text', 'sourceRefs', 'directQuote'],
        properties: {
          sectionType: { type: 'string', enum: sectionTypes },
          text: { type: 'string', minLength: 20, maxLength: 800 },
          sourceRefs: {
            type: 'array',
            minItems: 1,
            maxItems: 5,
            uniqueItems: true,
            items: { type: 'string', minLength: 1 },
          },
          directQuote: {
            anyOf: [
              { type: 'null' },
              {
                type: 'object',
                additionalProperties: false,
                required: ['sourceRef', 'text'],
                properties: {
                  sourceRef: { type: 'string', minLength: 1 },
                  text: { type: 'string', minLength: 1, maxLength: 1500 },
                },
              },
            ],
          },
        },
      },
    },
    missingContext: {
      type: 'array',
      maxItems: 5,
      items: { type: 'string', minLength: 1, maxLength: 240 },
    },
  },
};

const forbiddenPatterns = [
  /\bdiagnosis\b/i,
  /\bmendiagnosis\b/i,
  /\bADHD\b/i,
  /\bautisme\b/i,
  /\bdepresi\b/i,
  /\bgangguan mental\b/i,
  /\brisk score\b/i,
  /\bskor risiko\b/i,
  /\branking\b/i,
  /\bperingkat siswa\b/i,
  /\bdibandingkan dengan siswa lain\b/i,
  /\bsiswa terbaik\b/i,
  /\bsiswa terburuk\b/i,
];

function invalidOutputError(
  diagnosticReason,
  diagnosticPaths = [],
  diagnosticDetails = undefined
) {
  return {
    ...aiNarrativeError('ai_generation_invalid_output'),
    diagnosticReason,
    diagnosticPaths,
    diagnosticDetails,
  };
}

function parseNarrativeOutput(outputText) {
  let parsedOutput;
  try {
    parsedOutput = JSON.parse(outputText);
  } catch (error) {
    throw invalidOutputError('invalid_json');
  }

  const validationResult = narrativeSchema.safeParse(parsedOutput);
  if (!validationResult.success) {
    throw invalidOutputError(
      'provider_output_schema',
      validationResult.error.issues.map((issue) => issue.path.join('.'))
    );
  }
  return validationResult.data;
}

function normalizeNumber(value) {
  const parsed = Number(String(value).replace(',', '.'));
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

function extractNumbers(text) {
  const textWithoutRecognizedDates = String(text)
    .replace(/\b\d{4}-\d{2}-\d{2}\b/g, '')
    .replace(/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/g, '')
    .replace(
      /\b\d{1,2}\s+(?:Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\s+\d{4}\b/gi,
      ''
    );

  return (textWithoutRecognizedDates.match(/-?\d+(?:[.,]\d+)?/g) || [])
    .map(normalizeNumber)
    .filter((value) => value !== null);
}

function collectNumbers(value, target) {
  if (typeof value === 'number') {
    target.add(value);
    return;
  }
  if (typeof value === 'string') {
    extractNumbers(value).forEach((number) => target.add(number));
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectNumbers(item, target));
    return;
  }
  if (value && typeof value === 'object') {
    Object.values(value).forEach((item) => collectNumbers(item, target));
  }
}

function ungroundedNumbers(sectionText, referencedSources) {
  const sectionNumbers = extractNumbers(sectionText);
  if (sectionNumbers.length === 0) return [];

  const sourceNumbers = new Set();
  referencedSources.forEach((source) => {
    collectNumbers(source.facts, sourceNumbers);
    collectNumbers(source.content, sourceNumbers);
  });

  return sectionNumbers.filter((number) => (
    ![...sourceNumbers].some((sourceNumber) => (
      Math.abs(sourceNumber - number) < Number.EPSILON
    ))
  ));
}

function validateGroundedNarrative(narrative, sourcePacket) {
  void 'ISSA:SERVER.AI_NARRATIVE.GROUNDING_VALIDATION';
  const parsedNarrative = narrativeSchema.safeParse(narrative);
  if (!parsedNarrative.success) {
    throw invalidOutputError(
      'grounding_input_schema',
      parsedNarrative.error.issues.map((issue) => issue.path.join('.'))
    );
  }
  if (
    forbiddenPatterns.some((forbiddenPattern) => (
      forbiddenPattern.test(JSON.stringify(parsedNarrative.data))
    ))
  ) {
    throw invalidOutputError('forbidden_claim');
  }

  const sourceByReference = new Map(
    sourcePacket.sources.map((source) => [source.sourceRef, source])
  );

  for (const section of parsedNarrative.data.sections) {
    const referencedSources = section.sourceRefs.map((sourceRef) => (
      sourceByReference.get(sourceRef)
    ));
    if (referencedSources.some((source) => !source)) {
      throw invalidOutputError('unknown_source_reference');
    }
    if (
      referencedSources.some(
        (source) => !sourcePacket.sourceTypes.includes(source.sourceType)
      )
    ) {
      throw invalidOutputError('unrequested_source_type');
    }

    const unsupportedNumbers = ungroundedNumbers(
      section.text,
      referencedSources
    );
    if (unsupportedNumbers.length > 0) {
      throw invalidOutputError(
        'ungrounded_numeric_claim',
        [],
        {
          sectionType: section.sectionType,
          unsupportedNumberCount: unsupportedNumbers.length,
        }
      );
    }

    if (section.directQuote) {
      const directQuoteSource = sourceByReference.get(
        section.directQuote.sourceRef
      );
      if (
        !section.sourceRefs.includes(section.directQuote.sourceRef) ||
        !directQuoteSource ||
        directQuoteSource.captureType !== 'direct_quote' ||
        directQuoteSource.content !== section.directQuote.text
      ) {
        throw invalidOutputError('direct_quote_mismatch');
      }
    }
  }

  return parsedNarrative.data;
}

module.exports = {
  NARRATIVE_JSON_SCHEMA,
  narrativeSchema,
  parseNarrativeOutput,
  validateGroundedNarrative,
};

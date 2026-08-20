'use strict';

const { z } = require('zod');

const draftTypes = ['feedback', 'journal', 'score', 'attendance'];
const journalEntryTypes = [
  'observation',
  'strength',
  'challenge',
  'milestone',
  'student_reflection',
  'support_note',
];
const attendanceStates = ['present', 'absent', 'excused', 'sick', 'late'];

const commonItemFields = {
  studentReference: z.string().trim().min(1).max(120),
  sourceExcerpt: z.string().trim().min(1).max(500),
};

const feedbackItemSchema = z.object({
  ...commonItemFields,
  type: z.literal('feedback'),
  payload: z.object({
    observation: z.string().trim().min(3).max(1500),
    domainAmbiguous: z.boolean(),
  }).strict(),
}).strict();

const journalItemSchema = z.object({
  ...commonItemFields,
  type: z.literal('journal'),
  payload: z.object({
    entryType: z.enum(journalEntryTypes),
    content: z.string().trim().min(3).max(1500),
    domainAmbiguous: z.boolean(),
  }).strict(),
}).strict();

const scoreItemSchema = z.object({
  ...commonItemFields,
  type: z.literal('score'),
  payload: z.object({
    score: z.number().int().min(0).max(100),
    assessmentReference: z.string().trim().min(1).max(160).nullable(),
  }).strict(),
}).strict();

const attendanceItemSchema = z.object({
  ...commonItemFields,
  type: z.literal('attendance'),
  payload: z.object({
    status: z.enum(attendanceStates),
    minutesLate: z.number().int().min(1).max(1440).nullable(),
  }).strict(),
}).strict().superRefine((item, context) => {
  if (item.payload.status !== 'late' && item.payload.minutesLate !== null) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['payload', 'minutesLate'],
      message: 'minutesLate is only valid for explicit lateness',
    });
  }
});

const debriefOutputSchema = z.object({
  items: z.array(z.union([
    feedbackItemSchema,
    journalItemSchema,
    scoreItemSchema,
    attendanceItemSchema,
  ])).max(20),
}).strict();

function stringProperty(minLength, maxLength) {
  return { type: 'string', minLength, maxLength };
}

function objectSchema(required, properties) {
  return {
    type: 'object',
    additionalProperties: false,
    required,
    properties,
  };
}

function itemJsonSchema(type, payloadSchema) {
  return objectSchema(
    ['studentReference', 'type', 'sourceExcerpt', 'payload'],
    {
      studentReference: stringProperty(1, 120),
      type: { type: 'string', enum: [type] },
      sourceExcerpt: stringProperty(1, 500),
      payload: payloadSchema,
    }
  );
}

const CLASSROOM_DEBRIEF_JSON_SCHEMA = objectSchema(['items'], {
  items: {
    type: 'array',
    maxItems: 20,
    items: {
      anyOf: [
        itemJsonSchema('feedback', objectSchema(
          ['observation', 'domainAmbiguous'],
          {
            observation: stringProperty(3, 1500),
            domainAmbiguous: { type: 'boolean' },
          }
        )),
        itemJsonSchema('journal', objectSchema(
          ['entryType', 'content', 'domainAmbiguous'],
          {
            entryType: { type: 'string', enum: journalEntryTypes },
            content: stringProperty(3, 1500),
            domainAmbiguous: { type: 'boolean' },
          }
        )),
        itemJsonSchema('score', objectSchema(
          ['score', 'assessmentReference'],
          {
            score: { type: 'integer', minimum: 0, maximum: 100 },
            assessmentReference: {
              anyOf: [stringProperty(1, 160), { type: 'null' }],
            },
          }
        )),
        itemJsonSchema('attendance', objectSchema(
          ['status', 'minutesLate'],
          {
            status: { type: 'string', enum: attendanceStates },
            minutesLate: {
              anyOf: [
                { type: 'integer', minimum: 1, maximum: 1440 },
                { type: 'null' },
              ],
            },
          }
        )),
      ],
    },
  },
});

const forbiddenPayloadPatterns = [
  /\bdiagnos(?:is|e|ed)\b/i,
  /\bmendiagnosis\b/i,
  /\bADHD\b/i,
  /\bautis(?:me|tic)?\b/i,
  /\bdepresi(?:on)?\b/i,
  /\bgangguan mental\b/i,
  /\blearning disabilit(?:y|ies)\b/i,
  /\brisk score\b/i,
  /\bskor risiko\b/i,
  /\bprofil(?:ing)? siswa\b/i,
];

function classroomDebriefError(name) {
  return { name, code: name };
}

function extractNumbers(value) {
  return (String(value).match(/-?\d+(?:[.,]\d+)?/g) || [])
    .map((number) => Number(number.replace(',', '.')))
    .filter(Number.isFinite);
}

function payloadText(item) {
  if (item.type === 'feedback') return item.payload.observation;
  if (item.type === 'journal') return item.payload.content;
  return '';
}

function normalizeGroundingText(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('id-ID')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function parseDebriefOutput(outputText, debriefText) {
  let parsedOutput;
  try {
    parsedOutput = JSON.parse(outputText);
  } catch (error) {
    throw classroomDebriefError('classroom_debrief_invalid_output');
  }

  const validationResult = debriefOutputSchema.safeParse(parsedOutput);
  if (!validationResult.success) {
    throw classroomDebriefError('classroom_debrief_invalid_output');
  }

  for (const item of validationResult.data.items) {
    if (!debriefText.includes(item.sourceExcerpt)) {
      throw classroomDebriefError('classroom_debrief_invalid_output');
    }

    const normalizedExcerpt = normalizeGroundingText(item.sourceExcerpt);
    const normalizedStudentReference = normalizeGroundingText(
      item.studentReference
    );
    if (
      !normalizedStudentReference ||
      !normalizedExcerpt.includes(normalizedStudentReference)
    ) {
      throw classroomDebriefError('classroom_debrief_invalid_output');
    }

    if (forbiddenPayloadPatterns.some((pattern) => pattern.test(payloadText(item)))) {
      throw classroomDebriefError('classroom_debrief_invalid_output');
    }

    const sourceNumbers = extractNumbers(item.sourceExcerpt);
    if (
      item.type === 'score' &&
      !sourceNumbers.some((number) => number === item.payload.score)
    ) {
      throw classroomDebriefError('classroom_debrief_invalid_output');
    }
    if (
      item.type === 'score' &&
      item.payload.assessmentReference !== null &&
      (
        !normalizeGroundingText(item.payload.assessmentReference) ||
        !normalizedExcerpt.includes(
          normalizeGroundingText(item.payload.assessmentReference)
        )
      )
    ) {
      throw classroomDebriefError('classroom_debrief_invalid_output');
    }
    if (
      item.type === 'attendance' &&
      item.payload.minutesLate !== null &&
      !sourceNumbers.some((number) => number === item.payload.minutesLate)
    ) {
      throw classroomDebriefError('classroom_debrief_invalid_output');
    }
  }

  return validationResult.data;
}

module.exports = {
  CLASSROOM_DEBRIEF_JSON_SCHEMA,
  attendanceStates,
  classroomDebriefError,
  debriefOutputSchema,
  draftTypes,
  journalEntryTypes,
  parseDebriefOutput,
};

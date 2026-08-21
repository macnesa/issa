'use strict';

const { z } = require('zod');
const {
  classroomDebriefError,
  journalEntryTypes,
} = require('./classroom-debrief.contract');

const clientMutationIdSchema = z.string().trim().min(1).max(128);
const draftIdSchema = z.string().trim().min(1).max(128);
const sourceExcerptSchema = z.string().trim().min(1).max(500);
const observedAtSchema = z.string().trim().min(1).max(40);
const positiveIdSchema = z.number().int().positive().safe();

const commonFields = {
  clientMutationId: clientMutationIdSchema,
  draftId: draftIdSchema,
  sourceExcerpt: sourceExcerptSchema,
  studentId: positiveIdSchema,
};

const feedbackConfirmationSchema = z.object({
  ...commonFields,
  recordType: z.literal('feedback'),
  payload: z.object({
    content: z.string().trim().min(1).max(5000),
    observedAt: observedAtSchema,
  }).strict(),
}).strict();

const journalConfirmationSchema = z.object({
  ...commonFields,
  recordType: z.literal('journal'),
  payload: z.object({
    content: z.string().trim().min(3).max(1500),
    observedAt: observedAtSchema,
    type: z.enum(journalEntryTypes),
    voiceCaptureType: z.enum(['direct_quote', 'paraphrased']).nullable(),
  }).strict(),
}).strict();

const scoreConfirmationSchema = z.object({
  ...commonFields,
  recordType: z.literal('score'),
  payload: z.object({
    assignmentId: positiveIdSchema,
    description: z.string().trim().max(500).optional(),
    lessonId: positiveIdSchema,
    recordedAt: observedAtSchema.optional(),
    value: z.number().int().min(0).max(100),
  }).strict(),
}).strict();

const attendanceConfirmationSchema = z.object({
  ...commonFields,
  recordType: z.literal('attendance'),
  payload: z.object({
    attendanceDate: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/),
    status: z.enum(['Hadir', 'Sakit', 'Alfa', 'Izin']),
  }).strict(),
}).strict();

const confirmationItemSchema = z.discriminatedUnion('recordType', [
  feedbackConfirmationSchema,
  journalConfirmationSchema,
  scoreConfirmationSchema,
  attendanceConfirmationSchema,
]);

function validateConfirmationRequest(requestBody) {
  if (
    !requestBody ||
    typeof requestBody !== 'object' ||
    Array.isArray(requestBody) ||
    Object.keys(requestBody).some((key) => key !== 'items') ||
    !Array.isArray(requestBody.items) ||
    requestBody.items.length < 1 ||
    requestBody.items.length > 20
  ) {
    throw classroomDebriefError(
      'invalid_classroom_debrief_confirmation'
    );
  }

  return requestBody.items;
}

function validateConfirmationItem(item) {
  const validationResult = confirmationItemSchema.safeParse(item);
  if (!validationResult.success) {
    throw classroomDebriefError('invalid_classroom_debrief_draft');
  }
  return validationResult.data;
}

module.exports = {
  confirmationItemSchema,
  validateConfirmationItem,
  validateConfirmationRequest,
};

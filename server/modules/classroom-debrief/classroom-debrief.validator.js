'use strict';

const { z } = require('zod');
const {
  classroomDebriefError,
} = require('./classroom-debrief.contract');

const MAXIMUM_DEBRIEF_CHARACTERS = 4000;
const MAXIMUM_REQUEST_BYTES = 8 * 1024;

const requestBodySchema = z.object({
  text: z.string().trim().min(3).max(MAXIMUM_DEBRIEF_CHARACTERS),
  lessonId: z.number().int().positive().safe().optional(),
}).strict();

function validateClassroomDebriefRequest({ requester, requestBody }) {
  if (
    !requester ||
    requester.role !== 'teacher' ||
    !Number.isSafeInteger(Number(requester.teacherId)) ||
    !Number.isSafeInteger(Number(requester.classId))
  ) {
    throw { name: 'unAuthentication' };
  }

  const validationResult = requestBodySchema.safeParse(requestBody);
  if (!validationResult.success) {
    throw classroomDebriefError('invalid_classroom_debrief_request');
  }

  return validationResult.data;
}

function enforceClassroomDebriefRequestSize(req, res, next) {
  const contentLength = Number(req.headers['content-length'] || 0);
  let parsedBodyBytes;
  try {
    parsedBodyBytes = Buffer.byteLength(JSON.stringify(req.body || {}), 'utf8');
  } catch (error) {
    return next(classroomDebriefError('invalid_classroom_debrief_request'));
  }

  if (
    (Number.isFinite(contentLength) && contentLength > MAXIMUM_REQUEST_BYTES) ||
    parsedBodyBytes > MAXIMUM_REQUEST_BYTES
  ) {
    return next(classroomDebriefError('invalid_classroom_debrief_request'));
  }

  return next();
}

module.exports = {
  MAXIMUM_DEBRIEF_CHARACTERS,
  MAXIMUM_REQUEST_BYTES,
  enforceClassroomDebriefRequestSize,
  requestBodySchema,
  validateClassroomDebriefRequest,
};

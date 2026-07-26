const crypto = require('crypto');

function hasOwn(value, fieldName) {
  return Object.prototype.hasOwnProperty.call(value, fieldName);
}

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : value;
}

function normalizeInteger(value) {
  if (Number.isSafeInteger(value)) return value;
  if (typeof value === 'string' && /^[1-9]\d*$/.test(value.trim())) {
    const parsedValue = Number(value.trim());
    if (Number.isSafeInteger(parsedValue)) return parsedValue;
  }
  return value;
}

function normalizeDate(value) {
  const normalizedValue = normalizeString(value);
  const timestamp = typeof normalizedValue === 'string'
    ? new Date(normalizedValue).getTime()
    : NaN;
  return Number.isNaN(timestamp)
    ? normalizedValue
    : new Date(timestamp).toISOString();
}

function normalizeKnownPayload(type, payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return payload;
  }

  if (type === 'attendance.update') {
    return {
      attendanceDate: normalizeString(payload.attendanceDate),
      status: normalizeString(payload.status),
      studentId: normalizeInteger(payload.studentId),
    };
  }

  if (type === 'journal.create') {
    const normalizedPayload = {
      content: normalizeString(payload.content),
      observedAt: normalizeDate(payload.observedAt),
      studentId: normalizeInteger(payload.studentId),
      type: normalizeString(payload.type),
      voiceCaptureType: payload.voiceCaptureType ?? null,
    };
    if (hasOwn(payload, 'evidenceId')) {
      normalizedPayload.evidenceId = payload.evidenceId;
    }
    return normalizedPayload;
  }

  return payload;
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== 'object') return value;

  return Object.keys(value)
    .filter((key) => typeof value[key] !== 'undefined')
    .sort()
    .reduce((normalizedValue, key) => {
      normalizedValue[key] = canonicalize(value[key]);
      return normalizedValue;
    }, {});
}

function hashMutationRequest(mutation) {
  const type = normalizeString(mutation?.type);
  const hashInput = canonicalize({
    baseVersion: type === 'attendance.update'
      ? normalizeInteger(mutation?.baseVersion)
      : null,
    payload: normalizeKnownPayload(type, mutation?.payload),
    type,
  });

  return crypto
    .createHash('sha256')
    .update(JSON.stringify(hashInput))
    .digest('hex');
}

module.exports = {
  canonicalize,
  hashMutationRequest,
  normalizeKnownPayload,
};

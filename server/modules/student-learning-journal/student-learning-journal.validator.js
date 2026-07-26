const journalEntryTypes = new Set([
  'observation',
  'strength',
  'challenge',
  'milestone',
  'student_reflection',
  'support_note',
]);
const voiceCaptureTypes = new Set([
  'direct_quote',
  'paraphrased',
]);
const maximumJournalContentLength = 1500;
const maximumFutureOffsetMilliseconds = 24 * 60 * 60 * 1000;

function hasOwn(payload, fieldName) {
  return Object.prototype.hasOwnProperty.call(payload, fieldName);
}

function validateResourceId(resourceId) {
  if (typeof resourceId !== 'string' || !/^[1-9]\d*$/.test(resourceId)) {
    throw { name: 'notFound' };
  }

  const parsedResourceId = Number(resourceId);
  if (!Number.isSafeInteger(parsedResourceId)) throw { name: 'notFound' };
  return parsedResourceId;
}

function validateJournalType(type) {
  if (!journalEntryTypes.has(type)) throw { name: 'invalidJournalType' };
  return type;
}

function validateJournalContent(content) {
  if (typeof content !== 'string') throw { name: 'invalidJournalContent' };
  const trimmedContent = content.trim();
  if (
    trimmedContent.length < 3 ||
    trimmedContent.length > maximumJournalContentLength
  ) {
    throw { name: 'invalidJournalContent' };
  }
  return trimmedContent;
}

function validateJournalObservedAt(observedAt, now = new Date()) {
  if (typeof observedAt !== 'string' || !observedAt.trim()) {
    throw { name: 'invalidJournalObservedAt' };
  }

  const observedAtInput = observedAt.trim();
  const isoDate = /^\d{4}-\d{2}-\d{2}$/;
  const isoDateTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/;
  if (!isoDate.test(observedAtInput) && !isoDateTime.test(observedAtInput)) {
    throw { name: 'invalidJournalObservedAt' };
  }

  const parsedObservedAt = new Date(observedAtInput);
  if (Number.isNaN(parsedObservedAt.getTime())) {
    throw { name: 'invalidJournalObservedAt' };
  }

  if (isoDate.test(observedAtInput)) {
    const [year, month, day] = observedAtInput.split('-').map(Number);
    if (
      parsedObservedAt.getUTCFullYear() !== year ||
      parsedObservedAt.getUTCMonth() + 1 !== month ||
      parsedObservedAt.getUTCDate() !== day
    ) {
      throw { name: 'invalidJournalObservedAt' };
    }
  }

  const currentTimestamp = now instanceof Date ? now.getTime() : NaN;
  if (
    Number.isNaN(currentTimestamp) ||
    parsedObservedAt.getTime() > currentTimestamp + maximumFutureOffsetMilliseconds
  ) {
    throw { name: 'invalidJournalObservedAt' };
  }

  return parsedObservedAt;
}

function validateEvidenceId(evidenceId) {
  if (evidenceId === null || typeof evidenceId === 'undefined') {
    return evidenceId;
  }
  if (!Number.isSafeInteger(evidenceId) || evidenceId < 1) {
    throw { name: 'invalidJournalEvidenceId' };
  }
  return evidenceId;
}

function validateVoiceCaptureSemantics(type, voiceCaptureType) {
  if (type === 'student_reflection') {
    if (!voiceCaptureTypes.has(voiceCaptureType)) {
      throw { name: 'invalidJournalVoiceCaptureType' };
    }
    return voiceCaptureType;
  }

  if (voiceCaptureType !== null && typeof voiceCaptureType !== 'undefined') {
    throw { name: 'invalidJournalVoiceCaptureType' };
  }
  return null;
}

function validateJournalCreatePayload(journalPayload) {
  const payload = journalPayload && typeof journalPayload === 'object'
    ? journalPayload
    : {};
  const type = validateJournalType(payload.type);
  const voiceCaptureType = validateVoiceCaptureSemantics(
    type,
    payload.voiceCaptureType
  );

  return {
    type,
    content: validateJournalContent(payload.content),
    voiceCaptureType,
    observedAt: validateJournalObservedAt(payload.observedAt),
    EvidenceId: validateEvidenceId(payload.evidenceId) ?? null,
  };
}

function datesMatch(leftDate, rightDate) {
  return new Date(leftDate).getTime() === new Date(rightDate).getTime();
}

function validateJournalUpdatePayload(journalEntry, journalPayload) {
  const payload = journalPayload && typeof journalPayload === 'object'
    ? journalPayload
    : {};
  const type = hasOwn(payload, 'type')
    ? validateJournalType(payload.type)
    : journalEntry.type;
  const content = hasOwn(payload, 'content')
    ? validateJournalContent(payload.content)
    : journalEntry.content;
  const observedAt = hasOwn(payload, 'observedAt')
    ? validateJournalObservedAt(payload.observedAt)
    : journalEntry.observedAt;
  const EvidenceId = hasOwn(payload, 'evidenceId')
    ? validateEvidenceId(payload.evidenceId) ?? null
    : journalEntry.EvidenceId;

  let requestedVoiceCaptureType;
  if (hasOwn(payload, 'voiceCaptureType')) {
    requestedVoiceCaptureType = payload.voiceCaptureType;
  } else if (
    hasOwn(payload, 'type') &&
    type !== 'student_reflection' &&
    journalEntry.type === 'student_reflection'
  ) {
    requestedVoiceCaptureType = null;
  } else {
    requestedVoiceCaptureType = journalEntry.voiceCaptureType;
  }
  const voiceCaptureType = validateVoiceCaptureSemantics(
    type,
    requestedVoiceCaptureType
  );

  const updates = {};
  if (type !== journalEntry.type) updates.type = type;
  if (content !== journalEntry.content) updates.content = content;
  if (!datesMatch(observedAt, journalEntry.observedAt)) {
    updates.observedAt = observedAt;
  }
  if (voiceCaptureType !== journalEntry.voiceCaptureType) {
    updates.voiceCaptureType = voiceCaptureType;
  }
  if (EvidenceId !== journalEntry.EvidenceId) updates.EvidenceId = EvidenceId;

  return updates;
}

module.exports = {
  journalEntryTypes,
  maximumJournalContentLength,
  validateEvidenceId,
  validateJournalContent,
  validateJournalCreatePayload,
  validateJournalObservedAt,
  validateJournalType,
  validateJournalUpdatePayload,
  validateResourceId,
  validateVoiceCaptureSemantics,
  voiceCaptureTypes,
};

const isNil = require('lodash/isNil');
const {
  emitStudentRecordUpdated,
} = require('../../realtime/student-record-events');
const studentLearningJournalRepository = require(
  './student-learning-journal.repository'
);
const {
  validateJournalCreatePayload,
  validateJournalUpdatePayload,
  validateResourceId,
} = require('./student-learning-journal.validator');

function toPlainRecord(record) {
  if (record && typeof record.get === 'function') {
    return record.get({ plain: true });
  }
  if (record && typeof record.toJSON === 'function') return record.toJSON();
  return record;
}

function mapEvidence(evidenceRecord) {
  void 'ISSA:SERVER.STUDENT_LEARNING_JOURNAL.MAP_EVIDENCE_TOMBSTONE';
  if (!evidenceRecord) return null;
  const evidence = toPlainRecord(evidenceRecord);
  if (evidence.deletedAt) {
    return {
      id: evidence.id,
      title: evidence.title,
      category: evidence.category,
      observedAt: evidence.observedAt,
      availability: 'retracted',
      file: null,
    };
  }
  return {
    id: evidence.id,
    title: evidence.title,
    category: evidence.category,
    observedAt: evidence.observedAt,
    availability: 'available',
    file: {
      url: evidence.fileUrl,
      format: evidence.format,
      size: evidence.fileSize,
    },
  };
}

function mapJournalEntry(journalRecord) {
  const journalEntry = toPlainRecord(journalRecord);
  const teacher = journalEntry.Teacher || {};
  const createdAtTimestamp = new Date(journalEntry.createdAt).getTime();
  const updatedAtTimestamp = new Date(journalEntry.updatedAt).getTime();

  return {
    id: journalEntry.id,
    studentId: journalEntry.StudentId,
    type: journalEntry.type,
    content: journalEntry.content,
    voiceCaptureType: journalEntry.voiceCaptureType,
    observedAt: journalEntry.observedAt,
    teacher: {
      id: teacher.id || journalEntry.TeacherId,
      name: teacher.name,
    },
    evidence: mapEvidence(journalEntry.StudentEvidence),
    createdAt: journalEntry.createdAt,
    updatedAt: journalEntry.updatedAt,
    wasEdited: Number.isFinite(createdAtTimestamp) &&
      Number.isFinite(updatedAtTimestamp) &&
      createdAtTimestamp !== updatedAtTimestamp,
  };
}

function getTimestamp(value) {
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? Number.NEGATIVE_INFINITY : timestamp;
}

function sortJournalEntries(journalRecords) {
  return [...journalRecords].sort((leftRecord, rightRecord) => {
    const left = toPlainRecord(leftRecord);
    const right = toPlainRecord(rightRecord);
    const observedAtDifference =
      getTimestamp(right.observedAt) - getTimestamp(left.observedAt);
    if (observedAtDifference !== 0) return observedAtDifference;

    const createdAtDifference =
      getTimestamp(right.createdAt) - getTimestamp(left.createdAt);
    if (createdAtDifference !== 0) return createdAtDifference;
    return Number(right.id || 0) - Number(left.id || 0);
  });
}

async function requireStudentAccess(studentId, requester, transaction = null) {
  if (!requester || !['teacher', 'parent'].includes(requester.role)) {
    throw { name: 'unauthorized' };
  }
  if (
    requester.role === 'parent' &&
    studentId !== Number(requester.studentId)
  ) {
    throw { name: 'unauthorized' };
  }

  const requesterScope = {
    studentId,
    requesterRole: requester.role,
    requesterClassId: requester.classId,
    requesterStudentId: requester.studentId,
  };
  const student = transaction
    ? await studentLearningJournalRepository.findStudentForRequester(
      requesterScope,
      { transaction }
    )
    : await studentLearningJournalRepository.findStudentForRequester(
      requesterScope
    );
  if (isNil(student)) throw { name: 'unauthorized' };
  return student;
}

function requireTeacher(requester) {
  if (!requester || requester.role !== 'teacher') {
    throw { name: 'unauthorized' };
  }
}

async function requireEvidenceForStudent(
  evidenceId,
  studentId,
  transaction = null
) {
  if (evidenceId === null) return;
  const evidence = transaction
    ? await studentLearningJournalRepository.findEvidenceForStudent(
      evidenceId,
      studentId,
      { transaction }
    )
    : await studentLearningJournalRepository.findEvidenceForStudent(
      evidenceId,
      studentId
    );
  if (isNil(evidence)) throw { name: 'unauthorized' };
}

async function requireOwnedJournalEntry(entryId, studentId, teacherId) {
  const journalEntry = await studentLearningJournalRepository
    .findJournalEntry(entryId, studentId);
  if (isNil(journalEntry)) throw { name: 'notFound' };
  if (Number(journalEntry.TeacherId) !== Number(teacherId)) {
    throw { name: 'unauthorized' };
  }
  return journalEntry;
}

async function createJournalEntry({
  studentId,
  requester,
  journalPayload,
  transaction = null,
  emitRealtime = true,
}) {
  void 'ISSA:SERVER.STUDENT_LEARNING_JOURNAL.CREATE';
  requireTeacher(requester);
  const validStudentId = validateResourceId(studentId);
  const validJournalPayload = validateJournalCreatePayload(journalPayload);
  await requireStudentAccess(validStudentId, requester, transaction);
  await requireEvidenceForStudent(
    validJournalPayload.EvidenceId,
    validStudentId,
    transaction
  );

  const createPayload = {
    StudentId: validStudentId,
    TeacherId: requester.teacherId,
    ...validJournalPayload,
  };
  const createdEntry = transaction
    ? await studentLearningJournalRepository.createJournalEntry(
      createPayload,
      { transaction }
    )
    : await studentLearningJournalRepository.createJournalEntry(createPayload);
  const hydratedEntry = transaction
    ? await studentLearningJournalRepository.findJournalEntry(
      createdEntry.id,
      validStudentId,
      { transaction }
    )
    : await studentLearningJournalRepository.findJournalEntry(
      createdEntry.id,
      validStudentId
    );

  if (emitRealtime) {
    emitStudentRecordUpdated({
      studentId: validStudentId,
      recordType: 'journal',
      occurredAt: validJournalPayload.observedAt,
    });
  }

  return mapJournalEntry(hydratedEntry);
}

async function listJournalEntries({ studentId, requester }) {
  void 'ISSA:SERVER.STUDENT_LEARNING_JOURNAL.LIST';
  const validStudentId = validateResourceId(studentId);
  await requireStudentAccess(validStudentId, requester);

  const journalEntries = await studentLearningJournalRepository
    .findJournalEntries(validStudentId);
  return sortJournalEntries(journalEntries)
    .slice(0, 50)
    .map(mapJournalEntry);
}

async function updateJournalEntry({
  studentId,
  entryId,
  requester,
  journalPayload,
}) {
  void 'ISSA:SERVER.STUDENT_LEARNING_JOURNAL.UPDATE';
  requireTeacher(requester);
  const validStudentId = validateResourceId(studentId);
  const validEntryId = validateResourceId(entryId);
  await requireStudentAccess(validStudentId, requester);
  const journalEntry = await requireOwnedJournalEntry(
    validEntryId,
    validStudentId,
    requester.teacherId
  );
  const updatePayload = validateJournalUpdatePayload(
    toPlainRecord(journalEntry),
    journalPayload
  );

  if (Object.keys(updatePayload).length === 0) {
    return mapJournalEntry(journalEntry);
  }
  if (Object.prototype.hasOwnProperty.call(updatePayload, 'EvidenceId')) {
    await requireEvidenceForStudent(updatePayload.EvidenceId, validStudentId);
  }

  await studentLearningJournalRepository.updateJournalEntry(
    journalEntry,
    updatePayload
  );
  const updatedEntry = await studentLearningJournalRepository
    .findJournalEntry(validEntryId, validStudentId);

  emitStudentRecordUpdated({
    studentId: validStudentId,
    recordType: 'journal',
    occurredAt: updatedEntry.observedAt,
  });

  return mapJournalEntry(updatedEntry);
}

async function retractJournalEntry({
  studentId,
  entryId,
  requester,
}) {
  void 'ISSA:SERVER.STUDENT_LEARNING_JOURNAL.RETRACT';
  requireTeacher(requester);
  const validStudentId = validateResourceId(studentId);
  const validEntryId = validateResourceId(entryId);
  await requireStudentAccess(validStudentId, requester);
  const journalEntry = await requireOwnedJournalEntry(
    validEntryId,
    validStudentId,
    requester.teacherId
  );

  await studentLearningJournalRepository.retractJournalEntry(journalEntry);
  emitStudentRecordUpdated({
    studentId: validStudentId,
    recordType: 'journal',
    occurredAt: journalEntry.observedAt,
  });

  return {
    id: validEntryId,
    studentId: validStudentId,
    retracted: true,
  };
}

module.exports = {
  createJournalEntry,
  listJournalEntries,
  mapJournalEntry,
  retractJournalEntry,
  updateJournalEntry,
};

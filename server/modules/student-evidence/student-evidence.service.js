const isNil = require('lodash/isNil');
const cloudinaryIntegration = require('../../integrations/cloudinary');
const {
  emitStudentRecordUpdated,
} = require('../../realtime/student-record-events');
const studentEvidenceRepository = require('./student-evidence.repository');
const {
  validateCloudinaryImage,
  validateEvidenceFile,
  validateEvidenceMetadata,
  validateEvidencePatchPayload,
  validateEvidenceRetractionReason,
  validateStudentId,
} = require('./student-evidence.validator');

function toPlainRecord(record) {
  if (record && typeof record.get === 'function') {
    return record.get({ plain: true });
  }
  if (record && typeof record.toJSON === 'function') return record.toJSON();
  return record;
}

function mapStudentEvidence(evidenceRecord, teacherOverride) {
  const evidence = toPlainRecord(evidenceRecord);
  const teacher = teacherOverride || evidence.Teacher || {};

  return {
    id: evidence.id,
    studentId: evidence.StudentId,
    teacher: {
      id: teacher.id || evidence.TeacherId,
      name: teacher.name,
    },
    title: evidence.title,
    category: evidence.category,
    description: evidence.description,
    observedAt: evidence.observedAt,
    file: {
      url: evidence.fileUrl,
      format: evidence.format,
      size: evidence.fileSize,
    },
    createdAt: evidence.createdAt,
  };
}

function getTimestamp(value) {
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? Number.NEGATIVE_INFINITY : timestamp;
}

function sortStudentEvidences(evidenceRecords) {
  return [...evidenceRecords].sort((leftRecord, rightRecord) => {
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

async function cleanupUploadedImage(cloudinaryPublicId) {
  if (!cloudinaryPublicId) return false;

  try {
    return await cloudinaryIntegration.deleteStudentEvidenceImage(
      cloudinaryPublicId
    );
  } catch (error) {
    return false;
  }
}

async function createStudentEvidence({
  studentId,
  requester,
  metadata,
  file,
}) {
  void 'ISSA:SERVER.STUDENT_EVIDENCE.CREATE';
  if (!requester || requester.role !== 'teacher') {
    throw { name: 'unauthorized' };
  }

  const validStudentId = validateStudentId(studentId);
  const validMetadata = validateEvidenceMetadata(metadata);
  const student = await studentEvidenceRepository.findStudentInClass(
    validStudentId,
    requester.classId
  );
  if (isNil(student)) throw { name: 'unauthorized' };

  const validFile = validateEvidenceFile(file);
  const uploadResult = await cloudinaryIntegration.uploadStudentEvidenceImage({
    studentId: validStudentId,
    fileBuffer: validFile.buffer,
  });

  let uploadedImage;
  try {
    uploadedImage = validateCloudinaryImage(uploadResult, validFile.mimetype);
  } catch (validationError) {
    await cleanupUploadedImage(uploadResult?.public_id);
    throw validationError;
  }

  let createdEvidence;
  try {
    createdEvidence = await studentEvidenceRepository.createStudentEvidence({
      StudentId: validStudentId,
      TeacherId: requester.teacherId,
      ...validMetadata,
      ...uploadedImage,
    });
  } catch (databaseError) {
    await cleanupUploadedImage(uploadedImage.cloudinaryPublicId);
    throw databaseError;
  }

  emitStudentRecordUpdated({
    studentId: validStudentId,
    recordType: 'evidence',
    occurredAt: validMetadata.observedAt,
  });

  const teacher = toPlainRecord(student)?.Class?.Teacher;
  return mapStudentEvidence(createdEvidence, teacher);
}

function requireTeacher(requester) {
  if (!requester || requester.role !== 'teacher') {
    throw { name: 'unauthorized' };
  }
}

async function requireStudentInTeacherClass(studentId, requester) {
  const student = await studentEvidenceRepository.findStudentInClass(
    studentId,
    requester.classId
  );
  if (isNil(student)) throw { name: 'unauthorized' };
  return student;
}

async function requireOwnedActiveEvidence(evidenceId, studentId, teacherId) {
  const evidence = await studentEvidenceRepository.findActiveStudentEvidence(
    evidenceId,
    studentId
  );
  if (isNil(evidence)) throw { name: 'notFound' };
  if (Number(evidence.TeacherId) !== Number(teacherId)) {
    throw { name: 'unauthorized' };
  }
  return evidence;
}

async function correctStudentEvidence({
  studentId,
  evidenceId,
  requester,
  patchPayload,
}) {
  void 'ISSA:SERVER.STUDENT_EVIDENCE.CORRECT';
  requireTeacher(requester);
  const validStudentId = validateStudentId(studentId);
  const validEvidenceId = validateStudentId(evidenceId);
  await requireStudentInTeacherClass(validStudentId, requester);
  const evidence = await requireOwnedActiveEvidence(
    validEvidenceId,
    validStudentId,
    requester.teacherId
  );
  const updates = validateEvidencePatchPayload(
    toPlainRecord(evidence),
    patchPayload
  );

  if (Object.keys(updates).length === 0) {
    return mapStudentEvidence(evidence);
  }

  const updatedEvidence = await studentEvidenceRepository
    .updateStudentEvidence(evidence, updates);
  emitStudentRecordUpdated({
    studentId: validStudentId,
    recordType: 'evidence',
    occurredAt: updatedEvidence.observedAt,
  });

  return mapStudentEvidence(updatedEvidence);
}

async function retractStudentEvidence({
  studentId,
  evidenceId,
  requester,
  reason,
}) {
  void 'ISSA:SERVER.STUDENT_EVIDENCE.RETRACT';
  requireTeacher(requester);
  const validStudentId = validateStudentId(studentId);
  const validEvidenceId = validateStudentId(evidenceId);
  const validReason = validateEvidenceRetractionReason(reason);
  await requireStudentInTeacherClass(validStudentId, requester);
  const evidence = await requireOwnedActiveEvidence(
    validEvidenceId,
    validStudentId,
    requester.teacherId
  );

  await cloudinaryIntegration.destroyStudentEvidenceAsset(
    evidence.cloudinaryPublicId
  );
  await studentEvidenceRepository.retractStudentEvidence(evidence, {
    retractedAt: new Date(),
    retractionReason: validReason,
    RetractedByTeacherId: requester.teacherId,
  });

  emitStudentRecordUpdated({
    studentId: validStudentId,
    recordType: 'evidence',
    occurredAt: evidence.observedAt,
  });

  return {
    id: validEvidenceId,
    studentId: validStudentId,
    retracted: true,
  };
}

async function listStudentEvidences({ studentId, requester }) {
  void 'ISSA:SERVER.STUDENT_EVIDENCE.LIST';
  const validStudentId = validateStudentId(studentId);
  if (!requester || !['teacher', 'parent'].includes(requester.role)) {
    throw { name: 'unauthorized' };
  }
  if (
    requester.role === 'parent' &&
    validStudentId !== Number(requester.studentId)
  ) {
    throw { name: 'unauthorized' };
  }

  const student = await studentEvidenceRepository.findStudentForRequester({
    studentId: validStudentId,
    requesterRole: requester.role,
    requesterClassId: requester.classId,
    requesterStudentId: requester.studentId,
  });
  if (isNil(student)) throw { name: 'unauthorized' };

  const evidenceRecords = await studentEvidenceRepository
    .findStudentEvidences(validStudentId);
  return sortStudentEvidences(evidenceRecords).map((evidence) =>
    mapStudentEvidence(evidence)
  );
}

module.exports = {
  correctStudentEvidence,
  createStudentEvidence,
  listStudentEvidences,
  mapStudentEvidence,
  retractStudentEvidence,
};

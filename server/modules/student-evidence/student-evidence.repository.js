const {
  Class,
  Student,
  StudentEvidence,
  Teacher,
  sequelize,
} = require('../../models');

function findStudentInClass(studentId, classId) {
  return Student.findOne({
    where: {
      id: studentId,
      ClassId: classId,
    },
    attributes: ['id', 'ClassId'],
    include: {
      model: Class,
      attributes: ['id'],
      include: {
        model: Teacher,
        attributes: ['id', 'name'],
      },
    },
  });
}

function findStudentForRequester({
  studentId,
  requesterRole,
  requesterClassId,
  requesterStudentId,
}) {
  if (requesterRole === 'parent' && studentId !== requesterStudentId) {
    return null;
  }

  const studentWhere = { id: studentId };
  if (requesterRole === 'teacher') {
    studentWhere.ClassId = requesterClassId;
  }

  return Student.findOne({
    where: studentWhere,
    attributes: ['id'],
  });
}

function createStudentEvidence(evidencePayload) {
  return StudentEvidence.create(evidencePayload);
}

function findStudentEvidences(studentId) {
  return StudentEvidence.findAll({
    where: { StudentId: studentId },
    attributes: [
      'id',
      'StudentId',
      'TeacherId',
      'title',
      'category',
      'description',
      'observedAt',
      'fileUrl',
      'format',
      'fileSize',
      'createdAt',
    ],
    include: {
      model: Teacher,
      attributes: ['id', 'name'],
      required: true,
    },
    order: [
      ['observedAt', 'DESC'],
      ['createdAt', 'DESC'],
    ],
  });
}

function findActiveStudentEvidence(evidenceId, studentId) {
  return StudentEvidence.findOne({
    where: {
      id: evidenceId,
      StudentId: studentId,
    },
    attributes: [
      'id',
      'StudentId',
      'TeacherId',
      'title',
      'category',
      'description',
      'observedAt',
      'fileUrl',
      'cloudinaryPublicId',
      'format',
      'fileSize',
      'createdAt',
      'updatedAt',
    ],
    include: {
      model: Teacher,
      attributes: ['id', 'name'],
      required: true,
    },
  });
}

function updateStudentEvidence(evidenceRecord, updatePayload) {
  return evidenceRecord.update(updatePayload);
}

function retractStudentEvidence(evidenceRecord, retractionMetadata) {
  return sequelize.transaction(async (transaction) => {
    await evidenceRecord.update(retractionMetadata, { transaction });
    await evidenceRecord.destroy({ transaction });
    return evidenceRecord;
  });
}

module.exports = {
  createStudentEvidence,
  findActiveStudentEvidence,
  findStudentEvidences,
  findStudentForRequester,
  findStudentInClass,
  retractStudentEvidence,
  updateStudentEvidence,
};

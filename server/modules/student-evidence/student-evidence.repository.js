const {
  Class,
  Student,
  StudentEvidence,
  Teacher,
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

module.exports = {
  createStudentEvidence,
  findStudentEvidences,
  findStudentForRequester,
  findStudentInClass,
};

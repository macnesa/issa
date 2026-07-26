const {
  Student,
  StudentEvidence,
  StudentLearningJournal,
  Teacher,
} = require('../../models');

const journalAttributes = [
  'id',
  'StudentId',
  'TeacherId',
  'EvidenceId',
  'type',
  'content',
  'voiceCaptureType',
  'observedAt',
  'createdAt',
  'updatedAt',
];
const journalIncludes = [
  {
    model: Teacher,
    attributes: ['id', 'name'],
    required: true,
  },
  {
    model: StudentEvidence,
    attributes: [
      'id',
      'title',
      'category',
      'observedAt',
      'fileUrl',
      'format',
      'fileSize',
    ],
    required: false,
  },
];

function findStudentForRequester({
  studentId,
  requesterRole,
  requesterClassId,
  requesterStudentId,
}) {
  if (requesterRole === 'parent' && studentId !== requesterStudentId) {
    return null;
  }

  const where = { id: studentId };
  if (requesterRole === 'teacher') where.ClassId = requesterClassId;
  return Student.findOne({
    where,
    attributes: ['id', 'ClassId'],
  });
}

function findEvidenceForStudent(evidenceId, studentId) {
  return StudentEvidence.findOne({
    where: {
      id: evidenceId,
      StudentId: studentId,
    },
    attributes: ['id', 'StudentId'],
  });
}

function createJournalEntry(journalPayload) {
  return StudentLearningJournal.create(journalPayload);
}

function findJournalEntry(entryId, studentId) {
  return StudentLearningJournal.findOne({
    where: {
      id: entryId,
      StudentId: studentId,
    },
    attributes: journalAttributes,
    include: journalIncludes,
  });
}

function findJournalEntries(studentId) {
  return StudentLearningJournal.findAll({
    where: { StudentId: studentId },
    attributes: journalAttributes,
    include: journalIncludes,
    order: [
      ['observedAt', 'DESC'],
      ['createdAt', 'DESC'],
    ],
    limit: 50,
  });
}

function updateJournalEntry(journalEntry, updatePayload) {
  return journalEntry.update(updatePayload);
}

function retractJournalEntry(journalEntry) {
  return journalEntry.destroy();
}

module.exports = {
  createJournalEntry,
  findEvidenceForStudent,
  findJournalEntries,
  findJournalEntry,
  findStudentForRequester,
  retractJournalEntry,
  updateJournalEntry,
};

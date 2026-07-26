const studentEvidenceService = require('./student-evidence.service');

async function createStudentEvidence(req, res, next) {
  try {
    const createdEvidence = await studentEvidenceService.createStudentEvidence({
      studentId: req.params.studentId,
      requester: req.user,
      metadata: { ...req.body },
      file: req.file,
    });

    res.status(201).json(createdEvidence);
  } catch (error) {
    next(error);
  }
}

async function listStudentEvidences(req, res, next) {
  try {
    const evidenceList = await studentEvidenceService.listStudentEvidences({
      studentId: req.params.studentId,
      requester: req.user,
    });

    res.status(200).json(evidenceList);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createStudentEvidence,
  listStudentEvidences,
};

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

async function correctStudentEvidence(req, res, next) {
  try {
    const correctedEvidence = await studentEvidenceService
      .correctStudentEvidence({
        studentId: req.params.studentId,
        evidenceId: req.params.evidenceId,
        requester: req.user,
        patchPayload: req.body,
      });

    res.status(200).json(correctedEvidence);
  } catch (error) {
    next(error);
  }
}

async function retractStudentEvidence(req, res, next) {
  try {
    const retractionResult = await studentEvidenceService
      .retractStudentEvidence({
        studentId: req.params.studentId,
        evidenceId: req.params.evidenceId,
        requester: req.user,
        reason: req.body?.reason,
      });

    res.status(200).json(retractionResult);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  correctStudentEvidence,
  createStudentEvidence,
  listStudentEvidences,
  retractStudentEvidence,
};

const express = require('express');
const {
  authenticateActorRequest,
  authenticateTeacherRequest,
} = require('../../middlewares/authentication');
const {
  requireWritableAccount,
} = require('../../middlewares/public-demo-access');
const studentEvidenceController = require('./student-evidence.controller');
const studentEvidenceUpload = require('./student-evidence.upload');

const router = express.Router();

router.post(
  '/:studentId/evidences',
  authenticateTeacherRequest,
  requireWritableAccount,
  studentEvidenceUpload.single('file'),
  studentEvidenceController.createStudentEvidence
);

router.get(
  '/:studentId/evidences',
  authenticateActorRequest,
  studentEvidenceController.listStudentEvidences
);

router.patch(
  '/:studentId/evidences/:evidenceId',
  authenticateTeacherRequest,
  requireWritableAccount,
  studentEvidenceController.correctStudentEvidence
);

router.delete(
  '/:studentId/evidences/:evidenceId',
  authenticateTeacherRequest,
  requireWritableAccount,
  studentEvidenceController.retractStudentEvidence
);

module.exports = router;

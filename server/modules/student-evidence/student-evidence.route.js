const express = require('express');
const {
  authenticateActorRequest,
  authenticateTeacherRequest,
} = require('../../middlewares/authentication');
const studentEvidenceController = require('./student-evidence.controller');
const studentEvidenceUpload = require('./student-evidence.upload');

const router = express.Router();

router.post(
  '/:studentId/evidences',
  authenticateTeacherRequest,
  studentEvidenceUpload.single('file'),
  studentEvidenceController.createStudentEvidence
);

router.get(
  '/:studentId/evidences',
  authenticateActorRequest,
  studentEvidenceController.listStudentEvidences
);

module.exports = router;

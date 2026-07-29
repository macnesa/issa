const express = require('express');
const {
  authenticateActorRequest,
  authenticateTeacherRequest,
} = require('../../middlewares/authentication');
const {
  requireWritableAccount,
} = require('../../middlewares/public-demo-access');
const studentLearningJournalController = require(
  './student-learning-journal.controller'
);

const router = express.Router();

router.post(
  '/:studentId/journal',
  authenticateTeacherRequest,
  requireWritableAccount,
  studentLearningJournalController.createJournalEntry
);

router.get(
  '/:studentId/journal',
  authenticateActorRequest,
  studentLearningJournalController.listJournalEntries
);

router.patch(
  '/:studentId/journal/:entryId',
  authenticateTeacherRequest,
  requireWritableAccount,
  studentLearningJournalController.updateJournalEntry
);

router.delete(
  '/:studentId/journal/:entryId',
  authenticateTeacherRequest,
  requireWritableAccount,
  studentLearningJournalController.retractJournalEntry
);

module.exports = router;

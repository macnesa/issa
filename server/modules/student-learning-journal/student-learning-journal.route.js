const express = require('express');
const {
  authenticateActorRequest,
  authenticateTeacherRequest,
} = require('../../middlewares/authentication');
const studentLearningJournalController = require(
  './student-learning-journal.controller'
);

const router = express.Router();

router.post(
  '/:studentId/journal',
  authenticateTeacherRequest,
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
  studentLearningJournalController.updateJournalEntry
);

router.delete(
  '/:studentId/journal/:entryId',
  authenticateTeacherRequest,
  studentLearningJournalController.retractJournalEntry
);

module.exports = router;

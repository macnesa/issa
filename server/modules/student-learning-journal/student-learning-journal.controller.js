const studentLearningJournalService = require(
  './student-learning-journal.service'
);

async function createJournalEntry(req, res, next) {
  try {
    const journalEntry = await studentLearningJournalService.createJournalEntry({
      studentId: req.params.studentId,
      requester: req.user,
      journalPayload: req.body,
    });

    res.status(201).json(journalEntry);
  } catch (error) {
    next(error);
  }
}

async function listJournalEntries(req, res, next) {
  try {
    const journalEntries = await studentLearningJournalService
      .listJournalEntries({
        studentId: req.params.studentId,
        requester: req.user,
      });

    res.status(200).json(journalEntries);
  } catch (error) {
    next(error);
  }
}

async function updateJournalEntry(req, res, next) {
  try {
    const journalEntry = await studentLearningJournalService.updateJournalEntry({
      studentId: req.params.studentId,
      entryId: req.params.entryId,
      requester: req.user,
      journalPayload: req.body,
    });

    res.status(200).json(journalEntry);
  } catch (error) {
    next(error);
  }
}

async function retractJournalEntry(req, res, next) {
  try {
    const result = await studentLearningJournalService.retractJournalEntry({
      studentId: req.params.studentId,
      entryId: req.params.entryId,
      requester: req.user,
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createJournalEntry,
  listJournalEntries,
  retractJournalEntry,
  updateJournalEntry,
};

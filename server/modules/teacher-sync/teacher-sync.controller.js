const teacherSyncService = require('./teacher-sync.service');

async function processTeacherSyncBatch(req, res, next) {
  try {
    const syncResult = await teacherSyncService.processTeacherSyncBatch({
      requester: req.user,
      syncPayload: req.body,
    });
    res.status(200).json(syncResult);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  processTeacherSyncBatch,
};

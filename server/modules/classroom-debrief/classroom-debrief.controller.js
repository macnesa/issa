'use strict';

const classroomDebriefService = require('./classroom-debrief.service');
const classroomDebriefConfirmationService = require(
  './classroom-debrief-confirmation.service'
);

function createClassroomDebriefController(
  service = classroomDebriefService,
  confirmationService = classroomDebriefConfirmationService
) {
  async function createDrafts(req, res, next) {
    try {
      const result = await service.createDrafts({
        requester: req.user,
        requestBody: req.body,
      });
      return res.status(200).json({ data: result });
    } catch (error) {
      return next(error);
    }
  }

  async function confirmDrafts(req, res, next) {
    try {
      const result = await confirmationService.confirmDrafts({
        requester: req.user,
        requestBody: req.body,
      });
      return res.status(200).json({ data: result });
    } catch (error) {
      return next(error);
    }
  }

  return { confirmDrafts, createDrafts };
}

module.exports = createClassroomDebriefController();
module.exports.createClassroomDebriefController =
  createClassroomDebriefController;

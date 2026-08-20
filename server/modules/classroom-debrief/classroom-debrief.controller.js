'use strict';

const classroomDebriefService = require('./classroom-debrief.service');

function createClassroomDebriefController(service = classroomDebriefService) {
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

  return { createDrafts };
}

module.exports = createClassroomDebriefController();
module.exports.createClassroomDebriefController =
  createClassroomDebriefController;

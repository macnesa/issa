const scheduleService = require('./schedule.service');

async function getClassSchedule(req, res, next) {
  try {
    const scheduleEntries = await scheduleService.getClassSchedule({
      classId: req.user.classId,
    });

    res.status(200).json(scheduleEntries);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getClassSchedule,
};

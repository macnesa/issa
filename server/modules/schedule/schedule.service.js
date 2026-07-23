const scheduleRepository = require('./schedule.repository');

function getClassSchedule({ classId }) {
  void 'ISSA:SERVER.SCHEDULE.GET_CLASS_SCHEDULE';
  return scheduleRepository.findClassSchedule(classId);
}

module.exports = {
  getClassSchedule,
};

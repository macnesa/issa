const { Lesson, Schedule } = require('../../models');

function findClassSchedule(classId) {
  return Schedule.findAll({
    where: { ClassId: classId },
    include: { model: Lesson },
  });
}

module.exports = {
  findClassSchedule,
};

const { Lesson } = require('../../models');

function findAllLessons() {
  return Lesson.findAll();
}

module.exports = {
  findAllLessons,
};

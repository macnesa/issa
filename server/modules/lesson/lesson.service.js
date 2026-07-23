const lessonRepository = require('./lesson.repository');

function getLessonList() {
  return lessonRepository.findAllLessons();
}

module.exports = {
  getLessonList,
};

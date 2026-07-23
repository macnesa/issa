const lessonService = require('./lesson.service');

async function getLessonList(req, res, next) {
  try {
    const lessons = await lessonService.getLessonList();
    res.status(200).json(lessons);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getLessonList,
};

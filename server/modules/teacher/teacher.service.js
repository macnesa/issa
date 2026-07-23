const teacherRepository = require('./teacher.repository');

function getTeacherList() {
  return teacherRepository.findPublicTeacherList();
}

module.exports = {
  getTeacherList,
};

const { Class, Teacher } = require('../../models');

function findTeacherByNip(teacherNip) {
  return Teacher.findOne({
    where: { NIP: teacherNip },
  });
}

function findClassByTeacherId(teacherId) {
  return Class.findOne({
    where: { TeacherId: teacherId },
  });
}

function findPublicTeacherList() {
  return Teacher.findAll({
    attributes: { exclude: ['password'] },
  });
}

module.exports = {
  findClassByTeacherId,
  findPublicTeacherList,
  findTeacherByNip,
};

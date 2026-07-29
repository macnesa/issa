const { Class, Teacher } = require('../../models');

function findTeacherByNip(teacherNip) {
  return Teacher.findOne({
    where: { NIP: teacherNip },
  });
}

function findTeacherById(teacherId) {
  return Teacher.findByPk(teacherId, {
    attributes: { exclude: ['password'] },
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
  findTeacherById,
  findTeacherByNip,
};

const {
  Activity,
  Assignment,
  Attendance,
  Class,
  Lesson,
  Schedule,
  Score,
  Student,
  Teacher,
} = require('../../models');

function findClassmatesForParentClass(classId) {
  return Student.findAll({
    where: { ClassId: classId },
    include: [
      {
        model: Score,
        attributes: { exclude: ['createdAt', 'updatedAt'] },
        include: {
          model: Lesson,
          attributes: { exclude: ['createdAt', 'updatedAt'] },
        },
      },
    ],
  });
}

function findStudentForAuthenticatedParent(studentId) {
  return Student.findOne({
    where: { id: studentId },
    include: [
      {
        model: Class,
        include: {
          model: Teacher,
          attributes: { exclude: ['password', 'createdAt', 'updatedAt'] },
        },
      },
      {
        model: Attendance,
      },
      {
        model: Score,
        include: [
          {
            model: Assignment,
            attributes: { exclude: ['createdAt', 'updatedAt'] },
          },
          {
            model: Lesson,
            attributes: { exclude: ['createdAt', 'updatedAt'] },
          },
        ],
      },
    ],
  });
}

function findScheduleForParentClass(classId) {
  return Schedule.findAll({
    where: { ClassId: classId },
    include: {
      model: Lesson,
    },
  });
}

function findSchoolActivities() {
  return Activity.findAll();
}

module.exports = {
  findClassmatesForParentClass,
  findScheduleForParentClass,
  findSchoolActivities,
  findStudentForAuthenticatedParent,
};

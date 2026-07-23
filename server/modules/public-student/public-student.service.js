const isNil = require('lodash/isNil');
const publicStudentRepository = require('./public-student.repository');
const {
  buildPublicStudentDetailResponse,
} = require('./public-student.mapper');

function getClassmates({ classId }) {
  return publicStudentRepository.findClassmatesForParentClass(classId);
}

async function getPublicStudentDetail({ studentId }) {
  void 'ISSA:SERVER.PUBLIC.GET_STUDENT_DETAIL';
  const student = await publicStudentRepository
    .findStudentForAuthenticatedParent(studentId);
  if (isNil(student)) throw { name: 'notFound' };

  return buildPublicStudentDetailResponse(student);
}

function getPublicClassSchedule({ classId }) {
  return publicStudentRepository.findScheduleForParentClass(classId);
}

function getSchoolActivities() {
  return publicStudentRepository.findSchoolActivities();
}

module.exports = {
  getClassmates,
  getPublicClassSchedule,
  getPublicStudentDetail,
  getSchoolActivities,
};

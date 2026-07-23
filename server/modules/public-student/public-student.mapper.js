function buildPublicTeacherResponse(teacher) {
  if (!teacher || typeof teacher !== 'object') return teacher;

  const {
    password,
    createdAt,
    updatedAt,
    ...publicTeacherData
  } = teacher;

  return publicTeacherData;
}

function buildPublicClassResponse(classroom) {
  if (!classroom || typeof classroom !== 'object') return classroom;

  return {
    ...classroom,
    Teacher: buildPublicTeacherResponse(classroom.Teacher),
  };
}

function buildPublicStudentDetailResponse(student) {
  const studentData = typeof student.toJSON === 'function'
    ? student.toJSON()
    : { ...student };
  const {
    password,
    access_token,
    accessToken,
    token,
    session,
    User,
    Histories,
    ...publicStudentData
  } = studentData;

  return {
    ...publicStudentData,
    Class: buildPublicClassResponse(publicStudentData.Class),
    Attendances: Array.isArray(publicStudentData.Attendances)
      ? publicStudentData.Attendances
      : [],
    Scores: Array.isArray(publicStudentData.Scores)
      ? publicStudentData.Scores
      : [],
  };
}

module.exports = {
  buildPublicStudentDetailResponse,
};

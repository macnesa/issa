function validateStudentCreatePayload(studentPayload) {
  const {
    NIM,
    name,
    age,
    gender,
    birthDate,
    feedback,
    imgUrl,
  } = studentPayload;

  return {
    NIM,
    name,
    age,
    gender,
    birthDate,
    feedback,
    imgUrl,
  };
}

module.exports = {
  validateStudentCreatePayload,
};

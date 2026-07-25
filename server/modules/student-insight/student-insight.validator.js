function validateStudentId(studentId) {
  if (typeof studentId !== 'string' || !/^[1-9]\d*$/.test(studentId)) {
    throw { name: 'notFound' };
  }

  const parsedStudentId = Number(studentId);
  if (!Number.isSafeInteger(parsedStudentId)) throw { name: 'notFound' };

  return parsedStudentId;
}

module.exports = {
  validateStudentId,
};

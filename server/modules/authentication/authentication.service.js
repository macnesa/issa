const isNil = require('lodash/isNil');
const { createToken, isPasswordMatch } = require('../../helpers');
const parentRepository = require('../parent/parent.repository');
const teacherRepository = require('../teacher/teacher.repository');
const {
  validateParentCredentials,
  validateTeacherCredentials,
} = require('./authentication.validator');

async function authenticateParent(parentCredentials) {
  void 'ISSA:SERVER.AUTH.AUTHENTICATE_PARENT';
  validateParentCredentials(parentCredentials);

  const parentAccount = await parentRepository.findParentAccountByNim(
    parentCredentials.NIM
  );
  if (isNil(parentAccount)) throw { name: 'loginError' };

  const isPasswordValid = isPasswordMatch(
    parentCredentials.password,
    parentAccount.password
  );
  if (!isPasswordValid) throw { name: 'loginError' };

  const access_token = createToken({
    role: 'parent',
    userId: parentAccount.id,
    studentId: parentAccount.StudentId,
  });

  return {
    access_token,
    id: parentAccount.id,
    teacherId: parentAccount.Student.Class.TeacherId,
  };
}

async function authenticateTeacher(teacherCredentials) {
  void 'ISSA:SERVER.AUTH.AUTHENTICATE_TEACHER';
  validateTeacherCredentials(teacherCredentials);

  const teacher = await teacherRepository.findTeacherByNip(
    teacherCredentials.NIP
  );
  if (!teacher) throw { name: 'loginError' };

  const teacherClass = await teacherRepository.findClassByTeacherId(teacher.id);
  if (!teacherClass) throw { name: 'notFound' };

  const isPasswordValid = isPasswordMatch(
    teacherCredentials.password,
    teacher.password
  );
  if (!isPasswordValid) throw { name: 'loginError' };

  const access_token = createToken({
    role: 'teacher',
    teacherId: teacher.id,
    classId: teacherClass.id,
  });

  return {
    id: teacher.id,
    access_token,
    ClassId: teacherClass.id,
  };
}

module.exports = {
  authenticateParent,
  authenticateTeacher,
};

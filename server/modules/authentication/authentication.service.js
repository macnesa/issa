const isNil = require('lodash/isNil');
const { createToken, isPasswordMatch } = require('../../helpers');
const parentRepository = require('../parent/parent.repository');
const teacherRepository = require('../teacher/teacher.repository');
const {
  validateParentCredentials,
  validateTeacherCredentials,
} = require('./authentication.validator');
const {
  getPublicDemoConfig,
  isConfiguredDemoIdentity,
  publicDemoAccessMode,
} = require('../../config/public-demo');

function tokenPayloadWithAccessMode(payload, isDemo) {
  if (!isDemo) return payload;
  return {
    ...payload,
    accessMode: publicDemoAccessMode,
  };
}

function authenticationResponseWithAccessMode(response, isDemo) {
  if (!isDemo) return response;
  return {
    ...response,
    demo: true,
    readOnly: true,
  };
}

function isDemoParent(parentId) {
  return isConfiguredDemoIdentity({
    role: 'parent',
    userId: parentId,
  });
}

function isDemoTeacher(teacherId) {
  return isConfiguredDemoIdentity({
    role: 'teacher',
    teacherId,
  });
}

function requireEnabledPublicDemo() {
  const config = getPublicDemoConfig();
  if (!config.enabled) throw { name: 'publicDemoUnavailable' };
  return config;
}

function createParentAuthenticationResponse(parentAccount, isDemo) {
  if (
    !parentAccount?.Student ||
    !parentAccount.Student.Class ||
    !parentAccount.StudentId
  ) {
    throw { name: 'publicDemoConfigurationError' };
  }

  const access_token = createToken(tokenPayloadWithAccessMode({
    role: 'parent',
    userId: parentAccount.id,
    studentId: parentAccount.StudentId,
  }, isDemo));

  return authenticationResponseWithAccessMode({
    access_token,
    id: parentAccount.id,
    teacherId: parentAccount.Student.Class.TeacherId,
  }, isDemo);
}

function createTeacherAuthenticationResponse(teacher, teacherClass, isDemo) {
  if (!teacherClass) {
    if (isDemo) throw { name: 'publicDemoConfigurationError' };
    throw { name: 'notFound' };
  }

  const access_token = createToken(tokenPayloadWithAccessMode({
    role: 'teacher',
    teacherId: teacher.id,
    classId: teacherClass.id,
  }, isDemo));

  return authenticationResponseWithAccessMode({
    id: teacher.id,
    access_token,
    ClassId: teacherClass.id,
  }, isDemo);
}

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

  return createParentAuthenticationResponse(
    parentAccount,
    isDemoParent(parentAccount.id)
  );
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

  return createTeacherAuthenticationResponse(
    teacher,
    teacherClass,
    isDemoTeacher(teacher.id)
  );
}

async function authenticatePublicDemoParent() {
  void 'ISSA:SERVER.AUTH.AUTHENTICATE_PUBLIC_DEMO_PARENT';
  const config = requireEnabledPublicDemo();
  const parentAccount = await parentRepository.findParentAccountById(
    config.parentId
  );
  if (!parentAccount) throw { name: 'publicDemoConfigurationError' };
  return createParentAuthenticationResponse(parentAccount, true);
}

async function authenticatePublicDemoTeacher() {
  void 'ISSA:SERVER.AUTH.AUTHENTICATE_PUBLIC_DEMO_TEACHER';
  const config = requireEnabledPublicDemo();
  const teacher = await teacherRepository.findTeacherById(config.teacherId);
  if (!teacher) throw { name: 'publicDemoConfigurationError' };
  const teacherClass = await teacherRepository.findClassByTeacherId(teacher.id);
  return createTeacherAuthenticationResponse(teacher, teacherClass, true);
}

module.exports = {
  authenticateParent,
  authenticatePublicDemoParent,
  authenticatePublicDemoTeacher,
  authenticateTeacher,
};

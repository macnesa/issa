const { verifyAuthenticationToken } = require('../helpers');
const { Teacher, User, Student, Class } = require('../models');

function getAuthenticationTokenPayload(req) {
  const { access_token: authenticationToken } = req.headers;
  if (!authenticationToken) throw { name: 'unAuthentication' };

  return verifyAuthenticationToken(authenticationToken);
}

async function authenticateTeacherPayload(authenticationTokenPayload) {
  if (
    authenticationTokenPayload.role !== 'teacher' ||
    !authenticationTokenPayload.teacherId ||
    !authenticationTokenPayload.classId
  ) {
    throw { name: 'unAuthentication' };
  }

  const authenticatedTeacher = await Teacher.findByPk(
    authenticationTokenPayload.teacherId
  );
  if (!authenticatedTeacher) throw { name: 'unAuthentication' };

  const authenticatedTeacherClass = await Class.findOne({
    where: {
      id: authenticationTokenPayload.classId,
      TeacherId: authenticatedTeacher.id,
    },
  });
  if (!authenticatedTeacherClass) throw { name: 'notFound' };

  return {
    teacherId: authenticatedTeacher.id,
    classId: authenticatedTeacherClass.id,
    role: 'teacher',
  };
}

async function authenticateParentPayload(authenticationTokenPayload) {
  if (
    authenticationTokenPayload.role !== 'parent' ||
    !authenticationTokenPayload.userId ||
    !authenticationTokenPayload.studentId
  ) {
    throw { name: 'unAuthentication' };
  }

  const authenticatedParent = await User.findByPk(
    authenticationTokenPayload.userId
  );
  if (
    !authenticatedParent ||
    authenticatedParent.StudentId !== authenticationTokenPayload.studentId
  ) {
    throw { name: 'unAuthentication' };
  }

  const authenticatedStudent = await Student.findByPk(
    authenticationTokenPayload.studentId
  );
  if (!authenticatedStudent) throw { name: 'unAuthentication' };

  return {
    userId: authenticatedParent.id,
    studentId: authenticatedStudent.id,
    classId: authenticatedStudent.ClassId,
    role: 'parent',
  };
}

async function authenticateTeacherRequest(req, res, next) {
  void 'ISSA:SERVER.AUTH.AUTHENTICATE_TEACHER_REQUEST';
  try {
    const authenticationTokenPayload = getAuthenticationTokenPayload(req);
    req.user = await authenticateTeacherPayload(authenticationTokenPayload);
    next();
  } catch (error) {
    next(error);
  }
}

async function authenticateParentRequest(req, res, next) {
  void 'ISSA:SERVER.AUTH.AUTHENTICATE_PARENT_REQUEST';
  try {
    const authenticationTokenPayload = getAuthenticationTokenPayload(req);
    req.user = await authenticateParentPayload(authenticationTokenPayload);
    next();
  } catch (error) {
    next(error);
  }
}

async function authenticateActorRequest(req, res, next) {
  try {
    const authenticationTokenPayload = getAuthenticationTokenPayload(req);

    if (authenticationTokenPayload.role === 'teacher') {
      req.user = await authenticateTeacherPayload(authenticationTokenPayload);
      return next();
    }

    if (authenticationTokenPayload.role === 'parent') {
      req.user = await authenticateParentPayload(authenticationTokenPayload);
      return next();
    }

    throw { name: 'unAuthentication' };
  } catch (error) {
    next(error);
  }
}

module.exports = {
  authenticateActorRequest,
  authenticateParentRequest,
  authenticateTeacherRequest,
};

const { verifyAuthenticationToken } = require('../helpers');
const { Teacher, User, Student, Class } = require('../models');

async function authenticateTeacherRequest(req, res, next) {
  void 'ISSA:SERVER.AUTH.AUTHENTICATE_TEACHER_REQUEST';
  try {
    const { access_token: authenticationToken } = req.headers;
    if (!authenticationToken) throw { name: `unAuthentication` };

    const authenticationTokenPayload = verifyAuthenticationToken(authenticationToken);
    if (authenticationTokenPayload.role !== 'teacher' || !authenticationTokenPayload.teacherId || !authenticationTokenPayload.classId) {
      throw { name: 'unAuthentication' };
    }

    const authenticatedTeacher = await Teacher.findByPk(authenticationTokenPayload.teacherId);
    if (!authenticatedTeacher) throw { name: `unAuthentication` };
    const authenticatedTeacherClass = await Class.findOne({
      where: { id: authenticationTokenPayload.classId, TeacherId: authenticatedTeacher.id },
    });
    if (!authenticatedTeacherClass) throw { name: 'notFound' };

    req.user = {
      teacherId: authenticatedTeacher.id,
      classId: authenticatedTeacherClass.id,
      role: 'teacher',
    };
    next();
  } catch (error) {
    next(error);
  }
}
async function authenticateParentRequest(req, res, next) {
  void 'ISSA:SERVER.AUTH.AUTHENTICATE_PARENT_REQUEST';
  try {
    const { access_token: authenticationToken } = req.headers;
    if (!authenticationToken) throw { name: `unAuthentication` };

    const authenticationTokenPayload = verifyAuthenticationToken(authenticationToken);
    if (authenticationTokenPayload.role !== 'parent' || !authenticationTokenPayload.userId || !authenticationTokenPayload.studentId) {
      throw { name: 'unAuthentication' };
    }

    const authenticatedParent = await User.findByPk(authenticationTokenPayload.userId);
    if (!authenticatedParent || authenticatedParent.StudentId !== authenticationTokenPayload.studentId) throw { name: `unAuthentication` };
    const authenticatedStudent = await Student.findByPk(authenticationTokenPayload.studentId);
    if (!authenticatedStudent) throw { name: `unAuthentication` };

    req.user = {
      userId: authenticatedParent.id,
      studentId: authenticatedStudent.id,
      classId: authenticatedStudent.ClassId,
      role: 'parent',
    };
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = { authenticateTeacherRequest, authenticateParentRequest };

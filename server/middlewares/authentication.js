const { decodeToken } = require('../helpers');
const { Teacher, User, Student, Class } = require('../models');

async function teacherAuth(req, res, next) {
  try {
    let { access_token } = req.headers;
    if (!access_token) throw { name: `unAuthentication` };

    let payload = decodeToken(access_token);
    if (payload.role !== 'teacher' || !payload.teacherId || !payload.classId) {
      throw { name: 'unAuthentication' };
    }

    let teacher = await Teacher.findByPk(payload.teacherId);
    if (!teacher) throw { name: `unAuthentication` };
    let teacherClass = await Class.findOne({
      where: { id: payload.classId, TeacherId: teacher.id },
    });
    if (!teacherClass) throw { name: 'notFound' };

    req.user = {
      teacherId: teacher.id,
      classId: teacherClass.id,
      role: 'teacher',
    };
    next();
  } catch (error) {
    next(error);
  }
}
async function userAuth(req, res, next) {
  try {
    let { access_token } = req.headers;
    if (!access_token) throw { name: `unAuthentication` };

    let payload = decodeToken(access_token);
    if (payload.role !== 'parent' || !payload.userId || !payload.studentId) {
      throw { name: 'unAuthentication' };
    }

    let user = await User.findByPk(payload.userId);
    if (!user || user.StudentId !== payload.studentId) throw { name: `unAuthentication` };
    let student = await Student.findByPk(payload.studentId);
    if (!student) throw { name: `unAuthentication` };

    req.user = {
      userId: user.id,
      studentId: student.id,
      classId: student.ClassId,
      role: 'parent',
    };
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = { teacherAuth, userAuth };

const { isPasswordMatch, createToken } = require('../helpers');
const { Teacher, Class, History } = require('../models');

class TeacherController {
  static async authenticateTeacher(req, res, next) {
    void 'ISSA:SERVER.AUTH.AUTHENTICATE_TEACHER';
    try {
      const { NIP, password } = req.body;
      if (!NIP || !password) throw { name: `loginError` };

      const teacher = await Teacher.findOne({ where: { NIP } });
      if (!teacher) {
        throw { name: 'loginError' };
      }

      const teacherClass = await Class.findOne({ where: { TeacherId: teacher.id } });
      if (!teacherClass) throw { name: 'notFound' };

      const isPasswordValid = isPasswordMatch(password, teacher.password);
      if (!isPasswordValid) throw { name: 'loginError' };

      const access_token = createToken({
        role: 'teacher',
        teacherId: teacher.id,
        classId: teacherClass.id,
      });
      res.status(200).json({ id: teacher.id, access_token, ClassId: teacherClass.id });
    } catch (error) {
      next(error);
    }
  }

  static async register(req, res, next) {
    try {
      const teacherClass = await Class.findOne({ where: { TeacherId: req.user.idTeacher }, include: Teacher });

      const { NIP, password, name } = req.body;
      console.log(NIP);
      const data = await Teacher.create({ NIP, password, name });
      const history = await History.create({ description: `Teacher with name ${data.name} has been created`, createdBy: teacherClass.Teacher.name });
      res.status(201).json({ msg: `succesfuly registered`, history });
    } catch (error) {
      next(error);
    }
  }

  static async getTeacherList(req, res, next) {
    try {
      const teachers = await Teacher.findAll({
        attributes: { exclude: ['password'] },
      });

      res.status(200).json(teachers);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = TeacherController;

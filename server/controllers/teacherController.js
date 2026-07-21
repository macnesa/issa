const { compareHash, createToken } = require('../helpers');
const { Teacher, Class, History } = require('../models');

class TeacherController {
  static async login(req, res, next) {
    try {
      const { NIP, password } = req.body;
      if (!NIP || !password) throw { name: `loginError` };

      const data = await Teacher.findOne({ where: { NIP } });
      if (!data) {
        throw { name: 'loginError' };
      }

      const kelas = await Class.findOne({ where: { TeacherId: data.id } });
      if (!kelas) throw { name: 'notFound' };

      const isValid = compareHash(password, data.password);
      if (!isValid) throw { name: 'loginError' };

      const access_token = createToken({
        role: 'teacher',
        teacherId: data.id,
        classId: kelas.id,
      });
      res.status(200).json({ id: data.id, access_token, ClassId: kelas.id });
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

  static async allTeacher(req, res, next) {
    try {
      const data = await Teacher.findAll({
        attributes: { exclude: ['password'] },
      });

      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = TeacherController;

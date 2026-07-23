const { isPasswordMatch, createToken } = require('../helpers');
const { User, Student, Attendance, Score, Lesson, Class, Teacher } = require('../models');
const isNil = require('lodash/isNil');

class UserController {
  static async authenticateParent(req, res, next) {
    void 'ISSA:SERVER.AUTH.AUTHENTICATE_PARENT';
    try {
      const { NIM, password } = req.body;
      if (!NIM || !password) throw { name: `loginError` };

      const parentAccount = await User.findOne({
        where: { NIM },
        include: {
          model: Student,
          include: { model: Class },
        },
      });
      if (isNil(parentAccount)) {
        throw { name: 'loginError' };
      } else {
        const isPasswordValid = isPasswordMatch(password, parentAccount.password);
        if (!isPasswordValid) {
          throw { name: 'loginError' };
        } else {
          const access_token = createToken({
            role: 'parent',
            userId: parentAccount.id,
            studentId: parentAccount.StudentId,
          });
          res.status(200).json({ access_token, id: parentAccount.id, teacherId: parentAccount.Student.Class.TeacherId });
        }
      }
    } catch (error) {
      next(error);
    }
  }

  static async userChild(req, res, next) {
    try {
      const userChild = await Student.findOne({
        where: { NIM: req.user.NIM },
        include: [
          {
            model: Class,
            include: {
              model: Teacher,
              attributes: { exclude: ['password', 'createdAt', 'updatedAt'] },
            },
          },
          {
            model: Attendance,
          },
          {
            model: Score,
            attributes: { exclude: ['createdAt', 'updatedAt'] },
            include: {
              model: Lesson,
              attributes: { exclude: ['createdAt', 'updatedAt'] },
            },
          },
        ],
      });
      res.status(200).json(userChild);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = UserController;

const { Student, Attendance, Transaction, Score, Lesson, Class, Teacher, Assignment, Schedule, Activity, sequelize } = require('../models');

class StudentController {
  static async allStudent(req, res, next) {
    try {
      const data = await Student.findAll({
        where: { ClassId: req.user.classId },
        include: [
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
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }
  static async studentById(req, res, next) {
    try {
      const data = await Student.findOne({
        where: { id: req.user.studentId },
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
            include: [
              { model: Assignment, attributes: { exclude: ['createdAt', 'updatedAt'] } },
              {
                model: Lesson,
                attributes: { exclude: ['createdAt', 'updatedAt'] },
              },
            ],
          },
        ],
      });
      if (!data) {
        throw { name: 'notFound' };
      }
      //   const scoreTask = data.Scores.filter((x) => x.Assignment.type == 'Task').map((y) => {
      //     return y.value * 0.45;
      //   });
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }
  static async studentlessondetail(req, res, next) {
    try {
      const { day } = req.query;
      if (!day) throw { name: `notFound` };
      const data = await Schedule.findAll({ include: { model: Lesson }, where: { day, ClassId: req.user.classId } });
      if (data.length == 0) throw { name: `notFound` };
      res.status(200).json(data);
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
  static async schedules(req, res, next) {
    try {
      const data = await Schedule.findAll({
        where: { ClassId: req.user.classId },
        include: {
          model: Lesson,
        },
      });
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  }
  static async allActivities(req, res, next) {
    try {
      const data = await Activity.findAll();
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }
  static async transactionStatus(req, res, next) {
    try {
      const data = await Transaction.findOne({ where: { StudentId: req.user.id } });
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }

  static async successPayment(req, res, next) {
    try {
      let student = await Student.findOne({ where: { NIM: req.user.NIM } })

      const trasanction = await Transaction.findOne({
        where: {
          StudentId: student.id
        },
        order: [['createdAt', 'DESC']]
      });
      const data = await Transaction.update({ status: true }, {
        where: {
          id: trasanction.id
        }
      })
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  }

  static async statistic(req, res, next) {
    try {
      let query = `
            select l."name" ,avg(s.value)from "Scores" s 
            left join "Lessons" l on s."LessonId" = l.id 
            where "StudentId" = ${req.user.id}
            group by l."name" 
            `;
      let data = await Score.sequelize.query(query);
      res.status(200).json(data[0]);
    } catch (error) {
      next(error);
    }
  }
}
module.exports = StudentController;

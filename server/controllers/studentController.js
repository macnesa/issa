const { Student, Attendance, Score, Lesson, Class, Teacher, Assignment, History, StudentFeedback, sequelize } = require('../models');
const { Sequelize, Op } = require("sequelize");

function normalizeObservedAt(value) {
  if (typeof value !== 'string' || !value.trim()) throw { name: 'invalidObservedAt' };

  const input = value.trim();
  const isoDate = /^\d{4}-\d{2}-\d{2}$/;
  const isoDateTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/;
  if (!isoDate.test(input) && !isoDateTime.test(input)) throw { name: 'invalidObservedAt' };

  const date = new Date(input);
  if (Number.isNaN(date.getTime())) throw { name: 'invalidObservedAt' };

  if (isoDate.test(input)) {
    const [year, month, day] = input.split('-').map(Number);
    if (date.getUTCFullYear() !== year || date.getUTCMonth() + 1 !== month || date.getUTCDate() !== day) {
      throw { name: 'invalidObservedAt' };
    }
  }

  return date;
}

class StudentController {
  static async allStudents(req, res, next) {
    const { pageIndex, name } = req.query;
    const paramQuerySQL = {
      where: { ClassId: req.user.classId },
      include: [
        {
          model: Attendance
        },
        {
          model: Class,
          include: {
            model: Teacher,
            attributes: { exclude: ['password', 'createdAt', 'updatedAt'] },
          },
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
    };
    let limit;
    let offset;
    let pageSize = 7;

    if (name !== "" && typeof name !== "undefined") {
      paramQuerySQL.where.name = { [Op.iLike]: `%${name}%` };
    }


    // pagination
    if (pageSize !== '' && typeof pageSize !== 'undefined') {
      if (pageSize !== '' && typeof pageSize !== 'undefined') {
        limit = pageSize;
        paramQuerySQL.limit = limit;
      }

      if (pageIndex !== '' && typeof pageIndex !== 'undefined') {
        offset = pageIndex * limit - limit;
        paramQuerySQL.offset = offset;
      }
    } else {
      limit = 5 // limit 5 item
      offset = 1;
      paramQuerySQL.limit = limit;
      paramQuerySQL.offset = offset;
    }

    try {

      const data = await Student.findAndCountAll(paramQuerySQL)
      if (pageSize || pageIndex) {
        data.page = pageIndex
        data.totalPages = Math.ceil(data.count / pageSize)
      }
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }
  static async studentById(req, res, next) {
    try {
      const id = req.params.id;
      const data = await Student.findOne({
        where: { id, ClassId: req.user.classId },
        include: [
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
      // const scoreExam = data.Scores.filter((x) => x.Assignment.type == 'Exam').map((y) => {
      //   return y.value * 0.45;
      // });
      // console.log(scoreExam);
      const scoreTask = data.Scores.filter((x) => x.Assignment.type == 'Task').map((y) => {
        return y.value * 0.45;
      });
      console.log(scoreTask);
      // const scoreExam = data.Scores.filter((x) => x.assignmentType == 'Exam').map((y) => {
      //   return y.value * 0.45;
      // });
      // console.log(scoreExam);

      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }
  static async feedbackHistory(req, res, next) {
    try {
      const id = req.params.id;
      const student = await Student.findOne({
        where: { id, ClassId: req.user.classId },
        attributes: ['id'],
      });
      if (!student) throw { name: 'notFound' };

      const data = await StudentFeedback.findAll({
        where: { StudentId: student.id },
        attributes: ['id', 'content', 'observedAt', 'createdAt'],
        include: {
          model: Teacher,
          attributes: ['id', 'name'],
        },
        order: [['observedAt', 'DESC'], ['createdAt', 'DESC']],
      });
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }
  static async addStudent(req, res, next) {
    try {
      const teacherClass = await Class.findByPk(req.user.classId, { include: Teacher });

      const { NIM, name, age, gender, birthDate, feedback, imgUrl } = req.body;
      const data = await Student.create({ NIM, name, age, gender, birthDate, feedback, ClassId: teacherClass.id, imgUrl });
      const history = await History.create({ description: `student with name ${data.name} has been created`, createdBy: teacherClass.Teacher.name })
      res.status(201).json({ data, history });
    } catch (error) {
      next(error);
    }
  }
  static async deleteStudent(req, res, next) {
    return res.status(403).json({ msg: 'Student deletion is disabled for demo' });
  }
  static async editStudent(req, res, next) {
    try {
      const teacherClass = await Class.findByPk(req.user.classId, { include: Teacher });
      const id = req.params.id;
      const check = await Student.findOne({ where: { id, ClassId: req.user.classId } });
      if (!check) throw { name: `notFound` };

      const fields = ['NIM', 'name', 'age', 'gender', 'birthDate', 'imgUrl'];
      const updates = Object.fromEntries(
        fields
          .filter((field) => Object.prototype.hasOwnProperty.call(req.body, field))
          .map((field) => [field, req.body[field]])
      );

      const hasFeedback = Object.prototype.hasOwnProperty.call(req.body, 'feedback');
      let feedback;
      let observedAt;
      if (hasFeedback) {
        feedback = typeof req.body.feedback === 'string' ? req.body.feedback.trim() : '';
        if (!feedback) throw { name: 'invalidFeedback' };
        observedAt = Object.prototype.hasOwnProperty.call(req.body, 'observedAt')
          ? normalizeObservedAt(req.body.observedAt)
          : new Date();
      }

      const { data, history } = await sequelize.transaction(async (transaction) => {
        const feedbackChanged = hasFeedback && feedback !== check.feedback;
        if (feedbackChanged) updates.feedback = feedback;

        const updatedStudent = await check.update(updates, { transaction });
        if (feedbackChanged) {
          await StudentFeedback.create({
            StudentId: check.id,
            TeacherId: req.user.teacherId,
            content: feedback,
            observedAt,
          }, { transaction });
        }

        const updateHistory = await History.create({
          description: `student with name ${check.name} has been edited`,
          createdBy: teacherClass.Teacher.name,
        }, { transaction });

        return { data: updatedStudent, history: updateHistory };
      });

      res.status(200).json({ status: `updated`, data, history });
    } catch (error) {
      next(error);
    }
  }
}
module.exports = StudentController;

const { Student, Attendance, Score, Lesson, Class, Teacher, Assignment, History, StudentFeedback, sequelize } = require('../models');
const { Sequelize, Op } = require("sequelize");
const isEqual = require('lodash/isEqual');
const isNil = require('lodash/isNil');

function validateObservedAt(observedAt) {
  void 'ISSA:SERVER.FEEDBACK.VALIDATE_OBSERVED_AT';
  if (typeof observedAt !== 'string' || !observedAt.trim()) throw { name: 'invalidObservedAt' };

  const observedAtInput = observedAt.trim();
  const isoDate = /^\d{4}-\d{2}-\d{2}$/;
  const isoDateTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/;
  if (!isoDate.test(observedAtInput) && !isoDateTime.test(observedAtInput)) throw { name: 'invalidObservedAt' };

  const parsedObservedAt = new Date(observedAtInput);
  if (Number.isNaN(parsedObservedAt.getTime())) throw { name: 'invalidObservedAt' };

  if (isoDate.test(observedAtInput)) {
    const [year, month, day] = observedAtInput.split('-').map(Number);
    if (parsedObservedAt.getUTCFullYear() !== year || parsedObservedAt.getUTCMonth() + 1 !== month || parsedObservedAt.getUTCDate() !== day) {
      throw { name: 'invalidObservedAt' };
    }
  }

  return parsedObservedAt;
}

class StudentController {
  static async getStudentList(req, res, next) {
    void 'ISSA:SERVER.STUDENT.GET_LIST';
    const { pageIndex, name } = req.query;
    const studentListQuery = {
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

    if (name !== "" && !isNil(name)) {
      studentListQuery.where.name = { [Op.iLike]: `%${name}%` };
    }


    // pagination
    if (pageSize !== '' && typeof pageSize !== 'undefined') {
      if (pageSize !== '' && typeof pageSize !== 'undefined') {
        limit = pageSize;
        studentListQuery.limit = limit;
      }

      if (pageIndex !== '' && typeof pageIndex !== 'undefined') {
        offset = pageIndex * limit - limit;
        studentListQuery.offset = offset;
      }
    } else {
      limit = 5 // limit 5 item
      offset = 1;
      studentListQuery.limit = limit;
      studentListQuery.offset = offset;
    }

    try {

      const studentList = await Student.findAndCountAll(studentListQuery)
      if (pageSize || pageIndex) {
        studentList.page = pageIndex
        studentList.totalPages = Math.ceil(studentList.count / pageSize)
      }
      res.status(200).json(studentList);
    } catch (error) {
      next(error);
    }
  }
  static async getStudentDetail(req, res, next) {
    void 'ISSA:SERVER.STUDENT.GET_DETAIL';
    try {
      const studentId = req.params.id;
      const student = await Student.findOne({
        where: { id: studentId, ClassId: req.user.classId },
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
      if (isNil(student)) {
        throw { name: 'notFound' };
      }
      // const scoreExam = data.Scores.filter((x) => x.Assignment.type == 'Exam').map((y) => {
      //   return y.value * 0.45;
      // });
      // console.log(scoreExam);
      const taskScoreWeights = student.Scores.filter((scoreRecord) => scoreRecord.Assignment.type == 'Task').map((scoreRecord) => {
        return scoreRecord.value * 0.45;
      });
      console.log(taskScoreWeights);
      // const scoreExam = data.Scores.filter((x) => x.assignmentType == 'Exam').map((y) => {
      //   return y.value * 0.45;
      // });
      // console.log(scoreExam);

      res.status(200).json(student);
    } catch (error) {
      next(error);
    }
  }
  static async getStudentFeedbackHistory(req, res, next) {
    void 'ISSA:SERVER.FEEDBACK.GET_HISTORY';
    try {
      const studentId = req.params.id;
      const student = await Student.findOne({
        where: { id: studentId, ClassId: req.user.classId },
        attributes: ['id'],
      });
      if (isNil(student)) throw { name: 'notFound' };

      const feedbackHistory = await StudentFeedback.findAll({
        where: { StudentId: student.id },
        attributes: ['id', 'content', 'observedAt', 'createdAt'],
        include: {
          model: Teacher,
          attributes: ['id', 'name'],
        },
        order: [['observedAt', 'DESC'], ['createdAt', 'DESC']],
      });
      res.status(200).json(feedbackHistory);
    } catch (error) {
      next(error);
    }
  }
  static async createStudent(req, res, next) {
    try {
      const teacherClass = await Class.findByPk(req.user.classId, { include: Teacher });

      const { NIM, name, age, gender, birthDate, feedback, imgUrl } = req.body;
      const student = await Student.create({ NIM, name, age, gender, birthDate, feedback, ClassId: teacherClass.id, imgUrl });
      const history = await History.create({ description: `student with name ${student.name} has been created`, createdBy: teacherClass.Teacher.name })
      res.status(201).json({ data: student, history });
    } catch (error) {
      next(error);
    }
  }
  static async deleteStudent(req, res, next) {
    return res.status(403).json({ msg: 'Student deletion is disabled for demo' });
  }
  static async updateStudent(req, res, next) {
    void 'ISSA:SERVER.FEEDBACK.UPDATE_HISTORY';
    try {
      const teacherClass = await Class.findByPk(req.user.classId, { include: Teacher });
      const studentId = req.params.id;
      const existingStudent = await Student.findOne({ where: { id: studentId, ClassId: req.user.classId } });
      if (isNil(existingStudent)) throw { name: `notFound` };

      const fields = ['NIM', 'name', 'age', 'gender', 'birthDate', 'imgUrl'];
      const studentUpdatePayload = Object.fromEntries(
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
          ? validateObservedAt(req.body.observedAt)
          : new Date();
      }

      const { data, history } = await sequelize.transaction(async (databaseTransaction) => {
        const hasFeedbackChanged = hasFeedback && !isEqual(feedback, existingStudent.feedback);
        if (hasFeedbackChanged) studentUpdatePayload.feedback = feedback;

        const updatedStudent = await existingStudent.update(studentUpdatePayload, { transaction: databaseTransaction });
        if (hasFeedbackChanged) {
          await StudentFeedback.create({
            StudentId: existingStudent.id,
            TeacherId: req.user.teacherId,
            content: feedback,
            observedAt,
          }, { transaction: databaseTransaction });
        }

        const updateHistory = await History.create({
          description: `student with name ${existingStudent.name} has been edited`,
          createdBy: teacherClass.Teacher.name,
        }, { transaction: databaseTransaction });

        return { data: updatedStudent, history: updateHistory };
      });

      res.status(200).json({ status: `updated`, data, history });
    } catch (error) {
      next(error);
    }
  }
}
module.exports = StudentController;

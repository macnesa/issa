const { Student, Attendance, Score, Lesson, Class, Teacher, Assignment, History } = require('../models');
const { Op } = require("sequelize");
const isNil = require('lodash/isNil');

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
}
module.exports = StudentController;

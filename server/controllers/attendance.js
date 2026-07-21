const { Op } = require('sequelize');
const { Attendance, Student, History, Teacher, Class } = require('../models');

const attendanceStatuses = new Set(['Hadir', 'Sakit', 'Alfa', 'Izin']);

function todayRange() {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function validateStatus(status) {
  if (!attendanceStatuses.has(status)) throw { name: 'invalidAttendanceStatus' };
}

class AttendanceController {
  static async allAttendance(req, res, next) {
    try {
      const { StudentId } = req.query;
      const studentWhere = { ClassId: req.user.classId };
      if (StudentId !== '' && typeof StudentId !== 'undefined') studentWhere.id = StudentId;

      const students = await Student.findAll({
        where: studentWhere,
        attributes: ['id'],
      });
      if (StudentId && students.length === 0) throw { name: 'notFound' };

      const data = await Attendance.findAll({
        where: { StudentId: students.map((student) => student.id) },
      });
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }

  static async addAttendance(req, res, next) {
    try {
      const { StudentId, status } = req.body;
      validateStatus(status);

      const student = await Student.findOne({
        where: { id: StudentId, ClassId: req.user.classId },
      });
      if (!student) throw { name: 'notFound' };

      const { start, end } = todayRange();
      const attendance = await Attendance.findOne({
        where: { StudentId, createdAt: { [Op.between]: [start, end] } },
        order: [['createdAt', 'DESC']],
      });
      if (attendance) throw { name: 'attendanceAlreadyExists' };

      const teacherClass = await Class.findByPk(req.user.classId, { include: Teacher });
      const data = await Attendance.create({ StudentId, status });
      await History.create({
        description: `attendance ${student.name} has been created`,
        createdBy: teacherClass.Teacher.name,
      });
      res.status(201).json(data);
    } catch (error) {
      next(error);
    }
  }

  static async editAttendance(req, res, next) {
    try {
      const { StudentId, status } = req.body;
      validateStatus(status);

      const student = await Student.findOne({
        where: { id: StudentId, ClassId: req.user.classId },
      });
      if (!student) throw { name: 'notFound' };

      const { start, end } = todayRange();
      const attendance = await Attendance.findOne({
        where: { StudentId, createdAt: { [Op.between]: [start, end] } },
        order: [['createdAt', 'DESC']],
      });
      if (!attendance) throw { name: 'notFound' };

      const data = await attendance.update({ status });
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AttendanceController;

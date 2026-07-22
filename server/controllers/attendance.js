const { Attendance, Student, History, Teacher, Class } = require('../models');

const attendanceStatuses = new Set(['Hadir', 'Sakit', 'Alfa', 'Izin']);
const defaultTimeZone = 'Asia/Jakarta';

function dateInTimeZone(timeZone) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function currentAttendanceDate() {
  try {
    return dateInTimeZone(process.env.APP_TIMEZONE || defaultTimeZone);
  } catch (error) {
    return dateInTimeZone(defaultTimeZone);
  }
}

function normalizeAttendanceDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw { name: 'invalidAttendanceDate' };
  }

  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    throw { name: 'invalidAttendanceDate' };
  }

  return value;
}

function requestedAttendanceDate(body) {
  if (Object.prototype.hasOwnProperty.call(body, 'attendanceDate')) {
    return normalizeAttendanceDate(body.attendanceDate);
  }

  return currentAttendanceDate();
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

      const attendanceDate = requestedAttendanceDate(req.body);
      const attendance = await Attendance.findOne({
        where: { StudentId, attendanceDate },
      });
      if (attendance) throw { name: 'attendanceAlreadyExists' };

      const teacherClass = await Class.findByPk(req.user.classId, { include: Teacher });
      const data = await Attendance.create({ StudentId, status, attendanceDate });
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

      const attendanceDate = requestedAttendanceDate(req.body);
      const attendance = await Attendance.findOne({
        where: { StudentId, attendanceDate },
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

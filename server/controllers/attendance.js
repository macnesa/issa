const { Attendance, Student, History, Teacher, Class } = require('../models');
const isEmpty = require('lodash/isEmpty');
const isNil = require('lodash/isNil');

const attendanceStatuses = new Set(['Hadir', 'Sakit', 'Alfa', 'Izin']);
const defaultTimeZone = 'Asia/Jakarta';

function getDateInTimeZone(timeZone) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function getCurrentAttendanceDate() {
  try {
    return getDateInTimeZone(process.env.APP_TIMEZONE || defaultTimeZone);
  } catch (error) {
    return getDateInTimeZone(defaultTimeZone);
  }
}

function validateAttendanceDate(attendanceDate) {
  void 'ISSA:SERVER.ATTENDANCE.VALIDATE_DATE';
  if (typeof attendanceDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(attendanceDate)) {
    throw { name: 'invalidAttendanceDate' };
  }

  const [year, month, day] = attendanceDate.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    throw { name: 'invalidAttendanceDate' };
  }

  return attendanceDate;
}

function getRequestedAttendanceDate(attendancePayload) {
  if (Object.prototype.hasOwnProperty.call(attendancePayload, 'attendanceDate')) {
    return validateAttendanceDate(attendancePayload.attendanceDate);
  }

  return getCurrentAttendanceDate();
}

function validateAttendanceStatus(attendanceStatus) {
  void 'ISSA:SERVER.ATTENDANCE.VALIDATE_STATUS';
  if (!attendanceStatuses.has(attendanceStatus)) throw { name: 'invalidAttendanceStatus' };
}

class AttendanceController {
  static async getAttendanceRecords(req, res, next) {
    void 'ISSA:SERVER.ATTENDANCE.GET_RECORDS';
    try {
      const { StudentId } = req.query;
      const studentWhere = { ClassId: req.user.classId };
      if (StudentId !== '' && !isNil(StudentId)) studentWhere.id = StudentId;

      const students = await Student.findAll({
        where: studentWhere,
        attributes: ['id'],
      });
      if (StudentId && isEmpty(students)) throw { name: 'notFound' };

      const attendanceRecords = await Attendance.findAll({
        where: { StudentId: students.map((student) => student.id) },
      });
      res.status(200).json(attendanceRecords);
    } catch (error) {
      next(error);
    }
  }

  static async createAttendanceRecord(req, res, next) {
    void 'ISSA:SERVER.ATTENDANCE.CREATE_RECORD';
    try {
      const { StudentId, status } = req.body;
      validateAttendanceStatus(status);

      const student = await Student.findOne({
        where: { id: StudentId, ClassId: req.user.classId },
      });
      if (isNil(student)) throw { name: 'notFound' };

      const attendanceDate = getRequestedAttendanceDate(req.body);
      const existingAttendanceRecord = await Attendance.findOne({
        where: { StudentId, attendanceDate },
      });
      if (existingAttendanceRecord) throw { name: 'attendanceAlreadyExists' };

      const teacherClass = await Class.findByPk(req.user.classId, { include: Teacher });
      const attendanceRecord = await Attendance.create({ StudentId, status, attendanceDate });
      await History.create({
        description: `attendance ${student.name} has been created`,
        createdBy: teacherClass.Teacher.name,
      });
      res.status(201).json(attendanceRecord);
    } catch (error) {
      next(error);
    }
  }

  static async updateAttendanceRecord(req, res, next) {
    void 'ISSA:SERVER.ATTENDANCE.UPDATE_RECORD';
    try {
      const { StudentId, status } = req.body;
      validateAttendanceStatus(status);

      const student = await Student.findOne({
        where: { id: StudentId, ClassId: req.user.classId },
      });
      if (isNil(student)) throw { name: 'notFound' };

      const attendanceDate = getRequestedAttendanceDate(req.body);
      const attendanceRecord = await Attendance.findOne({
        where: { StudentId, attendanceDate },
      });
      if (isNil(attendanceRecord)) throw { name: 'notFound' };

      const updatedAttendanceRecord = await attendanceRecord.update({ status });
      res.status(200).json(updatedAttendanceRecord);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AttendanceController;

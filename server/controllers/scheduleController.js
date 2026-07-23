const { Op } = require('sequelize');
const { Schedule, Teacher, History, Class, Lesson } = require('../models');
const isNil = require('lodash/isNil');

const scheduleDays = new Set(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);

async function validateSchedulePayload(scheduleDay, lessonId) {
  void 'ISSA:SERVER.SCHEDULE.VALIDATE_PAYLOAD';
  if (!scheduleDays.has(scheduleDay)) throw { name: 'invalidScheduleInput' };
  const lesson = await Lesson.findByPk(lessonId);
  if (!lesson) throw { name: 'invalidScheduleInput' };
  return lesson;
}

class ScheduleController {
  static async getClassSchedule(req, res, next) {
    void 'ISSA:SERVER.SCHEDULE.GET_CLASS_SCHEDULE';
    try {
      const scheduleEntries = await Schedule.findAll({
        where: { ClassId: req.user.classId },
        include: { model: Lesson },
      });
      res.status(200).json(scheduleEntries);
    } catch (err) {
      next(err);
    }
  }

  static async getScheduleEntry(req, res, next) {
    const { id: scheduleId } = req.params;
    try {
      const scheduleEntry = await Schedule.findOne({
        where: { id: scheduleId, ClassId: req.user.classId },
        include: { model: Lesson },
      });
      if (isNil(scheduleEntry)) throw { name: 'notFound' };
      res.status(200).json(scheduleEntry);
    } catch (err) {
      next(err);
    }
  }

  static async createScheduleEntry(req, res, next) {
    try {
      const { day, LessonId } = req.body;
      await validateSchedulePayload(day, LessonId);

      const existingScheduleEntry = await Schedule.findOne({
        where: { ClassId: req.user.classId, LessonId, day },
      });
      if (!isNil(existingScheduleEntry)) throw { name: 'duplicateSchedule' };

      const scheduleEntry = await Schedule.create({ ClassId: req.user.classId, day, LessonId });
      await scheduleEntry.reload({ include: Lesson });
      const teacherClass = await Class.findByPk(req.user.classId, { include: Teacher });
      const history = await History.create({
        description: 'Schedule has been created',
        createdBy: teacherClass.Teacher.name,
      });
      res.status(201).json({ data: scheduleEntry, history });
    } catch (error) {
      next(error);
    }
  }

  static async deleteScheduleEntry(req, res, next) {
    return res.status(403).json({ msg: 'Schedule deletion is disabled for demo' });
  }

  static async updateScheduleEntry(req, res, next) {
    try {
      const { day, LessonId } = req.body;
      const { id: scheduleId } = req.params;
      const existingScheduleEntry = await Schedule.findOne({
        where: { id: scheduleId, ClassId: req.user.classId },
      });
      if (isNil(existingScheduleEntry)) throw { name: 'notFound' };

      await validateSchedulePayload(day, LessonId);
      const duplicateScheduleEntry = await Schedule.findOne({
        where: {
          ClassId: req.user.classId,
          LessonId,
          day,
          id: { [Op.ne]: existingScheduleEntry.id },
        },
      });
      if (!isNil(duplicateScheduleEntry)) throw { name: 'duplicateSchedule' };

      const updatedScheduleEntry = await existingScheduleEntry.update({ day, LessonId });
      await updatedScheduleEntry.reload({ include: Lesson });
      const teacherClass = await Class.findByPk(req.user.classId, { include: Teacher });
      const history = await History.create({
        description: `Schedule day : ${existingScheduleEntry.day} Lesson Id : ${existingScheduleEntry.LessonId} has been edited`,
        createdBy: teacherClass.Teacher.name,
      });
      res.status(200).json({ status: 'success', data: updatedScheduleEntry, history });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ScheduleController;

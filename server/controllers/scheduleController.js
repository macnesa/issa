const { Op } = require('sequelize');
const { Schedule, Teacher, History, Class, Lesson } = require('../models');

const scheduleDays = new Set(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);

async function validateScheduleInput(day, LessonId) {
  if (!scheduleDays.has(day)) throw { name: 'invalidScheduleInput' };
  const lesson = await Lesson.findByPk(LessonId);
  if (!lesson) throw { name: 'invalidScheduleInput' };
  return lesson;
}

class ScheduleController {
  static async schedules(req, res, next) {
    try {
      const data = await Schedule.findAll({
        where: { ClassId: req.user.classId },
        include: { model: Lesson },
      });
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  }

  static async scheduleById(req, res, next) {
    const { id } = req.params;
    try {
      const data = await Schedule.findOne({
        where: { id, ClassId: req.user.classId },
        include: { model: Lesson },
      });
      if (!data) throw { name: 'notFound' };
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  }

  static async addSchedule(req, res, next) {
    try {
      const { day, LessonId } = req.body;
      await validateScheduleInput(day, LessonId);

      const duplicate = await Schedule.findOne({
        where: { ClassId: req.user.classId, LessonId, day },
      });
      if (duplicate) throw { name: 'duplicateSchedule' };

      const data = await Schedule.create({ ClassId: req.user.classId, day, LessonId });
      await data.reload({ include: Lesson });
      const teacherClass = await Class.findByPk(req.user.classId, { include: Teacher });
      const history = await History.create({
        description: 'Schedule has been created',
        createdBy: teacherClass.Teacher.name,
      });
      res.status(201).json({ data, history });
    } catch (error) {
      next(error);
    }
  }

  static async deleteSchedule(req, res, next) {
    return res.status(403).json({ msg: 'Schedule deletion is disabled for demo' });
  }

  static async editSchedule(req, res, next) {
    try {
      const { day, LessonId } = req.body;
      const { id } = req.params;
      const check = await Schedule.findOne({
        where: { id, ClassId: req.user.classId },
      });
      if (!check) throw { name: 'notFound' };

      await validateScheduleInput(day, LessonId);
      const duplicate = await Schedule.findOne({
        where: {
          ClassId: req.user.classId,
          LessonId,
          day,
          id: { [Op.ne]: check.id },
        },
      });
      if (duplicate) throw { name: 'duplicateSchedule' };

      const data = await check.update({ day, LessonId });
      await data.reload({ include: Lesson });
      const teacherClass = await Class.findByPk(req.user.classId, { include: Teacher });
      const history = await History.create({
        description: `Schedule day : ${check.day} Lesson Id : ${check.LessonId} has been edited`,
        createdBy: teacherClass.Teacher.name,
      });
      res.status(200).json({ status: 'success', data, history });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ScheduleController;

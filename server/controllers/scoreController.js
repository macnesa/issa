const { Score, Student, Lesson, Assignment, Class, Teacher, History } = require('../models');

function validateValue(value) {
  if (!Number.isInteger(value) || value < 0 || value > 100) {
    throw { name: 'invalidScoreValue' };
  }
}

function normalizeRecordedAt(value) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw { name: 'invalidRecordedAt' };
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw { name: 'invalidRecordedAt' };
  return parsed;
}

function scoreCategory(value) {
  if (value >= 85) return 'A';
  if (value >= 75) return 'B';
  if (value >= 60) return 'C';
  if (value >= 50) return 'D';
  return 'E';
}

function scoreStatus(value, lesson) {
  const kkm = Number(lesson.KKM);
  if (!Number.isFinite(kkm)) throw { name: 'invalidLessonKkm' };
  return value >= kkm;
}

async function findStudentInClass(StudentId, classId) {
  return Student.findOne({ where: { id: StudentId, ClassId: classId } });
}

class ScoreController {
  static async addScore(req, res, next) {
    try {
      const { StudentId, LessonId, AssignmentId, value, desc, recordedAt } = req.body;
      validateValue(value);

      const [student, lesson, assignment] = await Promise.all([
        findStudentInClass(StudentId, req.user.classId),
        Lesson.findByPk(LessonId),
        Assignment.findByPk(AssignmentId),
      ]);
      if (!student || !lesson || !assignment) throw { name: 'notFound' };

      const duplicate = await Score.findOne({
        where: { StudentId, LessonId, AssignmentId },
      });
      if (duplicate) throw { name: 'duplicateScore' };

      const data = await Score.create({
        StudentId,
        LessonId,
        AssignmentId,
        value,
        desc,
        category: scoreCategory(value),
        status: scoreStatus(value, lesson),
        recordedAt: typeof recordedAt === 'undefined' ? new Date() : normalizeRecordedAt(recordedAt),
      });
      const teacherClass = await Class.findByPk(req.user.classId, { include: Teacher });
      const history = await History.create({
        description: `Score ${student.name} lesson ${lesson.name} has been created`,
        createdBy: teacherClass.Teacher.name,
      });
      res.status(201).json({ data, history });
    } catch (error) {
      next(error);
    }
  }

  static async editScore(req, res, next) {
    try {
      const { ScoreId, StudentId, LessonId, AssignmentId, value, recordedAt } = req.body;
      validateValue(value);

      let score;
      if (ScoreId) {
        score = await Score.findByPk(ScoreId);
      } else {
        score = await Score.findOne({
          where: { StudentId, LessonId, AssignmentId },
        });
      }
      if (!score) throw { name: 'notFound' };

      const [student, lesson, assignment] = await Promise.all([
        findStudentInClass(score.StudentId, req.user.classId),
        Lesson.findByPk(score.LessonId),
        Assignment.findByPk(score.AssignmentId),
      ]);
      if (!student || !lesson || !assignment) throw { name: 'notFound' };

      const updates = {
        value,
        category: scoreCategory(value),
        status: scoreStatus(value, lesson),
      };
      if (typeof recordedAt !== 'undefined') updates.recordedAt = normalizeRecordedAt(recordedAt);

      const data = await score.update(updates);
      const teacherClass = await Class.findByPk(req.user.classId, { include: Teacher });
      const history = await History.create({
        description: `Score ${student.name} lesson ${lesson.name} has been edited`,
        createdBy: teacherClass.Teacher.name,
      });
      res.status(200).json({ data, history });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ScoreController;

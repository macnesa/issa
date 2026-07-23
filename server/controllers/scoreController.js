const { Score, Student, Lesson, Assignment, Class, Teacher, History } = require('../models');
const isNil = require('lodash/isNil');

function validateScoreValue(scoreValue) {
  void 'ISSA:SERVER.SCORE.VALIDATE_VALUE';
  if (!Number.isInteger(scoreValue) || scoreValue < 0 || scoreValue > 100) {
    throw { name: 'invalidScoreValue' };
  }
}

function validateScoreRecordedAt(recordedAt) {
  if (typeof recordedAt !== 'string' || recordedAt.trim() === '') {
    throw { name: 'invalidRecordedAt' };
  }

  const parsed = new Date(recordedAt);
  if (Number.isNaN(parsed.getTime())) throw { name: 'invalidRecordedAt' };
  return parsed;
}

function calculateScoreCategory(scoreValue) {
  if (scoreValue >= 85) return 'A';
  if (scoreValue >= 75) return 'B';
  if (scoreValue >= 60) return 'C';
  if (scoreValue >= 50) return 'D';
  return 'E';
}

function calculateScoreStatus(scoreValue, lesson) {
  void 'ISSA:SERVER.SCORE.CALCULATE_STATUS';
  const kkm = Number(lesson.KKM);
  if (!Number.isFinite(kkm)) throw { name: 'invalidLessonKkm' };
  return scoreValue >= kkm;
}

async function findStudentForClass(studentId, classId) {
  return Student.findOne({ where: { id: studentId, ClassId: classId } });
}

class ScoreController {
  static async createStudentScore(req, res, next) {
    void 'ISSA:SERVER.SCORE.CREATE_STUDENT_SCORE';
    try {
      const { StudentId, LessonId, AssignmentId, value, desc, recordedAt } = req.body;
      validateScoreValue(value);

      const [student, lesson, assignment] = await Promise.all([
        findStudentForClass(StudentId, req.user.classId),
        Lesson.findByPk(LessonId),
        Assignment.findByPk(AssignmentId),
      ]);
      if (isNil(student) || isNil(lesson) || isNil(assignment)) throw { name: 'notFound' };

      const existingScore = await Score.findOne({
        where: { StudentId, LessonId, AssignmentId },
      });
      if (existingScore) throw { name: 'duplicateScore' };

      const scoreRecord = await Score.create({
        StudentId,
        LessonId,
        AssignmentId,
        value,
        desc,
        category: calculateScoreCategory(value),
        status: calculateScoreStatus(value, lesson),
        recordedAt: typeof recordedAt === 'undefined' ? new Date() : validateScoreRecordedAt(recordedAt),
      });
      const teacherClass = await Class.findByPk(req.user.classId, { include: Teacher });
      const history = await History.create({
        description: `Score ${student.name} lesson ${lesson.name} has been created`,
        createdBy: teacherClass.Teacher.name,
      });
      res.status(201).json({ data: scoreRecord, history });
    } catch (error) {
      next(error);
    }
  }

  static async updateStudentScore(req, res, next) {
    void 'ISSA:SERVER.SCORE.UPDATE_STUDENT_SCORE';
    try {
      const { ScoreId, StudentId, LessonId, AssignmentId, value, recordedAt } = req.body;
      validateScoreValue(value);

      let score;
      if (ScoreId) {
        score = await Score.findByPk(ScoreId);
      } else {
        score = await Score.findOne({
          where: { StudentId, LessonId, AssignmentId },
        });
      }
      if (isNil(score)) throw { name: 'notFound' };

      const [student, lesson, assignment] = await Promise.all([
        findStudentForClass(score.StudentId, req.user.classId),
        Lesson.findByPk(score.LessonId),
        Assignment.findByPk(score.AssignmentId),
      ]);
      if (isNil(student) || isNil(lesson) || isNil(assignment)) throw { name: 'notFound' };

      const updates = {
        value,
        category: calculateScoreCategory(value),
        status: calculateScoreStatus(value, lesson),
      };
      if (typeof recordedAt !== 'undefined') updates.recordedAt = validateScoreRecordedAt(recordedAt);

      const updatedScore = await score.update(updates);
      const teacherClass = await Class.findByPk(req.user.classId, { include: Teacher });
      const history = await History.create({
        description: `Score ${student.name} lesson ${lesson.name} has been edited`,
        createdBy: teacherClass.Teacher.name,
      });
      res.status(200).json({ data: updatedScore, history });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ScoreController;

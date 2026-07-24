'use strict';

const fs = require('node:fs');
const path = require('node:path');
const {
  Activity,
  Assignment,
  Class: ClassModel,
  Lesson,
  Schedule,
  Student,
  Teacher,
  User,
  sequelize,
} = require('../models');
const attendanceService = require('../modules/attendance/attendance.service');
const feedbackService = require('../modules/feedback/feedback.service');
const scoreService = require('../modules/score/score.service');
const { assertDemoDatabaseTarget, assertPhotoFixture, existingStudentPhotos } = require('./demo-safety');

const dataDirectory = path.join(__dirname, '..', 'data-seeding');

function readSeedJson(fileName) {
  const filePath = path.join(dataDirectory, fileName);
  const parsedData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (!Array.isArray(parsedData)) throw new Error(`Demo seed file ${fileName} must contain an array.`);
  return parsedData;
}

function readDemoData() {
  return {
    activities: readSeedJson('activities.json'),
    assignments: readSeedJson('assignments.json'),
    attendances: readSeedJson('attendance-records.json'),
    classes: readSeedJson('classes.json'),
    feedbacks: readSeedJson('feedbacks.json'),
    lessons: readSeedJson('lessons.json'),
    parents: readSeedJson('parents.json'),
    schedules: readSeedJson('schedules.json'),
    scores: readSeedJson('score-records.json'),
    students: readSeedJson('students.json'),
    teachers: readSeedJson('teachers.json'),
  };
}

async function seedBaseRecords(demoData) {
  return sequelize.transaction(async (transaction) => {
    const teacherRecords = [];
    for (const teacher of demoData.teachers) teacherRecords.push(await Teacher.create(teacher, { transaction }));
    const teacherByNip = new Map(teacherRecords.map((teacher) => [teacher.NIP, teacher]));

    const classRecords = [];
    for (const classData of demoData.classes) {
      classRecords.push(await ClassModel.create({
        name: classData.name,
        TeacherId: teacherByNip.get(classData.teacherNip).id,
        SPP: classData.SPP,
      }, { transaction }));
    }
    const classByCode = new Map(classRecords.map((classRecord, index) => [demoData.classes[index].classCode, classRecord]));

    const lessonRecords = [];
    for (const { lessonCode, ...lesson } of demoData.lessons) lessonRecords.push(await Lesson.create(lesson, { transaction }));
    const lessonByCode = new Map(lessonRecords.map((lessonRecord, index) => [demoData.lessons[index].lessonCode, lessonRecord]));

    const assignmentRecords = [];
    for (const { assignmentCode, ...assignment } of demoData.assignments) assignmentRecords.push(await Assignment.create(assignment, { transaction }));
    const assignmentByCode = new Map(assignmentRecords.map((assignmentRecord, index) => [demoData.assignments[index].assignmentCode, assignmentRecord]));

    const studentRecords = [];
    for (const studentData of demoData.students) {
      const { classCode, photoIndex, ...student } = studentData;
      const photoReference = existingStudentPhotos[photoIndex];
      if (!photoReference) throw new Error(`Student ${student.NIM} references an unavailable photo.`);
      studentRecords.push(await Student.create({
        ...student,
        ClassId: classByCode.get(classCode).id,
        feedback: null,
        imgUrl: photoReference,
      }, { transaction }));
    }
    const studentByNim = new Map(studentRecords.map((student) => [student.NIM, student]));

    for (const parent of demoData.parents) {
      await User.create({
        NIM: parent.NIM,
        password: parent.password,
        email: parent.email,
        StudentId: studentByNim.get(parent.studentNim).id,
      }, { transaction });
    }

    await Activity.bulkCreate(demoData.activities.map((activity) => ({ ...activity, date: new Date(activity.date) })), { transaction });
    await Schedule.bulkCreate(demoData.schedules.map((schedule) => ({
      ClassId: classByCode.get(schedule.classCode).id,
      LessonId: lessonByCode.get(schedule.lessonCode).id,
      day: schedule.day,
    })), { transaction });

    return { assignmentByCode, lessonByCode, studentByNim, teacherByNip };
  });
}

async function seedAttendance(attendanceRecords, studentByNim) {
  for (const attendance of attendanceRecords) {
    const student = studentByNim.get(attendance.studentNim);
    await attendanceService.createAttendanceRecord({
      classId: student.ClassId,
      attendancePayload: { StudentId: student.id, status: attendance.status, attendanceDate: attendance.attendanceDate },
    });
  }
}

async function seedScores(scoreRecords, studentByNim, lessonByCode, assignmentByCode) {
  for (const score of scoreRecords) {
    const student = studentByNim.get(score.studentNim);
    await scoreService.createStudentScore({
      classId: student.ClassId,
      scorePayload: {
        StudentId: student.id,
        LessonId: lessonByCode.get(score.lessonCode).id,
        AssignmentId: assignmentByCode.get(score.assignmentCode).id,
        value: score.value,
        recordedAt: score.recordedAt,
      },
    });
  }
}

async function seedFeedback(feedbackRecords, studentByNim, teacherByNip) {
  for (const feedback of feedbackRecords) {
    const student = studentByNim.get(feedback.studentNim);
    await feedbackService.updateStudentFeedback({
      studentId: student.id,
      classId: student.ClassId,
      teacherId: teacherByNip.get(feedback.teacherNip).id,
      studentUpdatePayload: { feedback: feedback.content, observedAt: feedback.observedAt },
    });
  }
}

async function seedDemoDatabase() {
  assertDemoDatabaseTarget();
  assertPhotoFixture();
  await sequelize.authenticate();
  const demoData = readDemoData();
  const { assignmentByCode, lessonByCode, studentByNim, teacherByNip } = await seedBaseRecords(demoData);
  await seedAttendance(demoData.attendances, studentByNim);
  await seedScores(demoData.scores, studentByNim, lessonByCode, assignmentByCode);
  await seedFeedback(demoData.feedbacks, studentByNim, teacherByNip);
  await sequelize.close();
  console.log('Curated ISSA demo seed completed.');
}

seedDemoDatabase().catch(async (error) => {
  console.error(error.message || error);
  await sequelize.close();
  process.exitCode = 1;
});

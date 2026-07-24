'use strict';

const {
  Attendance,
  Class: ClassModel,
  Lesson,
  Schedule,
  Score,
  Student,
  StudentFeedback,
  Teacher,
  User,
  sequelize,
} = require('../models');
const authenticationService = require('../modules/authentication/authentication.service');
const attendanceService = require('../modules/attendance/attendance.service');
const feedbackService = require('../modules/feedback/feedback.service');
const publicStudentService = require('../modules/public-student/public-student.service');
const scheduleService = require('../modules/schedule/schedule.service');
const studentService = require('../modules/student/student.service');
const { assertDemoDatabaseTarget, assertPhotoFixture, existingStudentPhotos } = require('./demo-safety');

const expectedDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

function assert(condition, message) {
  if (!condition) throw new Error(`Demo verification failed: ${message}`);
}

async function verifyRelations() {
  const [teacherCount, parentCount, classCount, studentCount, lessonCount, attendanceCount, scoreCount, feedbackCount] = await Promise.all([
    Teacher.count(), User.count(), ClassModel.count(), Student.count(), Lesson.count(), Attendance.count(), Score.count(), StudentFeedback.count(),
  ]);

  assert(teacherCount === 5, `expected 5 teachers, received ${teacherCount}`);
  assert(parentCount === 15, `expected 15 parent accounts, received ${parentCount}`);
  assert(classCount === 3, `expected 3 classes, received ${classCount}`);
  assert(studentCount === 18, `expected 18 students, received ${studentCount}`);
  assert(lessonCount === 8, `expected 8 lessons, received ${lessonCount}`);
  assert(attendanceCount > 300, `expected rich attendance history, received ${attendanceCount}`);
  assert(scoreCount > 70, `expected rich score history, received ${scoreCount}`);
  assert(feedbackCount >= 36, `expected feedback history, received ${feedbackCount}`);

  const students = await Student.findAll({ include: [ClassModel, User] });
  assert(students.every((student) => student.Class), 'a student has no class relation');
  assert(students.every((student) => existingStudentPhotos.includes(student.imgUrl)), 'a student photo is not in the preserved fixture');

  const parentAccounts = await User.findAll({ include: { model: Student, required: true } });
  assert(parentAccounts.length === parentCount, 'a parent account is orphaned from its student');

  const schedules = await Schedule.findAll();
  for (const classRecord of await ClassModel.findAll()) {
    const classDays = new Set(schedules.filter((schedule) => schedule.ClassId === classRecord.id).map((schedule) => schedule.day));
    assert(expectedDays.every((day) => classDays.has(day)), `class ${classRecord.name} does not have a complete Monday–Friday schedule`);
  }

  const attendanceStatuses = new Set((await Attendance.findAll({ attributes: ['status'] })).map((attendance) => attendance.status));
  assert(['Hadir', 'Sakit', 'Izin', 'Alfa'].every((status) => attendanceStatuses.has(status)), 'not all attendance statuses are represented');

  const scores = await Score.findAll({ include: Lesson });
  assert(scores.some((score) => score.value < score.Lesson.KKM), 'no score is below KKM');
  assert(scores.some((score) => score.value === score.Lesson.KKM), 'no score equals KKM');
  assert(scores.some((score) => score.value > score.Lesson.KKM), 'no score is above KKM');
  assert(scores.every((score) => score.status === (score.value >= score.Lesson.KKM)), 'score status does not match its lesson KKM');

  const scoredStudentIds = new Set(scores.map((score) => score.StudentId));
  assert(scoredStudentIds.size === studentCount, 'a student has no score record');
  const scoreCounts = scores.reduce((counts, score) => counts.set(score.StudentId, (counts.get(score.StudentId) || 0) + 1), new Map());
  assert([...scoreCounts.values()].some((count) => count < lessonCount), 'no student has a partial academic record');

  const feedbackStudents = new Set((await StudentFeedback.findAll({ attributes: ['StudentId'] })).map((feedback) => feedback.StudentId));
  assert(feedbackStudents.size === studentCount, 'a student has no feedback history');
  assert(students.every((student) => typeof student.feedback === 'string' && student.feedback.length > 0), 'latest feedback snapshot is missing');

  return { attendanceCount, classCount, feedbackCount, lessonCount, parentCount, scoreCount, studentCount, teacherCount };
}

async function verifyServiceSmoke() {
  const teacherLogin = await authenticationService.authenticateTeacher({ NIP: '2026001001', password: 'GuruDemo2026' });
  const parentLogin = await authenticationService.authenticateParent({ NIM: '2026071001', password: 'OrangTua2026' });
  const studentList = await studentService.getStudentList({ classId: teacherLogin.ClassId, pageIndex: 1, name: '' });
  assert(studentList.rows.length > 0, 'teacher list students service returned no rows');

  const student = studentList.rows[0];
  await studentService.getStudentDetail({ studentId: student.id, classId: teacherLogin.ClassId });
  const attendance = await attendanceService.getAttendanceRecords({ studentId: student.id, classId: teacherLogin.ClassId });
  assert(attendance.length > 0, 'attendance service returned no records');
  const feedback = await feedbackService.getStudentFeedbackHistory({ studentId: student.id, classId: teacherLogin.ClassId });
  assert(feedback.length > 0, 'feedback service returned no records');
  const schedule = await scheduleService.getClassSchedule({ classId: teacherLogin.ClassId });
  assert(schedule.length > 0, 'schedule service returned no records');
  const parentDetail = await publicStudentService.getPublicStudentDetail({ studentId: parentLogin.id ? (await User.findByPk(parentLogin.id)).StudentId : null });
  assert(parentDetail, 'public student detail service returned no data');
}

async function verifyDemoDatabase() {
  assertDemoDatabaseTarget();
  assertPhotoFixture();
  await sequelize.authenticate();
  const counts = await verifyRelations();
  await verifyServiceSmoke();
  await sequelize.close();
  console.log(JSON.stringify({ status: 'ok', counts }, null, 2));
}

verifyDemoDatabase().catch(async (error) => {
  console.error(error.message || error);
  await sequelize.close();
  process.exitCode = 1;
});

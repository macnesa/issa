'use strict';

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const { Op } = require('sequelize');
const config = require('../config/config').development;
const {
  Activity,
  Assignment,
  Attendance,
  Chat,
  Class: ClassModel,
  Lesson,
  Schedule,
  Score,
  Student,
  StudentEvidence,
  StudentFeedback,
  StudentLearningJournal,
  Teacher,
  Transaction,
  User,
  sequelize,
} = require('../models');
const { hashPassword } = require('../helpers');
const { existingStudentPhotos } = require('./demo-safety');
const {
  DEMO_TIMESTAMP,
  activities,
  assignments,
  buildAttendances,
  demoClass,
  evidence,
  feedbacks,
  journals,
  lessons,
  parent,
  schedules,
  scores,
  students,
  teacher,
} = require('../demo-data/canonical-demo');

const CONFIRMATION_ENV = 'ISSA_DEMO_RESET_CONFIRM';
const CONFIRMATION_TOKEN = 'issa-local-demo-reset-v1';
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);
const REMOTE_MARKERS = [
  'neon',
  'render',
  'vercel',
  'supabase',
  'railway',
  'production',
  '.prod',
];
const LEGACY_DEMO_ACTIVITY_NAMES = [
  'Pameran Karya Kelas',
  'Gerak Pagi Bersama',
  'Kunjungan Perpustakaan',
  'Presentasi Proyek Lingkungan',
  'Apresiasi Belajar Bulanan',
];

function assert(condition, message) {
  if (!condition) throw new Error(`Demo assertion failed: ${message}`);
}

function assertLocalDevelopmentTarget() {
  const environment = process.env.NODE_ENV || 'development';
  const databaseName = String(config.database || '').trim();
  const databaseHost = String(config.host || '').trim().toLowerCase();
  const databaseUrl = String(process.env.DATABASE_URL || '').trim();
  const targetDescription = `${databaseName} ${databaseHost} ${databaseUrl}`.toLowerCase();

  if (environment === 'production') {
    throw new Error('Refusing demo reset: NODE_ENV=production.');
  }
  if (environment !== 'development') {
    throw new Error(`Refusing demo reset: environment ${environment} is not development.`);
  }
  if (process.env[CONFIRMATION_ENV] !== CONFIRMATION_TOKEN) {
    throw new Error('Refusing demo reset: internal confirmation token is missing.');
  }
  if (!LOCAL_HOSTS.has(databaseHost)) {
    throw new Error(`Refusing demo reset: database host ${databaseHost || '(empty)'} is not local.`);
  }
  if (!/(^|[_-])(dev|demo|local)([_-]|$)|development/i.test(databaseName)) {
    throw new Error(`Refusing demo reset: database ${databaseName || '(empty)'} is not a local development database.`);
  }
  if (REMOTE_MARKERS.some((marker) => targetDescription.includes(marker))) {
    throw new Error('Refusing demo reset: database configuration contains a remote or production marker.');
  }
  if (databaseUrl) {
    let parsedUrl;
    try {
      parsedUrl = new URL(databaseUrl);
    } catch {
      throw new Error('Refusing demo reset: DATABASE_URL is invalid.');
    }
    if (!LOCAL_HOSTS.has(parsedUrl.hostname.toLowerCase())) {
      throw new Error('Refusing demo reset: DATABASE_URL does not point to a local host.');
    }
  }
  if (!config.username || !databaseName || !Number.isInteger(config.port)) {
    throw new Error('Refusing demo reset: local database configuration is incomplete.');
  }

  return { databaseHost, databaseName, environment };
}

function scoreCategory(value) {
  if (value >= 85) return 'A';
  if (value >= 75) return 'B';
  if (value >= 60) return 'C';
  if (value >= 50) return 'D';
  return 'E';
}

async function findOrCreateCanonicalRecord(Model, where, values, transaction) {
  const [record] = await Model.findOrCreate({
    where,
    defaults: {
      ...values,
      createdAt: DEMO_TIMESTAMP,
      updatedAt: DEMO_TIMESTAMP,
    },
    transaction,
  });
  await record.update({
    ...values,
    updatedAt: DEMO_TIMESTAMP,
  }, { transaction, hooks: false });
  return record;
}

async function syncSequence(tableName, transaction) {
  await sequelize.query(
    `SELECT setval(
      pg_get_serial_sequence('"${tableName}"', 'id'),
      GREATEST(COALESCE((SELECT MAX(id) FROM "${tableName}"), 1), 1),
      true
    )`,
    { transaction }
  );
}

async function ensureCanonicalTeacher(transaction) {
  const byNip = await Teacher.findOne({
    where: { NIP: teacher.NIP },
    transaction,
  });
  const byId = await Teacher.findByPk(teacher.id, { transaction });

  assert(!byNip || byNip.id === teacher.id, 'canonical Teacher NIP is attached to another ID');
  assert(!byId || byId.NIP === teacher.NIP, 'Teacher ID 1 is occupied by another account');

  if (!byNip) {
    return Teacher.create({
      ...teacher,
      createdAt: DEMO_TIMESTAMP,
      updatedAt: DEMO_TIMESTAMP,
    }, { transaction });
  }

  await byNip.update({
    name: teacher.name,
    password: hashPassword(teacher.password),
    updatedAt: DEMO_TIMESTAMP,
  }, { transaction, hooks: false });
  return byNip;
}

async function ensureCanonicalClass(teacherRecord, transaction) {
  const byId = await ClassModel.findByPk(demoClass.id, { transaction });
  const byName = await ClassModel.findOne({
    where: { name: demoClass.name },
    transaction,
  });

  assert(!byName || byName.id === demoClass.id, 'Class 1A is attached to another ID');
  assert(!byId || byId.name === demoClass.name, 'Class ID 1 is occupied by another class');

  if (!byId) {
    return ClassModel.create({
      ...demoClass,
      TeacherId: teacherRecord.id,
      createdAt: DEMO_TIMESTAMP,
      updatedAt: DEMO_TIMESTAMP,
    }, { transaction });
  }

  await byId.update({
    name: demoClass.name,
    TeacherId: teacherRecord.id,
    SPP: demoClass.SPP,
    updatedAt: DEMO_TIMESTAMP,
  }, { transaction });
  return byId;
}

async function assertStableIdentitySlots(classRecord, transaction) {
  const desiredStudentIds = students.map((student) => student.id);
  const desiredNims = students.map((student) => student.NIM);
  const existingById = await Student.findAll({
    where: { id: { [Op.in]: desiredStudentIds } },
    transaction,
  });
  const existingByNim = await Student.findAll({
    where: { NIM: { [Op.in]: desiredNims } },
    transaction,
  });

  assert(
    existingById.every((student) => student.ClassId === classRecord.id),
    'a canonical Student ID is occupied outside Class 1A'
  );
  assert(
    existingByNim.every((student) => student.ClassId === classRecord.id),
    'a canonical Student NIM is occupied outside Class 1A'
  );
}

async function cleanupClassData(classRecord, transaction) {
  const existingStudents = await Student.findAll({
    where: { ClassId: classRecord.id },
    attributes: ['id'],
    transaction,
  });
  const studentIds = existingStudents.map((student) => student.id);
  if (studentIds.length === 0) {
    await Schedule.destroy({ where: { ClassId: classRecord.id }, transaction });
    return;
  }

  const parentAccounts = await User.findAll({
    where: { StudentId: { [Op.in]: studentIds } },
    attributes: ['id'],
    transaction,
  });
  const parentIds = parentAccounts.map((account) => account.id);

  await StudentLearningJournal.destroy({
    force: true,
    transaction,
    where: { StudentId: { [Op.in]: studentIds } },
  });
  await StudentEvidence.destroy({
    force: true,
    transaction,
    where: { StudentId: { [Op.in]: studentIds } },
  });
  await StudentFeedback.destroy({
    transaction,
    where: { StudentId: { [Op.in]: studentIds } },
  });
  await Score.destroy({
    transaction,
    where: { StudentId: { [Op.in]: studentIds } },
  });
  await Attendance.destroy({
    transaction,
    where: { StudentId: { [Op.in]: studentIds } },
  });
  await Transaction.destroy({
    transaction,
    where: { StudentId: { [Op.in]: studentIds } },
  });
  if (parentIds.length > 0) {
    await Chat.destroy({
      transaction,
      where: {
        [Op.or]: [
          { fromUserId: { [Op.in]: parentIds } },
          { toUserId: { [Op.in]: parentIds } },
        ],
      },
    });
  }
  await User.destroy({
    transaction,
    where: { StudentId: { [Op.in]: studentIds } },
  });
  await Student.destroy({
    transaction,
    where: { id: { [Op.in]: studentIds } },
  });
  await Schedule.destroy({
    transaction,
    where: { ClassId: classRecord.id },
  });
}

async function seedCurriculum(transaction) {
  const lessonByCode = new Map();
  for (const lesson of lessons) {
    const { code, ...values } = lesson;
    const record = await findOrCreateCanonicalRecord(
      Lesson,
      { name: values.name },
      { ...values, imgUrl: null },
      transaction
    );
    lessonByCode.set(code, record);
  }

  const assignmentByCode = new Map();
  for (const assignment of assignments) {
    const { code, ...values } = assignment;
    const record = await findOrCreateCanonicalRecord(
      Assignment,
      { name: values.name },
      values,
      transaction
    );
    assignmentByCode.set(code, record);
  }

  return { assignmentByCode, lessonByCode };
}

async function seedStudents(classRecord, transaction) {
  const latestFeedbackByNim = new Map();
  for (const feedback of feedbacks) {
    latestFeedbackByNim.set(feedback.studentNim, feedback.content);
  }

  const records = [];
  for (const student of students) {
    const { photoIndex, ...identity } = student;
    const imgUrl = existingStudentPhotos[photoIndex];
    assert(imgUrl, `approved photo fixture is missing for ${student.NIM}`);
    records.push(await Student.create({
      ...identity,
      birthDate: new Date(`${identity.birthDate}T00:00:00.000Z`),
      ClassId: classRecord.id,
      feedback: latestFeedbackByNim.get(identity.NIM),
      imgUrl,
      createdAt: DEMO_TIMESTAMP,
      updatedAt: DEMO_TIMESTAMP,
    }, { transaction, hooks: false }));
  }
  return new Map(records.map((record) => [record.NIM, record]));
}

async function seedParent(studentByNim, transaction) {
  const student = studentByNim.get(parent.studentNim);
  const existingId = await User.findByPk(parent.id, { transaction });
  const existingNim = await User.findOne({
    where: { NIM: parent.NIM },
    transaction,
  });
  assert(!existingId, 'Parent ID 1 remained after scoped cleanup');
  assert(!existingNim, 'Parent Ari NIM remained after scoped cleanup');
  await User.create({
    id: parent.id,
    NIM: parent.NIM,
    password: parent.password,
    email: parent.email,
    StudentId: student.id,
    createdAt: DEMO_TIMESTAMP,
    updatedAt: DEMO_TIMESTAMP,
  }, { transaction });
}

async function seedClassRecords({
  assignmentByCode,
  classRecord,
  lessonByCode,
  studentByNim,
  teacherRecord,
  transaction,
}) {
  const attendanceRows = buildAttendances().map((attendance) => ({
    StudentId: studentByNim.get(attendance.studentNim).id,
    attendanceDate: attendance.attendanceDate,
    status: attendance.status,
    version: attendance.version,
    createdAt: `${attendance.attendanceDate}T08:00:00.000Z`,
    updatedAt: `${attendance.attendanceDate}T08:00:00.000Z`,
  }));
  await Attendance.bulkCreate(attendanceRows, { transaction });

  const scoreRows = scores.map((score) => {
    const lesson = lessonByCode.get(score.lessonCode);
    return {
      StudentId: studentByNim.get(score.studentNim).id,
      LessonId: lesson.id,
      AssignmentId: assignmentByCode.get(score.assignmentCode).id,
      value: score.value,
      desc: score.desc,
      category: scoreCategory(score.value),
      status: score.value >= lesson.KKM,
      recordedAt: score.recordedAt,
      createdAt: score.recordedAt,
      updatedAt: score.recordedAt,
    };
  });
  await Score.bulkCreate(scoreRows, { transaction });

  const evidenceRecord = await StudentEvidence.create({
    ...evidence,
    StudentId: studentByNim.get(evidence.studentNim).id,
    TeacherId: teacherRecord.id,
    retractedAt: null,
    retractionReason: null,
    RetractedByTeacherId: null,
    deletedAt: null,
    createdAt: evidence.observedAt,
    updatedAt: evidence.observedAt,
  }, { transaction });

  const journalRows = journals.map((journal) => ({
    StudentId: studentByNim.get(journal.studentNim).id,
    TeacherId: teacherRecord.id,
    EvidenceId: journal.studentNim === evidence.studentNim
      && journal.type === 'observation'
      ? evidenceRecord.id
      : null,
    type: journal.type,
    content: journal.content,
    voiceCaptureType: journal.voiceCaptureType,
    observedAt: journal.observedAt,
    createdAt: journal.observedAt,
    updatedAt: journal.observedAt,
    deletedAt: null,
  }));
  await StudentLearningJournal.bulkCreate(journalRows, { transaction });

  const feedbackRows = feedbacks.map((feedback) => ({
    StudentId: studentByNim.get(feedback.studentNim).id,
    TeacherId: teacherRecord.id,
    content: feedback.content,
    observedAt: feedback.observedAt,
    createdAt: feedback.observedAt,
    updatedAt: feedback.observedAt,
  }));
  await StudentFeedback.bulkCreate(feedbackRows, { transaction });

  await Schedule.bulkCreate(schedules.map(([day, lessonCode]) => ({
    ClassId: classRecord.id,
    LessonId: lessonByCode.get(lessonCode).id,
    day,
    createdAt: DEMO_TIMESTAMP,
    updatedAt: DEMO_TIMESTAMP,
  })), { transaction });
}

async function seedActivities(transaction) {
  const canonicalNames = activities.map((activity) => activity.name);
  await Activity.destroy({
    transaction,
    where: {
      name: {
        [Op.in]: [...new Set([
          ...LEGACY_DEMO_ACTIVITY_NAMES,
          ...canonicalNames,
        ])],
      },
    },
  });
  await Activity.bulkCreate(activities.map((activity) => ({
    ...activity,
    createdAt: activity.date,
    updatedAt: activity.date,
  })), { transaction });
}

function containsKeyword(records, fields, keyword) {
  const normalisedKeyword = keyword.toLowerCase();
  return records.some((record) => fields.some((field) => (
    String(record[field] || '').toLowerCase().includes(normalisedKeyword)
  )));
}

async function verifyCanonicalDataset({
  assignmentByCode,
  classRecord,
  lessonByCode,
  studentByNim,
  teacherRecord,
  transaction,
}) {
  const studentIds = [...studentByNim.values()].map((student) => student.id);
  const [
    attendanceRecords,
    scoreRecords,
    journalRecords,
    evidenceRecords,
    feedbackRecords,
    scheduleRecords,
    activityRecords,
    parentRecords,
  ] = await Promise.all([
    Attendance.findAll({ where: { StudentId: { [Op.in]: studentIds } }, transaction }),
    Score.findAll({ where: { StudentId: { [Op.in]: studentIds } }, transaction }),
    StudentLearningJournal.findAll({
      paranoid: false,
      where: { StudentId: { [Op.in]: studentIds } },
      transaction,
    }),
    StudentEvidence.findAll({
      paranoid: false,
      where: { StudentId: { [Op.in]: studentIds } },
      transaction,
    }),
    StudentFeedback.findAll({ where: { StudentId: { [Op.in]: studentIds } }, transaction }),
    Schedule.findAll({ where: { ClassId: classRecord.id }, transaction }),
    Activity.findAll({
      where: { name: { [Op.in]: activities.map((activity) => activity.name) } },
      transaction,
    }),
    User.findAll({ where: { StudentId: { [Op.in]: studentIds } }, transaction }),
  ]);

  const classStudents = await Student.findAll({
    where: { ClassId: classRecord.id },
    transaction,
  });
  const ari = await Student.findByPk(1, { transaction });
  const teacherCheck = await Teacher.findOne({
    where: { id: 1, NIP: teacher.NIP },
    transaction,
  });
  const parentAri = await User.findOne({
    where: { NIM: parent.NIM, StudentId: ari?.id },
    transaction,
  });

  assert(teacherCheck?.id === teacherRecord.id, 'Teacher demo was not found');
  assert(classRecord.id === 1 && classRecord.name === '1A', 'Class 1A was not found');
  assert(ari?.id === 1, 'Ari ID is not 1');
  assert(ari?.NIM === '2026071001', 'Ari NIM changed');
  assert(parentAri, 'Parent Ari is not connected');
  assert(parentRecords.length === 1 && parentRecords[0].StudentId === 1, 'Parent demo can access a non-Ari student');
  assert(classStudents.length === students.length, `expected ${students.length} Class 1A students`);
  assert(classStudents.every((student) => student.ClassId === classRecord.id), 'a Student has the wrong ClassId');
  assert(attendanceRecords.every((record) => record.version >= 1), 'Attendance version is invalid');

  const attendanceKeys = attendanceRecords.map((record) => (
    `${record.StudentId}:${record.attendanceDate}`
  ));
  assert(new Set(attendanceKeys).size === attendanceKeys.length, 'duplicate Student attendance date exists');

  const studentIdSet = new Set(studentIds);
  const lessonIdSet = new Set([...lessonByCode.values()].map((lesson) => lesson.id));
  const assignmentIdSet = new Set([...assignmentByCode.values()].map((assignment) => assignment.id));
  assert(scoreRecords.every((record) => (
    studentIdSet.has(record.StudentId)
    && lessonIdSet.has(record.LessonId)
    && assignmentIdSet.has(record.AssignmentId)
  )), 'an orphan Score exists');
  assert(journalRecords.every((record) => studentIdSet.has(record.StudentId)), 'an orphan Journal exists');
  assert(evidenceRecords.every((record) => studentIdSet.has(record.StudentId)), 'an orphan Evidence exists');

  const activeEvidence = evidenceRecords.filter((record) => (
    !record.retractedAt && !record.deletedAt
  ));
  const retractedEvidence = evidenceRecords.filter((record) => (
    Boolean(record.retractedAt || record.deletedAt)
  ));
  assert(activeEvidence.every((record) => !record.retractedAt && !record.deletedAt), 'retracted Evidence is considered active');

  const keywordRecords = [
    ...journalRecords,
    ...feedbackRecords,
    ...evidenceRecords,
    ...activityRecords,
    ...[...assignmentByCode.values()],
  ];
  assert(
    containsKeyword(keywordRecords, ['content', 'title', 'description', 'name', 'desc'], 'pecahan'),
    'keyword pecahan is unavailable'
  );
  assert(
    containsKeyword(keywordRecords, ['content', 'title', 'description', 'name', 'desc'], 'pameran'),
    'keyword pameran is unavailable'
  );

  const ariCounts = {
    attendance: attendanceRecords.filter((record) => record.StudentId === 1).length,
    evidence: evidenceRecords.filter((record) => record.StudentId === 1).length,
    feedback: feedbackRecords.filter((record) => record.StudentId === 1).length,
    journals: journalRecords.filter((record) => record.StudentId === 1).length,
    scores: scoreRecords.filter((record) => record.StudentId === 1).length,
  };
  assert(
    ariCounts.attendance > 0
      && ariCounts.evidence > 0
      && ariCounts.feedback > 0
      && ariCounts.journals > 0
      && ariCounts.scores > 0,
    'Ari source coverage is incomplete'
  );

  return {
    activities: activityRecords.length,
    assignments: assignmentByCode.size,
    attendance: attendanceRecords.length,
    classCount: 1,
    evidenceActive: activeEvidence.length,
    evidenceRetracted: retractedEvidence.length,
    feedback: feedbackRecords.length,
    journals: journalRecords.length,
    lessons: lessonByCode.size,
    schedules: scheduleRecords.length,
    scores: scoreRecords.length,
    students: classStudents.length,
    teacherCount: 1,
  };
}

async function resetCanonicalDemo() {
  const target = assertLocalDevelopmentTarget();
  console.log(`Environment: ${target.environment}`);
  console.log(`Database: ${target.databaseName}`);
  console.log(`Host: ${target.databaseHost}`);
  console.log(`Class demo target: ${demoClass.name} (ID ${demoClass.id})`);

  await sequelize.authenticate();
  const summary = await sequelize.transaction(async (transaction) => {
    const teacherRecord = await ensureCanonicalTeacher(transaction);
    const classRecord = await ensureCanonicalClass(teacherRecord, transaction);
    await assertStableIdentitySlots(classRecord, transaction);
    await cleanupClassData(classRecord, transaction);

    const { assignmentByCode, lessonByCode } = await seedCurriculum(transaction);
    const studentByNim = await seedStudents(classRecord, transaction);
    await seedParent(studentByNim, transaction);
    await seedClassRecords({
      assignmentByCode,
      classRecord,
      lessonByCode,
      studentByNim,
      teacherRecord,
      transaction,
    });
    await seedActivities(transaction);

    for (const tableName of [
      'Teachers',
      'Classes',
      'Students',
      'Users',
      'StudentEvidences',
      'StudentLearningJournals',
      'StudentFeedbacks',
      'Attendances',
      'Scores',
      'Schedules',
      'Activities',
    ]) {
      await syncSequence(tableName, transaction);
    }

    return verifyCanonicalDataset({
      assignmentByCode,
      classRecord,
      lessonByCode,
      studentByNim,
      teacherRecord,
      transaction,
    });
  });

  console.log('ISSA local demo reset complete');
  console.log(`Teacher: ${summary.teacherCount}`);
  console.log(`Class: ${summary.classCount}`);
  console.log(`Students: ${summary.students}`);
  console.log(`Attendance: ${summary.attendance}`);
  console.log(`Scores: ${summary.scores}`);
  console.log(`Journals: ${summary.journals}`);
  console.log(`Evidence active: ${summary.evidenceActive}`);
  console.log(`Evidence retracted: ${summary.evidenceRetracted}`);
  console.log(`Feedback: ${summary.feedback}`);
  console.log(`Lessons: ${summary.lessons}`);
  console.log(`Assignments: ${summary.assignments}`);
  console.log(`Schedules: ${summary.schedules}`);
  console.log(`Activities: ${summary.activities}`);
  return summary;
}

resetCanonicalDemo()
  .catch((error) => {
    const safeMessage = String(error?.message || 'unknown error')
      .replace(/postgres(?:ql)?:\/\/[^\s]+/gi, '[redacted database URL]');
    console.error(`ISSA local demo reset failed: ${safeMessage}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });

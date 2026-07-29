jest.mock('../helpers', () => ({
  ...jest.requireActual('../helpers'),
  verifyAuthenticationToken: jest.fn(),
}));

jest.mock('../modules/teacher-search/teacher-search.repository', () => ({
  findActivityCandidates: jest.fn(),
  findFeedbackCandidates: jest.fn(),
  findJournalCandidates: jest.fn(),
  findLessonCandidates: jest.fn(),
  findStudentCandidates: jest.fn(),
}));

const express = require('express');
const request = require('supertest');
const helpers = require('../helpers');
const {
  Activity,
  Class,
  Lesson,
  Student,
  StudentLearningJournal,
  Teacher,
} = require('../models');
const teacherSearchRepository = require(
  '../modules/teacher-search/teacher-search.repository'
);
const actualTeacherSearchRepository = jest.requireActual(
  '../modules/teacher-search/teacher-search.repository'
);
const {
  searchTeacherRecords,
} = require('../modules/teacher-search/teacher-search.service');
const teacherSearchRouter = require(
  '../modules/teacher-search/teacher-search.route'
);
const { errorHandler } = require('../middlewares/errorHandler');

function emptyRepositoryResults() {
  teacherSearchRepository.findActivityCandidates.mockResolvedValue([]);
  teacherSearchRepository.findFeedbackCandidates.mockResolvedValue([]);
  teacherSearchRepository.findJournalCandidates.mockResolvedValue([]);
  teacherSearchRepository.findLessonCandidates.mockResolvedValue([]);
  teacherSearchRepository.findStudentCandidates.mockResolvedValue([]);
}

describe('Teacher authorized universal search', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    emptyRepositoryResults();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('teacher searches name or NIM only through the authenticated class scope', async () => {
    teacherSearchRepository.findStudentCandidates.mockResolvedValue([
      {
        id: 1,
        name: 'Ari Wibowo',
        NIM: '2026071001',
        updatedAt: '2026-07-26T10:00:00.000Z',
        Class: { id: 3, name: 'Kelas 6A' },
      },
    ]);

    const result = await searchTeacherRecords({
      requester: { role: 'teacher', teacherId: 9, classId: 3 },
      queryParameters: { q: '2026071001' },
    });

    expect(teacherSearchRepository.findStudentCandidates).toHaveBeenCalledWith(
      expect.objectContaining({ classId: 3, pattern: '%2026071001%' })
    );
    expect(result).toEqual({
      data: {
        query: '2026071001',
        total: 1,
        groups: [{
          type: 'student',
          label: 'Siswa',
          items: [{
            id: 1,
            title: 'Ari Wibowo',
            subtitle: 'Kelas 6A',
            snippet: 'NIM 2026071001',
            studentId: 1,
            occurredAt: null,
          }],
        }],
      },
    });
  });

  test('pecahan returns safe Journal, Feedback, and Lesson groups with backend ranking', async () => {
    teacherSearchRepository.findJournalCandidates.mockResolvedValue([
      {
        id: 8,
        StudentId: 1,
        type: 'observation',
        content: `Catatan awal ${'panjang '.repeat(24)}pecahan di bagian akhir.`,
        observedAt: '2026-07-25T08:00:00.000Z',
        Student: { id: 1, name: 'Ari Wibowo' },
        fileUrl: 'https://cloudinary.example/private.png',
        deletedAt: null,
      },
      {
        id: 6,
        StudentId: 1,
        type: 'strength',
        content: '<b>Pecahan</b> digunakan untuk memeriksa hasil.',
        observedAt: '2026-07-20T08:00:00.000Z',
        Student: { id: 1, name: 'Ari Wibowo' },
      },
    ]);
    teacherSearchRepository.findFeedbackCandidates.mockResolvedValue([
      {
        id: 1,
        name: 'Ari Wibowo',
        feedback: 'Pemahaman pecahan mulai terlihat konsisten.',
        updatedAt: '2026-07-26T09:00:00.000Z',
      },
    ]);
    teacherSearchRepository.findLessonCandidates.mockResolvedValue([
      {
        id: 11,
        name: 'Pecahan',
        desc: 'Membandingkan dan menyederhanakan pecahan.',
        updatedAt: '2026-07-24T09:00:00.000Z',
      },
    ]);
    teacherSearchRepository.findActivityCandidates.mockResolvedValue([
      {
        id: 21,
        name: 'Pameran proyek matematika',
        desc: 'Eksplorasi pecahan melalui karya siswa.',
        date: '2026-07-27T09:00:00.000Z',
      },
    ]);

    const result = await searchTeacherRecords({
      requester: { role: 'teacher', teacherId: 9, classId: 3 },
      queryParameters: { q: 'pecahan', limit: '5' },
    });

    expect(result.data.groups.map((group) => group.type)).toEqual([
      'journal',
      'feedback',
      'lesson',
      'activity',
    ]);
    expect(result.data.groups[0].items[0].id).toBe(6);
    expect(result.data.groups[0].items[0].snippet).not.toMatch(/[<>]/);
    expect(result.data.groups[0].items[1].snippet.length).toBeLessThanOrEqual(140);
    for (const group of result.data.groups) {
      for (const item of group.items) {
        expect(Object.keys(item)).toEqual([
          'id',
          'title',
          'subtitle',
          'snippet',
          'studentId',
          'occurredAt',
        ]);
        expect(item).not.toHaveProperty('fileUrl');
        expect(item).not.toHaveProperty('deletedAt');
      }
    }
  });

  test('repository constrains Student and active Journal queries to the teacher class', async () => {
    const studentFindAll = jest.spyOn(Student, 'findAll').mockResolvedValue([]);
    const journalFindAll = jest
      .spyOn(StudentLearningJournal, 'findAll')
      .mockResolvedValue([]);
    const lessonFindAll = jest.spyOn(Lesson, 'findAll').mockResolvedValue([]);
    const activityFindAll = jest.spyOn(Activity, 'findAll').mockResolvedValue([]);

    await actualTeacherSearchRepository.findStudentCandidates({
      classId: 3,
      pattern: '%ari%',
      candidateLimit: 10,
    });
    await actualTeacherSearchRepository.findJournalCandidates({
      classId: 3,
      pattern: '%pecahan%',
      matchingJournalTypes: [],
      candidateLimit: 10,
    });
    await actualTeacherSearchRepository.findLessonCandidates({
      classId: 3,
      pattern: '%pecahan%',
      candidateLimit: 10,
    });
    await actualTeacherSearchRepository.findActivityCandidates({
      pattern: '%pecahan%',
      candidateLimit: 10,
    });

    expect(studentFindAll.mock.calls[0][0]).toEqual(expect.objectContaining({
      where: expect.objectContaining({ ClassId: 3 }),
      limit: 10,
    }));
    const journalOptions = journalFindAll.mock.calls[0][0];
    expect(journalOptions.include.where).toEqual({ ClassId: 3 });
    expect(journalOptions).not.toHaveProperty('paranoid', false);
    expect(journalOptions.limit).toBe(10);
    expect(lessonFindAll.mock.calls[0][0].include.where).toEqual({ ClassId: 3 });
    expect(activityFindAll.mock.calls[0][0].attributes).toContain('desc');
  });

  test('route rejects unauthenticated/Parent access and returns safe invalid query error', async () => {
    const app = express();
    app.use('/teachers', teacherSearchRouter);
    app.use(errorHandler);

    helpers.verifyAuthenticationToken.mockImplementation((token) => {
      if (token === 'parent-token') {
        return { role: 'parent', userId: 4, studentId: 1, classId: 3 };
      }
      return { role: 'teacher', teacherId: 9, classId: 3 };
    });
    jest.spyOn(Teacher, 'findByPk').mockResolvedValue({ id: 9 });
    jest.spyOn(Class, 'findOne').mockResolvedValue({ id: 3 });
    jest.spyOn(console, 'log').mockImplementation(() => {});

    await request(app)
      .get('/teachers/me/search?q=ari')
      .expect(401, { msg: 'Invalid Token' });
    await request(app)
      .get('/teachers/me/search?q=ari')
      .set('access_token', 'parent-token')
      .expect(401, { msg: 'Invalid Token' });
    await request(app)
      .get('/teachers/me/search?q=x')
      .set('access_token', 'teacher-token')
      .expect(400, {
        error: {
          code: 'invalid_search_query',
          message: 'Masukkan minimal 2 karakter untuk mencari.',
        },
      });
  });
});

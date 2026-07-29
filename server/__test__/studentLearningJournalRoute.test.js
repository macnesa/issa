jest.mock('../middlewares/authentication', () => ({
  authenticateActorRequest: jest.fn((request, response, next) => {
    request.user = request.headers.access_token === 'parent-token'
      ? {
        role: 'parent',
        userId: 21,
        studentId: 7,
        classId: 3,
      }
      : {
        role: 'teacher',
        teacherId: 5,
        classId: 3,
      };
    next();
  }),
  authenticateParentRequest: jest.fn((request, response, next) => next()),
  authenticateTeacherRequest: jest.fn((request, response, next) => {
    if (request.headers.access_token === 'parent-token') {
      next({ name: 'unAuthentication' });
      return;
    }
    request.user = {
      role: 'teacher',
      teacherId: 5,
      classId: 3,
    };
    next();
  }),
}));
jest.mock('../modules/student-learning-journal/student-learning-journal.service', () => ({
  createJournalEntry: jest.fn(),
  listJournalEntries: jest.fn(),
  retractJournalEntry: jest.fn(),
  updateJournalEntry: jest.fn(),
}));

const request = require('supertest');
const app = require('../app');
const studentLearningJournalService = require(
  '../modules/student-learning-journal/student-learning-journal.service'
);

const responseEntry = {
  id: 41,
  studentId: 7,
  type: 'observation',
  content: 'Ari mencoba dua strategi.',
  voiceCaptureType: null,
  observedAt: '2026-07-25T08:00:00.000Z',
  teacher: {
    id: 5,
    name: 'Teacher One',
  },
  evidence: null,
  createdAt: '2026-07-25T09:00:00.000Z',
  updatedAt: '2026-07-25T09:00:00.000Z',
  wasEdited: false,
};

describe('Shared Learning Journal HTTP routes', () => {
  let consoleLogSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    studentLearningJournalService.createJournalEntry.mockResolvedValue(
      responseEntry
    );
    studentLearningJournalService.listJournalEntries.mockResolvedValue([
      responseEntry,
    ]);
    studentLearningJournalService.updateJournalEntry.mockResolvedValue({
      ...responseEntry,
      content: 'Catatan terkoreksi.',
      wasEdited: true,
    });
    studentLearningJournalService.retractJournalEntry.mockResolvedValue({
      id: 41,
      studentId: 7,
      retracted: true,
    });
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  test('POST creates a journal entry through Teacher authentication', async () => {
    const journalPayload = {
      type: 'observation',
      content: 'Ari mencoba dua strategi.',
      observedAt: '2026-07-25T08:00:00Z',
    };
    const response = await request(app)
      .post('/students/7/journal')
      .set('access_token', 'teacher-token')
      .send(journalPayload);

    expect(response.status).toBe(201);
    expect(response.body).toEqual(responseEntry);
    expect(studentLearningJournalService.createJournalEntry).toHaveBeenCalledWith({
      studentId: '7',
      requester: {
        role: 'teacher',
        teacherId: 5,
        classId: 3,
      },
      journalPayload,
    });
  });

  test('GET allows an authenticated Parent actor', async () => {
    const response = await request(app)
      .get('/students/7/journal')
      .set('access_token', 'parent-token');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([responseEntry]);
    expect(studentLearningJournalService.listJournalEntries).toHaveBeenCalledWith({
      studentId: '7',
      requester: {
        role: 'parent',
        userId: 21,
        studentId: 7,
        classId: 3,
      },
    });
  });

  test('PATCH updates an entry through Teacher authentication', async () => {
    const response = await request(app)
      .patch('/students/7/journal/41')
      .set('access_token', 'teacher-token')
      .send({ content: 'Catatan terkoreksi.' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(expect.objectContaining({
      id: 41,
      content: 'Catatan terkoreksi.',
      wasEdited: true,
    }));
  });

  test('DELETE returns a compact soft-delete response', async () => {
    const response = await request(app)
      .delete('/students/7/journal/41')
      .set('access_token', 'teacher-token');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: 41,
      studentId: 7,
      retracted: true,
    });
  });

  test.each(['post', 'patch', 'delete'])(
    'Parent is rejected by the %s write route',
    async (method) => {
      const path = method === 'post'
        ? '/students/7/journal'
        : '/students/7/journal/41';
      const response = await request(app)[method](path)
        .set('access_token', 'parent-token')
        .send({});

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ msg: 'Invalid Token' });
    }
  );
});

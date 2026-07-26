jest.mock('../middlewares/authentication', () => ({
  authenticateActorRequest: jest.fn((request, response, next) => next()),
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
jest.mock('../modules/student-evidence/student-evidence.service', () => ({
  correctStudentEvidence: jest.fn(),
  createStudentEvidence: jest.fn(),
  listStudentEvidences: jest.fn(),
  retractStudentEvidence: jest.fn(),
}));

const request = require('supertest');
const app = require('../app');
const studentEvidenceService = require(
  '../modules/student-evidence/student-evidence.service'
);

describe('Student Evidence correction and retraction routes', () => {
  let consoleLogSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    studentEvidenceService.correctStudentEvidence.mockResolvedValue({
      id: 31,
      studentId: 7,
      title: 'Corrected evidence',
    });
    studentEvidenceService.retractStudentEvidence.mockResolvedValue({
      id: 31,
      studentId: 7,
      retracted: true,
    });
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  test('PATCH delegates metadata correction through Teacher auth', async () => {
    const response = await request(app)
      .patch('/students/7/evidences/31')
      .set('access_token', 'teacher-token')
      .send({ title: 'Corrected evidence' });

    expect(response.status).toBe(200);
    expect(studentEvidenceService.correctStudentEvidence).toHaveBeenCalledWith({
      studentId: '7',
      evidenceId: '31',
      requester: {
        role: 'teacher',
        teacherId: 5,
        classId: 3,
      },
      patchPayload: { title: 'Corrected evidence' },
    });
  });

  test('DELETE delegates reason through Teacher auth', async () => {
    const response = await request(app)
      .delete('/students/7/evidences/31')
      .set('access_token', 'teacher-token')
      .send({ reason: 'Incorrect evidence.' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: 31,
      studentId: 7,
      retracted: true,
    });
    expect(studentEvidenceService.retractStudentEvidence).toHaveBeenCalledWith({
      studentId: '7',
      evidenceId: '31',
      requester: {
        role: 'teacher',
        teacherId: 5,
        classId: 3,
      },
      reason: 'Incorrect evidence.',
    });
  });

  test.each(['patch', 'delete'])(
    'Parent is rejected by the %s route using existing auth contract',
    async (method) => {
      const response = await request(app)[method](
        '/students/7/evidences/31'
      )
        .set('access_token', 'parent-token')
        .send({});

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ msg: 'Invalid Token' });
    }
  );
});

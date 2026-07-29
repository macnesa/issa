const express = require('express');
const request = require('supertest');

jest.mock('../middlewares/authentication', () => ({
  authenticateTeacherRequest: jest.fn((req, res, next) => {
    if (req.headers['x-test-role'] !== 'teacher') {
      return next({ name: 'unAuthentication' });
    }
    req.user = {
      role: 'teacher',
      teacherId: 5,
      classId: 3,
    };
    return next();
  }),
}));
jest.mock('../modules/teacher-sync/teacher-sync.service', () => ({
  processTeacherSyncBatch: jest.fn(),
}));

const { errorHandler } = require('../middlewares/errorHandler');
const teacherSyncRouter = require(
  '../modules/teacher-sync/teacher-sync.route'
);
const teacherSyncService = require(
  '../modules/teacher-sync/teacher-sync.service'
);

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/teachers', teacherSyncRouter);
  app.use(errorHandler);
  return app;
}

describe('POST /teachers/me/sync route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    teacherSyncService.processTeacherSyncBatch.mockResolvedValue({
      results: [{
        clientMutationId: 'attendance-1',
        status: 'applied',
        serverRecord: { id: 31, version: 2 },
        conflict: null,
        error: null,
      }],
    });
  });

  test('valid Teacher receives evaluated batch result', async () => {
    const response = await request(createTestApp())
      .post('/teachers/me/sync')
      .set('x-test-role', 'teacher')
      .send({ mutations: [{ clientMutationId: 'attendance-1' }] });

    expect(response.status).toBe(200);
    expect(response.body.results[0]).toEqual(expect.objectContaining({
      clientMutationId: 'attendance-1',
      status: 'applied',
    }));
    expect(teacherSyncService.processTeacherSyncBatch).toHaveBeenCalledWith({
      requester: {
        role: 'teacher',
        teacherId: 5,
        classId: 3,
      },
      syncPayload: { mutations: [{ clientMutationId: 'attendance-1' }] },
    });
  });

  test('Parent is rejected before sync service runs', async () => {
    const response = await request(createTestApp())
      .post('/teachers/me/sync')
      .set('x-test-role', 'parent')
      .send({ mutations: [{ clientMutationId: 'attendance-1' }] });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ msg: 'Invalid Token' });
    expect(teacherSyncService.processTeacherSyncBatch).not.toHaveBeenCalled();
  });

  test('malformed top-level request uses existing HTTP error contract', async () => {
    teacherSyncService.processTeacherSyncBatch.mockRejectedValue({
      name: 'invalidSyncBatch',
    });

    const response = await request(createTestApp())
      .post('/teachers/me/sync')
      .set('x-test-role', 'teacher')
      .send({ mutations: [] });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      msg: 'Sync batch must contain 1 to 50 valid mutations',
    });
  });
});

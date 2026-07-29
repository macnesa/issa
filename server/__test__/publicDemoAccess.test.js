const express = require('express');
const request = require('supertest');

jest.mock('../helpers', () => ({
  createToken: jest.fn(),
  isPasswordMatch: jest.fn(),
  verifyAuthenticationToken: jest.fn(),
}));

jest.mock('../modules/parent/parent.repository', () => ({
  findParentAccountById: jest.fn(),
  findParentAccountByNim: jest.fn(),
}));

jest.mock('../modules/teacher/teacher.repository', () => ({
  findClassByTeacherId: jest.fn(),
  findPublicTeacherList: jest.fn(),
  findTeacherById: jest.fn(),
  findTeacherByNip: jest.fn(),
}));

const { createToken, isPasswordMatch } = require('../helpers');
const { getPublicDemoConfig } = require('../config/public-demo');
const { errorHandler } = require('../middlewares/errorHandler');
const {
  createPublicDemoAccessGuard,
  requireWritableAccount,
} = require('../middlewares/public-demo-access');
const {
  createFixedWindowRateLimiter,
} = require('../middlewares/rate-limit');
const authenticationService = require(
  '../modules/authentication/authentication.service'
);
const parentRepository = require('../modules/parent/parent.repository');
const teacherRepository = require('../modules/teacher/teacher.repository');

const publicDemoEnvironment = {
  PUBLIC_DEMO_ENABLED: 'true',
  DEMO_TEACHER_ID: '5',
  DEMO_PARENT_ID: '17',
};

function createGuardTestApp({ payload }) {
  const app = express();
  app.use(createPublicDemoAccessGuard({
    environment: publicDemoEnvironment,
    verifyToken: () => payload,
  }));
  app.use(express.json());
  app.all('*', (req, res) => res.status(200).json({ reached: true }));
  app.use(errorHandler);
  return app;
}

describe('public demo configuration', () => {
  test('requires server-owned actor IDs whenever public demo is enabled', () => {
    expect(() => getPublicDemoConfig({
      PUBLIC_DEMO_ENABLED: 'true',
    })).toThrow('DEMO_TEACHER_ID must be a positive integer.');
  });

  test('parses enabled demo IDs and bounded default rate limits', () => {
    expect(getPublicDemoConfig(publicDemoEnvironment)).toEqual(
      expect.objectContaining({
        enabled: true,
        teacherId: 5,
        parentId: 17,
        loginRateLimit: {
          windowMs: 60000,
          maximumRequests: 30,
        },
        aiRateLimit: {
          windowMs: 600000,
          maximumRequests: 5,
        },
      })
    );
  });
});

describe('passwordless public demo authentication', () => {
  const originalEnvironment = {};

  beforeAll(() => {
    Object.keys(publicDemoEnvironment).forEach((environmentKey) => {
      originalEnvironment[environmentKey] = process.env[environmentKey];
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    Object.assign(process.env, publicDemoEnvironment);
    createToken.mockReturnValue('demo-token');
    isPasswordMatch.mockReturnValue(true);
    parentRepository.findParentAccountById.mockResolvedValue({
      id: 17,
      StudentId: 7,
      password: 'must-not-be-used',
      Student: {
        Class: {
          TeacherId: 5,
        },
      },
    });
    teacherRepository.findTeacherById.mockResolvedValue({
      id: 5,
      password: 'must-not-be-used',
    });
    teacherRepository.findClassByTeacherId.mockResolvedValue({ id: 3 });
  });

  afterAll(() => {
    Object.entries(originalEnvironment).forEach(([environmentKey, value]) => {
      if (value === undefined) {
        delete process.env[environmentKey];
      } else {
        process.env[environmentKey] = value;
      }
    });
  });

  test('Parent demo login selects only the configured server-side account', async () => {
    await expect(
      authenticationService.authenticatePublicDemoParent({
        parentId: 999,
        password: 'ignored',
      })
    ).resolves.toEqual({
      access_token: 'demo-token',
      id: 17,
      teacherId: 5,
      demo: true,
      readOnly: true,
    });

    expect(parentRepository.findParentAccountById).toHaveBeenCalledWith(17);
    expect(isPasswordMatch).not.toHaveBeenCalled();
    expect(createToken).toHaveBeenCalledWith({
      role: 'parent',
      userId: 17,
      studentId: 7,
      accessMode: 'demo',
    });
  });

  test('Teacher demo login selects only the configured server-side account', async () => {
    await expect(
      authenticationService.authenticatePublicDemoTeacher({
        teacherId: 999,
        classId: 999,
      })
    ).resolves.toEqual({
      id: 5,
      access_token: 'demo-token',
      ClassId: 3,
      demo: true,
      readOnly: true,
    });

    expect(teacherRepository.findTeacherById).toHaveBeenCalledWith(5);
    expect(teacherRepository.findClassByTeacherId).toHaveBeenCalledWith(5);
    expect(isPasswordMatch).not.toHaveBeenCalled();
    expect(createToken).toHaveBeenCalledWith({
      role: 'teacher',
      teacherId: 5,
      classId: 3,
      accessMode: 'demo',
    });
  });

  test('one-click HTTP endpoints reject supplied identity and password fields', async () => {
    const parentRouter = require('../modules/parent/parent.route');
    const teacherRouter = require('../modules/teacher/teacher.route');
    const app = express();
    app.use(express.json());
    app.use('/users', parentRouter);
    app.use('/teachers', teacherRouter);
    app.use(errorHandler);

    const parentResponse = await request(app)
      .post('/users/demo-login')
      .send({ parentId: 999, studentId: 999, password: 'ignored' });
    const teacherResponse = await request(app)
      .post('/teachers/demo-login')
      .send({ teacherId: 999, classId: 999, password: 'ignored' });

    expect(parentResponse.status).toBe(400);
    expect(teacherResponse.status).toBe(400);
    expect(parentRepository.findParentAccountById).not.toHaveBeenCalled();
    expect(teacherRepository.findTeacherById).not.toHaveBeenCalled();
    expect(isPasswordMatch).not.toHaveBeenCalled();
  });

  test('one-click HTTP endpoints return demo tokens without request bodies', async () => {
    const parentRouter = require('../modules/parent/parent.route');
    const teacherRouter = require('../modules/teacher/teacher.route');
    const app = express();
    app.use(express.json());
    app.use('/users', parentRouter);
    app.use('/teachers', teacherRouter);
    app.use(errorHandler);

    const parentResponse = await request(app).post('/users/demo-login');
    const teacherResponse = await request(app).post('/teachers/demo-login');

    expect(parentResponse.status).toBe(200);
    expect(parentResponse.headers['cache-control']).toBe('no-store');
    expect(parentResponse.body).toEqual(expect.objectContaining({
      id: 17,
      demo: true,
      readOnly: true,
    }));
    expect(parentResponse.body).not.toHaveProperty('password');
    expect(teacherResponse.status).toBe(200);
    expect(teacherResponse.headers['cache-control']).toBe('no-store');
    expect(teacherResponse.body).toEqual(expect.objectContaining({
      id: 5,
      ClassId: 3,
      demo: true,
      readOnly: true,
    }));
    expect(teacherResponse.body).not.toHaveProperty('password');
  });

  test('configured demo identity remains read-only through password login', async () => {
    teacherRepository.findTeacherByNip.mockResolvedValue({
      id: 5,
      password: 'teacher-password-hash',
    });

    await expect(authenticationService.authenticateTeacher({
      NIP: 'T-5',
      password: 'valid-password',
    })).resolves.toEqual(expect.objectContaining({
      demo: true,
      readOnly: true,
    }));
    expect(createToken).toHaveBeenCalledWith(expect.objectContaining({
      teacherId: 5,
      accessMode: 'demo',
    }));
  });

  test('non-demo authenticated account retains standard write-capable token', async () => {
    teacherRepository.findTeacherByNip.mockResolvedValue({
      id: 6,
      password: 'teacher-password-hash',
    });
    teacherRepository.findClassByTeacherId.mockResolvedValue({ id: 4 });

    await expect(authenticationService.authenticateTeacher({
      NIP: 'T-6',
      password: 'valid-password',
    })).resolves.toEqual({
      id: 6,
      access_token: 'demo-token',
      ClassId: 4,
    });
    expect(createToken).toHaveBeenCalledWith({
      role: 'teacher',
      teacherId: 6,
      classId: 4,
    });
  });

  test('disabled public demo fails without querying an account', async () => {
    process.env.PUBLIC_DEMO_ENABLED = 'false';

    await expect(authenticationService.authenticatePublicDemoParent())
      .rejects.toEqual({ name: 'publicDemoUnavailable' });
    expect(parentRepository.findParentAccountById).not.toHaveBeenCalled();
  });
});

describe('central public demo read-only guard', () => {
  const demoTeacherPayload = {
    role: 'teacher',
    teacherId: 5,
    classId: 3,
    accessMode: 'demo',
  };

  test.each([
    ['post', '/students'],
    ['post', '/attendances'],
    ['put', '/attendances'],
    ['post', '/scores'],
    ['put', '/scores'],
    ['put', '/students/7'],
    ['post', '/students/7/journal'],
    ['patch', '/students/7/journal/9'],
    ['delete', '/students/7/journal/9'],
    ['post', '/students/7/evidences'],
    ['patch', '/students/7/evidences/4'],
    ['delete', '/students/7/evidences/4'],
    ['post', '/teachers/me/sync'],
  ])('blocks demo %s %s with 403', async (method, path) => {
    const response = await request(
      createGuardTestApp({ payload: demoTeacherPayload })
    )[method](path)
      .set('access_token', 'valid-demo-token')
      .send({});

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      error: {
        code: 'publicDemoReadOnly',
        message: 'Public demo accounts are read-only.',
      },
    });
  });

  test('allows demo reads and the non-persistent AI draft POST', async () => {
    await request(createGuardTestApp({ payload: demoTeacherPayload }))
      .get('/students/7')
      .set('access_token', 'valid-demo-token')
      .expect(200, { reached: true });

    await request(createGuardTestApp({ payload: demoTeacherPayload }))
      .post('/students/7/ai/narrative-draft')
      .set('access_token', 'valid-demo-token')
      .send({})
      .expect(200, { reached: true });
  });

  test('also protects an older standard token for the configured demo identity', async () => {
    const response = await request(createGuardTestApp({
      payload: {
        role: 'teacher',
        teacherId: 5,
        classId: 3,
      },
    }))
      .post('/scores')
      .set('access_token', 'older-token')
      .send({});

    expect(response.status).toBe(403);
  });

  test('does not block a normal authenticated account', async () => {
    await request(createGuardTestApp({
      payload: {
        role: 'teacher',
        teacherId: 6,
        classId: 4,
      },
    }))
      .post('/scores')
      .set('access_token', 'standard-token')
      .send({})
      .expect(200, { reached: true });
  });

  test('route-level guard provides defense before a mutation handler runs', async () => {
    const mutationHandler = jest.fn((req, res) => res.sendStatus(204));
    const app = express();
    app.post(
      '/mutation',
      (req, res, next) => {
        req.user = { role: 'teacher', isDemo: true, accessMode: 'demo' };
        next();
      },
      requireWritableAccount,
      mutationHandler
    );
    app.use(errorHandler);

    await request(app).post('/mutation').expect(403);
    expect(mutationHandler).not.toHaveBeenCalled();
  });
});

describe('public demo rate limiting', () => {
  test('returns Retry-After only after the configured request allowance', async () => {
    const app = express();
    app.get(
      '/limited',
      createFixedWindowRateLimiter({
        windowMs: 10000,
        maximumRequests: 2,
        key: () => 'visitor',
        clock: () => 1000,
      }),
      (req, res) => res.status(200).json({ ok: true })
    );
    app.use(errorHandler);

    await request(app).get('/limited').expect(200);
    await request(app).get('/limited').expect(200);
    const limitedResponse = await request(app).get('/limited');

    expect(limitedResponse.status).toBe(429);
    expect(limitedResponse.headers['retry-after']).toBe('10');
    expect(limitedResponse.body.error.code)
      .toBe('publicDemoRateLimitExceeded');
  });
});

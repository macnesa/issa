const request = require('supertest');
const app = require('../app');
const { sequelize } = require('../models');
const {
  createDatabaseHealthHandler,
  waitForDatabase,
} = require('../lifecycle/database-health');
const {
  createGracefulShutdown,
} = require('../lifecycle/graceful-shutdown');

describe('server liveness and readiness', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  test('GET / remains database-free', async () => {
    const authenticate = jest.spyOn(sequelize, 'authenticate');

    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
    expect(authenticate).not.toHaveBeenCalled();
  });

  test('exposes Retry-After to approved browser clients', async () => {
    const response = await request(app)
      .get('/')
      .set('Origin', 'http://localhost:3001');

    expect(response.status).toBe(200);
    expect(response.headers['access-control-expose-headers'])
      .toContain('Retry-After');
  });

  test('GET /health returns connected when database authentication succeeds', async () => {
    jest.spyOn(sequelize, 'authenticate').mockResolvedValue();

    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok', database: 'connected' });
  });

  test('GET /health returns a sanitized degraded response on database failure', async () => {
    jest.spyOn(sequelize, 'authenticate').mockRejectedValue(
      new Error('password authentication failed for db.internal.example')
    );

    const response = await request(app).get('/health');

    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      status: 'degraded',
      database: 'unavailable',
    });
    expect(response.text).not.toContain('password');
    expect(response.text).not.toContain('db.internal.example');
  });

  test('database readiness checks have a bounded deadline', async () => {
    jest.useFakeTimers();
    const pendingAuthentication = new Promise(() => {});
    const readiness = waitForDatabase(pendingAuthentication, 25);

    jest.advanceTimersByTime(25);

    await expect(readiness).rejects.toThrow('timed out');
  });

  test('health handler rejects an invalid authentication dependency', () => {
    expect(() => createDatabaseHealthHandler({})).toThrow(TypeError);
  });
});

describe('graceful shutdown', () => {
  test('keeps the real HTTP and Socket.IO lifecycle closable', async () => {
    const { httpServer, realtimeServer } = app.createApplicationServer();
    const database = { close: jest.fn().mockResolvedValue() };
    const exit = jest.fn();

    await new Promise((resolve, reject) => {
      httpServer.once('error', reject);
      httpServer.listen(0, '127.0.0.1', resolve);
    });

    const response = await request(httpServer).get('/');
    expect(response.status).toBe(200);
    expect(realtimeServer.engine).toBeDefined();

    const shutdown = createGracefulShutdown({
      httpServer,
      realtimeServer,
      sequelize: database,
      exit,
      logger: { log: jest.fn(), error: jest.fn() },
    });
    await shutdown('SIGTERM');

    expect(httpServer.listening).toBe(false);
    expect(database.close).toHaveBeenCalledTimes(1);
    expect(exit).toHaveBeenCalledWith(0);
  });

  test('closes network resources and the database pool exactly once', async () => {
    const events = [];
    const httpServer = {
      closeAllConnections: jest.fn(),
    };
    const realtimeServer = {
      close: jest.fn((callback) => {
        events.push('network');
        callback();
      }),
    };
    const database = {
      close: jest.fn(async () => {
        events.push('database');
      }),
    };
    const clearRealtimeServer = jest.fn();
    const exit = jest.fn();
    const logger = { log: jest.fn(), error: jest.fn() };
    const shutdown = createGracefulShutdown({
      httpServer,
      realtimeServer,
      sequelize: database,
      clearRealtimeServer,
      exit,
      logger,
    });

    const firstShutdown = shutdown('SIGTERM');
    const secondShutdown = shutdown('SIGINT');

    expect(secondShutdown).toBe(firstShutdown);
    await firstShutdown;

    expect(events).toEqual(['network', 'database']);
    expect(realtimeServer.close).toHaveBeenCalledTimes(1);
    expect(database.close).toHaveBeenCalledTimes(1);
    expect(clearRealtimeServer).toHaveBeenCalledTimes(1);
    expect(httpServer.closeAllConnections).not.toHaveBeenCalled();
    expect(exit).toHaveBeenCalledTimes(1);
    expect(exit).toHaveBeenCalledWith(0);
  });

  test('closes the HTTP server directly when Socket.IO is unavailable', async () => {
    const httpServer = {
      close: jest.fn((callback) => callback()),
    };
    const database = { close: jest.fn().mockResolvedValue() };
    const exit = jest.fn();
    const shutdown = createGracefulShutdown({
      httpServer,
      sequelize: database,
      exit,
      logger: { log: jest.fn(), error: jest.fn() },
    });

    await shutdown('SIGTERM');

    expect(httpServer.close).toHaveBeenCalledTimes(1);
    expect(database.close).toHaveBeenCalledTimes(1);
    expect(exit).toHaveBeenCalledWith(0);
  });
});

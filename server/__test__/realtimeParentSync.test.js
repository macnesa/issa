jest.mock('../middlewares/authentication', () => ({
  authenticateParentRequest: jest.fn(),
}));

const {
  authenticateParentRequest,
} = require('../middlewares/authentication');
const {
  getParentRoom,
  registerParentSocketAuthentication,
} = require('../realtime/realtime-server');
const {
  emitStudentRecordUpdated,
  getStudentRoom,
  setRealtimeServer,
  studentRecordEventName,
} = require('../realtime/student-record-events');

function createFakeSocket(authentication = {}) {
  return {
    data: {},
    handshake: {
      auth: authentication,
    },
    join: jest.fn(),
  };
}

function registerFakeRealtimeServer() {
  const realtimeMiddleware = {};
  const connectionHandlers = {};
  const fakeIo = {
    on: jest.fn((eventName, handler) => {
      connectionHandlers[eventName] = handler;
    }),
    use: jest.fn((handler) => {
      realtimeMiddleware.authenticate = handler;
    }),
  };

  registerParentSocketAuthentication(fakeIo);
  return { connectionHandlers, realtimeMiddleware };
}

function runSocketAuthentication(authenticationMiddleware, socket) {
  return new Promise((resolve) => {
    authenticationMiddleware(socket, (error) => resolve(error));
  });
}

describe('Parent realtime authentication and rooms', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authenticateParentRequest.mockImplementation((request, response, next) => {
      request.user = {
        role: 'parent',
        userId: 21,
        studentId: 7,
        classId: 3,
      };
      next();
    });
  });

  test('accepts a valid Parent access token and joins verified rooms', async () => {
    const { connectionHandlers, realtimeMiddleware } = registerFakeRealtimeServer();
    const socket = createFakeSocket({ accessToken: 'valid-parent-token' });

    await expect(
      runSocketAuthentication(realtimeMiddleware.authenticate, socket)
    ).resolves.toBeUndefined();
    connectionHandlers.connection(socket);

    expect(authenticateParentRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: { access_token: 'valid-parent-token' },
      }),
      null,
      expect.any(Function)
    );
    expect(socket.join).toHaveBeenCalledWith(getParentRoom(21));
    expect(socket.join).toHaveBeenCalledWith(getStudentRoom(7));
  });

  test('rejects an invalid access token', async () => {
    authenticateParentRequest.mockImplementation((request, response, next) => {
      next({ name: 'unAuthentication' });
    });
    const { realtimeMiddleware } = registerFakeRealtimeServer();
    const socket = createFakeSocket({ accessToken: 'invalid-token' });

    const authenticationError = await runSocketAuthentication(
      realtimeMiddleware.authenticate,
      socket
    );

    expect(authenticationError).toEqual(expect.objectContaining({
      message: 'unauthorized',
      data: { code: 'UNAUTHORIZED' },
    }));
  });

  test('derives the student room from authenticated JWT data, not client input', async () => {
    const { connectionHandlers, realtimeMiddleware } = registerFakeRealtimeServer();
    const socket = createFakeSocket({
      accessToken: 'valid-parent-token',
      studentId: 999,
    });

    await runSocketAuthentication(realtimeMiddleware.authenticate, socket);
    connectionHandlers.connection(socket);

    expect(socket.join).toHaveBeenCalledWith(getStudentRoom(7));
    expect(socket.join).not.toHaveBeenCalledWith(getStudentRoom(999));
  });
});

describe('student record invalidation event', () => {
  afterEach(() => {
    setRealtimeServer(null);
  });

  test('emits the minimal payload only to the related student room', () => {
    const emit = jest.fn();
    const to = jest.fn(() => ({ emit }));
    setRealtimeServer({ to });

    expect(emitStudentRecordUpdated({
      studentId: 7,
      recordType: 'attendance',
      occurredAt: '2026-07-25',
    })).toBe(true);

    expect(to).toHaveBeenCalledTimes(1);
    expect(to).toHaveBeenCalledWith(getStudentRoom(7));
    expect(emit).toHaveBeenCalledWith(studentRecordEventName, {
      studentId: 7,
      recordType: 'attendance',
      occurredAt: '2026-07-25',
    });
  });

  test('keeps the HTTP write path independent when realtime delivery is unavailable', () => {
    setRealtimeServer({
      to: jest.fn(() => {
        throw new Error('realtime unavailable');
      }),
    });

    expect(emitStudentRecordUpdated({
      studentId: 7,
      recordType: 'feedback',
      occurredAt: '2026-07-25T12:00:00.000Z',
    })).toBe(false);
  });

  test('supports evidence through the existing student record event', () => {
    const emit = jest.fn();
    const to = jest.fn(() => ({ emit }));
    setRealtimeServer({ to });

    expect(emitStudentRecordUpdated({
      studentId: 7,
      recordType: 'evidence',
      occurredAt: '2026-07-25T12:00:00.000Z',
    })).toBe(true);

    expect(emit).toHaveBeenCalledWith(studentRecordEventName, {
      studentId: 7,
      recordType: 'evidence',
      occurredAt: '2026-07-25T12:00:00.000Z',
    });
  });
});

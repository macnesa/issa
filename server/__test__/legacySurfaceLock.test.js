const request = require('supertest');
const app = require('../app');
const {
  registerParentSocketAuthentication,
} = require('../realtime/realtime-server');

describe('legacy HTTP surface lock', () => {
  test.each([
    ['post', '/teachers/register'],
    ['post', '/users/register'],
    ['post', '/users/generate-midtrans/1'],
    ['get', '/public/transaction'],
    ['patch', '/public/transaction'],
    ['post', '/chatParent'],
    ['get', '/chatParent/1'],
    ['post', '/chatTeacher'],
    ['get', '/chatTeacher/1'],
  ])('%s %s remains unavailable', async (method, path) => {
    const response = await request(app)[method](path);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      msg: 'Route not available in the public demo',
    });
  });
});

describe('legacy Socket.IO surface lock', () => {
  test('connection only joins authenticated Parent rooms without chat handlers', () => {
    let connectionHandler;
    const io = {
      use: jest.fn(),
      on: jest.fn((eventName, handler) => {
        if (eventName === 'connection') connectionHandler = handler;
      }),
    };
    const socket = {
      data: {
        parent: {
          userId: 21,
          studentId: 7,
        },
      },
      join: jest.fn(),
      on: jest.fn(),
    };

    registerParentSocketAuthentication(io);
    connectionHandler(socket);

    expect(socket.join).toHaveBeenCalledWith('parent:21');
    expect(socket.join).toHaveBeenCalledWith('student:7');
    expect(socket.on).not.toHaveBeenCalled();
  });
});

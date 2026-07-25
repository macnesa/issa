const { Server } = require('socket.io');
const { authenticateParentRequest } = require('../middlewares/authentication');
const {
  getStudentRoom,
  setRealtimeServer,
} = require('./student-record-events');

function getParentRoom(parentId) {
  return `parent:${parentId}`;
}

function authenticateParentAccessToken(accessToken) {
  return new Promise((resolve, reject) => {
    const request = {
      headers: {
        access_token: accessToken,
      },
    };

    authenticateParentRequest(request, null, (error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(request.user);
    });
  });
}

function registerParentSocketAuthentication(io) {
  io.use(async (socket, next) => {
    try {
      const authenticatedParent = await authenticateParentAccessToken(
        socket.handshake.auth?.accessToken
      );
      socket.data.parent = authenticatedParent;
      next();
    } catch (error) {
      const authenticationError = new Error('unauthorized');
      authenticationError.data = { code: 'UNAUTHORIZED' };
      next(authenticationError);
    }
  });

  io.on('connection', (socket) => {
    const { userId, studentId } = socket.data.parent;
    socket.join(getParentRoom(userId));
    socket.join(getStudentRoom(studentId));
  });
}

function initializeRealtimeServer(httpServer, { allowedOrigins }) {
  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
    },
  });

  registerParentSocketAuthentication(io);
  setRealtimeServer(io);
  return io;
}

module.exports = {
  authenticateParentAccessToken,
  getParentRoom,
  initializeRealtimeServer,
  registerParentSocketAuthentication,
};

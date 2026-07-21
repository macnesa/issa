const { Server } = require('socket.io');
const axios = require('axios');
const users = {};

const { Chat } = require('../models');
function connIOServer(server) {
  const io = new Server(server, {
    cors: {
      origin: '*',
    },
  });

  io.on('connection', (socket) => {
    socket.on('join:room', (room) => {
      socket.join(room);
    });

    socket.on('chat:msg', async (data) => {
      console.log(data, 'dataaaa');
      try {
        const newChat = await Chat.create({
          fromUserId: data.from,
          roomId: data.room,
          toUserId: data.to,
          message: data.msg.message,
        });
        const chat = await Chat.findAll({ where: { roomId: data.room } });
        io.in(data.room).emit('resp:msg', chat);
      } catch (err) {
        console.log(err);
      }
    });
  });
}

function getIO() {
  return io;
}

module.exports = { connIOServer, getIO };

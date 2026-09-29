// Socket.IO configuration and utilities
const { createAdapter } = require('@socket.io/redis-adapter');
const { getRedisClient } = require('./redis');

const setupRedisAdapter = (io) => {
  try {
    const pubClient = getRedisClient().duplicate();
    const subClient = pubClient.duplicate();
    
    io.adapter(createAdapter(pubClient, subClient));
    console.log('Redis adapter configured for Socket.IO');
  } catch (error) {
    console.warn('Redis adapter not configured:', error.message);
  }
};

const socketConfig = {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
};

module.exports = { setupRedisAdapter, socketConfig };
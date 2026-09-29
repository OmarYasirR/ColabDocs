const app = require('./app');
const http = require('http');
require('dotenv').config();
const { Server } = require('socket.io');
const { setupSocketHandlers } = require('./sockets');
const { connectDatabase } = require('./config/database');
const { connectRedis } = require('./config/redis');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to databases
    await connectDatabase();
    await connectRedis();
    
    // Create HTTP server
    const server = http.createServer(app);
    
    // Setup Socket.IO
    const io = new Server(server, {
      cors: {
        origin: [process.env.CLIENT_URL],
        methods: ['GET', 'POST', 'PATCH'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    // makes `io` reachable from REST controllers via req.app.get('io'),
    // so documentController.addCollaborator can push a real-time
    // notification to the invited user without needing its own socket
    // connection.
    app.set('io', io);
    
    // Setup socket handlers
    setupSocketHandlers(io);
    
    // Start server
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
    
    // Handle graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      server.close(() => {
        logger.info('Process terminated');
      });
    });
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
const Redis = require('ioredis');
const logger = require('../utils/logger');

let redisClient;

const connectRedis = async () => {
  try {
    redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3
    });
    
    redisClient.on('connect', () => {
      logger.info('Redis connected successfully');
    });
    
    redisClient.on('error', (err) => {
      logger.error('Redis error:', err);
    });
    
    // Test connection
    await redisClient.ping();
    
  } catch (error) {
    logger.error('Redis connection failed:', error);
    // Don't exit process, app can work without Redis in fallback mode
  }
};

const getRedisClient = () => {
  if (!redisClient) {
    throw new Error('Redis client not initialized');
  }
  return redisClient;
};

module.exports = { connectRedis, getRedisClient };
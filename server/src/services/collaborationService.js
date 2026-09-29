const Collaboration = require('../models/Collaboration');
const Document = require('../models/Document');
const { getRedisClient } = require('../config/redis');

class CollaborationService {
  constructor() {
    this.redis = null;
    this.documentLocks = new Map();
  }

  
  async init() {
    try {
      this.redis = getRedisClient();
    } catch (error) {
      console.warn('Redis not available for collaboration service');
    }
  }

  // Join document collaboration
  async joinDocument(documentId, userId, socketId) {
    let collaboration = await Collaboration.findOne({ document: documentId });
    
    if (!collaboration) {
      collaboration = await Collaboration.create({
        document: documentId,
        activeUsers: [],
        cursors: [],
        comments: [],
        operations: []
      });
    }

    await collaboration.addActiveUser(userId, socketId);
    
    // Get current active users with details
    await collaboration.populate('activeUsers.user', 'name email avatar');
    
    return collaboration;
  }

  // Leave document
  async leaveDocument(documentId, socketId) {
    const collaboration = await Collaboration.findOne({ document: documentId });
    if (!collaboration) return null;

    await collaboration.removeActiveUser(socketId);
    await collaboration.populate('activeUsers.user', 'name email avatar');
    
    return collaboration;
  }

  // Update cursor position
  async updateCursor(documentId, userId, position, color) {
    const collaboration = await Collaboration.findOne({ document: documentId });
    if (!collaboration) return null;

    await collaboration.updateCursor(userId, position, color);
    return collaboration;
  }

  // Add comment
  async addComment(documentId, commentData) {
    const collaboration = await Collaboration.findOne({ document: documentId });
    if (!collaboration) return null;

    collaboration.comments.push({
      ...commentData,
      createdAt: new Date()
    });

    await collaboration.save();
    return collaboration;
  }

  // Get active users
  async getActiveUsers(documentId) {
    const collaboration = await Collaboration.findOne({ document: documentId })
      .populate('activeUsers.user', 'name email avatar');
    
    return collaboration ? collaboration.activeUsers : [];
  }

  // Lock document for operation (distributed locking with Redis)
  async acquireLock(documentId, timeout = 5000) {
    if (!this.redis) return true; // Fallback if no Redis
    
    const lockKey = `lock:doc:${documentId}`;
    const token = Date.now().toString();
    
    const acquired = await this.redis.set(lockKey, token, 'PX', timeout, 'NX');
    return acquired === 'OK';
  }

  async releaseLock(documentId) {
    if (!this.redis) return;
    
    const lockKey = `lock:doc:${documentId}`;
    await this.redis.del(lockKey);
  }
}

module.exports = new CollaborationService();
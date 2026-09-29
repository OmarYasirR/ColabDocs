const Notification = require('../models/Notification');
const logger = require('../utils/logger');

class NotificationService {
  /**
   * Creates a notification record AND pushes it live over the given
   * socket.io `io` instance if the recipient is currently connected.
   * Persistence always happens; the live push is best-effort (a no-op
   * if they're offline — they'll just see it next time they open the
   * bell).
   */
  async notify(io, { userId, type, data }) {
    try {
      const notification = await Notification.create({ user: userId, type, data });

      if (io) {
        io.to(`user:${userId}`).emit('notification:new', this.serialize(notification));
      }

      return notification;
    } catch (error) {
      logger.error('Error creating notification:', error);
      // Notifications are a secondary concern — never let a failure
      // here bubble up and break the primary action (e.g. sharing a
      // document should still succeed even if this throws).
      return null;
    }
  }

  async getForUser(userId, { page = 1, limit = 20 } = {}) {
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ user: userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Notification.countDocuments({ user: userId }),
      Notification.countDocuments({ user: userId, read: false })
    ]);

    return {
      notifications: notifications.map(this.serialize),
      unreadCount,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    };
  }

  async markRead(userId, notificationId) {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { $set: { read: true, readAt: new Date() } },
      { new: true }
    ).lean();

    return notification ? this.serialize(notification) : null;
  }

  async markAllRead(userId) {
    await Notification.updateMany(
      { user: userId, read: false },
      { $set: { read: true, readAt: new Date() } }
    );
  }

  serialize(n) {
    return {
      id: n._id.toString(),
      type: n.type,
      data: n.data,
      read: n.read,
      createdAt: n.createdAt
    };
  }
}

module.exports = new NotificationService();
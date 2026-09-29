const notificationService = require('../services/notificationService');

exports.getNotifications = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await notificationService.getForUser(req.user.id, {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20
    });
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

exports.markNotificationRead = async (req, res, next) => {
  try {
    const notification = await notificationService.markRead(req.user.id, req.params.id);
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    res.json({ success: true, notification });
  } catch (error) {
    next(error);
  }
};

exports.markAllNotificationsRead = async (req, res, next) => {
  try {
    await notificationService.markAllRead(req.user.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
const express = require('express');
const {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead
} = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

const router = express.Router();  

router.use(protect);

router.get('/', getNotifications);
router.patch('/:id/read', markNotificationRead);
router.post('/read-all', markAllNotificationsRead);

module.exports = router;
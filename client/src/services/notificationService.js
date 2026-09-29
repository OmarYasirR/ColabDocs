// src/services/notificationService.js
import api from './api';

const notificationService = {
  async getNotifications(params = {}) {
    const { data } = await api.get('/notifications', { params });
    return data; // { notifications, unreadCount, pagination }
  },

  async markRead(notificationId) {
    const { data } = await api.patch(`/notifications/${notificationId}/read`);
    return data; // { notification }
  },

  async markAllRead() {
    const { data } = await api.post('/notifications/read-all');
    return data;
  },
};

export default notificationService;
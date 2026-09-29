// src/services/authService.js
import api from './api';
import { AUTH_TOKEN_KEY } from '../utils/constants';

const authService = {
  async login({ email, password }) {
    const { data } = await api.post('/auth/login', { email, password });
    if (data?.token) {
      localStorage.setItem(AUTH_TOKEN_KEY, data.token);
    }
    return data; // { user, token }
  },

  async register({ name, email, password }) {
    const { data } = await api.post('/auth/register', { name, email, password });
    if (data?.token) {
      localStorage.setItem(AUTH_TOKEN_KEY, data.token);
    }
    return data; // { user, token }
  },

  async getCurrentUser() {
    const { data } = await api.get('/auth/me');
    return data; // user
  },

  async logout() {
    try {
      // await api.post('/auth/logout');
    } finally {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      console.log('User logged out'); // Debugging log
    }
    return true;
  },

  async updateProfile(payload) {
    const { data } = await api.patch('/auth/me', payload);
    return data; // updated user
  },
};

export default authService;
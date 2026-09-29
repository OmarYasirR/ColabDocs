// src/services/api.js
import axios from 'axios';
import { API_BASE_URL, AUTH_TOKEN_KEY } from '../utils/constants';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// ---------------------------------------------------------------------------
// Request interceptor — attach bearer token
// ---------------------------------------------------------------------------
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ---------------------------------------------------------------------------
// Response interceptor — normalize errors, handle 401s
// ---------------------------------------------------------------------------
let onUnauthorized = null;

/**
 * Allows the app (e.g. a root-level effect) to register a callback that
 * runs when the API returns a 401, without api.js needing to import the
 * store directly (avoids circular imports).
 */
export const registerUnauthorizedHandler = (handler) => {
  onUnauthorized = handler;
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      if (typeof onUnauthorized === 'function') {
        onUnauthorized();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
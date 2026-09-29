import { io } from 'socket.io-client';
import { SOCKET_URL, AUTH_TOKEN_KEY } from '../utils/constants';

/**
 * Thin singleton wrapper around socket.io-client so the raw socket instance
 * is created once and shared across hooks (useSocket, useCollaboration)
 * without re-instantiating on every render.
 */
class SocketService {
  socket = null;

  connect() {
    if (this.socket?.connected) return this.socket;

    const token = localStorage.getItem(AUTH_TOKEN_KEY);

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    return this.socket;
  }

  getSocket() {
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  emit(event, payload) {
    if (!this.socket) return;
    this.socket.emit(event, payload);
  }

  on(event, handler) {
    if (!this.socket) return;
    this.socket.on(event, handler);
  }

  off(event, handler) {
    if (!this.socket) return;
    this.socket.off(event, handler);
  }
}

export default new SocketService();
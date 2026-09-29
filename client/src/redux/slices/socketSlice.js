// src/redux/slices/socketSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isConnected: false,
  isConnecting: false,
  connectionError: null,
  lastConnectedAt: null,
  reconnectAttempts: 0,
};

const socketSlice = createSlice({
  name: 'socket',
  initialState,
  reducers: {
    connectionStarted(state) {
      state.isConnecting = true;
      state.connectionError = null;
    },
    connectionEstablished(state) {
      state.isConnected = true;
      state.isConnecting = false;
      state.connectionError = null;
      state.lastConnectedAt = new Date().toISOString();
      state.reconnectAttempts = 0;
    },
    connectionLost(state) {
      state.isConnected = false;
      state.isConnecting = false;
    },
    connectionFailed(state, action) {
      state.isConnected = false;
      state.isConnecting = false;
      state.connectionError = action.payload || 'Failed to connect to real-time server';
    },
    reconnectAttempted(state) {
      state.reconnectAttempts += 1;
    },
    resetSocketState() {
      return initialState;
    },
  },
});

export const {
  connectionStarted,
  connectionEstablished,
  connectionLost,
  connectionFailed,
  reconnectAttempted,
  resetSocketState,
} = socketSlice.actions;

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------
export const selectIsSocketConnected = (state) => state.socket.isConnected;
export const selectIsSocketConnecting = (state) => state.socket.isConnecting;
export const selectSocketError = (state) => state.socket.connectionError;
export const selectReconnectAttempts = (state) => state.socket.reconnectAttempts;

export default socketSlice.reducer;
// src/redux/slices/notificationSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import notificationService from '../../services/notificationService';

export const fetchNotifications = createAsyncThunk(
  'notification/fetchNotifications',
  async (params, { rejectWithValue }) => {
    try {
      return await notificationService.getNotifications(params);
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || 'Failed to load notifications');
    }
  }
);

export const markNotificationRead = createAsyncThunk(
  'notification/markNotificationRead',
  async (notificationId, { rejectWithValue }) => {
    try {
      const data = await notificationService.markRead(notificationId);
      return data.notification;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || 'Failed to update notification');
    }
  }
);

export const markAllNotificationsRead = createAsyncThunk(
  'notification/markAllNotificationsRead',
  async (_, { rejectWithValue }) => {
    try {
      await notificationService.markAllRead();
      return true;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || 'Failed to update notifications');
    }
  }
);

const initialState = {
  items: [],
  unreadCount: 0,
  status: 'idle', // idle | loading | succeeded | failed
  error: null,
};

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    // Live push arrival — prepend so newest is first, matching the
    // REST fetch's sort order.
    notificationPushed(state, action) {
      state.items.unshift(action.payload);
      state.unreadCount += 1;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload.notifications;
        state.unreadCount = action.payload.unreadCount;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const idx = state.items.findIndex((n) => n.id === action.payload.id);
        if (idx !== -1 && !state.items[idx].read) {
          state.items[idx] = action.payload;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        state.items = state.items.map((n) => ({ ...n, read: true }));
        state.unreadCount = 0;
      });
  },
});

export const { notificationPushed } = notificationSlice.actions;

export const selectNotifications = (state) => state.notification.items;
export const selectUnreadCount = (state) => state.notification.unreadCount;
export const selectNotificationStatus = (state) => state.notification.status;

export default notificationSlice.reducer;
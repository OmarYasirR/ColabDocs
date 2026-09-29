// src/redux/slices/profileSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from '../../services/authService';

// ---------------------------------------------------------------------------
// Async thunks
// ---------------------------------------------------------------------------
export const updateProfile = createAsyncThunk(
  'profile/updateProfile',
  async (payload, { rejectWithValue }) => {
    try {
      const data = await authService.updateProfile(payload);
      return data; // updated user
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || 'Failed to update profile');
    }
  }
);

const initialState = {
  preferences: {
    emailNotifications: true,
    desktopNotifications: false,
    autoSaveEnabled: true,
  },
  updateStatus: 'idle', // idle | loading | succeeded | failed
  updateError: null,
};

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    setPreference(state, action) {
      const { key, value } = action.payload;
      state.preferences[key] = value;
    },
    clearProfileError(state) {
      state.updateError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateProfile.pending, (state) => {
        state.updateStatus = 'loading';
        state.updateError = null;
      })
      .addCase(updateProfile.fulfilled, (state) => {
        state.updateStatus = 'succeeded';
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.updateStatus = 'failed';
        state.updateError = action.payload;
      });
  },
});

export const { setPreference, clearProfileError } = profileSlice.actions;

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------
export const selectPreferences = (state) => state.profile.preferences;
export const selectProfileUpdateStatus = (state) => state.profile.updateStatus;
export const selectProfileUpdateError = (state) => state.profile.updateError;

export default profileSlice.reducer;
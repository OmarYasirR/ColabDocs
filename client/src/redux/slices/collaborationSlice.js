// src/redux/slices/collaborationSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  activeDocumentId: null,
  activeUsers: {},

  comments: [],
};

const collaborationSlice = createSlice({
  name: 'collaboration',
  initialState,
  reducers: {
    joinedDocument(state, action) {
      state.activeDocumentId = action.payload;
      state.activeUsers = {};
      state.comments = [];
    },
    leftDocument() {
      return initialState;
    },
    presenceSynced(state, action) {
      const users = action.payload || [];
      state.activeUsers = users.reduce((acc, u) => {
        acc[u.userId] = { userId: u.userId, name: u.name };
        return acc;
      }, {});
    },
    commentsLoaded(state, action) {
      state.comments = action.payload;
    },
    commentAdded(state, action) {
      state.comments.push(action.payload);
    },
    commentUpdated(state, action) {
      const idx = state.comments.findIndex((c) => c.id === action.payload.id);
      if (idx !== -1) state.comments[idx] = { ...state.comments[idx], ...action.payload };
    },
    commentRemoved(state, action) {
      state.comments = state.comments.filter((c) => c.id !== action.payload);
    },
  },
});

export const {
  joinedDocument,
  leftDocument,
  presenceSynced,
  commentsLoaded,
  commentAdded,
  commentUpdated,
  commentRemoved,
} = collaborationSlice.actions;

export const selectActiveDocumentId = (state) => state.collaboration.activeDocumentId;
export const selectActiveUsers = (state) => Object.values(state.collaboration.activeUsers);
export const selectComments = (state) => state.collaboration.comments;
export const selectUnresolvedComments = (state) =>
  state.collaboration.comments.filter((c) => !c.resolved);

export default collaborationSlice.reducer;
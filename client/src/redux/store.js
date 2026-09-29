import { configureStore } from '@reduxjs/toolkit';
import notificationReducer from './slices/notificationSlice';
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';
import documentReducer from './slices/documentSlice';
import collaborationReducer from './slices/collaborationSlice';
import socketReducer from './slices/socketSlice';
import profileReducer from './slices/profileSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    document: documentReducer,
    collaboration: collaborationReducer,
    socket: socketReducer,
    profile: profileReducer,
    notification: notificationReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['socket/setSocketInstance'],
        ignoredPaths: ['socket.instance'],
      },
    }),
  devTools: import.meta.env.MODE !== 'production',
});

export default store;
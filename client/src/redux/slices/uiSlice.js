import { createSlice, nanoid } from '@reduxjs/toolkit';
import { TOAST_DURATION_MS } from '../../utils/constants';

const isDesktop =
  typeof window !== 'undefined' && window.innerWidth >= 1024;

const initialState = {
  sidebarOpen: isDesktop,
  activeModal: null,
  toasts: [],
  theme: 'light',
  globalLoading: false,
  hasUnreadNotifications: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen(state, action) {
      state.sidebarOpen = action.payload;
    },
    openModal(state, action) {
      const { type, props = {} } = action.payload;
      state.activeModal = { type, props };
    },
    closeModal(state) {
      state.activeModal = null;
    },
    addToast: {
      reducer(state, action) {
        state.toasts.push(action.payload);
      },
      prepare({ type = 'info', message, duration = TOAST_DURATION_MS }) {
        return { payload: { id: nanoid(), type, message, duration } };
      },
    },
    removeToast(state, action) {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
    setGlobalLoading(state, action) {
      state.globalLoading = action.payload;
    },
    notificationReceived(state) {
      state.hasUnreadNotifications = true;
    },
    notificationsCleared(state) {
      state.hasUnreadNotifications = false;
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  openModal,
  closeModal,
  addToast,
  removeToast,
  setGlobalLoading,
  notificationReceived,
  notificationsCleared,
} = uiSlice.actions;

export const selectSidebarOpen = (state) => state.ui.sidebarOpen;
export const selectActiveModal = (state) => state.ui.activeModal;
export const selectToasts = (state) => state.ui.toasts;
export const selectGlobalLoading = (state) => state.ui.globalLoading;
export const selectHasUnreadNotifications = (state) =>
  state.ui.hasUnreadNotifications;

export default uiSlice.reducer;
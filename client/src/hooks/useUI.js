// src/hooks/useUI.js
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
  toggleSidebar,
  setSidebarOpen,
  openModal,
  closeModal,
  addToast,
  setGlobalLoading,
  selectSidebarOpen,
  selectActiveModal,
  selectGlobalLoading,
} from '../redux/slices/uiSlice';

/**
 * Thin wrapper around uiSlice — the single entry point components use
 * for sidebar toggling, modal orchestration, and toast notifications.
 */
const useUI = () => {
  const dispatch = useDispatch();

  const sidebarOpen = useSelector(selectSidebarOpen);
  const activeModal = useSelector(selectActiveModal);
  const globalLoading = useSelector(selectGlobalLoading);

  const toggleSidebarOpen = useCallback(() => dispatch(toggleSidebar()), [dispatch]);
  const setSidebar = useCallback((open) => dispatch(setSidebarOpen(open)), [dispatch]);

  const showModal = useCallback(
    (type, props = {}) => dispatch(openModal({ type, props })),
    [dispatch]
  );
  const hideModal = useCallback(() => dispatch(closeModal()), [dispatch]);

  const notify = useCallback(
    (message, type = 'info', duration) => dispatch(addToast({ type, message, duration })),
    [dispatch]
  );

  const setLoading = useCallback((value) => dispatch(setGlobalLoading(value)), [dispatch]);

  return {
    sidebarOpen,
    activeModal,
    globalLoading,
    toggleSidebarOpen,
    setSidebar,
    showModal,
    hideModal,
    notify,
    setLoading,
  };
};

export default useUI;
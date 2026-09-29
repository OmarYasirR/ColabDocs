import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
  loginUser,
  registerUser,
  logoutUser,
  fetchCurrentUser,
  clearAuthError,
  selectCurrentUser,
  selectAuthToken,
  selectIsAuthenticated,
  selectAuthStatus,
  selectAuthError,
  selectIsAuthInitialized,
} from '../redux/slices/authSlice';
import { addToast } from '../redux/slices/uiSlice';
import { useNavigate } from 'react-router-dom';
import { AUTH_TOKEN_KEY } from '../utils/constants';

/**
 * Centralized auth hook — wraps the authSlice thunks/selectors so
 * components never need to import redux/slices/authSlice directly.
 */
const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const user = useSelector(selectCurrentUser);
  const token = useSelector(selectAuthToken);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const status = useSelector(selectAuthStatus);
  const error = useSelector(selectAuthError);
  const isInitialized = useSelector(selectIsAuthInitialized);

  useEffect(() => {
    console.log('useAuth state:', { user, token, isAuthenticated, status, error, isInitialized });
  }, [user, token, isAuthenticated, status, error, isInitialized]);

  const login = useCallback(
    async (credentials) => {
      const result = await dispatch(loginUser(credentials));
      if (loginUser.fulfilled.match(result)) {
        dispatch(addToast({ type: 'success', message: 'Welcome back!' }));
        return { success: true };
      }
      return { success: false, error: result.payload };
    },
    [dispatch]
  );

  const register = useCallback(
    async (payload) => {
      const result = await dispatch(registerUser(payload));
      if (registerUser.fulfilled.match(result)) {
        dispatch(addToast({ type: 'success', message: 'Account created successfully' }));
        return { success: true };
      }
      return { success: false, error: result.payload };
    },
    [dispatch]
  );

  const logout = useCallback(async () => {
    await dispatch(logoutUser());
    dispatch(addToast({ type: 'info', message: 'You have been logged out' }));
    navigate('/login');
  }, [dispatch, navigate]);

  const bootstrapSession = useCallback(() => {
    if (localStorage.getItem(AUTH_TOKEN_KEY)) {
      dispatch(fetchCurrentUser());
    }
  }, [dispatch]);

  const clearError = useCallback(() => dispatch(clearAuthError()), [dispatch]);

  return {
    user,
    token,
    isAuthenticated,
    status,
    error,
    isInitialized,
    login,
    register,
    logout,
    bootstrapSession,
    clearError,
  };
};

export default useAuth;
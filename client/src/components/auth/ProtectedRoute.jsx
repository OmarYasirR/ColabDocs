// src/components/auth/ProtectedRoute.jsx
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import Spinner from '../common/Spinner';

/**
 * Guards nested routes behind authentication. Renders a full-screen
 * spinner while the initial session bootstrap (fetchCurrentUser) is
 * in flight, then redirects to /login (preserving the intended
 * destination) if the user is not authenticated.
 */
const ProtectedRoute = () => {
  const { isAuthenticated, isInitialized, status } = useAuth();
  const location = useLocation();

  if (!isInitialized && status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
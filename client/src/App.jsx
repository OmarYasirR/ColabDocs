import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import EditorLayout from "./components/layout/EditorLayout";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Toast from "./components/common/Toast";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import DocumentEditorPage from "./pages/DocumentEditor";
import ProfilePage from "./pages/ProfilePage";
import NotFound from "./pages/NotFound";

import useAuth from "./hooks/useAuth";
import useSocket from "./hooks/useSocket";
import { registerUnauthorizedHandler } from "./services/api";
import { logoutUser, selectAuthStatus } from "./redux/slices/authSlice";

import "./App.css";
import Spinner from "./components/common/Spinner";

function App() {
  const dispatch = useDispatch();
  const { bootstrapSession, isAuthenticated } = useAuth();
  const status = useSelector(selectAuthStatus);

  // Establish/tear down the real-time connection based on auth state.
  // Mounted once at the app root so it persists across route changes.
  useSocket();

  // On first load, if a token exists in localStorage, verify it and
  // hydrate the user into Redux before rendering protected routes.
  useEffect(() => {
    bootstrapSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // If the API layer detects a 401 (expired/invalid token) on any
  // request, force a clean logout rather than leaving stale state.
  useEffect(() => {
    registerUnauthorizedHandler(() => {
      dispatch(logoutUser());
    });
  }, [dispatch]);

  return (
    <div className="App h-full">
      {/* show spinner while initializing auth state */}
      {status === "loading" ? (
        <div className="flex justify-center items-center h-full">
          <Spinner size="lg" />
        </div>
      ) : (
        <Routes>
          {/* Public routes */}
          <Route
            path="/login"
            element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
            }
          />
          <Route
            path="/register"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Register />
              )
            }
          />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<EditorLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/:filter" element={<Dashboard />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route
                path="/documents/:documentId"
                element={<DocumentEditorPage />}
              />
            </Route>
          </Route>

          {/* Root redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      )}
      <Toast />
    </div>
  );
}

export default App;

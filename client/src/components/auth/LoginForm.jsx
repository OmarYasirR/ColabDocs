import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiMail, FiLock, FiAlertCircle, FiX } from 'react-icons/fi';

import Input from '../common/Input';
import Button from '../common/Button';
import useAuth from '../../hooks/useAuth';
import { validateEmail, validateRequired } from '../../utils/validators';

const LoginForm = () => {
  const { login, status, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const errorRef = useRef(null);

  const isSubmitting = status === 'loading';

  // Move focus to the error banner when a new auth error appears so
  // keyboard / screen-reader users are notified immediately.
  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.focus({ preventScroll: false });
    }
  }, [error]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
    if (error) clearError();
  };

  const validate = () => {
    const errors = {};
    if (!validateEmail(form.email)) errors.email = 'Enter a valid email address';
    if (!validateRequired(form.password)) errors.password = 'Password is required';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const result = await login(form);
    if (result.success) {
      const redirectTo = location.state?.from?.pathname || '/dashboard';
      navigate(redirectTo, { replace: true });
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm space-y-5"
      noValidate
    >
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Welcome back
        </h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Log in to continue to CollabEdit
        </p>
      </div>

      {error && (
        <div
          ref={errorRef}
          role="alert"
          aria-live="assertive"
          tabIndex={-1}
          className="flex animate-slide-up items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700 outline-none focus:ring-2 focus:ring-rose-300"
        >
          <FiAlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={clearError}
            className="-m-0.5 rounded-md p-0.5 text-rose-400 transition-colors hover:bg-rose-100 hover:text-rose-600"
            aria-label="Dismiss error"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>
      )}

      <Input
        label="Email"
        name="email"
        type="email"
        icon={FiMail}
        placeholder="you@company.com"
        value={form.email}
        onChange={handleChange}
        error={fieldErrors.email}
        autoComplete="email"
      />

      <Input
        label="Password"
        name="password"
        type="password"
        icon={FiLock}
        placeholder="Enter your password"
        value={form.password}
        onChange={handleChange}
        error={fieldErrors.password}
        autoComplete="current-password"
      />

      <Button type="submit" fullWidth size="lg" isLoading={isSubmitting}>
        Log in
      </Button>

      <p className="text-center text-sm text-slate-500">
        Don&apos;t have an account?{' '}
        <Link
          to="/register"
          className="font-medium text-indigo-600 hover:text-indigo-700"
        >
          Sign up
        </Link>
      </p>
    </form>
  );
};

export default LoginForm;
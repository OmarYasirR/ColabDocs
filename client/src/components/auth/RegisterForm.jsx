import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiUser, FiMail, FiLock, FiAlertCircle, FiX } from 'react-icons/fi';

import Input from '../common/Input';
import Button from '../common/Button';
import useAuth from '../../hooks/useAuth';
import {
  validateEmail,
  validateRequired,
  validatePasswordStrength,
} from '../../utils/validators';

const RegisterForm = () => {
  const { register, status, error, clearError } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const errorRef = useRef(null);

  const isSubmitting = status === 'loading';

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
    if (!validateRequired(form.name)) errors.name = 'Name is required';
    if (!validateEmail(form.email)) errors.email = 'Enter a valid email address';
    if (!validatePasswordStrength(form.password)) {
      errors.password = 'Password must be at least 8 characters';
    }
    if (form.confirmPassword !== form.password) {
      errors.confirmPassword = 'Passwords do not match';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const { name, email, password } = form;
    const result = await register({ name, email, password });
    if (result.success) {
      navigate('/dashboard', { replace: true });
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm space-y-4"
      noValidate
    >
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Create your account
        </h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Start collaborating in seconds
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
        label="Full name"
        name="name"
        type="text"
        icon={FiUser}
        placeholder="Ada Lovelace"
        value={form.name}
        onChange={handleChange}
        error={fieldErrors.name}
        autoComplete="name"
      />

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
        placeholder="At least 8 characters"
        value={form.password}
        onChange={handleChange}
        error={fieldErrors.password}
        autoComplete="new-password"
      />

      <Input
        label="Confirm password"
        name="confirmPassword"
        type="password"
        icon={FiLock}
        placeholder="Re-enter your password"
        value={form.confirmPassword}
        onChange={handleChange}
        error={fieldErrors.confirmPassword}
        autoComplete="new-password"
      />

      <Button type="submit" fullWidth size="lg" isLoading={isSubmitting}>
        Create account
      </Button>

      <p className="text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-medium text-indigo-600 hover:text-indigo-700"
        >
          Log in
        </Link>
      </p>
    </form>
  );
};

export default RegisterForm;
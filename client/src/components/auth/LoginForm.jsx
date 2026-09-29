// src/components/auth/LoginForm.jsx
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiMail, FiLock } from 'react-icons/fi';

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

  const isSubmitting = status === 'loading';

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
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Welcome back</h1>
        <p className="mt-1 text-sm text-slate-500">Log in to continue to CollabEdit</p>
      </div>

      {error && (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
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
        placeholder="••••••••"
        value={form.password}
        onChange={handleChange}
        error={fieldErrors.password}
        autoComplete="current-password"
      />

      <Button type="submit" fullWidth isLoading={isSubmitting}>
        Log in
      </Button>

      <p className="text-center text-sm text-slate-500">
        Don&apos;t have an account?{' '}
        <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-700">
          Sign up
        </Link>
      </p>
    </form>
  );
};

export default LoginForm;
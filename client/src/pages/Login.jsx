// src/pages/Login.jsx
import LoginForm from '../components/auth/LoginForm';
import { APP_NAME } from '../utils/constants';

const Login = () => {
  return (
    <div className="flex min-h-screen">
      {/* Left: form */}
      <div className="flex w-full flex-col justify-center px-6 sm:px-12 lg:w-1/2 lg:px-24">
        <LoginForm />
      </div>

      {/* Right: brand panel */}
      <div className="relative hidden w-1/2 items-center justify-center bg-indigo-600 lg:flex">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-violet-700" />
        <div className="relative z-10 max-w-md px-12 text-center text-white">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-white/10 backdrop-blur">
            <img src="/collabedit-icon-monochrome.svg" alt="" className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-semibold">{APP_NAME}</h2>
          <p className="mt-3 text-indigo-100">
            Real-time collaborative editing, live cursors, and comments — all in one place for
            your team.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
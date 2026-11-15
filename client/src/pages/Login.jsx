import LoginForm from '../components/auth/LoginForm';
import { APP_NAME } from '../utils/constants';

const Login = () => {
  return (
    <div className="flex min-h-screen bg-white">
      <div className="flex w-full flex-col justify-center px-6 py-12 sm:px-10 lg:w-1/2 lg:px-20">
        <div className="mx-auto w-full max-w-sm">
          <LoginForm />
        </div>
      </div>

      <div className="relative hidden w-1/2 items-center justify-center overflow-hidden bg-indigo-600 lg:flex">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-violet-700 to-fuchsia-700" />
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-fuchsia-400/20 blur-3xl" />
        <div className="relative z-10 max-w-md px-12 text-center text-white">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
            <img
              src="/collabedit-icon-monochrome.svg"
              alt=""
              className="h-8 w-8"
            />
          </div>
          <h2 className="text-3xl font-semibold tracking-tight">{APP_NAME}</h2>
          <p className="mt-3 text-sm text-indigo-100">
            Real-time collaborative editing, live cursors, and comments — all in
            one place for your team.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
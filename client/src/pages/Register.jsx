// src/pages/Register.jsx
import RegisterForm from '../components/auth/RegisterForm';
import { APP_NAME } from '../utils/constants';

const Register = () => {
  return (
    <div className="flex min-h-screen">
      {/* Left: brand panel */}
      <div className="relative hidden w-1/2 items-center justify-center bg-indigo-600 lg:flex">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-700 to-indigo-600" />
        <div className="relative z-10 max-w-md px-12 text-center text-white">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-white/10 backdrop-blur">
            <img src="/collabedit-icon-monochrome.svg" alt="" className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-semibold">Join {APP_NAME}</h2>
          <p className="mt-3 text-indigo-100">
            Create, share, and co-author documents with your team in real time.
          </p>
        </div>
      </div>

      {/* Right: form */}
      <div className="flex w-full flex-col justify-center px-6 sm:px-12 lg:w-1/2 lg:px-24">
        <RegisterForm />
      </div>
    </div>
  );
};

export default Register;
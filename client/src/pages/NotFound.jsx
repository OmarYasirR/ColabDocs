// src/pages/NotFound.jsx
import { useNavigate } from 'react-router-dom';
import { HiOutlineFaceFrown } from 'react-icons/hi2';
import Button from '../components/common/Button';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center">
      <HiOutlineFaceFrown className="h-16 w-16 text-indigo-300" />
      <h1 className="mt-4 text-3xl font-bold text-slate-900">404</h1>
      <p className="mt-2 text-slate-500">
        We couldn&apos;t find the page you&apos;re looking for.
      </p>
      <div className="mt-6 flex gap-3">
        <Button variant="secondary" onClick={() => navigate(-1)}>
          Go back
        </Button>
        <Button onClick={() => navigate('/dashboard')}>Go to dashboard</Button>
      </div>
    </div>
  );
};

export default NotFound;
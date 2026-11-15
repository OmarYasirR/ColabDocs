import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

const EditorLayout = () => {
  return (
    <div className="flex h-screen flex-col bg-slate-50">
      <Header />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <Sidebar />
        <main className="min-w-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default EditorLayout;
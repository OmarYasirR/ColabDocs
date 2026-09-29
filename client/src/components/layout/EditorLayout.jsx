import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

/**
 * Top-level app shell: fixed header, collapsible sidebar, and a scrollable
 * content area rendered via <Outlet /> for nested routes (Dashboard,
 * DocumentEditor page, ProfilePage, etc.).
 */
const EditorLayout = () => {
  return (
    <div className="flex h-screen flex-col bg-slate-50">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default EditorLayout;
// src/components/layout/Sidebar.jsx
import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  HiOutlineHome,
  HiOutlineDocumentText,
  HiOutlineClock,
  HiOutlineStar,
  HiOutlineTrash,
  HiOutlineUsers,
} from 'react-icons/hi2';

import { selectSidebarOpen } from '../../redux/slices/uiSlice';

const navItems = [
  { label: 'Home', to: '/dashboard', icon: HiOutlineHome, end: true },
  { label: 'My Documents', to: '/dashboard/documents', icon: HiOutlineDocumentText },
  { label: 'Recent', to: '/dashboard/recent', icon: HiOutlineClock },
  { label: 'Favorites', to: '/dashboard/favorites', icon: HiOutlineStar },
  { label: 'Shared with me', to: '/dashboard/shared', icon: HiOutlineUsers },
  { label: 'Trash', to: '/dashboard/trash', icon: HiOutlineTrash },
];

const Sidebar = () => {
  const sidebarOpen = useSelector(selectSidebarOpen);

  return (
    <aside
      className={`h-full shrink-0 border-r border-slate-200 bg-slate-50 transition-all duration-200 ease-in-out ${
        sidebarOpen ? 'w-60' : 'w-0 overflow-hidden'
      }`}
    >
      <nav className="flex h-full w-60 flex-col gap-1 p-3">
        {navItems.map(({ label, to, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`
            }
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span className="truncate">{label}</span>
          </NavLink>
        ))}

        <div className="mt-auto rounded-lg border border-slate-200 bg-white p-3 shadow-card">
          <p className="text-xs font-semibold text-slate-700">Storage</p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-1/3 rounded-full bg-indigo-600" />
          </div>
          <p className="mt-1.5 text-xs text-slate-400">3.2 GB of 10 GB used</p>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
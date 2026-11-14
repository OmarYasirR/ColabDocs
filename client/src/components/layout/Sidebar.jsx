import { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  HiOutlineHome,
  HiOutlineDocumentText,
  HiOutlineClock,
  HiOutlineStar,
  HiOutlineTrash,
  HiOutlineUsers,
  HiOutlineCloud,
} from 'react-icons/hi2';

import {
  selectSidebarOpen,
  setSidebarOpen,
} from '../../redux/slices/uiSlice';
import { cx } from '../../utils/helpers';

const navItems = [
  { label: 'Home', to: '/dashboard', icon: HiOutlineHome, end: true },
  { label: 'My Documents', to: '/dashboard/documents', icon: HiOutlineDocumentText },
  { label: 'Recent', to: '/dashboard/recent', icon: HiOutlineClock },
  { label: 'Favorites', to: '/dashboard/favorites', icon: HiOutlineStar },
  { label: 'Shared with me', to: '/dashboard/shared', icon: HiOutlineUsers },
  { label: 'Trash', to: '/dashboard/trash', icon: HiOutlineTrash },
];

const Sidebar = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const sidebarOpen = useSelector(selectSidebarOpen);

  const close = () => dispatch(setSidebarOpen(false));

  // Auto-close the drawer on mobile after navigation
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      dispatch(setSidebarOpen(false));
    }
  }, [location.pathname, dispatch]);

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={cx(
          'fixed inset-x-0 bottom-0 top-14 z-30 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-200 lg:hidden',
          sidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={close}
        aria-hidden="true"
      />

      <aside
        className={cx(
          'fixed bottom-0 left-0 top-14 z-40 flex w-60 flex-col border-r border-slate-200 bg-white shadow-xl',
          'transition-all duration-200 ease-out',
          'lg:static lg:top-auto lg:bottom-auto lg:z-auto lg:h-full lg:overflow-hidden lg:shadow-none',
          sidebarOpen
            ? 'translate-x-0 lg:w-60'
            : '-translate-x-full lg:w-0 lg:translate-x-0'
        )}
        aria-label="Primary navigation"
      >
        <nav className="flex h-full w-full flex-col gap-1 overflow-y-auto p-3 lg:w-60">
          {navItems.map(({ label, to, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cx(
                  'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={cx(
                      'h-5 w-5 shrink-0 transition-colors',
                      isActive
                        ? 'text-indigo-600'
                        : 'text-slate-400 group-hover:text-slate-600'
                    )}
                  />
                  <span className="truncate">{label}</span>
                </>
              )}
            </NavLink>
          ))}

          <div className="mt-auto rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-3.5">
            <div className="flex items-center gap-2">
              <HiOutlineCloud className="h-4 w-4 text-indigo-500" />
              <p className="text-xs font-semibold text-slate-700">Storage</p>
            </div>
            <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
              <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" />
            </div>
            <p className="mt-2 text-[11px] text-slate-500">3.2 GB of 10 GB used</p>
          </div>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
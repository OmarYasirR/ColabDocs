import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { HiOutlineBars3, HiOutlineChevronDown } from 'react-icons/hi2';
import { FiUser, FiSettings, FiLogOut } from 'react-icons/fi';

import { toggleSidebar } from '../../redux/slices/uiSlice';
import { selectCurrentUser } from '../../redux/slices/authSlice';
import useAuth from '../../hooks/useAuth';
import { APP_NAME } from '../../utils/constants';
import NotificationDropdown from './NotificationDropdown';
import { cx } from '../../utils/helpers';

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const { logout } = useAuth();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200 bg-white/90 px-2.5 backdrop-blur sm:px-4">
      <div className="flex items-center gap-1.5 sm:gap-3">
        <button
          type="button"
          onClick={() => dispatch(toggleSidebar())}
          className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          aria-label="Toggle sidebar"
        >
          <HiOutlineBars3 className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 rounded-lg px-1 py-1 transition-colors hover:bg-slate-50"
        >
          <img src="/collabedit-wordmark-light.svg" className="h-9 w-auto" alt="applogo" />
        </button>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <NotificationDropdown />

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className={cx(
              'flex items-center gap-2 rounded-lg px-1.5 py-1 transition-colors',
              'hover:bg-slate-100',
              menuOpen && 'bg-slate-100'
            )}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 text-xs font-semibold text-indigo-700 ring-2 ring-white">
              {initials}
            </div>
            <span className="hidden max-w-[10rem] truncate text-sm font-medium text-slate-700 sm:inline">
              {user?.name || 'Account'}
            </span>
            <HiOutlineChevronDown
              className={cx(
                'hidden h-4 w-4 text-slate-400 transition-transform sm:inline',
                menuOpen && 'rotate-180'
              )}
            />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 z-20 mt-2 w-52 animate-slide-up rounded-xl border border-slate-200 bg-white py-1 shadow-popover"
            >
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  navigate('/profile');
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                <FiUser className="h-4 w-4 text-slate-400" />
                Profile
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                <FiSettings className="h-4 w-4 text-slate-400" />
                Settings
              </button>
              <div className="my-1 border-t border-slate-100" />
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"
              >
                <FiLogOut className="h-4 w-4" />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { HiOutlineBell, HiOutlineDocumentText } from 'react-icons/hi2';

import Spinner from '../common/Spinner';
import { formatRelativeTime, cx } from '../../utils/helpers';
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  selectNotifications,
  selectUnreadCount,
  selectNotificationStatus,
} from '../../redux/slices/notificationSlice';

const NOTIFICATION_COPY = {
  document_shared: (n) => `${n.data.actorName || 'Someone'} shared "${n.data.documentTitle}" with you`,
  comment_added: (n) => `${n.data.actorName || 'Someone'} commented on "${n.data.documentTitle}"`,
  comment_resolved: (n) => `A comment was resolved on "${n.data.documentTitle}"`,
};

const NotificationDropdown = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const notifications = useSelector(selectNotifications);
  const unreadCount = useSelector(selectUnreadCount);
  const status = useSelector(selectNotificationStatus);

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpen = () => {
    setIsOpen((o) => !o);
    if (!isOpen && status === 'idle') {
      dispatch(fetchNotifications());
    }
  };

  const handleItemClick = (notification) => {
    if (!notification.read) {
      dispatch(markNotificationRead(notification.id));
    }
    setIsOpen(false);
    if (notification.data?.documentId) {
      navigate(`/documents/${notification.data.documentId}`);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={handleOpen}
        className="relative rounded-md p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
        aria-label="Notifications"
      >
        <HiOutlineBell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-20 mt-2 w-80 animate-slide-up rounded-lg border border-slate-200 bg-white shadow-popover">
          <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2.5">
            <span className="text-sm font-semibold text-slate-900">Notifications</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => dispatch(markAllNotificationsRead())}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {status === 'loading' && (
              <div className="flex justify-center py-8">
                <Spinner size="sm" />
              </div>
            )}

            {status === 'succeeded' && notifications.length === 0 && (
              <p className="py-8 text-center text-sm text-slate-400">
                You're all caught up.
              </p>
            )}

            {notifications.map((n) => {
              const copyFn = NOTIFICATION_COPY[n.type];
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleItemClick(n)}
                  className={cx(
                    'flex w-full items-start gap-2.5 px-3 py-2.5 text-left hover:bg-slate-50',
                    !n.read && 'bg-indigo-50/50'
                  )}
                >
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                    <HiOutlineDocumentText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-700">
                      {copyFn ? copyFn(n) : 'New notification'}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {formatRelativeTime(n.createdAt)}
                    </p>
                  </div>
                  {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-600" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
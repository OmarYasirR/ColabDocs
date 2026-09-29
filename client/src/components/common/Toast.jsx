// src/components/common/Toast.jsx
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineExclamationTriangle,
  HiOutlineInformationCircle,
  HiOutlineXMark,
} from 'react-icons/hi2';

import { selectToasts, removeToast } from '../../redux/slices/uiSlice';
import { cx } from '../../utils/helpers';

const TOAST_STYLES = {
  success: {
    icon: HiOutlineCheckCircle,
    classes: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    iconClasses: 'text-emerald-500',
  },
  error: {
    icon: HiOutlineXCircle,
    classes: 'border-rose-200 bg-rose-50 text-rose-800',
    iconClasses: 'text-rose-500',
  },
  warning: {
    icon: HiOutlineExclamationTriangle,
    classes: 'border-amber-200 bg-amber-50 text-amber-800',
    iconClasses: 'text-amber-500',
  },
  info: {
    icon: HiOutlineInformationCircle,
    classes: 'border-slate-200 bg-white text-slate-800',
    iconClasses: 'text-indigo-500',
  },
};

const ToastItem = ({ toast }) => {
  const dispatch = useDispatch();
  const { id, type, message, duration } = toast;
  const style = TOAST_STYLES[type] || TOAST_STYLES.info;
  const Icon = style.icon;

  useEffect(() => {
    const timer = setTimeout(() => dispatch(removeToast(id)), duration);
    return () => clearTimeout(timer);
  }, [id, duration, dispatch]);

  return (
    <div
      className={cx(
        'flex w-80 animate-slide-up items-start gap-2.5 rounded-lg border px-4 py-3 shadow-popover',
        style.classes
      )}
    >
      <Icon className={cx('mt-0.5 h-5 w-5 shrink-0', style.iconClasses)} />
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        type="button"
        onClick={() => dispatch(removeToast(id))}
        className="text-current opacity-60 hover:opacity-100"
        aria-label="Dismiss"
      >
        <HiOutlineXMark className="h-4 w-4" />
      </button>
    </div>
  );
};

/**
 * Renders the full toast stack. Mounted once near the root (App.jsx),
 * reads directly from uiSlice so any part of the app can dispatch
 * addToast(...) without prop drilling.
 */
const Toast = () => {
  const toasts = useSelector(selectToasts);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
};

export default Toast;
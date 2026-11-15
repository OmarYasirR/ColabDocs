import { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { HiOutlineXMark } from 'react-icons/hi2';
import { cx } from '../../utils/helpers';

const SIZE_CLASSES = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-2xl',
};

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer = null,
  size = 'md',
  closeOnOverlayClick = true,
}) => {
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') onClose?.();
    },
    [onClose]
  );

  useEffect(() => {
    if (!isOpen) return undefined;
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        className="absolute inset-0 animate-fade-in bg-slate-900/50 backdrop-blur-sm"
        onClick={closeOnOverlayClick ? onClose : undefined}
      />

      <div
        role="dialog"
        aria-modal="true"
        className={cx(
          'relative z-10 flex max-h-[92vh] w-full animate-slide-up flex-col bg-white shadow-popover',
          'rounded-t-2xl sm:rounded-xl',
          SIZE_CLASSES[size]
        )}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3.5 sm:px-5">
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Close"
            >
              <HiOutlineXMark className="h-5 w-5" />
            </button>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          {children}
        </div>

        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-4 py-3 sm:px-5">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
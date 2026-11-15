import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineBold,
  HiOutlineItalic,
  HiOutlineUnderline,
  HiOutlineListBullet,
  HiOutlineNumberedList,
  HiOutlineChevronLeft,
  HiOutlineChevronDown,
  HiOutlineChatBubbleLeftRight,
} from 'react-icons/hi2';
import { FiCheck, FiLoader, FiAlertTriangle } from 'react-icons/fi';

import Button from '../common/Button';
import Input from '../common/Input';
import { DOCUMENT_STATUS } from '../../utils/constants';
import { cx } from '../../utils/helpers';

const SAVE_STATUS_CONFIG = {
  [DOCUMENT_STATUS.SAVED]: { icon: FiCheck, text: 'Saved', classes: 'text-emerald-600' },
  [DOCUMENT_STATUS.SAVING]: { icon: FiLoader, text: 'Saving…', classes: 'text-slate-400 [&>svg]:animate-spin' },
  [DOCUMENT_STATUS.UNSAVED]: { icon: FiLoader, text: 'Unsaved', classes: 'text-amber-600' },
  [DOCUMENT_STATUS.ERROR]: { icon: FiAlertTriangle, text: 'Save failed', classes: 'text-rose-600' },
};

// `icon` for icon-based commands, `text` for glyph labels (H1/H2/H3).
const FORMAT_BUTTONS = [
  { command: 'bold', icon: HiOutlineBold, label: 'Bold', isActive: (e) => e.isActive('bold') },
  { command: 'italic', icon: HiOutlineItalic, label: 'Italic', isActive: (e) => e.isActive('italic') },
  { command: 'underline', icon: HiOutlineUnderline, label: 'Underline', isActive: (e) => e.isActive('underline') },
  { command: 'insertUnorderedList', icon: HiOutlineListBullet, label: 'Bulleted list', isActive: (e) => e.isActive('bulletList') },
  { command: 'insertOrderedList', icon: HiOutlineNumberedList, label: 'Numbered list', isActive: (e) => e.isActive('orderedList') },
  { command: 'h1', text: 'H1', label: 'Heading 1', isActive: (e) => e.isActive('heading', { level: 1 }) },
  { command: 'h2', text: 'H2', label: 'Heading 2', isActive: (e) => e.isActive('heading', { level: 2 }) },
  { command: 'h3', text: 'H3', label: 'Heading 3', isActive: (e) => e.isActive('heading', { level: 3 }) },
];

const FormatButton = ({ item, editor, onFormat, fullWidth = false }) => {
  const active = editor ? item.isActive(editor) : false;
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={() => onFormat?.(item.command)}
      className={cx(
        'flex items-center justify-center rounded-md p-2 transition-colors',
        fullWidth ? 'w-full' : '',
        active
          ? 'bg-indigo-50 text-indigo-600'
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
      )}
      aria-label={item.label}
      aria-pressed={active}
      title={item.label}
    >
      {Icon ? (
        <Icon className="h-4 w-4" />
      ) : (
        <span className="text-[11px] font-bold leading-none">{item.text}</span>
      )}
    </button>
  );
};

const MobileFormatFlyout = ({ editor, onFormat }) => {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  // Close on outside click / escape
  useEffect(() => {
    if (!open) return undefined;
    const onMouseDown = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const handleFormat = useCallback(
    (command) => {
      onFormat?.(command);
      setOpen(false);
    },
    [onFormat]
  );

  return (
    <div className="relative md:hidden" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cx(
          'flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm transition-colors',
          open
            ? 'bg-indigo-50 text-indigo-600'
            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
        )}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Text formatting"
      >
        <span className="font-bold">Aa</span>
        <HiOutlineChevronDown
          className={cx('h-3.5 w-3.5 transition-transform', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full z-30 mt-1.5 w-56 animate-slide-up rounded-xl border border-slate-200 bg-white p-2 shadow-popover"
        >
          <div className="grid grid-cols-4 gap-1">
            {FORMAT_BUTTONS.slice(0, 4).map((item) => (
              <FormatButton
                key={item.command}
                item={item}
                editor={editor}
                onFormat={handleFormat}
              />
            ))}
          </div>

          <div className="my-1.5 border-t border-slate-100" />

          <div className="grid grid-cols-4 gap-1">
            {FORMAT_BUTTONS.slice(4).map((item) => (
              <FormatButton
                key={item.command}
                item={item}
                editor={editor}
                onFormat={handleFormat}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const Toolbar = ({
  title,
  onTitleChange,
  saveStatus = DOCUMENT_STATUS.SAVED,
  onFormat,
  editor,
  rightSlot = null,
  onShareClick,
  commentsOpen = true,
  onToggleComments,
}) => {
  const navigate = useNavigate();
  const statusConfig = SAVE_STATUS_CONFIG[saveStatus] || SAVE_STATUS_CONFIG[DOCUMENT_STATUS.SAVED];
  const StatusIcon = statusConfig.icon;

  return (
    <div className="flex items-center justify-between gap-2 border-b border-slate-200 bg-white px-2 py-2 sm:gap-4 sm:px-4 sm:py-2.5">
      <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-3">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="shrink-0 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          aria-label="Back to dashboard"
        >
          <HiOutlineChevronLeft className="h-5 w-5" />
        </button>

        <Input
          name="document-title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Untitled document"
          containerClassName="min-w-0 flex-1 max-w-xs"
          className="border-none bg-transparent px-1 py-1 text-base font-medium shadow-none focus:ring-0"
        />

        {/* Mobile format flyout (< md) */}
        <MobileFormatFlyout editor={editor} onFormat={onFormat} />

        {/* Desktop inline format buttons (md+) */}
        <div className="hidden items-center gap-0.5 border-l border-slate-200 pl-2 md:flex">
          {FORMAT_BUTTONS.map((item) => (
            <FormatButton
              key={item.command}
              item={item}
              editor={editor}
              onFormat={onFormat}
            />
          ))}
        </div>

        <div
          className={cx(
            'hidden items-center gap-1.5 pl-2 text-xs font-medium sm:flex',
            statusConfig.classes
          )}
        >
          <StatusIcon className="h-3.5 w-3.5" />
          <span>{statusConfig.text}</span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
        <div className="hidden sm:block">{rightSlot}</div>

        {onToggleComments && (
          <button
            type="button"
            onClick={onToggleComments}
            className={cx(
              'rounded-lg p-2 transition-colors',
              commentsOpen
                ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
            )}
            aria-label="Toggle comments"
            aria-pressed={commentsOpen}
            title="Toggle comments"
          >
            <HiOutlineChatBubbleLeftRight className="h-5 w-5" />
          </button>
        )}

        <Button size="sm" variant="secondary" onClick={onShareClick}>
          Share
        </Button>
      </div>
    </div>
  );
};

export default Toolbar;
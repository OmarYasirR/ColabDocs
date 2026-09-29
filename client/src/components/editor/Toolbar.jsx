// src/components/editor/Toolbar.jsx
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineBold,
  HiOutlineItalic,
  HiOutlineUnderline,
  HiOutlineListBullet,
  HiOutlineChevronLeft,
} from 'react-icons/hi2';
import { FiCheck, FiLoader, FiAlertTriangle } from 'react-icons/fi';

import Button from '../common/Button';
import Input from '../common/Input';
import { DOCUMENT_STATUS } from '../../utils/constants';
import { cx } from '../../utils/helpers';

const SAVE_STATUS_CONFIG = {
  [DOCUMENT_STATUS.SAVED]: { icon: FiCheck, text: 'Saved', classes: 'text-emerald-600' },
  [DOCUMENT_STATUS.SAVING]: { icon: FiLoader, text: 'Saving…', classes: 'text-slate-400 [&>svg]:animate-spin' },
  [DOCUMENT_STATUS.UNSAVED]: { icon: FiLoader, text: 'Unsaved changes', classes: 'text-amber-600' },
  [DOCUMENT_STATUS.ERROR]: { icon: FiAlertTriangle, text: 'Failed to save', classes: 'text-rose-600' },
};

const FORMAT_BUTTONS = [
  { command: 'bold', icon: HiOutlineBold, label: 'Bold', isActive: (editor) => editor.isActive('bold') },
  { command: 'italic', icon: HiOutlineItalic, label: 'Italic', isActive: (editor) => editor.isActive('italic') },
  { command: 'underline', icon: HiOutlineUnderline, label: 'Underline', isActive: (editor) => editor.isActive('underline') },
  { command: 'insertUnorderedList', icon: HiOutlineListBullet, label: 'Bulleted list', isActive: (editor) => editor.isActive('bulletList') },
];

/**
 * Editor top bar: back nav, editable title, inline formatting controls
 * (reflecting live active-mark state from the Tiptap `editor` instance),
 * save-status indicator, and the collaborator avatar stack.
 */
const Toolbar = ({
  title,
  onTitleChange,
  saveStatus = DOCUMENT_STATUS.SAVED,
  onFormat,
  editor,
  rightSlot = null,
  onShareClick
}) => {
  const navigate = useNavigate();
  const statusConfig = SAVE_STATUS_CONFIG[saveStatus] || SAVE_STATUS_CONFIG[DOCUMENT_STATUS.SAVED];
  const StatusIcon = statusConfig.icon;

  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-2.5">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="shrink-0 rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
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
          className="border-none px-1 text-base font-medium shadow-none focus:ring-0"
        />

        <div className="hidden items-center gap-1 border-l border-slate-200 pl-3 sm:flex">
          {FORMAT_BUTTONS.map(({ command, icon: Icon, label, isActive }) => {
            const active = editor ? isActive(editor) : false;
            return (
              <button
                key={command}
                type="button"
                onClick={() => onFormat?.(command)}
                className={cx(
                  'rounded-md p-1.5 hover:bg-slate-100',
                  active ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:text-slate-700'
                )}
                aria-label={label}
                aria-pressed={active}
                title={label}
              >
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
        </div>

        <div className={cx('hidden items-center gap-1.5 pl-2 text-xs font-medium sm:flex', statusConfig.classes)}>
          <StatusIcon className="h-3.5 w-3.5" />
          <span>{statusConfig.text}</span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        {rightSlot}
        <Button size="sm" variant="secondary" onClick={onShareClick}>
          Share
        </Button>
      </div>
    </div>
  );
};

export default Toolbar;
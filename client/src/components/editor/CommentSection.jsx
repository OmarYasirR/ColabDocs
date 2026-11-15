import { useState } from 'react';
import {
  HiOutlineChatBubbleLeftRight,
  HiOutlineCheckCircle,
  HiOutlineTrash,
  HiOutlineXMark,
} from 'react-icons/hi2';
import { FiSend } from 'react-icons/fi';

import Button from '../common/Button';
import { getInitials, formatRelativeTime, cx } from '../../utils/helpers';

const CommentSection = ({
  comments = [],
  currentUser,
  onAddComment,
  onResolveComment,
  onDeleteComment,
  onClose,
}) => {
  const [draft, setDraft] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    onAddComment?.({
      text,
      authorId: currentUser?.id,
      authorName: currentUser?.name,
    });
    setDraft('');
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <HiOutlineChatBubbleLeftRight className="h-5 w-5 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-900">
            Comments {comments.length > 0 && `(${comments.length})`}
          </h3>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 lg:hidden"
            aria-label="Close comments"
          >
            <HiOutlineXMark className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3 sm:px-4">
        {comments.length === 0 && (
          <div className="mt-12 flex flex-col items-center gap-2 px-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50">
              <HiOutlineChatBubbleLeftRight className="h-6 w-6 text-indigo-400" />
            </div>
            <p className="text-sm text-slate-500">No comments yet</p>
            <p className="text-xs text-slate-400">
              Select text to leave the first one.
            </p>
          </div>
        )}

        {comments.map((comment) => {
          const isOwnComment = comment.authorId === currentUser?.id;
          return (
            <div
              key={comment.id}
              className={cx(
                'group rounded-xl border p-3 text-sm transition-colors',
                comment.resolved
                  ? 'border-slate-100 bg-slate-50 opacity-70'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-semibold text-indigo-700">
                    {getInitials(comment.authorName)}
                  </div>
                  <span className="truncate font-medium text-slate-800">
                    {comment.authorName}
                  </span>
                  <span className="shrink-0 text-xs text-slate-400">
                    {formatRelativeTime(comment.createdAt)}
                  </span>
                </div>

                <div className="flex shrink-0 items-center gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                  {!comment.resolved && (
                    <button
                      type="button"
                      onClick={() => onResolveComment?.(comment.id)}
                      className="rounded p-1 text-slate-300 hover:bg-emerald-50 hover:text-emerald-600"
                      aria-label="Resolve comment"
                      title="Mark resolved"
                    >
                      <HiOutlineCheckCircle className="h-4 w-4" />
                    </button>
                  )}
                  {isOwnComment && (
                    <button
                      type="button"
                      onClick={() => onDeleteComment?.(comment.id)}
                      className="rounded p-1 text-slate-300 hover:bg-rose-50 hover:text-rose-600"
                      aria-label="Delete comment"
                      title="Delete"
                    >
                      <HiOutlineTrash className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              <p className="mt-2 whitespace-pre-wrap break-words text-slate-600">
                {comment.text}
              </p>
            </div>
          );
        })}
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-t border-slate-200 bg-white p-3"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a comment…"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        />
        <Button
          type="submit"
          size="sm"
          icon={FiSend}
          disabled={!draft.trim()}
          aria-label="Send comment"
        >
          <span className="sr-only sm:not-sr-only">Send</span>
        </Button>
      </form>
    </div>
  );
};

export default CommentSection;
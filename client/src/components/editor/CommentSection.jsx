// src/components/editor/CommentSection.jsx
import { useState } from 'react';
import { HiOutlineChatBubbleLeftRight, HiOutlineCheckCircle, HiOutlineTrash } from 'react-icons/hi2';
import { FiSend } from 'react-icons/fi';

import Button from '../common/Button';
import { getInitials, formatRelativeTime, cx } from '../../utils/helpers';

const CommentSection = ({
  comments = [],
  currentUser,
  onAddComment,
  onResolveComment,
  onDeleteComment,
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
      <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
        <HiOutlineChatBubbleLeftRight className="h-5 w-5 text-slate-400" />
        <h3 className="text-sm font-semibold text-slate-900">
          Comments {comments.length > 0 && `(${comments.length})`}
        </h3>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {comments.length === 0 && (
          <p className="mt-8 text-center text-sm text-slate-400">
            No comments yet — select text to leave the first one.
          </p>
        )}

        {comments.map((comment) => {
          const isOwnComment = comment.authorId === currentUser?.id;
          return (
            <div
              key={comment.id}
              className={cx(
                'group rounded-lg border p-3 text-sm',
                comment.resolved ? 'border-slate-100 bg-slate-50 opacity-60' : 'border-slate-200 bg-white'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-semibold text-indigo-700">
                    {getInitials(comment.authorName)}
                  </div>
                  <span className="font-medium text-slate-800">{comment.authorName}</span>
                  <span className="text-xs text-slate-400">
                    {formatRelativeTime(comment.createdAt)}
                  </span>
                </div>

                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  {!comment.resolved && (
                    <button
                      type="button"
                      onClick={() => onResolveComment?.(comment.id)}
                      className="text-slate-300 hover:text-emerald-600"
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
                      className="text-slate-300 hover:text-rose-600"
                      aria-label="Delete comment"
                      title="Delete"
                    >
                      <HiOutlineTrash className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              <p className="mt-2 text-slate-600">{comment.text}</p>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-slate-200 p-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a comment…"
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        />
        <Button type="submit" size="sm" icon={FiSend} disabled={!draft.trim()}>
          <span className="sr-only sm:not-sr-only">Send</span>
        </Button>
      </form>
    </div>
  );
};

export default CommentSection;
// src/utils/helpers.js
import { CURSOR_COLORS } from './constants';

/**
 * Deterministically assigns a cursor color to a user based on their
 * user ID, so the same user always renders with the same color across
 * sessions/tabs.
 */
export const getCursorColorForUser = (userId) => {
  if (!userId) return CURSOR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < userId.length; i += 1) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % CURSOR_COLORS.length;
  return CURSOR_COLORS[index];
};

/**
 * Builds initials from a full name, e.g. "Ada Lovelace" -> "AL".
 */
export const getInitials = (name = '') => {
  if (!name) return '?';
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
};

/**
 * Formats an ISO timestamp into a short relative string
 * (e.g. "2m ago", "3h ago", "Jul 12").
 */
export const formatRelativeTime = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

/**
 * Truncates text to a max length, appending an ellipsis.
 */
export const truncateText = (text = '', maxLength = 80) => {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}…`;
};

/**
 * Simple class-name joiner (avoids pulling in a dependency like `clsx`
 * for this project's needs).
 */
export const cx = (...classes) => classes.filter(Boolean).join(' ');

/**
 * Generates a short, human-friendly document preview snippet by
 * stripping any HTML tags from editor content.
 */
export const stripHtml = (html = '') => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

/**
 * Clamp helper — used for cursor overlay positioning math.
 */
export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
// src/components/editor/CollaborationPanel.jsx
import { HiOutlineUserGroup } from 'react-icons/hi2';
import { getInitials } from '../../utils/helpers';

const MAX_VISIBLE_AVATARS = 5;

/**
 * Compact avatar stack showing who's currently active in the document.
 * `activeUsers` now comes from useCollaboration's Yjs awareness state
 * (see SocketIOYjsProvider), where each user object is shaped
 * `{ id, name, color }` — NOT the old `{ userId, name, color }` shape
 * from the pre-Yjs presence:join/leave events. Keying/reading off
 * `.id` here matches that.
 */
const CollaborationPanel = ({ activeUsers = [] }) => {
  const visible = activeUsers.slice(0, MAX_VISIBLE_AVATARS);
  const overflowCount = Math.max(activeUsers.length - MAX_VISIBLE_AVATARS, 0);

  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {visible.map((user) => (
          <div
            key={user.id}
            title={user.name}
            className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-xs font-semibold text-white shadow-sm"
            style={{ backgroundColor: user.color }}
          >
            {getInitials(user.name)}
          </div>
        ))}
        {overflowCount > 0 && (
          <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-slate-200 text-xs font-semibold text-slate-600">
            +{overflowCount}
          </div>
        )}
      </div>

      {activeUsers.length > 0 && (
        <div className="hidden items-center gap-1 text-xs font-medium text-emerald-600 md:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {activeUsers.length} online
        </div>
      )}

      {activeUsers.length === 0 && (
        <div className="hidden items-center gap-1 text-xs text-slate-400 md:flex">
          <HiOutlineUserGroup className="h-4 w-4" />
          Just you
        </div>
      )}
    </div>
  );
};

export default CollaborationPanel;
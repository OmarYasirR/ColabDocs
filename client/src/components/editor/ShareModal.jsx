// src/components/editor/ShareModal.jsx
import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { HiOutlineUserPlus, HiOutlineXMark } from 'react-icons/hi2';
import { FiSearch } from 'react-icons/fi';

import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import Spinner from '../common/Spinner';

import documentService from '../../services/documentService';
import collaborationService from '../../services/collaborationService';
import { useDebouncedValue } from '../../hooks/useDebounce';
import { selectCurrentUser } from '../../redux/slices/authSlice';
import { getInitials } from '../../utils/helpers';

const ROLE_LABELS = { user: 'Viewer', editor: 'Editor', owner: 'Owner' };

/**
 * Share dialog: lists current collaborators (with remove, owner-only)
 * and a searchable list of other users in the system to invite. Role
 * management is intentionally simple — Viewer ('user') or Editor.
 */
const ShareModal = ({ isOpen, onClose, documentId, ownerId }) => {
  const currentUser = useSelector(selectCurrentUser);
  const isOwner = currentUser?.id === ownerId;

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);

  const [collaborators, setCollaborators] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loadingCollaborators, setLoadingCollaborators] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [pendingUserId, setPendingUserId] = useState(null);
  const [roleByUser, setRoleByUser] = useState({});

  const loadCollaborators = useCallback(async () => {
    if (!documentId) return;
    setLoadingCollaborators(true);
    try {
      const data = await documentService.getCollaborators(documentId);
      setCollaborators(data.collaborators || []);
    } finally {
      setLoadingCollaborators(false);
    }
  }, [documentId]);

  const loadAvailableUsers = useCallback(async () => {
    if (!documentId) return;
    setLoadingUsers(true);
    try {
      const data = await collaborationService.getShareableUsers(documentId, debouncedSearch);
      setAvailableUsers(data.users || []);
    } finally {
      setLoadingUsers(false);
    }
  }, [documentId, debouncedSearch]);

  useEffect(() => {
    if (!isOpen) return;
    loadCollaborators();
  }, [isOpen, loadCollaborators]);

  useEffect(() => {
    if (!isOpen) return;
    loadAvailableUsers();
  }, [isOpen, loadAvailableUsers]);

  const handleInvite = async (userId) => {
    setPendingUserId(userId);
    try {
      await documentService.addCollaborator(documentId, {
        userId,
        role: roleByUser[userId] || 'user',
      });
      setAvailableUsers((prev) => prev.filter((u) => u._id !== userId && u.id !== userId));
      loadCollaborators();
    } finally {
      setPendingUserId(null);
    }
  };

  const handleRemove = async (userId) => {
    setPendingUserId(userId);
    try {
      await documentService.removeCollaborator(documentId, userId);
      loadCollaborators();
      loadAvailableUsers();
    } finally {
      setPendingUserId(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share document" size="lg">
      <div className="space-y-5">
        {/* Current collaborators */}
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            People with access
          </h3>
          {loadingCollaborators ? (
            <div className="flex justify-center py-4">
              <Spinner size="sm" />
            </div>
          ) : (
            <ul className="space-y-1.5">
              {collaborators.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-slate-50"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                      {getInitials(c.name)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{c.name}</p>
                      <p className="text-xs text-slate-400">{c.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-500">
                      {ROLE_LABELS[c.role] || c.role}
                    </span>
                    {isOwner && c.role !== 'owner' && (
                      <button
                        type="button"
                        onClick={() => handleRemove(c.id)}
                        disabled={pendingUserId === c.id}
                        className="rounded-md p-1 text-slate-300 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                        aria-label="Remove access"
                      >
                        <HiOutlineXMark className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Invite others */}
        {isOwner && (
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Invite someone
            </h3>
            <Input
              name="share-search"
              icon={FiSearch}
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <div className="mt-3 max-h-60 space-y-1 overflow-y-auto">
              {loadingUsers && (
                <div className="flex justify-center py-4">
                  <Spinner size="sm" />
                </div>
              )}

              {!loadingUsers && availableUsers.length === 0 && (
                <p className="py-4 text-center text-sm text-slate-400">
                  No matching users found.
                </p>
              )}

              {!loadingUsers &&
                availableUsers.map((u) => {
                  const userId = u._id || u.id;
                  return (
                    <div
                      key={userId}
                      className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                          {getInitials(u.name)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800">{u.name}</p>
                          <p className="text-xs text-slate-400">{u.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={roleByUser[userId] || 'user'}
                          onChange={(e) =>
                            setRoleByUser((prev) => ({ ...prev, [userId]: e.target.value }))
                          }
                          className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 focus:border-indigo-500 focus:outline-none"
                        >
                          <option value="user">Viewer</option>
                          <option value="editor">Editor</option>
                        </select>
                        <Button
                          size="sm"
                          variant="secondary"
                          icon={HiOutlineUserPlus}
                          isLoading={pendingUserId === userId}
                          onClick={() => handleInvite(userId)}
                        >
                          Invite
                        </Button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {!isOwner && (
          <p className="text-xs text-slate-400">
            Only the document owner can manage sharing.
          </p>
        )}
      </div>
    </Modal>
  );
};

export default ShareModal;
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import socketService from '../services/socketService';
import SocketIOYjsProvider from '../services/yjsProvider';
import collaborationService from '../services/collaborationService';
import { SOCKET_EVENTS } from '../utils/constants';
import { selectCurrentUser } from '../redux/slices/authSlice';
import { getCursorColorForUser } from '../utils/helpers';
import { addToast } from '../redux/slices/uiSlice';
import {
  joinedDocument,
  leftDocument,
  presenceSynced,
  commentsLoaded,
  commentAdded,
  commentUpdated,
  commentRemoved,
  selectComments,
} from '../redux/slices/collaborationSlice';

const useCollaboration = (documentId) => {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const comments = useSelector(selectComments);

  const [provider, setProvider] = useState(null);
  const [activeUsers, setActiveUsers] = useState([]);

  useEffect(() => {
    if (!documentId || !currentUser) return undefined;
    const socket = socketService.getSocket();
    if (!socket) return undefined;

    let cancelled = false;

    socket.emit(SOCKET_EVENTS.JOIN_DOCUMENT, {
      documentId,
      user: { userId: currentUser.id, name: currentUser.name },
    });

    const instance = new SocketIOYjsProvider({
      socket,
      documentId,
      userId: currentUser.id,
      userName: currentUser.name,
      color: getCursorColorForUser(currentUser.id),
    });

    setProvider(instance);
    dispatch(joinedDocument(documentId))

    const handleAwarenessChange = () => {
      const states = Array.from(instance.awareness.getStates().values());
      const users = states
        .map((state) => state.user)
        .filter(Boolean)
        .filter((user) => user.id !== currentUser?.id);
      setActiveUsers(users);
      dispatch(presenceSynced(users.map((u) => ({ userId: u.id, name: u.name }))));
    };
    instance.awareness.on('change', handleAwarenessChange);
    handleAwarenessChange();

    collaborationService
      .getComments(documentId)
      .then((data) => dispatch(commentsLoaded(data.comments)))
      .catch(() => {
        dispatch(addToast({ type: 'error', message: 'Could not load comments' }));
      });

    const handleCommentAdd = (comment) => dispatch(commentAdded(comment));
    const handleCommentUpdate = (comment) => dispatch(commentUpdated(comment));
    const handleCommentDelete = (commentId) => dispatch(commentRemoved(commentId));

    socket.on(SOCKET_EVENTS.COMMENT_ADD, handleCommentAdd);
    socket.on(SOCKET_EVENTS.COMMENT_UPDATE, handleCommentUpdate);
    socket.on(SOCKET_EVENTS.COMMENT_DELETE, handleCommentDelete);

    return () => {
      cancelled = true;

      instance.awareness.off('change', handleAwarenessChange);
      socket.off(SOCKET_EVENTS.COMMENT_ADD, handleCommentAdd);
      socket.off(SOCKET_EVENTS.COMMENT_UPDATE, handleCommentUpdate);
      socket.off(SOCKET_EVENTS.COMMENT_DELETE, handleCommentDelete);

      socket.emit(SOCKET_EVENTS.LEAVE_DOCUMENT, { documentId, userId: currentUser?.id });

      instance.destroy();
      dispatch(leftDocument());

      setProvider(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId, currentUser?.id, dispatch]);

  const addComment = async (comment) => {
    try {
      const created = await collaborationService.addComment(documentId, comment);
      dispatch(commentAdded(created));
      socketService.emit(SOCKET_EVENTS.COMMENT_ADD, { documentId, ...created });
      return { success: true };
    } catch (err) {
      dispatch(addToast({ type: 'error', message: 'Could not post comment' }));
      return { success: false };
    }
  };

  const resolveComment = async (commentId) => {
    dispatch(commentUpdated({ id: commentId, resolved: true }));
    try {
      const updated = await collaborationService.resolveComment(documentId, commentId);
      socketService.emit(SOCKET_EVENTS.COMMENT_UPDATE, { documentId, ...updated });
      return { success: true };
    } catch (err) {
      dispatch(commentUpdated({ id: commentId, resolved: false }));
      dispatch(addToast({ type: 'error', message: 'Could not resolve comment' }));
      return { success: false };
    }
  };

  const deleteComment = async (commentId) => {
    try {
      await collaborationService.deleteComment(documentId, commentId);
      dispatch(commentRemoved(commentId));
      socketService.emit(SOCKET_EVENTS.COMMENT_DELETE, { documentId, commentId });
      return { success: true };
    } catch (err) {
      dispatch(addToast({ type: 'error', message: 'Could not delete comment' }));
      return { success: false };
    }
  };

  return {
    ydoc: provider?.doc ?? null,
    awareness: provider?.awareness ?? null,
    activeUsers,
    activeUserCount: activeUsers.length,
    comments,
    addComment,
    resolveComment,
    deleteComment,
  };
};

export default useCollaboration;
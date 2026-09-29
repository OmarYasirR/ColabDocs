import { notificationPushed } from '../redux/slices/notificationSlice'
import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import socketService from '../services/socketService';
import { SOCKET_EVENTS } from '../utils/constants';
import { selectIsAuthenticated } from '../redux/slices/authSlice';
import {
  connectionStarted,
  connectionEstablished,
  connectionLost,
  connectionFailed,
  reconnectAttempted,
  selectIsSocketConnected,
  selectIsSocketConnecting,
  selectSocketError,
} from '../redux/slices/socketSlice';
import { addToast, notificationReceived } from '../redux/slices/uiSlice';
import { fetchDocuments } from '../redux/slices/documentSlice';

const useSocket = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isConnected = useSelector(selectIsSocketConnected);
  const isConnecting = useSelector(selectIsSocketConnecting);
  const connectionError = useSelector(selectSocketError);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) {
      if (hasInitialized.current) {
        socketService.disconnect();
        dispatch(connectionLost());
        hasInitialized.current = false;
      }
      return undefined;
    }

    dispatch(connectionStarted());
    const socket = socketService.connect();
    hasInitialized.current = true;

    const handleConnect = () => dispatch(connectionEstablished());
    const handleDisconnect = () => dispatch(connectionLost());
    const handleConnectError = (err) =>
      dispatch(connectionFailed(err?.message || 'Connection error'));
    const handleReconnectAttempt = () => dispatch(reconnectAttempted());

    // NEW: personal notification — a document was shared with this
    // user. Fires regardless of which page/document they're currently
    // viewing, since it's delivered via the personal `user:<id>` room,
    // not a document room.
    const handleNotificationNew = (notification) => {
      dispatch(notificationPushed(notification));

      // Still show a toast for the most common type today; other types
      // can add their own toast copy here as they're introduced.
      if (notification.type === 'document_shared') {
        dispatch(
          addToast({
            type: 'info',
            message: `${notification.data.actorName || 'Someone'} shared "${notification.data.documentTitle}" with you`,
          })
        );
        dispatch(fetchDocuments());
      }
    };

    socket.on(SOCKET_EVENTS.CONNECT, handleConnect);
    socket.on(SOCKET_EVENTS.DISCONNECT, handleDisconnect);
    socket.on(SOCKET_EVENTS.CONNECT_ERROR, handleConnectError);
    socket.io.on('reconnect_attempt', handleReconnectAttempt);
    socket.on(SOCKET_EVENTS.NOTIFICATION_NEW, handleNotificationNew);;

    return () => {
      socket.off(SOCKET_EVENTS.CONNECT, handleConnect);
      socket.off(SOCKET_EVENTS.DISCONNECT, handleDisconnect);
      socket.off(SOCKET_EVENTS.CONNECT_ERROR, handleConnectError);
      socket.io.off('reconnect_attempt', handleReconnectAttempt);
      socket.on(SOCKET_EVENTS.NOTIFICATION_NEW, handleNotificationNew);;
    };
  }, [isAuthenticated, dispatch]);

  return {
    isConnected,
    isConnecting,
    connectionError,
    socket: socketService.getSocket(),
  };
};

export default useSocket;
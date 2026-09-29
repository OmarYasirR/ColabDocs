// src/utils/constants.js

export const APP_NAME = 'CollabEdit';

// ---------------------------------------------------------------------------
// API / Socket endpoints
// ---------------------------------------------------------------------------
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
export const AUTH_TOKEN_KEY = 'collab-token';
export const AUTH_REFRESH_KEY = 'collabedit_refresh_token';

// ---------------------------------------------------------------------------
// Socket events (shared contract with backend)
// ---------------------------------------------------------------------------
export const SOCKET_EVENTS = {
  NOTIFICATION_NEW: 'notification:new',
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',

  JOIN_DOCUMENT: 'document:join',
  LEAVE_DOCUMENT: 'document:leave',

  // Legacy HTML-broadcast events — retained only for the non-editor
  // parts of the app (e.g. dashboard preview snippets) that don't need
  // CRDT merging. The editor itself no longer uses these.
  DOC_SAVE: 'document:save',

  PRESENCE_JOIN: 'presence:join',
  PRESENCE_LEAVE: 'presence:leave',

  // --- Yjs sync protocol ---
  // Binary y-protocols/sync messages (step1/step2/update), relayed
  // verbatim by the server to every other client in the same document
  // room. The server does NOT need to understand Yjs's internal
  // format — it just needs to broadcast the buffer to the room and,
  // for a new joiner, ask an existing peer for the current state
  // (see YJS_SYNC_REQUEST below).
  YJS_SYNC: 'yjs:sync',
  // Emitted by a newly-joined client to request the current document
  // state from the room; the server can either maintain its own
  // authoritative Y.Doc (recommended) or relay this to an existing
  // peer and forward their response back.
  YJS_SYNC_REQUEST: 'yjs:sync-request',

  // --- Yjs awareness protocol (presence + live cursors/selections) ---
  YJS_AWARENESS: 'yjs:awareness',

  COMMENT_ADD: 'comment:add',
  COMMENT_UPDATE: 'comment:update',
  COMMENT_DELETE: 'comment:delete',
};

// ---------------------------------------------------------------------------
// Document permissions / roles
// ---------------------------------------------------------------------------
export const DOCUMENT_ROLES = {
  OWNER: 'owner',
  EDITOR: 'editor',
  VIEWER: 'viewer',
};

export const DOCUMENT_STATUS = {
  SAVED: 'saved',
  SAVING: 'saving',
  UNSAVED: 'unsaved',
  ERROR: 'error',
};

// ---------------------------------------------------------------------------
// UI
// ---------------------------------------------------------------------------
export const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
};

export const TOAST_DURATION_MS = 4000;

export const MODAL_TYPES = {
  CREATE_DOCUMENT: 'create_document',
  DELETE_DOCUMENT: 'delete_document',
  SHARE_DOCUMENT: 'share_document',
  CONFIRM: 'confirm',
};

// ---------------------------------------------------------------------------
// Collaboration cursor colors (assigned round-robin per active user)
// ---------------------------------------------------------------------------
export const CURSOR_COLORS = [
  '#4f46e5', '#059669', '#d97706', '#e11d48', '#0891b2', '#7c3aed', '#db2777',
];

// ---------------------------------------------------------------------------
// Debounce / timing
// ---------------------------------------------------------------------------
// How often the Yjs doc state is persisted to the REST backend as a
// durable snapshot. This is now decoupled from real-time sync (which
// is instant, per-keystroke) — it exists purely so a document can be
// reloaded from REST alone (e.g. no active collaborators) without
// depending on the Yjs room still existing in server memory.
export const AUTOSAVE_DEBOUNCE_MS = 2000;
export const CURSOR_EMIT_THROTTLE_MS = 50;

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  DOCUMENT: '/documents/:documentId',
  PROFILE: '/profile',
  NOT_FOUND: '*',
};
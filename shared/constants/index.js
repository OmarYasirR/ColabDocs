// Operation Types for OT
exports.OPERATION_TYPES = {
  INSERT: 'insert',
  DELETE: 'delete',
  RETAIN: 'retain'
};

// Socket Events
exports.SOCKET_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  
  // Document
  JOIN_DOCUMENT: 'document:join',
  LEAVE_DOCUMENT: 'document:leave',
  DOCUMENT_STATE: 'document:state',
  
  // Operations
  OPERATION: 'operation',
  OPERATION_ACK: 'operation:ack',
  OPERATION_ERROR: 'operation:error',
  
  // Collaboration
  CURSOR_MOVE: 'cursor:move',
  USER_JOINED: 'user:joined',
  USER_LEFT: 'user:left',
  
  // Comments
  COMMENT_ADD: 'comment:add',
  COMMENT_DELETE: 'comment:delete',
  COMMENT_RESOLVE: 'comment:resolve',
  
  // Awareness
  AWARENESS_UPDATE: 'awareness:update'
};

// Document Permissions
exports.PERMISSIONS = {
  READ: 'read',
  WRITE: 'write',
  ADMIN: 'admin'
};

// Error Codes
exports.ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  DOCUMENT_NOT_FOUND: 'DOCUMENT_NOT_FOUND',
  INVALID_OPERATION: 'INVALID_OPERATION',
  VERSION_CONFLICT: 'VERSION_CONFLICT',
  VALIDATION_ERROR: 'VALIDATION_ERROR'
};

// Rate Limiting
exports.RATE_LIMITS = {
  OPERATIONS_PER_SECOND: 10,
  MAX_DOCUMENT_SIZE: 1024 * 1024 * 10, // 10MB
  MAX_CONCURRENT_USERS: 50
};
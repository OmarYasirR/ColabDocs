const documentService = require('../services/documentService')
const collaborationService = require('../services/collaborationService')
const logger = require('../utils/logger')

const documentHandlers = (io, socket) => {
  const userId = socket.user.id

  socket.on('document:join', async ({ documentId }, callback) => {
    try {
      const { document, permission } = await documentService.getDocumentWithPermission(
        documentId,
        userId
      )

      if (!document) return callback?.({ error: 'Document not found' })
      if (!permission) return callback?.({ error: 'Access denied' })

      socket.join(`doc:${documentId}`)

      const collaboration = await collaborationService.joinDocument(
        documentId,
        userId,
        socket.id
      )

      socket.to(`doc:${documentId}`).emit('user:joined', {
        user: {
          id: socket.user.id,
          name: socket.user.name,
          email: socket.user.email,
          avatar: socket.user.avatar
        },
        socketId: socket.id
      })

      // The frontend's useCollaboration hook doesn't currently pass a
      // callback to document:join (Yjs sync/awareness handles catching
      // up separately), so this ack is optional — but kept for any
      // client that does supply one.
      callback?.({
        success: true,
        data: {
          document: { id: document._id, title: document.title, content: document.content },
          permission,
          activeUsers: collaboration.activeUsers.filter(
            (u) => u.user._id.toString() !== userId
          )
        }
      })

      logger.info(`User ${userId} joined document ${documentId}`)
    } catch (error) {
      logger.error('Error joining document:', error)
      callback?.({ error: error.message })
    }
  })

  socket.on('document:leave', async ({ documentId }) => {
    try {
      socket.leave(`doc:${documentId}`)
      await collaborationService.leaveDocument(documentId, socket.id)
      socket.to(`doc:${documentId}`).emit('user:left', { userId, socketId: socket.id })
      logger.info(`User ${userId} left document ${documentId}`)
    } catch (error) {
      logger.error('Error leaving document:', error)
    }
  })

  // REMOVED: `operation` and `document:state` handlers (the custom OT
  // pipeline against otService + Document.version). Superseded by
  // collaborationHandlers.js's yjs:sync / yjs:sync-request / yjs:awareness
  // relay — see that file for the real-time merge logic now in effect.
}

module.exports = documentHandlers
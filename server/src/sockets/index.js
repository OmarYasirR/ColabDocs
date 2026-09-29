const documentHandlers = require('./documentHandlers')
const collaborationHandlers = require('./collaborationHandlers')
const collaborationService = require('../services/collaborationService')
const { protectSocket } = require('../middleware/auth')
const logger = require('../utils/logger')

const setupSocketHandlers = (io) => {
  io.use(protectSocket)

  io.on('connection', (socket) => {
    logger.info(`User connected: ${socket.user.id} (${socket.id})`)

    
    // NEW: every authenticated socket joins a room keyed by their own
    // user ID. This is how server-initiated notifications (like "you've
    // been added to a document") reach a specific person regardless of
    // which document room(s) they currently have open — or even if
    // they have none open at all.
    socket.join(`user:${socket.user.id}`)

    documentHandlers(io, socket)
    collaborationHandlers(io, socket)

    socket.on('disconnect', async () => {
      logger.info(`User disconnected: ${socket.user.id} (${socket.id})`)

      // FIXED: a browser refresh/crash/closed-tab never emits a clean
      // 'document:leave' — it just drops the socket. Without handling
      // cleanup here too, a document's in-memory Yjs room (and its Mongo
      // activeUsers record) could stay populated forever, meaning
      // evictRoomDoc's "last person left" condition never fires, and a
      // room seeded/corrupted during an earlier bug stays stuck
      // indefinitely regardless of what's correctly saved via REST.
      for (const room of socket.rooms) {
        if (room === socket.id) continue

        socket.to(room).emit('user:left', {
          userId: socket.user.id,
          socketId: socket.id
        })

        if (room.startsWith('doc:')) {
          const documentId = room.slice('doc:'.length)
          try {
            const collaboration = await collaborationService.leaveDocument(documentId, socket.id)
            if (!collaboration?.activeUsers?.length) {
              collaborationHandlers.evictRoomDoc(documentId)
            }
          } catch (error) {
            logger.error(`Error cleaning up document room ${documentId} on disconnect:`, error)
          }
        }
      }
    })

    socket.on('error', (error) => {
      logger.error(`Socket error for user ${socket.user.id}:`, error)
    })
  })
}

module.exports = { setupSocketHandlers }
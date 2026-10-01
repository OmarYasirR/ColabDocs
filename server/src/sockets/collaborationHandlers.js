const Y = require('yjs')
const syncProtocol = require('y-protocols/sync')
const encoding = require('lib0/encoding')
const decoding = require('lib0/decoding')
const { generateJSON } = require('@tiptap/html')
const { getSchema } = require('@tiptap/core')
const { prosemirrorJSONToYDoc } = require('y-prosemirror')
const StarterKit = require('@tiptap/starter-kit').default
const Underline = require('@tiptap/extension-underline').default

const Document = require('../models/Document')
const logger = require('../utils/logger')

// Must mirror DocumentEditor.jsx's Tiptap extension config exactly
// (StarterKit heading levels [1,2,3] + history:false, plus Underline) —
// a schema mismatch here breaks prosemirrorJSONToYDoc seeding.
const SERVER_EXTENSIONS = [
  StarterKit.configure({ heading: { levels: [1, 2, 3] }, history: false }),
  Underline
]

const SCHEMA = getSchema(SERVER_EXTENSIONS)

// Must match Tiptap Collaboration's internal field name — defaults to
// 'default' when no `field` option is passed to Collaboration.configure().
const YJS_FIELD = 'default'

// documentId -> Y.Doc (authoritative in-memory room state)
const roomDocs = new Map()
// documentId -> Promise<Y.Doc>, de-dupes concurrent first-joins
const roomInitPromises = new Map()

const seedFromPersistedContent = async (documentId) => {
  const doc = new Y.Doc()

  try {
    const document = await Document.findById(documentId).select('content')
    if (document?.content && document.content.trim().length > 0) {
      const json = generateJSON(document.content, SERVER_EXTENSIONS)
      const seeded = prosemirrorJSONToYDoc(SCHEMA, json, YJS_FIELD)
      Y.applyUpdate(doc, Y.encodeStateAsUpdate(seeded))
      logger.info(`Seeded Yjs room ${documentId} from persisted content`)
    }
  } catch (error) {
    logger.error(`Failed to seed Yjs room ${documentId}, starting empty:`, error)
  }

  return doc
}

const getRoomDoc = async (documentId) => {
  if (roomDocs.has(documentId)) return roomDocs.get(documentId)

  if (!roomInitPromises.has(documentId)) {
    roomInitPromises.set(
      documentId,
      seedFromPersistedContent(documentId).then((doc) => {
        roomDocs.set(documentId, doc)
        roomInitPromises.delete(documentId)
        return doc
      })
    )
  }

  return roomInitPromises.get(documentId)
}

// Called once a document's room has no active collaborators left (see
// documentHandlers.js's document:leave and sockets/index.js's disconnect
// handler), so a future re-join re-seeds from current persisted content
// instead of serving a stale in-memory copy indefinitely.
const evictRoomDoc = (documentId) => {
  roomDocs.delete(documentId)
  roomInitPromises.delete(documentId)
}

const collaborationHandlers = (io, socket) => {
  // Decode the incoming payload as a proper sync-protocol message
  // (matching the envelope the client's _handleDocUpdate produces) and
  // apply it via readSyncMessage, rather than feeding raw/wrapped bytes
  // straight into Y.applyUpdate.
  socket.on('yjs:sync', async ({ documentId, payload }) => {
    
    try {
      const doc = await getRoomDoc(documentId)
      const decoder = decoding.createDecoder(Uint8Array.from(payload))
      const messageType = decoding.readVarUint(decoder)

      if (messageType === 0 /* MESSAGE_SYNC */) {
        const responseEncoder = encoding.createEncoder()
        syncProtocol.readSyncMessage(decoder, responseEncoder, doc, socket)
      }

      // Relay the ORIGINAL wrapped payload unchanged — other clients'
      // decoders expect that same envelope.
      socket.to(`doc:${documentId}`).emit('yjs:sync', { documentId, payload })
    } catch (error) {
      logger.error('Error relaying yjs:sync:', error)
    }
  })

  socket.on('yjs:sync-request', async ({ documentId }) => {
    try {
      const doc = await getRoomDoc(documentId)
      const update = Y.encodeStateAsUpdate(doc)
      if (update.length === 0) return

      // Wrap in the same sync-protocol envelope every other yjs:sync
      // message uses — bare Y.encodeStateAsUpdate() bytes with no
      // [MESSAGE_SYNC][syncStep][...] wrapper is what caused the
      // client's readSyncMessage to throw "Unexpected end of array".
      const encoder = encoding.createEncoder()
      encoding.writeVarUint(encoder, 0) // MESSAGE_SYNC
      syncProtocol.writeUpdate(encoder, update)

      socket.emit('yjs:sync', {
        documentId,
        payload: Array.from(encoding.toUint8Array(encoder))
      })
    } catch (error) {
      logger.error('Error handling yjs:sync-request:', error)
    }
  })

  socket.on('yjs:awareness', ({ documentId, payload }) => {
    socket.to(`doc:${documentId}`).emit('yjs:awareness', { documentId, payload })
  })

  socket.on('comment:add', ({ documentId, ...comment }) => {
    socket.to(`doc:${documentId}`).emit('comment:add', comment)
  })

  socket.on('comment:update', ({ documentId, ...comment }) => {
    socket.to(`doc:${documentId}`).emit('comment:update', comment)
  })

  socket.on('comment:delete', ({ documentId, commentId }) => {
    socket.to(`doc:${documentId}`).emit('comment:delete', commentId)
  })
}

collaborationHandlers.evictRoomDoc = evictRoomDoc

module.exports = collaborationHandlers
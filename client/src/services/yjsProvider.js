import * as Y from 'yjs';
import * as syncProtocol from 'y-protocols/sync';
import * as awarenessProtocol from 'y-protocols/awareness';
import * as encoding from 'lib0/encoding';
import * as decoding from 'lib0/decoding';

import { SOCKET_EVENTS } from '../utils/constants';

const MESSAGE_SYNC = 0;
const MESSAGE_AWARENESS = 1;

// How long to wait for a sync response before assuming this is a
// genuinely brand-new, empty room (nothing to seed from) rather than a
// stuck sync. Prevents the editor from spinning forever on a document
// that legitimately has no prior content.
const SYNC_TIMEOUT_MS = 1500;

/**
 * A Socket.IO-transported Yjs provider.
 *
 * Responsibilities:
 * - Owns a Y.Doc and a Y.Awareness instance for one document room.
 * - Encodes local Yjs updates as binary messages and emits them over
 *   the shared socket connection (via socketService).
 * - Decodes incoming binary messages from other clients and applies
 *   them to the local Y.Doc / awareness state.
 * - On connect, performs the standard Yjs sync handshake (step1/step2)
 *   so a newly-joined client catches up to the room's current state.
 * - Tracks `synced` state (with a fallback timeout) so consumers (see
 *   useCollaboration's isSynced) know when it's safe to render content
 *   instead of an editor that looks empty because sync hasn't
 *   completed yet.
 *
 * Mirrors the public interface of `y-websocket`'s WebsocketProvider
 * (`.doc`, `.awareness`, `.destroy()`) so it drops into
 * `@tiptap/extension-collaboration` / `@tiptap/extension-collaboration-cursor`
 * without modification.
 *
 * BACKEND CONTRACT this depends on (server-side):
 * 1. On `document:join`, the server adds the socket to a room named
 *    by documentId.
 * 2. On `yjs:sync` / `yjs:awareness`, the server relays the raw binary
 *    payload to every OTHER socket in that document's room.
 * 3. On `yjs:sync-request` from a newly-joined client, the server
 *    responds with the room's current authoritative state (seeded
 *    from persisted content on first creation — see
 *    collaborationHandlers.js's seedFromPersistedContent).
 */
class SocketIOYjsProvider {
  constructor({ socket, documentId, userId, userName, color }) {
    this.socket = socket;
    this.documentId = documentId;
    this.doc = new Y.Doc();
    this.awareness = new awarenessProtocol.Awareness(this.doc);
    this.synced = false;
    this._resolveSynced = null;
    this.whenSynced = new Promise((resolve) => {
      this._resolveSynced = resolve;
    });

    this.awareness.setLocalStateField('user', { id: userId, name: userName, color });


    this._handleDocUpdate = this._handleDocUpdate.bind(this);
    this._handleAwarenessUpdate = this._handleAwarenessUpdate.bind(this);
    this._handleIncomingSync = this._handleIncomingSync.bind(this);
    this._handleIncomingAwareness = this._handleIncomingAwareness.bind(this);

    this.doc.on('update', this._handleDocUpdate);
    this.awareness.on('update', this._handleAwarenessUpdate);

    this.socket.on(SOCKET_EVENTS.YJS_SYNC, this._handleIncomingSync);
    this.socket.on(SOCKET_EVENTS.YJS_AWARENESS, this._handleIncomingAwareness);

    // Ask the room for its current state.
    this.socket.emit(SOCKET_EVENTS.YJS_SYNC_REQUEST, { documentId });

  }

  // -------------------------------------------------------------------
  // Outbound: local Yjs doc changed -> broadcast an update message
  // -------------------------------------------------------------------
  _handleDocUpdate(update, origin) {
    if (origin === this) return;

    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MESSAGE_SYNC);
    syncProtocol.writeUpdate(encoder, update);

    this.socket.emit(SOCKET_EVENTS.YJS_SYNC, {
      documentId: this.documentId,
      payload: Array.from(encoding.toUint8Array(encoder)),
    });
  }

  // -------------------------------------------------------------------
  // Outbound: local awareness changed
  // -------------------------------------------------------------------
  _handleAwarenessUpdate({ added, updated, removed }) {
    const changedClients = added.concat(updated, removed);
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MESSAGE_AWARENESS);
    encoding.writeVarUint8Array(
      encoder,
      awarenessProtocol.encodeAwarenessUpdate(this.awareness, changedClients)
    );

    this.socket.emit(SOCKET_EVENTS.YJS_AWARENESS, {
      documentId: this.documentId,
      payload: Array.from(encoding.toUint8Array(encoder)),
    });
  }

  // -------------------------------------------------------------------
  // Inbound: a sync message arrived from another client or the server
  // -------------------------------------------------------------------
  _handleIncomingSync({ documentId, payload }) {
    console.log('incoming sync' + payload);
    if (documentId !== this.documentId) return;
    console.log('incoming sync doc match');
    const decoder = decoding.createDecoder(Uint8Array.from(payload));
    const messageType = decoding.readVarUint(decoder);
    if (messageType !== MESSAGE_SYNC) return;

    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MESSAGE_SYNC);
    const responseType = syncProtocol.readSyncMessage(decoder, encoder, this.doc, this);

    if (responseType === syncProtocol.messageYjsSyncStep2 && encoding.length(encoder) > 1) {
      this.socket.emit(SOCKET_EVENTS.YJS_SYNC, {
        documentId: this.documentId,
        payload: Array.from(encoding.toUint8Array(encoder)),
      });
    }
  }
  // -------------------------------------------------------------------
  // Inbound: an awareness message arrived from another client
  // -------------------------------------------------------------------
  _handleIncomingAwareness({ documentId, payload }) {
    if (documentId !== this.documentId) return;
    const decoder = decoding.createDecoder(Uint8Array.from(payload));
    const messageType = decoding.readVarUint(decoder);
    if (messageType !== MESSAGE_AWARENESS) return;

    awarenessProtocol.applyAwarenessUpdate(
      this.awareness,
      decoding.readVarUint8Array(decoder),
      this
    );
  }

  destroy() {

    awarenessProtocol.removeAwarenessStates(this.awareness, [this.doc.clientID], this);

    this.doc.off('update', this._handleDocUpdate);
    this.awareness.off('update', this._handleAwarenessUpdate);
    this.socket.off(SOCKET_EVENTS.YJS_SYNC, this._handleIncomingSync);
    this.socket.off(SOCKET_EVENTS.YJS_AWARENESS, this._handleIncomingAwareness);

    this.awareness.destroy();
    this.doc.destroy();
  }
}

export default SocketIOYjsProvider;
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    // Who this notification is FOR.
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: {
      type: String,
      enum: ['document_shared', 'comment_added', 'comment_resolved'],
      required: true
    },
    // Free-form, type-specific payload — kept as a plain object rather
    // than a rigid schema so new notification types can add fields
    // without a migration. Always includes enough to render + link.
    data: {
      documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
      documentTitle: String,
      actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      actorName: String,
      role: String
    },
    read: {
      type: Boolean,
      default: false
    },
    readAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

// Most common query: "my recent notifications, newest first"
notificationSchema.index({ user: 1, createdAt: -1 });
// Fast unread-count lookups for the bell badge
notificationSchema.index({ user: 1, read: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
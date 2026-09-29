const mongoose = require('mongoose');

const collaborationSchema = new mongoose.Schema({
  document: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true,
    unique: true
  },
  // Lightweight REST-queryable presence record (backs GET
  // /documents/:id/active-users). Live presence during an open editor
  // session is now sourced from Yjs awareness on the client, not this —
  // this collection just answers "who's around" for clients that aren't
  // currently in the document (e.g. a dashboard "active now" badge).
  activeUsers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    socketId: String,
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

collaborationSchema.index({ document: 1 });
collaborationSchema.index({ 'activeUsers.user': 1 });

collaborationSchema.methods.addActiveUser = function(userId, socketId) {
  const existing = this.activeUsers.find(
    u => u.user.toString() === userId.toString()
  );

  if (existing) {
    existing.socketId = socketId;
    existing.joinedAt = new Date();
  } else {
    this.activeUsers.push({ user: userId, socketId });
  }

  return this.save();
};

collaborationSchema.methods.removeActiveUser = function(socketId) {
  this.activeUsers = this.activeUsers.filter(u => u.socketId !== socketId);
  return this.save();
};

module.exports = mongoose.model('Collaboration', collaborationSchema);
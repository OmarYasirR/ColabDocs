const mongoose = require("mongoose");

const replySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: [1000, "Reply cannot exceed 1000 characters"],
    },
    createdAt: { type: Date, default: Date.now },
    resolved: { type: Boolean, default: false },
  },
  { _id: true },
);

const commentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: [2000, "Comment cannot exceed 2000 characters"],
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    resolved: { type: Boolean, default: false },
    resolvedAt: { type: Date },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    replies: [replySchema],
  },
  { _id: true },
);

const permissionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["owner", "editor", "user"], default: "user" },
  },
  { _id: false },
);

const documentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please provide a title"],
      trim: true,
      maxlength: [200, "Title cannot be more than 200 characters"],
    },
    // CHANGED: was `Object` storing Quill Delta ops. The frontend's Tiptap
    // editor persists an HTML string via PATCH/PUT /documents/:id
    // { content }, and real-time merging now happens client-side via Yjs
    // (see collaborationHandlers.js) — this field is purely the durable
    // snapshot used to reload a document with no active collaborators.
    content: {
      type: String,
      default: "",
    },
    version: {
      type: Number,
      default: 0,
    },
    comments: [commentSchema],
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    collaborators: [permissionSchema],
    isPublic: {
      type: Boolean,
      default: false,
    },
    // NEW: the Dashboard's favorites/trash filter views (FILTER_CONFIG in
    // Dashboard.jsx) read these two fields directly.
    isFavorite: {
      type: Boolean,
      default: false,
    },
    isTrashed: {
      type: Boolean,
      default: false,
    },
    trashedAt: {
      type: Date,
      default: null,
    },
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    lastModifiedAt: {
      type: Date,
      default: Date.now,
    },
    snapshots: [
      {
        version: Number,
        content: String, // CHANGED: was Object (Delta) — now HTML, matching `content` above
        createdAt: Date,
        createdBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

documentSchema.index({ title: "text", content: "text" });
documentSchema.index({ "comments.createdAt": -1 });
documentSchema.index({ owner: 1, isTrashed: 1 });

documentSchema.methods.getUserPermission = function (userId) {
  const ownerId = this.owner._id
    ? this.owner._id.toString()
    : this.owner.toString();
  if (ownerId === userId.toString()) return "admin";

  const collaborator = this.collaborators.find(
    (c) => c.user.toString() === userId.toString(),
  );
  return collaborator ? collaborator.role : this.isPublic ? "read" : null;
};

documentSchema.methods.addCollaborator = function (userId, role = "user") {
  const existing = this.collaborators.find(
    (c) => c.user.toString() === userId.toString(),
  );
  if (existing) {
    existing.role = role;
  } else {
    this.collaborators.push({ user: userId, role });
  }
  return this.save();
};

documentSchema.methods.createSnapshot = function (userId) {
  this.snapshots.push({
    version: this.version,
    content: this.content,
    createdAt: new Date(),
    createdBy: userId,
  });
  if (this.snapshots.length > 10) {
    this.snapshots = this.snapshots.slice(-10);
  }
  return this.save();
};

// CHANGED: dropped the `selection` param (Quill range) — the frontend's
// comment UI is document-level only, no text-anchored ranges.
documentSchema.methods.addComment = function (userId, content) {
  this.comments.push({
    user: userId,
    content,
    createdAt: new Date(),
    updatedAt: new Date(),
    resolved: false,
    replies: [],
  });
  return this.save();
};

documentSchema.methods.addReply = function (commentId, userId, content) {
  const comment = this.comments.id(commentId);
  if (!comment) throw new Error("Comment not found");
  comment.replies.push({ user: userId, content, createdAt: new Date() });
  comment.updatedAt = new Date();
  return this.save();
};

documentSchema.methods.resolveComment = function (commentId, userId) {
  const comment = this.comments.id(commentId);
  if (!comment) throw new Error("Comment not found");
  comment.resolved = true;
  comment.resolvedAt = new Date();
  comment.resolvedBy = userId;
  comment.replies.forEach((reply) => {
    reply.resolved = true;
  });
  return this.save();
};

documentSchema.methods.deleteComment = function (commentId) {
  this.comments = this.comments.filter(
    (c) => c._id.toString() !== commentId.toString(),
  );
  return this.save();
};

documentSchema.methods.deleteReply = function (commentId, replyId) {
  const comment = this.comments.id(commentId);
  if (!comment) throw new Error("Comment not found");
  comment.replies = comment.replies.filter(
    (r) => r._id.toString() !== replyId.toString(),
  );
  return this.save();
};

module.exports = mongoose.model("Document", documentSchema);

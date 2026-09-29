const Document = require('../models/Document')
const Collaboration = require('../models/Collaboration')
const { validationResult } = require('express-validator')
const notificationService = require('../services/notificationService')

// ---------------------------------------------------------------------------
// Serialization — maps Mongoose documents to the exact flat shape the
// frontend's documentSlice/collaborationSlice expect (`id` not `_id`,
// `text`/`authorId`/`authorName` for comments, etc.). Centralized here so
// the DB schema stays free to evolve independently of the wire format.
// ---------------------------------------------------------------------------
const serializeDocument = (doc, userId) => ({
  id: doc._id.toString(),
  title: doc.title,
  content: doc.content,
  ownerId: (doc.owner._id || doc.owner).toString(),
  role: doc.getUserPermission(userId),
  isFavorite: doc.isFavorite,
  isTrashed: doc.isTrashed,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt
})

const serializeComment = (comment) => ({
  id: comment._id.toString(),
  text: comment.content,
  authorId: (comment.user._id || comment.user).toString(),
  authorName: comment.user.name || 'Unknown',
  createdAt: comment.createdAt,
  resolved: comment.resolved
})

// ----- Document CRUD -----

exports.getDocuments = async (req, res, next) => {
  try {
    const { filter } = req.query

    const query = {
      $or: [
        { owner: req.user.id },
        { 'collaborators.user': req.user.id },
        { isPublic: true }
      ]
    }

    // Matches Dashboard.jsx's FILTER_CONFIG — server-side filtering as
    // a first pass; the frontend also re-filters client-side, so this
    // just needs to be a reasonable superset, not exact.
    if (filter === 'trash') {
      query.isTrashed = true
    } else {
      query.isTrashed = { $ne: true }
      if (filter === 'favorites') query.isFavorite = true
      if (filter === 'shared') query.owner = { $ne: req.user.id }
    }

    const documents = await Document.find(query)
      .populate('owner', 'name email avatar')
      .sort({ updatedAt: -1 })

    res.json({
      success: true,
      documents: documents.map((d) => serializeDocument(d, req.user.id))
    })
  } catch (error) {
    next(error)
  }
}

exports.getDocument = async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id).populate('owner', 'name email avatar')
    if (!document) return res.status(404).json({ message: 'Document not found' })

    const permission = document.getUserPermission(req.user.id)
    if (!permission) return res.status(403).json({ message: 'Access denied' })

    // Flat, unwrapped — fetchDocumentById's thunk assigns the response
    // body directly to state.activeDocument.
    res.json(serializeDocument(document, req.user.id))
  } catch (error) {
    next(error)
  }
}

exports.createDocument = async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

    const { title, content = '' } = req.body
    const document = await Document.create({
      title,
      content,
      owner: req.user.id,
      lastModifiedBy: req.user.id
    })
    await document.populate('owner', 'name email avatar')

    res.status(201).json(serializeDocument(document, req.user.id))
  } catch (error) {
    next(error)
  }
}

exports.updateDocument = async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id).populate('owner', 'name email avatar')
    if (!document) return res.status(404).json({ message: 'Document not found' })

    const permission = document.getUserPermission(req.user.id)
    if (!permission || permission === 'read') {
      return res.status(403).json({ message: 'Write permission required' })
    }

    const { title, content } = req.body
    if (title !== undefined) document.title = title
    if (content !== undefined) document.content = content
    document.lastModifiedBy = req.user.id
    document.lastModifiedAt = new Date()
    document.version += 1
    await document.save()

    res.json(serializeDocument(document, req.user.id))
  } catch (error) {
    next(error)
  }
}

// Soft delete — moves to trash. useDocument's removeDocument thunk only
// needs a 2xx, the body content doesn't matter.
exports.deleteDocument = async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id)
    if (!document) return res.status(404).json({ message: 'Document not found' })
    if (document.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the owner can delete this document' })
    }

    document.isTrashed = true
    document.trashedAt = new Date()
    await document.save()

    res.json({ success: true, message: 'Document moved to trash' })
  } catch (error) {
    next(error)
  }
}

// NEW — matches documentService.permanentlyDeleteDocument
// (DELETE /documents/:id/permanent)
exports.permanentlyDeleteDocument = async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id)
    if (!document) return res.status(404).json({ message: 'Document not found' })
    if (document.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the owner can delete this document' })
    }

    await Document.deleteOne({ _id: document._id })
    await Collaboration.deleteOne({ document: document._id })

    res.json({ success: true, message: 'Document permanently deleted' })
  } catch (error) {
    next(error)
  }
}

// NEW — matches documentService.restoreDocument (POST /documents/:id/restore)
exports.restoreDocument = async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id).populate('owner', 'name email avatar')
    if (!document) return res.status(404).json({ message: 'Document not found' })

    const permission = document.getUserPermission(req.user.id)
    if (!permission) return res.status(403).json({ message: 'Access denied' })

    document.isTrashed = false
    document.trashedAt = null
    await document.save()

    res.json(serializeDocument(document, req.user.id))
  } catch (error) {
    next(error)
  }
}

// NEW — matches documentService.setFavorite (PATCH /documents/:id/favorite)
exports.setDocumentFavorite = async (req, res, next) => {
  try {
    const { isFavorite } = req.body
    const document = await Document.findById(req.params.id).populate('owner', 'name email avatar')
    if (!document) return res.status(404).json({ message: 'Document not found' })

    const permission = document.getUserPermission(req.user.id)
    if (!permission) return res.status(403).json({ message: 'Access denied' })

    document.isFavorite = Boolean(isFavorite)
    await document.save()

    res.json(serializeDocument(document, req.user.id))
  } catch (error) {
    next(error)
  }
}

exports.addCollaborator = async (req, res, next) => {
  try {
    const { userId, role = 'read' } = req.body
    const document = await Document.findById(req.params.id)
    if (!document) return res.status(404).json({ message: 'Document not found' })
    if (document.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the owner can manage collaborators' })
    }

    await document.addCollaborator(userId, role)
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
}

exports.removeCollaborator = async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id)
    if (!document) return res.status(404).json({ message: 'Document not found' })
    if (document.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the owner can manage collaborators' })
    }

    document.collaborators = document.collaborators.filter(
      (c) => c.user.toString() !== req.params.userId
    )
    await document.save()
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
}

exports.getSnapshots = async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id).select('snapshots')
    if (!document) return res.status(404).json({ message: 'Document not found' })
    res.json({ success: true, snapshots: document.snapshots })
  } catch (error) {
    next(error)
  }
}

// ----- Comments -----

exports.getDocumentComments = async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id)
      .select('comments owner collaborators isPublic')
      .populate('comments.user', 'name email avatar')

    if (!document) return res.status(404).json({ message: 'Document not found' })

    const permission = document.getUserPermission(req.user.id)
    if (!permission) return res.status(403).json({ message: 'Access denied' })

    res.json({ success: true, comments: document.comments.map(serializeComment) })
  } catch (error) {
    next(error)
  }
}

// Accepts `text` (the frontend's field name) as well as `content`, and
// responds with the flat serialized comment — useCollaboration.addComment
// dispatches the raw response body straight into commentAdded().
exports.addDocumentComment = async (req, res, next) => {
  try {
    const content = req.body.text ?? req.body.content
    const document = await Document.findById(req.params.id)
    if (!document) return res.status(404).json({ message: 'Document not found' })

    const permission = document.getUserPermission(req.user.id)
    if (!permission) return res.status(403).json({ message: 'Access denied' })

    await document.addComment(req.user.id, content)
    await document.populate('comments.user', 'name email avatar')
    const newComment = document.comments[document.comments.length - 1]

    res.status(201).json(serializeComment(newComment))
  } catch (error) {
    next(error)
  }
}

// Handles both content edits AND the resolve toggle in one place, since
// collaborationService.resolveComment PATCHes this same route with
// { resolved: true } rather than hitting a separate /resolve endpoint.
exports.updateDocumentComment = async (req, res, next) => {
  try {
    const { commentId } = req.params
    const { content, resolved } = req.body
    const document = await Document.findById(req.params.id)
    if (!document) return res.status(404).json({ message: 'Document not found' })

    const comment = document.comments.id(commentId)
    if (!comment) return res.status(404).json({ message: 'Comment not found' })

    if (comment.user.toString() !== req.user.id && document.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' })
    }

    if (content !== undefined) {
      comment.content = content
      comment.updatedAt = new Date()
    }
    if (resolved === true) {
      comment.resolved = true
      comment.resolvedAt = new Date()
      comment.resolvedBy = req.user.id
    } else if (resolved === false) {
      comment.resolved = false
      comment.resolvedAt = undefined
      comment.resolvedBy = undefined
    }

    await document.save()
    await document.populate('comments.user', 'name email avatar')

    res.json(serializeComment(document.comments.id(commentId)))
  } catch (error) {
    next(error)
  }
}

// Kept as an explicit-verb alias — delegates to the same logic above.
exports.resolveDocumentComment = async (req, res, next) => {
  req.body = { ...req.body, resolved: true }
  return exports.updateDocumentComment(req, res, next)
}

exports.deleteDocumentComment = async (req, res, next) => {
  try {
    const { commentId } = req.params
    const document = await Document.findById(req.params.id)
    if (!document) return res.status(404).json({ message: 'Document not found' })

    const comment = document.comments.id(commentId)
    if (!comment) return res.status(404).json({ message: 'Comment not found' })

    if (comment.user.toString() !== req.user.id && document.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' })
    }

    await document.deleteComment(comment._id)
    res.json({ success: true, message: 'Comment deleted' })
  } catch (error) {
    next(error)
  }
}

// ----- Replies (kept for future use — no current frontend UI for these) -----

exports.addReply = async (req, res, next) => {
  try {
    const { commentId } = req.params
    const { content } = req.body
    const document = await Document.findById(req.params.id)
    if (!document) return res.status(404).json({ message: 'Document not found' })

    const permission = document.getUserPermission(req.user.id)
    if (!permission) return res.status(403).json({ message: 'Access denied' })

    const comment = document.comments.id(commentId)
    if (!comment) return res.status(404).json({ message: 'Comment not found' })

    await document.addReply(commentId, req.user.id, content)
    res.status(201).json({ success: true })
  } catch (error) {
    next(error)
  }
}

exports.deleteReply = async (req, res, next) => {
  try {
    const { commentId, replyId } = req.params
    const document = await Document.findById(req.params.id)
    if (!document) return res.status(404).json({ message: 'Document not found' })

    const comment = document.comments.id(commentId)
    if (!comment) return res.status(404).json({ message: 'Comment not found' })

    const reply = comment.replies.id(replyId)
    if (!reply) return res.status(404).json({ message: 'Reply not found' })

    if (reply.user.toString() !== req.user.id && document.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' })
    }

    comment.replies.pull(replyId)
    await document.save()
    res.json({ success: true, message: 'Reply deleted' })
  } catch (error) {
    next(error)
  }
}

exports.resolveReply = async (req, res, next) => {
  try {
    const { commentId, replyId } = req.params
    const document = await Document.findById(req.params.id)
    if (!document) return res.status(404).json({ message: 'Document not found' })

    const comment = document.comments.id(commentId)
    if (!comment) return res.status(404).json({ message: 'Comment not found' })

    const reply = comment.replies.id(replyId)
    if (!reply) return res.status(404).json({ message: 'Reply not found' })

    if (reply.user.toString() !== req.user.id && document.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' })
    }

    reply.resolved = true
    await document.save()
    res.json({ success: true, message: 'Reply resolved' })
  } catch (error) {
    next(error)
  }
}

// ----- Active users -----

exports.getActiveUsers = async (req, res, next) => {
  try {
    const collaboration = await Collaboration.findOne({ document: req.params.id })
      .populate('activeUsers.user', 'name email avatar')

    if (!collaboration) return res.json({ success: true, activeUsers: [] })
    res.json({ success: true, activeUsers: collaboration.activeUsers })
  } catch (error) {
    next(error)
  }
}

// ------ Document Collabrators ------


exports.addCollaborator = async (req, res, next) => {
  try {
    const { userId, role = 'user' } = req.body;

    if (!['user', 'editor'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const document = await Document.findById(req.params.id).populate('owner', 'name email avatar');
    if (!document) return res.status(404).json({ message: 'Document not found' });

    if (document.owner._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the owner can manage collaborators' });
    }

    if (userId === req.user.id) {
      return res.status(400).json({ message: 'You already own this document' });
    }

    await document.addCollaborator(userId, role);

    const updated = await Document.findById(document._id).populate('collaborators.user', 'name email avatar');
    const added = updated.collaborators.find((c) => c.user._id.toString() === userId);

    const io = req.app.get('io');
    await notificationService.notify(io, {
      userId,
      type: 'document_shared',
      data: {
        documentId: document._id.toString(),
        documentTitle: document.title,
        actorId: document.owner._id.toString(),
        actorName: document.owner.name,
        role
      }
    });

    res.json({
      success: true,
      collaborator: added
        ? {
            id: added.user._id.toString(),
            name: added.user.name,
            email: added.user.email,
            avatar: added.user.avatar,
            role: added.role
          }
        : null
    });
  } catch (error) {
    next(error);
  }
};

// NEW — GET /:id/collaborators. Returns owner + all collaborators in
// one flat list so the share modal can show "who already has access"
// alongside the invite list.
exports.getCollaborators = async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('collaborators.user', 'name email avatar');

    if (!document) return res.status(404).json({ message: 'Document not found' });

    const permission = document.getUserPermission(req.user.id);
    if (!permission) return res.status(403).json({ message: 'Access denied' });

    const collaborators = [
      {
        id: document.owner._id.toString(),
        name: document.owner.name,
        email: document.owner.email,
        avatar: document.owner.avatar,
        role: 'owner'
      },
      ...document.collaborators.map((c) => ({
        id: c.user._id.toString(),
        name: c.user.name,
        email: c.user.email,
        avatar: c.user.avatar,
        role: c.role
      }))
    ];

    res.json({ success: true, collaborators });
  } catch (error) {
    next(error);
  }
};
exports.removeCollaborator = async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id)
    if (!document) return res.status(404).json({ message: 'Document not found' })
    if (document.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the owner can manage collaborators' })
    }

    document.collaborators = document.collaborators.filter(
      (c) => c.user.toString() !== req.params.userId
    )
    await document.save()

    res.json({ success: true, message: 'Collaborator removed' })
  } catch (error) {
    next(error)
  }
}


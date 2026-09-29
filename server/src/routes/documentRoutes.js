const express = require('express')
const { body } = require('express-validator')
const {
  getDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
  permanentlyDeleteDocument,
  restoreDocument,
  setDocumentFavorite,
  addCollaborator,
  removeCollaborator,
  getSnapshots,
  addDocumentComment,
  getDocumentComments,
  resolveDocumentComment,
  deleteDocumentComment,
  updateDocumentComment,
  getActiveUsers,
  addReply,
  deleteReply,
  resolveReply,
  getCollaborators
} = require('../controllers/documentController')
const { protect } = require('../middleware/auth')

const router = express.Router()

router.use(protect)

router.route('/')
  .get(getDocuments)
  .post([body('title').trim().notEmpty()], createDocument)

router.route('/:id')
  .get(getDocument)
  .put(updateDocument)
  .patch(updateDocument) // NEW — documentService.updateDocument uses PATCH
  .delete(deleteDocument) // soft delete — moves to trash

// NEW — trash / favorite lifecycle, matching documentService.js
router.delete('/:id/permanent', permanentlyDeleteDocument)
router.post('/:id/restore', restoreDocument)
router.patch('/:id/favorite', setDocumentFavorite)

router.route('/:id/collaborators')
  .get(getCollaborators)
  .post(addCollaborator)

router.route('/:id/collaborators/:userId')
  .delete(removeCollaborator)

router.get('/:id/snapshots', getSnapshots)

// Comments
router.get('/:id/comments', getDocumentComments)
router.post('/:id/comments', addDocumentComment)
router.patch('/:id/comments/:commentId', updateDocumentComment) // NEW — handles content edits AND resolve toggle
router.put('/:id/comments/:commentId', updateDocumentComment)   // kept for backward compatibility
router.delete('/:id/comments/:commentId', deleteDocumentComment)
router.post('/:id/comments/:commentId/resolve', resolveDocumentComment) // legacy explicit-verb alias

router.get('/:id/active-users', getActiveUsers)

// Replies
router.post('/:id/comments/:commentId/replies', addReply)
router.delete('/:id/comments/:commentId/replies/:replyId', deleteReply)
router.put('/:id/comments/:commentId/replies/:replyId/resolve', resolveReply)

module.exports = router
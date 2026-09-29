const Document = require('../models/Document');
const User = require('../models/User');
const Collaboration = require('../models/Collaboration');
const logger = require('../utils/logger');

class DocumentService {
  async createDocument(userId, { title = 'Untitled Document', content = '' }) {
    try {
      const document = new Document({
        title,
        content,
        owner: userId, // FIXED: was `ownerId` — schema field is `owner`
        version: 1,
        isPublic: false,
        lastModifiedBy: userId,
        lastModifiedAt: new Date()
      });

      await document.save();

      // FIXED: Collaboration schema fields are `document`/`user`, not
      // `documentId`/`userId`. Also role enum is ['owner','editor','user'],
      // not the earlier 'read'/'write'/'admin' set from a different draft.
      await Collaboration.create({
        document: document._id,
        activeUsers: []
      });

      logger.info(`Document created: ${document._id} by user ${userId}`);
      await document.populate('owner', 'name email avatar');

      return document;
    } catch (error) {
      logger.error('Error creating document:', error);
      throw new Error('Failed to create document');
    }
  }

  /**
   * Get document by ID with a required minimum permission level.
   * FIXED: this used to call itself recursively with no base case,
   * causing an infinite loop (and the stuck editor spinner). It now
   * actually fetches and returns the document after the access check.
   */
  async getDocumentWithPermission(documentId, userId, requiredPermission = 'user') {
    try {
      let allowedRoles;
      switch (requiredPermission) {
        case 'owner':
          allowedRoles = ['owner'];
          break;
        case 'editor':
          allowedRoles = ['owner', 'editor'];
          break;
        default:
          allowedRoles = ['owner', 'editor', 'user'];
          break;
      }

      const document = await Document.findById(documentId).populate('owner', 'name email avatar');
      if (!document) {
        return { document: null, permission: null };
      }

      const permission = document.getUserPermission(userId);
      const normalizedPermission = permission === 'admin' ? 'owner' : permission;

      if (!normalizedPermission || !allowedRoles.includes(normalizedPermission)) {
        return { document: null, permission: null };
      }

      return { document, permission: normalizedPermission };
    } catch (error) {
      logger.error(`Error in getDocumentWithPermission for document ${documentId}:`, error);
      throw error;
    }
  }

  async getDocumentContent(documentId, userId) {
    try {
      const hasWriteAccess = await this.checkDocumentAccess(documentId, userId, ['owner', 'editor']);
      if (!hasWriteAccess) throw new Error('Write access denied');

      const document = await Document.findById(documentId).select('content version title');
      if (!document) throw new Error('Document not found');

      return {
        id: document._id,
        title: document.title,
        content: document.content,
        version: document.version
      };
    } catch (error) {
      logger.error('Error fetching document content:', error);
      throw error;
    }
  }

  async updateDocument(documentId, userId, updates) {
    try {
      const hasWriteAccess = await this.checkDocumentAccess(documentId, userId, ['owner', 'editor']);
      if (!hasWriteAccess) throw new Error('Write access denied');

      const allowedUpdates = ['title', 'content', 'isPublic'];
      const updateData = {};
      Object.keys(updates).forEach((key) => {
        if (allowedUpdates.includes(key)) updateData[key] = updates[key];
      });

      updateData.lastModifiedBy = userId;
      updateData.lastModifiedAt = new Date();
      if (updates.content !== undefined) {
        updateData.$inc = { version: 1 };
      }

      const { $inc, ...setFields } = updateData;
      const document = await Document.findByIdAndUpdate(
        documentId,
        { $set: setFields, ...($inc ? { $inc } : {}) },
        { new: true, runValidators: true }
      ).lean();

      if (!document) throw new Error('Document not found');

      logger.info(`Document ${documentId} updated by user ${userId}`);
      return document;
    } catch (error) {
      logger.error('Error updating document:', error);
      throw error;
    }
  }

  async deleteDocument(documentId, userId) {
    try {
      const document = await Document.findById(documentId);
      if (!document) throw new Error('Document not found');

      // FIXED: was `document.ownerId` — schema field is `owner`
      if (document.owner.toString() !== userId.toString()) {
        throw new Error('Only owner can delete this document');
      }

      await Promise.all([
        Document.findByIdAndDelete(documentId),
        Collaboration.deleteOne({ document: documentId }) // FIXED: field name + deleteOne (schema has `unique: true` on document)
      ]);

      logger.info(`Document ${documentId} deleted by user ${userId}`);
      return { success: true, message: 'Document deleted successfully' };
    } catch (error) {
      logger.error('Error deleting document:', error);
      throw error;
    }
  }

  /**
   * List documents for user (owned + explicitly shared via
   * Document.collaborators — NOT the Collaboration model, which only
   * tracks live presence, not document sharing/permissions).
   */
  async getUserDocuments(userId, { page = 1, limit = 20, sortBy = 'lastModifiedAt', order = 'desc', search = '' } = {}) {
    try {
      const skip = (page - 1) * limit;

      const query = {
        isTrashed: { $ne: true },
        $or: [{ owner: userId }, { 'collaborators.user': userId }, { isPublic: true }]
      };

      if (search) {
        query.title = { $regex: search, $options: 'i' };
      }

      const total = await Document.countDocuments(query);

      const documents = await Document.find(query)
        .populate('owner', 'name email')
        .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const documentsWithRole = documents.map((doc) => ({
        ...doc,
        role:
          doc.owner._id.toString() === userId.toString()
            ? 'owner'
            : doc.collaborators.find((c) => c.user.toString() === userId.toString())?.role || 'user',
        ownerName: doc.owner.name,
        ownerEmail: doc.owner.email
      }));

      return {
        documents: documentsWithRole,
        pagination: { page, limit, total, pages: Math.ceil(total / limit), hasMore: page * limit < total }
      };
    } catch (error) {
      logger.error('Error fetching user documents:', error);
      throw new Error('Failed to fetch documents');
    }
  }

  async shareDocument(documentId, ownerId, { email, role = 'user' }) {
    try {
      const document = await Document.findById(documentId);
      if (!document) throw new Error('Document not found');
      if (document.owner.toString() !== ownerId.toString()) {
        throw new Error('Only owner can share document');
      }

      const user = await User.findOne({ email });
      if (!user) throw new Error('User not found');

      await document.addCollaborator(user._id, role);

      logger.info(`Document ${documentId} shared with ${email} as ${role}`);
      return { success: true, message: 'Document shared successfully' };
    } catch (error) {
      logger.error('Error sharing document:', error);
      throw error;
    }
  }

  async unshareDocument(documentId, ownerId, targetUserId) {
    try {
      const document = await Document.findById(documentId);
      if (!document) throw new Error('Document not found');
      if (document.owner.toString() !== ownerId.toString()) {
        throw new Error('Only owner can remove collaborators');
      }
      if (targetUserId.toString() === ownerId.toString()) {
        throw new Error('Cannot remove document owner');
      }

      document.collaborators = document.collaborators.filter(
        (c) => c.user.toString() !== targetUserId.toString()
      );
      await document.save();

      logger.info(`User ${targetUserId} removed from document ${documentId}`);
      return { success: true, message: 'Collaborator removed' };
    } catch (error) {
      logger.error('Error unsharing document:', error);
      throw error;
    }
  }

  /**
   * Check if user has access to document.
   * FIXED: removed the debug console.log that ran BEFORE the null
   * check (would throw on a nonexistent document instead of returning
   * false), and fixed the Collaboration query to use `document`/`user`
   * — note Collaboration no longer stores per-user roles (it's just a
   * presence tracker now), so role-based access actually comes from
   * Document.collaborators, not the Collaboration model.
   */
  async checkDocumentAccess(documentId, userId, allowedRoles = ['owner', 'editor', 'user']) {
    try {
      const document = await Document.findById(documentId);
      if (!document) return false;

      if (document.owner.toString() === userId.toString()) {
        return true;
      }

      if (document.isPublic && allowedRoles.includes('user')) {
        return true;
      }

      const collaborator = document.collaborators.find(
        (c) => c.user.toString() === userId.toString()
      );

      if (!collaborator) return false;

      return allowedRoles.includes(collaborator.role);
    } catch (error) {
      logger.error('Error checking document access:', error);
      return false;
    }
  }

  async getUserRole(documentId, userId) {
    try {
      const document = await Document.findById(documentId);
      if (!document) return null;
      return document.getUserPermission(userId);
    } catch (error) {
      logger.error('Error getting user role:', error);
      return null;
    }
  }

  async duplicateDocument(documentId, userId) {
    try {
      const original = await Document.findById(documentId);
      if (!original) throw new Error('Document not found');

      const hasAccess = await this.checkDocumentAccess(documentId, userId);
      if (!hasAccess) throw new Error('Access denied');

      return await this.createDocument(userId, {
        title: `${original.title} (Copy)`,
        content: original.content
      });
    } catch (error) {
      logger.error('Error duplicating document:', error);
      throw error;
    }
  }
}

module.exports = new DocumentService();
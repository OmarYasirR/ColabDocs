const User = require('../models/User');
const Document = require('../models/Document');

// Search users
exports.searchUsers = async (req, res, next) => {
  try {
    const { query } = req.query;

    if (!query || query.length < 2) {
      return res.status(400).json({ message: 'Query must be at least 2 characters' });
    }

    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ],
      isActive: true
    })
      .select('name email avatar')
      .limit(10);

    res.json({ success: true, users });
  } catch (error) {
    next(error);
  }
};

// Get user by ID
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('name email avatar');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// List users available to share a document with — excludes the
// requester, the document's current owner, and existing collaborators,
// so the share modal only shows people who could actually be invited.
exports.listUsers = async (req, res, next) => {
  try {
    const { excludeDocument, query } = req.query;
    const excludedIds = new Set([req.user.id]);

    if (excludeDocument) {
      const document = await Document.findById(excludeDocument).select('owner collaborators');
      if (document) {
        excludedIds.add(document.owner.toString());
        document.collaborators.forEach((c) => excludedIds.add(c.user.toString()));
      }
    }

    const filter = {
      _id: { $nin: Array.from(excludedIds) },
      isActive: true
    };

    if (query && query.trim().length >= 1) {
      filter.$or = [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ];
    }

    const users = await User.find(filter).select('name email avatar').limit(50);
    res.json({ success: true, users });
  } catch (error) {
    next(error);
  }
};
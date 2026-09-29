const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const User = require('../models/User');
const Document = require('../models/Document');
const bcrypt = require('bcryptjs');

// Configure multer for avatar uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/avatars/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, req.userId + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

// Auth middleware
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Get user profile
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get user preferences (you can store these in a separate collection)
    const preferences = {
      theme: user.theme || 'light',
      fontSize: user.fontSize || 'medium',
      autoSave: user.autoSave !== false,
      showCursorNames: user.showCursorNames !== false,
      highlightChanges: user.highlightChanges !== false,
      notifications: user.notifications !== false
    };
    
    res.json({ user, preferences });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user profile
router.put('/', auth, async (req, res) => {
  try {
    const { username, email, bio, fullName, company, location, website } = req.body;
    
    const updates = {};
    if (username) updates.username = username;
    if (email) updates.email = email;
    if (bio !== undefined) updates.bio = bio;
    if (fullName !== undefined) updates.fullName = fullName;
    if (company !== undefined) updates.company = company;
    if (location !== undefined) updates.location = location;
    if (website !== undefined) updates.website = website;
    
    const user = await User.findByIdAndUpdate(
      req.userId,
      updates,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update preferences
router.put('/preferences', auth, async (req, res) => {
  try {
    const { theme, fontSize, autoSave, showCursorNames, highlightChanges, notifications } = req.body;
    
    const updates = {};
    if (theme) updates.theme = theme;
    if (fontSize) updates.fontSize = fontSize;
    if (autoSave !== undefined) updates.autoSave = autoSave;
    if (showCursorNames !== undefined) updates.showCursorNames = showCursorNames;
    if (highlightChanges !== undefined) updates.highlightChanges = highlightChanges;
    if (notifications !== undefined) updates.notifications = notifications;
    
    const user = await User.findByIdAndUpdate(
      req.userId,
      updates,
      { new: true }
    ).select('-password');
    
    res.json({ preferences: updates });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload avatar
router.post('/avatar', auth, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    
    const user = await User.findByIdAndUpdate(
      req.userId,
      { avatar: avatarUrl },
      { new: true }
    ).select('-password');
    
    res.json({ avatar: avatarUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Change password
router.post('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    user.password = newPassword;
    await user.save();
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const ownedDocuments = await Document.countDocuments({ owner: req.userId });
    const collaboratedDocuments = await Document.countDocuments({ collaborators: req.userId });
    const totalDocuments = ownedDocuments + collaboratedDocuments;
    
    // Calculate total edits (simplified - you'd need a separate collection for tracking)
    const allDocuments = await Document.find({
      $or: [
        { owner: req.userId },
        { collaborators: req.userId }
      ]
    });
    
    // This is simplified - in production, track actual edit counts
    const totalEdits = allDocuments.reduce((sum, doc) => sum + (doc.version || 0), 0);
    
    res.json({
      totalDocuments,
      ownedDocuments,
      collaboratedDocuments,
      totalEdits,
      collaborationHours: Math.floor(totalEdits / 60), // Simplified
      sharedDocuments: collaboratedDocuments
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's activity
router.get('/activity', auth, async (req, res) => {
  try {
    const recentDocuments = await Document.find({
      $or: [
        { owner: req.userId },
        { collaborators: req.userId }
      ]
    })
    .sort({ updatedAt: -1 })
    .limit(10)
    .select('title updatedAt content');
    
    const activity = recentDocuments.map(doc => ({
      type: doc.owner.toString() === req.userId ? 'created' : 'edited',
      documentId: doc._id,
      title: doc.title,
      timestamp: doc.updatedAt,
      preview: doc.content?.substring(0, 100) || ''
    }));
    
    res.json(activity);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
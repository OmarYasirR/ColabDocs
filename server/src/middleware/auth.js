const jwt = require('jsonwebtoken');
const User = require('../models/User');

// HTTP middleware for Express routes
exports.protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id);

      
      if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
      }

      if (!req.user.isActive) {
        return res.status(401).json({ message: 'User account is deactivated' });
      }

      next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } catch (error) {
    next(error);
  }
};

// Socket.IO middleware for authenticating WebSocket connections
exports.protectSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      console.error('Socket authentication: No token provided');
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);

      if (!user) {
        return next(new Error('User not found'));
      }

      if (!user.isActive) {
        return next(new Error('User account is deactivated'));
      }

      // Attach user to socket
      socket.user = user;
      socket.userId = user._id;
      
      console.log(`Socket authenticated for user: ${user.email}`);
      next();
    } catch (error) {
      console.error('Socket token verification failed:', error.message);
      return next(new Error('Invalid token'));
    }
  } catch (error) {
    console.error('Socket authentication error:', error);
    next(new Error('Authentication failed'));
  }
};

// Optional: Role-based access for HTTP
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized for this action' });
    }
    next();
  };
};

// Optional: Role-based access for Socket.IO
exports.authorizeSocket = (...roles) => {
  return (socket, next) => {
    if (!roles.includes(socket.user.role)) {
      return next(new Error('Not authorized for this action'));
    }
    next();
  };
};
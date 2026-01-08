const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');
const userService = require('../services/userService');

const resolveUserForFirebaseClaims = async (claims) => {
  const email = (claims && typeof claims.email === 'string') ? claims.email : null;
  if (!email) return null;
  return userService.findByEmail(email);
};

// Protect routes - verify token
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Check if token exists in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    try {
      // Verify backend JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      const user = await userService.findById(decoded.id);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      delete user.password;
      req.user = user;
      return next();
    } catch (jwtError) {
      // If backend JWT verification fails, try Firebase ID token (used by the frontend)
      try {
        const claims = await admin.auth().verifyIdToken(token);
        const user = await resolveUserForFirebaseClaims(claims);

        if (!user) {
          return res.status(401).json({
            success: false,
            message: 'User not found'
          });
        }

        delete user.password;
        req.user = user;
        return next();
      } catch (firebaseError) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized to access this route'
        });
      }
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

// Optional authentication - doesn't fail if no token
exports.optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await userService.findById(decoded.id);
        if (user) {
          delete user.password;
        }
        req.user = user;
      } catch (error) {
        // Token is invalid, but we don't fail the request
        req.user = null;
      }
    }

    next();
  } catch (error) {
    req.user = null;
    next();
  }
}; 
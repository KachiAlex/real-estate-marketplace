const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');
const userService = require('../services/userService');
const mockUsers = require('../data/mockUsers');

const ALLOW_MOCK_AUTH = process.env.ALLOW_MOCK_AUTH !== 'false';

const findMockUserByEmail = (email) => {
  if (!email || typeof email !== 'string') return null;
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;
  return mockUsers.find((user) => user.email?.toLowerCase() === normalized) || null;
};

const attachMockUserFromHeaders = (req) => {
  if (!ALLOW_MOCK_AUTH || !req?.headers) {
    return false;
  }

  const mockEmail = req.headers['x-mock-user-email'] || req.headers['x-mock-user'];
  const mockUser = findMockUserByEmail(mockEmail);

  if (!mockUser) {
    return false;
  }

  const sanitizedUser = { ...mockUser };
  delete sanitizedUser.password;
  sanitizedUser.id = sanitizedUser.id || sanitizedUser._id || sanitizedUser.uid || sanitizedUser.email;
  sanitizedUser.role = sanitizedUser.role || 'user';
  sanitizedUser.roles = Array.isArray(sanitizedUser.roles) && sanitizedUser.roles.length
    ? sanitizedUser.roles
    : [sanitizedUser.role];

  req.user = sanitizedUser;
  return true;
};

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
      if (attachMockUserFromHeaders(req)) {
        return next();
      }
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
        console.warn('[protect] User not found for decoded token id:', decoded.id);
        if (attachMockUserFromHeaders(req)) {
          return next();
        }
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      delete user.password;
      req.user = user;
      return next();
    } catch (jwtError) {
      console.warn('[protect] JWT verification failed:', jwtError?.message || jwtError);
      // If backend JWT verification fails, try Firebase ID token (used by the frontend)
      try {
        const claims = await admin.auth().verifyIdToken(token);
        const user = await resolveUserForFirebaseClaims(claims);

        if (!user) {
          console.warn('[protect] Firebase token resolved but user not found for email:', claims?.email);
          if (!attachMockUserFromHeaders(req)) {
            return res.status(401).json({
              success: false,
              message: 'User not found'
            });
          }
          return next();
        }

        delete user.password;
        req.user = user;
        return next();
      } catch (firebaseError) {
        console.warn('[protect] Firebase token verification failed:', firebaseError?.message || firebaseError);
        if (attachMockUserFromHeaders(req)) {
          return next();
        }
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

// Export aliases for compatibility with route imports
exports.authenticateToken = exports.protect;
exports.requireAdmin = exports.authorize('admin');
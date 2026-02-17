const jwt = require('jsonwebtoken');
const userService = require('../services/userService');
const mockUsers = require('../data/mockUsers');
const jwtUtils = require('../utils/jwt');

// Firebase removed — middleware now relies only on backend JWTs and mock headers.

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


// Protect routes - verify token
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Check if token exists in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // DEBUG: Log request path/method and what we received (mask token)
    try {
      const authHeader = req.headers.authorization || null;
      let masked = null;
      if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
        const t = authHeader.split(' ')[1] || '';
        const len = t.length;
        masked = `${t.slice(0,8)}...${t.slice(-8)} (len=${len})`;
      }
      console.log(`[protect] DEBUG - ${req.method} ${req.originalUrl} - Authorization header:`, authHeader ? 'Present' : 'Missing');
      console.log('[protect] DEBUG - Authorization (masked):', masked || authHeader);
      console.log('[protect] DEBUG - Token extracted:', token ? `Yes (${token.length} chars)` : 'No');
    } catch (logErr) {
      console.warn('[protect] DEBUG - failed to log headers', logErr?.message || logErr);
    }

    // Check if token exists
    if (!token) {
      console.warn('[protect] No token in request, checking mock user headers');
      if (attachMockUserFromHeaders(req)) {
        console.log('[protect] Mock user authenticated from headers');
        return next();
      }
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    // Check if this is a mock token (created by frontend for mock user login)
    if (token && token.startsWith('mock-')) {
      console.log('[protect] Mock token detected, checking mock user headers');
      if (attachMockUserFromHeaders(req)) {
        console.log('[protect] Mock token verified with mock user from headers');
        return next();
      }
      console.warn('[protect] Mock token present but no mock user header found');
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    try {
      // Verify backend JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('[protect] Backend JWT verified successfully for user:', decoded.id);

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
      // Firebase support removed — only backend JWTs are accepted.
      if (attachMockUserFromHeaders(req)) {
        return next();
      }
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
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

/**
 * JWT Authentication Middleware (for PostgreSQL migration)
 * Verifies JWT tokens instead of Firebase tokens
 */
exports.authenticateJWT = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'No authorization header provided',
        code: 'AUTH_MISSING'
      });
    }

    const decoded = jwtUtils.verifyToken(authHeader);
    
    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
        code: 'AUTH_INVALID'
      });
    }

    // Attach user info to request
    req.user = decoded;
    next();
  } catch (error) {
    console.error('JWT Authentication error:', error);
    return res.status(401).json({
      success: false,
      error: 'Authentication failed',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * Authorize based on role (for PostgreSQL migration)
 */
exports.authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
        code: 'AUTH_MISSING'
      });
    }

    const userRole = req.user.activeRole || req.user.role;
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        code: 'AUTH_FORBIDDEN',
        requiredRoles: allowedRoles,
        userRole
      });
    }

    next();
  };
};

// Export aliases for compatibility with route imports
exports.authenticateToken = exports.protect;
exports.requireAdmin = exports.authorize('admin');
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
  
  // Try to find existing user
  let user = await userService.findByEmail(email);
  
  // If user doesn't exist, create them from Firebase claims
  if (!user) {
    console.log('[auth] Creating new user from Firebase claims for email:', email);
    try {
      // Extract name from Firebase display name or claim name
      const displayName = claims.name || email.split('@')[0];
      const [firstName, ...lastNameParts] = displayName.split(' ');
      const lastName = lastNameParts.join(' ') || 'User';
      
      user = await userService.createUser({
        firstName: firstName || 'Firebase',
        lastName: lastName || 'User',
        email: email,
        // Firebase users don't have passwords - they use Firebase auth
        password: Math.random().toString(36).slice(-8),
        firebaseUid: claims.uid,
        emailVerified: claims.email_verified || false
      });
      console.log('[auth] User created successfully from Firebase claims:', user.id);
    } catch (createError) {
      console.error('[auth] Failed to create user from Firebase claims:', createError?.message);
      return null;
    }
  }
  
  return user;
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
      console.log('[protect] Attempting Firebase ID token verification...');
      // If backend JWT verification fails, try Firebase ID token (used by the frontend)
      try {
        const claims = await admin.auth().verifyIdToken(token);
        console.log('[protect] Firebase token verified for email:', claims?.email);
        const user = await resolveUserForFirebaseClaims(claims);

        if (!user) {
          console.warn('[protect] Firebase token resolved but user not found for email:', claims?.email);
          console.log('[protect] Creating/syncing user from Firebase claims...');
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
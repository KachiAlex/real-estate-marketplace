const { securityLogger } = require('../config/logger');

/**
 * Middleware to validate user roles server-side
 * Prevents client-side role manipulation
 */

// Define role hierarchy
const ROLE_HIERARCHY = {
  admin: 4,
  'investment-company': 3,
  'vendor-agent': 2,
  vendor: 2,
  user: 1
};

// Define allowed roles
const ALLOWED_ROLES = Object.keys(ROLE_HIERARCHY);

/**
 * Check if user has required role
 */
const hasRole = (user, requiredRole) => {
  if (!user || !user.role) {
    return false;
  }

  const userRoleLevel = ROLE_HIERARCHY[user.role] || 0;
  const requiredRoleLevel = ROLE_HIERARCHY[requiredRole] || 0;

  return userRoleLevel >= requiredRoleLevel;
};

/**
 * Check if user has any of the required roles
 */
const hasAnyRole = (user, roles = []) => {
  if (!user || !user.role) {
    return false;
  }

  return roles.some(role => hasRole(user, role));
};

/**
 * Middleware to require specific role
 * Usage: requireRole('admin')
 */
const requireRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      securityLogger('UNAUTHORIZED_ACCESS_ATTEMPT', null, {
        url: req.originalUrl,
        ip: req.ip,
        requiredRole
      });
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!hasRole(req.user, requiredRole)) {
      securityLogger('FORBIDDEN_ACCESS_ATTEMPT', req.user.id, {
        url: req.originalUrl,
        userRole: req.user.role,
        requiredRole
      });
      return res.status(403).json({
        success: false,
        message: `Access denied. ${requiredRole} role required.`
      });
    }

    next();
  };
};

/**
 * Middleware to require any of the specified roles
 * Usage: requireAnyRole(['admin', 'vendor'])
 */
const requireAnyRole = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      securityLogger('UNAUTHORIZED_ACCESS_ATTEMPT', null, {
        url: req.originalUrl,
        ip: req.ip,
        requiredRoles: roles
      });
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!hasAnyRole(req.user, roles)) {
      securityLogger('FORBIDDEN_ACCESS_ATTEMPT', req.user.id, {
        url: req.originalUrl,
        userRole: req.user.role,
        requiredRoles: roles
      });
      return res.status(403).json({
        success: false,
        message: `Access denied. One of these roles required: ${roles.join(', ')}`
      });
    }

    next();
  };
};

/**
 * Middleware to check resource ownership
 * Ensures user can only access/modify their own resources
 */
const checkOwnership = (resourceUserIdField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Admins can access all resources
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user owns the resource
    const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
    
    if (resourceUserId && resourceUserId !== req.user.id.toString()) {
      securityLogger('OWNERSHIP_VIOLATION_ATTEMPT', req.user.id, {
        url: req.originalUrl,
        attemptedAccess: resourceUserId
      });
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own resources.'
      });
    }

    next();
  };
};

/**
 * Validate role assignment
 * Prevents users from assigning themselves higher roles
 */
const validateRoleAssignment = (req, res, next) => {
  if (!req.body.role) {
    return next();
  }

  // Only admins can assign roles
  if (!req.user || req.user.role !== 'admin') {
    securityLogger('UNAUTHORIZED_ROLE_ASSIGNMENT_ATTEMPT', req.user?.id, {
      attemptedRole: req.body.role,
      url: req.originalUrl
    });
    return res.status(403).json({
      success: false,
      message: 'Only administrators can assign roles'
    });
  }

  // Validate that role exists
  if (!ALLOWED_ROLES.includes(req.body.role)) {
    return res.status(400).json({
      success: false,
      message: `Invalid role. Allowed roles: ${ALLOWED_ROLES.join(', ')}`
    });
  }

  next();
};

module.exports = {
  hasRole,
  hasAnyRole,
  requireRole,
  requireAnyRole,
  checkOwnership,
  validateRoleAssignment,
  ALLOWED_ROLES,
  ROLE_HIERARCHY
};


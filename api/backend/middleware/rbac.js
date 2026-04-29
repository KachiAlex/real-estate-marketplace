/**
 * Phase 3.4: RBAC Middleware for authorization
 * Provides decorators for permission-based access control
 */

const RBACService = require('../services/rbacService');

/**
 * Middleware: Check if user has a specific permission
 * Usage: router.get('/route', protect, requirePermission('property:view'), handler)
 */
exports.requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userRole = req.user.activeRole || req.user.role;
    
    if (!RBACService.hasPermission(userRole, permission)) {
      return res.status(403).json({
        success: false,
        message: `Permission denied: ${permission} required`,
        requiredPermission: permission,
        userRole
      });
    }

    next();
  };
};

/**
 * Middleware: Check if user has any of the specified permissions
 */
exports.requireAnyPermission = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userRole = req.user.activeRole || req.user.role;
    
    if (!RBACService.hasAnyPermission(userRole, permissions)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        requiredPermissions: permissions,
        userRole
      });
    }

    next();
  };
};

/**
 * Middleware: Check if user has all of the specified permissions
 */
exports.requireAllPermissions = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userRole = req.user.activeRole || req.user.role;
    
    if (!RBACService.hasAllPermissions(userRole, permissions)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        requiredPermissions: permissions,
        userRole
      });
    }

    next();
  };
};

/**
 * Middleware: Verify resource ownership with permission scoping
 * For actions like "edit:own" that requires ownership verification
 * Usage: router.put('/property/:id', protect, verifyResourceOwnership('property', 'owner_field'), handler)
 */
exports.verifyResourceOwnership = (resource, ownerFieldName = 'ownerId') => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Get resource from request (could be from params, body, or pre-loaded in req)
    const resourceData = req.resourceData || req.body || req.query;
    const ownerId = resourceData[ownerFieldName];

    if (!ownerId) {
      // If no owner field, permission check is at route level
      return next();
    }

    // Check if current user is the resource owner
    if (ownerId !== req.user.id) {
      // If user has admin role, allow access
      const userRole = req.user.activeRole || req.user.role;
      if (userRole !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to modify this resource',
          reason: 'resource_ownership'
        });
      }
    }

    next();
  };
};

/**
 * Middleware: Require specific roles (backward compatibility with authorize)
 */
exports.requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userRole = req.user.activeRole || req.user.role;
    
    if (!roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `This action requires one of the following roles: ${roles.join(', ')}`,
        requiredRoles: roles,
        userRole
      });
    }

    next();
  };
};

/**
 * Middleware: Check for admin role
 */
exports.requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  const userRole = req.user.activeRole || req.user.role;
  
  if (userRole !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required',
      userRole
    });
  }

  next();
};

/**
 * Middleware: Attach RBAC utilities to request object
 * Allows handlers to check permissions dynamically
 */
exports.attachRBAC = (req, res, next) => {
  if (!req.user) {
    return next();
  }

  const userRole = req.user.activeRole || req.user.role;

  // Attach RBAC checking methods to request
  req.rbac = {
    role: userRole,
    hasPermission: (permission) => RBACService.hasPermission(userRole, permission),
    hasAnyPermission: (...permissions) => RBACService.hasAnyPermission(userRole, permissions),
    hasAllPermissions: (...permissions) => RBACService.hasAllPermissions(userRole, permissions),
    canExecutePermission: (permission, resourceOwnerId) => {
      return RBACService.canExecutePermission(userRole, permission, resourceOwnerId, req.user.id);
    },
    isAdmin: () => userRole === 'admin',
    isVendor: () => userRole === 'vendor',
    isAgent: () => userRole === 'agent',
    isUser: () => userRole === 'user'
  };

  next();
};

/**
 * Utility: Check permission in route handler
 * Returns middleware that calls next only if permission is granted
 */
exports.checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.rbac || !req.rbac.hasPermission(permission)) {
      return res.status(403).json({
        success: false,
        message: `Permission denied: ${permission} required`
      });
    }
    next();
  };
};

module.exports = exports;

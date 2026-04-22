/**
 * Phase 3.4: RBAC Management Routes
 * Endpoints for role and permission management and information
 */

const express = require('express');
const { protect } = require('../middleware/auth');
const { requirePermission, requireAdmin } = require('../middleware/rbac');
const RBACService = require('../services/rbacService');

const router = express.Router();

/**
 * @desc    Get current user's role and permissions
 * @route   GET /api/rbac/me
 * @access  Private
 */
router.get('/me', protect, (req, res) => {
  try {
    const userRole = req.user.activeRole || req.user.role;
    const allPermissions = RBACService.getAllPermissions(userRole);
    const roleInfo = RBACService.getRoleInfo(userRole);

    res.json({
      success: true,
      data: {
        userId: req.user.id,
        userEmail: req.user.email,
        role: userRole,
        roles: req.user.roles || [userRole],
        roleInfo: {
          displayName: roleInfo.displayName,
          description: roleInfo.description,
          level: roleInfo.level
        },
        permissions: allPermissions,
        permissionCount: allPermissions.length
      }
    });
  } catch (error) {
    console.error('RBAC me error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user role information'
    });
  }
});

/**
 * @desc    Check if user has specific permission
 * @route   POST /api/rbac/check-permission
 * @access  Private
 */
router.post('/check-permission', protect, (req, res) => {
  try {
    const { permission } = req.body;

    if (!permission || typeof permission !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Permission name required'
      });
    }

    const userRole = req.user.activeRole || req.user.role;
    const hasPermission = RBACService.hasPermission(userRole, permission);

    res.json({
      success: true,
      data: {
        permission,
        userRole,
        hasPermission
      }
    });
  } catch (error) {
    console.error('Check permission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check permission'
    });
  }
});

/**
 * @desc    Get all available roles (admin only)
 * @route   GET /api/rbac/roles
 * @access  Private (Admin)
 */
router.get('/roles', protect, requireAdmin, (req, res) => {
  try {
    const roles = RBACService.getAllRoles();

    res.json({
      success: true,
      data: {
        roles,
        roleCount: roles.length
      }
    });
  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch roles'
    });
  }
});

/**
 * @desc    Get role details and permissions
 * @route   GET /api/rbac/roles/:role
 * @access  Private (Admin)
 */
router.get('/roles/:role', protect, requireAdmin, (req, res) => {
  try {
    const { role } = req.params;
    const roleInfo = RBACService.getRoleInfo(role);

    if (!roleInfo || role === 'guest') {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    res.json({
      success: true,
      data: {
        role,
        ...roleInfo
      }
    });
  } catch (error) {
    console.error('Get role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch role details'
    });
  }
});

/**
 * @desc    Get all permissions for a role
 * @route   GET /api/rbac/roles/:role/permissions
 * @access  Private (Admin)
 */
router.get('/roles/:role/permissions', protect, requireAdmin, (req, res) => {
  try {
    const { role } = req.params;
    const permissions = RBACService.getAllPermissions(role);

    res.json({
      success: true,
      data: {
        role,
        permissions,
        permissionCount: permissions.length
      }
    });
  } catch (error) {
    console.error('Get role permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch role permissions'
    });
  }
});

/**
 * @desc    Get user list with role information (admin only)
 * @route   GET /api/rbac/users
 * @access  Private (Admin)
 */
router.get('/users', protect, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const userService = require('../services/userService');

    // Get users with pagination
    // Note: This is a placeholder - actual implementation depends on userService structure
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    res.json({
      success: true,
      message: 'User listing with RBAC would require additional data loading',
      data: {
        note: 'Implement based on actual userService interface',
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
});

module.exports = router;

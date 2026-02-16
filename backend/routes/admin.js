const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const { adminValidation } = require('../middleware/validation');
const propertyService = require('../services/propertyService');
const userService = require('../services/userService');
const adminSettingsService = require('../services/adminSettingsService');
const mortgageBankService = require('../services/mortgageBankService');

const router = express.Router();
// Update existing admin user by email (TEMP: no auth middleware for testing)
router.put('/update-admin', [
  body('email').isEmail().withMessage('Valid email required'),
  body('firstName').optional().notEmpty().withMessage('First name required'),
  body('lastName').optional().notEmpty().withMessage('Last name required'),
  body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    const { email, firstName, lastName, password } = req.body;
    // Find user by email
    const user = await userService.findByEmail(email);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    // Prepare update fields
    const updateFields = {};
    if (firstName) updateFields.firstName = firstName;
    if (lastName) updateFields.lastName = lastName;
    if (password) updateFields.password = password;
    // Always keep role and roles as admin
    updateFields.role = 'admin';
    updateFields.roles = ['admin'];
    // Update user
    const updatedUser = await userService.updateUser(user.id, updateFields);
    res.json({ success: true, message: 'Admin user updated', user: { email, firstName: updatedUser.firstName, lastName: updatedUser.lastName, role: 'admin', roles: ['admin'] } });
  } catch (error) {
    console.error('Update admin error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});
// Create new admin user (TEMP: no auth middleware for testing)
router.post('/create-admin', [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').notEmpty().withMessage('First name required'),
  body('lastName').notEmpty().withMessage('Last name required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    const { email, password, firstName, lastName } = req.body;
    // Check if user already exists
    const existing = await userService.findByEmail(email);
    if (existing) {
      return res.status(409).json({ success: false, message: 'User already exists' });
    }
    // Create admin user
    const newUser = await userService.createUser({
      email,
      password,
      firstName,
      lastName,
      role: 'admin',
      roles: ['admin'],
      isVerified: true
    });
    res.status(201).json({ success: true, message: 'Admin user created', user: { email, firstName, lastName, role: 'admin', roles: ['admin'] } });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Apply admin protection to all routes
// router.use(protect);
// router.use(authorize('admin'));

// @desc    Get admin dashboard statistics
// @route   GET /api/admin/stats
// @access  Private (Admin only)
router.get('/stats', async (req, res) => {
  try {
    const [propertyStats, userStats, recentProperties, recentUsersResult] = await Promise.all([
      propertyService.getPropertyStats(),
      userService.getUserStats(),
      propertyService.listRecentProperties(5),
      userService.listUsers({ page: 1, limit: 5, sort: 'createdAt', order: 'desc' })
    ]);

    const recentUsers = (recentUsersResult?.users || []).map((user) => {
      const { password, ...rest } = user;
      return rest;
    });

    res.json({
      success: true,
      data: {
        properties: propertyStats,
        users: userStats,
        recentActivity: {
          properties: recentProperties,
          users: recentUsers
        }
      }
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get all properties for admin with filtering
// @route   GET /api/admin/properties
// @access  Private (Admin only)
router.get('/properties', [
  query('status').optional().isIn(['for-sale', 'for-rent', 'for-lease', 'sold', 'rented']).withMessage('Invalid status'),
  query('verificationStatus').optional().isIn(['pending', 'approved', 'rejected']).withMessage('Invalid verification status'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      status,
      verificationStatus,
      page = 1,
      limit = 20,
      search,
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    const { properties, pagination, stats } = await propertyService.listProperties({
      status,
      verificationStatus,
      page: Number(page),
      limit: Number(limit),
      search,
      sort,
      order
    });

    res.json({
      success: true,
      data: properties,
      pagination,
      stats
    });
  } catch (error) {
    console.error('Admin get properties error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Verify/approve/reject property
// @route   PUT /api/admin/properties/:id/verify
// @access  Private (Admin only)
router.put('/properties/:id/verify', [
  body('verificationStatus').isIn(['approved', 'rejected']).withMessage('Invalid verification status'),
  body('verificationNotes').optional().trim().isLength({ max: 500 }).withMessage('Verification notes cannot exceed 500 characters')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { verificationStatus, verificationNotes } = req.body;

    const property = await propertyService.updatePropertyVerification(req.params.id, {
      status: verificationStatus,
      notes: verificationNotes,
      adminId: req.user.id
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    res.json({
      success: true,
      message: `Property ${verificationStatus} successfully`,
      data: property
    });
  } catch (error) {
    console.error('Admin verify property error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get all users for admin management
// @route   GET /api/admin/users
// @access  Private (Admin only)
const ALLOWED_USER_ROLES = ['buyer', 'vendor', 'admin', 'agent', 'user'];

router.get('/users', [
  query('role').optional().isIn(ALLOWED_USER_ROLES).withMessage('Invalid role'),
  query('isVerified').optional().isBoolean().withMessage('isVerified must be boolean'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      role,
      isVerified,
      page = 1,
      limit = 20,
      search,
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};

    if (role) filter.role = role;
    if (isVerified !== undefined) filter.isVerified = isVerified === 'true';

    // Text search
    if (search) {
      filter.$text = { $search: search };
    }

    // Build sort object
    const sortObj = {};
    sortObj[sort] = order === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get users with pagination
    const { users, pagination } = await userService.listUsers({
      role,
      isVerified,
      page: Number(page),
      limit: Number(limit),
      search,
      sort,
      order
    });

    const sanitizedUsers = users.map((user) => {
      const { password, ...rest } = user;
      return rest;
    });

    res.json({
      success: true,
      data: sanitizedUsers,
      pagination
    });
  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Update user verification status
// @route   PUT /api/admin/users/:id/verify
// @access  Private (Admin only)
router.put('/users/:id/verify', [
  body('isVerified').isBoolean().withMessage('isVerified must be boolean'),
  body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { isVerified, notes } = req.body;

    const user = await userService.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const updatedUser = await userService.updateUser(req.params.id, {
      isVerified,
      verificationNotes: notes || '',
      verifiedBy: req.user.id,
      verifiedAt: new Date()
    });

    res.json({
      success: true,
      message: `User ${isVerified ? 'verified' : 'unverified'} successfully`,
      data: updatedUser
    });
  } catch (error) {
    console.error('Admin verify user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Delete property (admin only)
// @route   DELETE /api/admin/properties/:id
// @access  Private (Admin only)
router.delete('/properties/:id', async (req, res) => {
  try {
    const property = await propertyService.getPropertyById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    await propertyService.deleteProperty(req.params.id);

    res.json({
      success: true,
      message: 'Property deleted successfully'
    });
  } catch (error) {
    console.error('Admin delete property error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Delete user (admin only)
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin only)
router.delete('/users/:id', async (req, res) => {
  try {
    // Prevent admin from deleting themselves
    if (req.params.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    const user = await userService.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await propertyService.deletePropertiesByOwner(req.params.id);
    await userService.deleteUser(req.params.id);

    res.json({
      success: true,
      message: 'User and associated data deleted successfully'
    });
  } catch (error) {
    console.error('Admin delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get admin settings
// @route   GET /api/admin/settings
// @access  Private (Admin only)
router.get('/settings', async (req, res) => {
  try {
    const settings = await adminSettingsService.getSettings();

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Get admin settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Update admin settings
// @route   PUT /api/admin/settings
// @access  Private (Admin only)
router.put('/settings', adminValidation.settings, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const settings = await adminSettingsService.updateSettings(req.body);

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: settings
    });
  } catch (error) {
    console.error('Update admin settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get all mortgage banks for admin review
// @route   GET /api/admin/mortgage-banks
// @access  Private (Admin only)
router.get('/mortgage-banks', async (req, res) => {
  try {
    const { status = 'all' } = req.query;

    const banks = await mortgageBankService.listMortgageBanks({
      isAdmin: true,
      status,
      includeDocuments: true
    });

    res.json({
      success: true,
      count: banks.length,
      data: banks
    });
  } catch (error) {
    console.error('Admin get mortgage banks error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @desc    Verify/reject mortgage bank
// @route   PUT /api/admin/mortgage-banks/:id/verify
// @access  Private (Admin only)
router.put('/mortgage-banks/:id/verify', [
  body('verificationStatus').isIn(['approved', 'rejected']).withMessage('Verification status must be approved or rejected'),
  body('verificationNotes').optional().trim().isLength({ max: 1000 }).withMessage('Verification notes cannot exceed 1000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { verificationStatus, verificationNotes } = req.body;
    const bank = await mortgageBankService.updateMortgageBankVerification(req.params.id, {
      verificationStatus,
      verificationNotes,
      adminId: req.user.id
    });

    if (!bank) {
      return res.status(404).json({
        success: false,
        message: 'Mortgage bank not found'
      });
    }

    res.json({
      success: true,
      message: `Mortgage bank ${verificationStatus === 'approved' ? 'approved' : 'rejected'} successfully`,
      data: bank
    });
  } catch (error) {
    console.error('Admin verify mortgage bank error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

module.exports = router;

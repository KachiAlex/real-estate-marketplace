const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Property = require('../models/Property');
const User = require('../models/User');
const AdminSettings = require('../models/AdminSettings');
const MortgageBank = require('../models/MortgageBank');
const { protect, authorize } = require('../middleware/auth');
const { adminValidation } = require('../middleware/validation');

const router = express.Router();

// Apply admin protection to all routes
router.use(protect);
router.use(authorize('admin'));

// @desc    Get admin dashboard statistics
// @route   GET /api/admin/stats
// @access  Private (Admin only)
router.get('/stats', async (req, res) => {
  try {
    const totalProperties = await Property.countDocuments();
    const pendingProperties = await Property.countDocuments({ verificationStatus: 'pending' });
    const approvedProperties = await Property.countDocuments({ verificationStatus: 'approved' });
    const rejectedProperties = await Property.countDocuments({ verificationStatus: 'rejected' });
    const totalUsers = await User.countDocuments();
    const totalAgents = await User.countDocuments({ role: 'agent' });
    const verifiedUsers = await User.countDocuments({ isVerified: true });

    // Get recent activity
    const recentProperties = await Property.find()
      .populate('owner', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentUsers = await User.find()
      .select('firstName lastName email role createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        properties: {
          total: totalProperties,
          pending: pendingProperties,
          approved: approvedProperties,
          rejected: rejectedProperties
        },
        users: {
          total: totalUsers,
          agents: totalAgents,
          verified: verifiedUsers
        },
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

    // Build filter object
    const filter = {};

    if (status) filter.status = status;
    if (verificationStatus) filter.verificationStatus = verificationStatus;

    // Text search
    if (search) {
      filter.$text = { $search: search };
    }

    // Build sort object
    const sortObj = {};
    sortObj[sort] = order === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get properties with pagination
    const properties = await Property.find(filter)
      .populate('owner', 'firstName lastName email avatar')
      .populate('agent', 'firstName lastName email avatar')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Property.countDocuments(filter);

    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit));

    // Get statistics
    const stats = {
      total: await Property.countDocuments(),
      pending: await Property.countDocuments({ verificationStatus: 'pending' }),
      approved: await Property.countDocuments({ verificationStatus: 'approved' }),
      rejected: await Property.countDocuments({ verificationStatus: 'rejected' })
    };

    res.json({
      success: true,
      data: properties,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit)
      },
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

    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    // Update property verification status
    property.verificationStatus = verificationStatus;
    property.verificationNotes = verificationNotes || '';
    property.isVerified = verificationStatus === 'approved';
    property.verifiedBy = req.user.id;
    property.verifiedAt = new Date();

    await property.save();

    const populatedProperty = await Property.findById(property._id)
      .populate('owner', 'firstName lastName email avatar');

    res.json({
      success: true,
      message: `Property ${verificationStatus} successfully`,
      data: populatedProperty
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
router.get('/users', [
  query('role').optional().isIn(['user', 'agent', 'admin']).withMessage('Invalid role'),
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
    const users = await User.find(filter)
      .select('-password')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await User.countDocuments(filter);

    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      data: users,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
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

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user verification status
    user.isVerified = isVerified;
    user.verificationNotes = notes || '';
    user.verifiedBy = req.user.id;
    user.verifiedAt = new Date();

    await user.save();

    res.json({
      success: true,
      message: `User ${isVerified ? 'verified' : 'unverified'} successfully`,
      data: user
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
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    await Property.findByIdAndDelete(req.params.id);

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

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete user's properties first
    await Property.deleteMany({ owner: req.params.id });

    // Delete user
    await User.findByIdAndDelete(req.params.id);

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
    let settings = await AdminSettings.findOne();
    
    // If no settings exist, create default settings
    if (!settings) {
      settings = new AdminSettings({
        verificationFee: 50000,
        vendorListingFee: 100000,
        escrowTimeoutDays: 7,
        platformFee: 0.025
      });
      await settings.save();
    }

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

    let settings = await AdminSettings.findOne();
    
    // If no settings exist, create new one
    if (!settings) {
      settings = new AdminSettings(req.body);
    } else {
      // Update existing settings
      Object.keys(req.body).forEach(key => {
        if (req.body[key] !== undefined) {
          settings[key] = req.body[key];
        }
      });
      settings.updatedAt = new Date();
    }

    await settings.save();

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
    const { status } = req.query;
    
    let query = {};
    if (status) {
      query.verificationStatus = status;
    }

    const banks = await MortgageBank.find(query)
      .populate('userAccount', 'firstName lastName email role isActive')
      .populate('verifiedBy', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: banks.length,
      data: banks
    });
  } catch (error) {
    console.error('Admin get mortgage banks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
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
    const bank = await MortgageBank.findById(req.params.id).populate('userAccount');

    if (!bank) {
      return res.status(404).json({
        success: false,
        message: 'Mortgage bank not found'
      });
    }

    // Update bank verification status
    bank.verificationStatus = verificationStatus;
    bank.verifiedBy = req.user.id;
    bank.verifiedAt = new Date();
    bank.verificationNotes = verificationNotes || '';

    if (verificationStatus === 'approved') {
      bank.isActive = true;
      // Activate the user account
      if (bank.userAccount) {
        bank.userAccount.isActive = true;
        bank.userAccount.isVerified = true;
        await bank.userAccount.save();
      }
    } else {
      bank.isActive = false;
      // Deactivate the user account
      if (bank.userAccount) {
        bank.userAccount.isActive = false;
        await bank.userAccount.save();
      }
    }

    await bank.save();

    // Log admin action
    await logAdminAction(req.user.id, 'verify_mortgage_bank', {
      bankId: bank._id,
      bankName: bank.name,
      status: verificationStatus,
      notes: verificationNotes
    });

    res.json({
      success: true,
      message: `Mortgage bank ${verificationStatus === 'approved' ? 'approved' : 'rejected'} successfully`,
      data: bank
    });
  } catch (error) {
    console.error('Admin verify mortgage bank error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;

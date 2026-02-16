const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const { adminValidation } = require('../middleware/validation');
const User = require('../models/User');
const propertyService = require('../services/propertyService');
const userService = require('../services/userService');
const adminSettingsService = require('../services/adminSettingsService');
const mortgageBankService = require('../services/mortgageBankService');

const router = express.Router();

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

// VENDOR MANAGEMENT ROUTES

// GET /api/admin/vendors - List all vendors with pagination and filters
router.get('/vendors', protect, authorize('admin'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status; // 'active', 'inactive', 'suspended'
    const kycStatus = req.query.kycStatus; // 'pending', 'under_review', 'approved', 'rejected'

    const query = { roles: 'vendor' };

    if (status) {
      switch (status) {
        case 'active':
          query['vendorProfile.subscription.isActive'] = true;
          query['vendorProfile.kycStatus'] = 'approved';
          break;
        case 'inactive':
          query['vendorProfile.subscription.isActive'] = false;
          break;
        case 'suspended':
          query['vendorProfile.subscription.suspensionDate'] = { $exists: true, $ne: null };
          break;
      }
    }

    if (kycStatus) {
      query['vendorProfile.kycStatus'] = kycStatus;
    }

    const vendors = await User.find(query)
      .select('firstName lastName email phone roles vendorProfile createdAt')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .lean();

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      vendors: vendors.map(vendor => ({
        id: vendor._id,
        name: `${vendor.firstName} ${vendor.lastName}`,
        email: vendor.email,
        phone: vendor.phone,
        roles: vendor.roles,
        kycStatus: vendor.vendorProfile?.kycStatus || 'pending',
        subscriptionActive: vendor.vendorProfile?.subscription?.isActive || false,
        subscriptionAmount: vendor.vendorProfile?.subscription?.amount || 0,
        lastPaid: vendor.vendorProfile?.subscription?.lastPaid,
        nextDue: vendor.vendorProfile?.subscription?.nextDue,
        joinedDate: vendor.vendorProfile?.joinedDate || vendor.createdAt,
        suspensionDate: vendor.vendorProfile?.subscription?.suspensionDate,
        onboardingComplete: vendor.vendorProfile?.onboardingComplete || false
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch vendors', error: error.message });
  }
});

// GET /api/admin/vendors/:id/kyc - Get vendor KYC details
router.get('/vendors/:id/kyc', protect, authorize('admin'), async (req, res) => {
  try {
    const vendor = await User.findById(req.params.id)
      .select('firstName lastName email vendorProfile')
      .lean();

    if (!vendor || !vendor.roles.includes('vendor')) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    res.json({
      success: true,
      vendor: {
        id: vendor._id,
        name: `${vendor.firstName} ${vendor.lastName}`,
        email: vendor.email,
        kycStatus: vendor.vendorProfile?.kycStatus || 'pending',
        businessInfo: {
          businessName: vendor.vendorProfile?.businessName,
          businessType: vendor.vendorProfile?.businessType,
          licenseNumber: vendor.vendorProfile?.licenseNumber,
          experience: vendor.vendorProfile?.experience,
          specializations: vendor.vendorProfile?.specializations,
          contactInfo: vendor.vendorProfile?.contactInfo
        },
        documents: vendor.vendorProfile?.kycDocuments || []
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch vendor KYC details', error: error.message });
  }
});

// POST /api/admin/vendors/:id/kyc/verify - Approve/reject KYC
router.post('/vendors/:id/kyc/verify', protect, authorize('admin'), async (req, res) => {
  try {
    const { action, documentUpdates, rejectionReasons } = req.body; // action: 'approve' or 'reject'

    const vendor = await User.findById(req.params.id);
    if (!vendor || !vendor.roles.includes('vendor')) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    if (action === 'approve') {
      vendor.vendorProfile.kycStatus = 'approved';
      // Update document statuses
      if (documentUpdates && Array.isArray(documentUpdates)) {
        documentUpdates.forEach(update => {
          const doc = vendor.vendorProfile.kycDocuments.find(d => d._id.toString() === update.id);
          if (doc) {
            doc.status = 'verified';
            doc.verifiedAt = new Date();
            doc.verifiedBy = req.userId;
          }
        });
      }
    } else if (action === 'reject') {
      vendor.vendorProfile.kycStatus = 'rejected';
      // Update document statuses with rejection reasons
      if (documentUpdates && Array.isArray(documentUpdates)) {
        documentUpdates.forEach(update => {
          const doc = vendor.vendorProfile.kycDocuments.find(d => d._id.toString() === update.id);
          if (doc) {
            doc.status = 'rejected';
            doc.rejectionReason = update.rejectionReason;
            doc.verifiedAt = new Date();
            doc.verifiedBy = req.userId;
          }
        });
      }
    }

    await vendor.save();

    res.json({
      success: true,
      message: `KYC ${action}d successfully`,
      kycStatus: vendor.vendorProfile.kycStatus
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update KYC status', error: error.message });
  }
});

// POST /api/admin/vendors/:id/suspend - Suspend vendor account
router.post('/vendors/:id/suspend', protect, authorize('admin'), async (req, res) => {
  try {
    const { reason } = req.body;

    const vendor = await User.findById(req.params.id);
    if (!vendor || !vendor.roles.includes('vendor')) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    vendor.vendorProfile.subscription.isActive = false;
    vendor.vendorProfile.subscription.suspensionDate = new Date();
    vendor.vendorProfile.subscription.suspensionReason = reason;

    await vendor.save();

    res.json({
      success: true,
      message: 'Vendor account suspended successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to suspend vendor', error: error.message });
  }
});

// POST /api/admin/vendors/:id/activate - Reactivate vendor account
router.post('/vendors/:id/activate', protect, authorize('admin'), async (req, res) => {
  try {
    const vendor = await User.findById(req.params.id);
    if (!vendor || !vendor.roles.includes('vendor')) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    vendor.vendorProfile.subscription.isActive = true;
    vendor.vendorProfile.subscription.suspensionDate = null;
    vendor.vendorProfile.subscription.suspensionReason = null;

    await vendor.save();

    res.json({
      success: true,
      message: 'Vendor account activated successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to activate vendor', error: error.message });
  }
});

// PUT /api/admin/settings/subscription - Update subscription settings
router.put('/settings/subscription', protect, authorize('admin'), async (req, res) => {
  try {
    const { vendorSubscriptionFee, vendorSubscriptionGracePeriod, vendorLateFee } = req.body;

    let settings = await AdminSettings.findOne();
    if (!settings) {
      settings = new AdminSettings();
    }

    if (vendorSubscriptionFee !== undefined) settings.vendorSubscriptionFee = vendorSubscriptionFee;
    if (vendorSubscriptionGracePeriod !== undefined) settings.vendorSubscriptionGracePeriod = vendorSubscriptionGracePeriod;
    if (vendorLateFee !== undefined) settings.vendorLateFee = vendorLateFee;

    await settings.save();

    res.json({
      success: true,
      message: 'Subscription settings updated successfully',
      settings: {
        vendorSubscriptionFee: settings.vendorSubscriptionFee,
        vendorSubscriptionGracePeriod: settings.vendorSubscriptionGracePeriod,
        vendorLateFee: settings.vendorLateFee
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update subscription settings', error: error.message });
  }
});

// GET /api/admin/subscription-analytics - Subscription analytics
router.get('/subscription-analytics', protect, authorize('admin'), async (req, res) => {
  try {
    const vendors = await User.find({ roles: 'vendor' })
      .select('vendorProfile createdAt')
      .lean();

    const analytics = {
      totalVendors: vendors.length,
      activeSubscriptions: vendors.filter(v => v.vendorProfile?.subscription?.isActive).length,
      inactiveSubscriptions: vendors.filter(v => !v.vendorProfile?.subscription?.isActive).length,
      suspendedAccounts: vendors.filter(v => v.vendorProfile?.subscription?.suspensionDate).length,
      kycStatuses: {
        pending: vendors.filter(v => v.vendorProfile?.kycStatus === 'pending').length,
        underReview: vendors.filter(v => v.vendorProfile?.kycStatus === 'under_review').length,
        approved: vendors.filter(v => v.vendorProfile?.kycStatus === 'approved').length,
        rejected: vendors.filter(v => v.vendorProfile?.kycStatus === 'rejected').length
      },
      monthlyRevenue: vendors
        .filter(v => v.vendorProfile?.subscription?.isActive)
        .reduce((sum, v) => sum + (v.vendorProfile?.subscription?.amount || 0), 0)
    };

    res.json({
      success: true,
      analytics
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch subscription analytics', error: error.message });
  }
});

// GET /api/admin/vendors - List vendors with filtering and pagination
router.get('/vendors', [
  query('status').optional().isIn(['active', 'inactive', 'suspended']).withMessage('Invalid status'),
  query('kycStatus').optional().isIn(['pending', 'under_review', 'approved', 'rejected']).withMessage('Invalid KYC status'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], protect, authorize('admin'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { status, kycStatus, page = 1, limit = 20, search } = req.query;

    const query = { roles: 'vendor' };

    if (status) {
      if (status === 'active') {
        query['vendorProfile.subscription.isActive'] = true;
        query['vendorProfile.subscription.suspensionDate'] = { $exists: false };
      } else if (status === 'inactive') {
        query['vendorProfile.subscription.isActive'] = false;
      } else if (status === 'suspended') {
        query['vendorProfile.subscription.suspensionDate'] = { $exists: true };
      }
    }

    if (kycStatus) {
      query['vendorProfile.kycStatus'] = kycStatus;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'vendorProfile.businessName': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const [vendors, total] = await Promise.all([
      User.find(query)
        .select('name email vendorProfile createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query)
    ]);

    const formattedVendors = vendors.map(vendor => ({
      id: vendor._id,
      name: vendor.name,
      email: vendor.email,
      businessName: vendor.vendorProfile?.businessName,
      subscriptionActive: vendor.vendorProfile?.subscription?.isActive || false,
      suspensionDate: vendor.vendorProfile?.subscription?.suspensionDate,
      kycStatus: vendor.vendorProfile?.kycStatus || 'pending',
      joinedDate: vendor.createdAt,
      documents: vendor.vendorProfile?.documents || [],
      businessType: vendor.vendorProfile?.businessType,
      licenseNumber: vendor.vendorProfile?.licenseNumber,
      experience: vendor.vendorProfile?.experience,
      phone: vendor.vendorProfile?.phone,
      address: vendor.vendorProfile?.address
    }));

    res.json({
      success: true,
      vendors: formattedVendors,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Admin get vendors error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vendors',
      error: error.message
    });
  }
});

// POST /api/admin/vendors/:id/kyc/verify - Review and verify KYC documents
router.post('/vendors/:id/kyc/verify', [
  body('action').isIn(['approve', 'reject']).withMessage('Action must be approve or reject'),
  body('documentUpdates').optional().isArray().withMessage('Document updates must be an array'),
  body('rejectionReasons').optional().isArray().withMessage('Rejection reasons must be an array')
], protect, authorize('admin'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { action, documentUpdates = [], rejectionReasons = [] } = req.body;

    const vendor = await User.findById(id);
    if (!vendor || !vendor.roles.includes('vendor')) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    if (action === 'approve') {
      vendor.vendorProfile.kycStatus = 'approved';
      vendor.vendorProfile.kycApprovalDate = new Date();

      // Update document statuses
      if (documentUpdates.length > 0) {
        documentUpdates.forEach(update => {
          const doc = vendor.vendorProfile.documents.find(d => d._id.toString() === update.id);
          if (doc) {
            doc.status = update.status;
            doc.adminNotes = update.adminNotes;
          }
        });
      }
    } else if (action === 'reject') {
      vendor.vendorProfile.kycStatus = 'rejected';
      vendor.vendorProfile.kycRejectionDate = new Date();
      vendor.vendorProfile.kycRejectionReasons = rejectionReasons;

      // Mark documents as rejected
      vendor.vendorProfile.documents.forEach(doc => {
        doc.status = 'rejected';
        doc.rejectionReason = rejectionReasons.join('; ');
      });
    }

    await vendor.save();

    res.json({
      success: true,
      message: `KYC ${action}d successfully`,
      vendor: {
        id: vendor._id,
        kycStatus: vendor.vendorProfile.kycStatus
      }
    });
  } catch (error) {
    console.error('Admin KYC verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process KYC verification',
      error: error.message
    });
  }
});

// POST /api/admin/vendors/:id/suspend - Suspend vendor account
router.post('/vendors/:id/suspend', [
  body('reason').notEmpty().withMessage('Suspension reason is required')
], protect, authorize('admin'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { reason } = req.body;

    const vendor = await User.findById(id);
    if (!vendor || !vendor.roles.includes('vendor')) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    vendor.vendorProfile.subscription.isActive = false;
    vendor.vendorProfile.subscription.suspensionDate = new Date();
    vendor.vendorProfile.subscription.suspensionReason = reason;

    await vendor.save();

    res.json({
      success: true,
      message: 'Vendor account suspended successfully'
    });
  } catch (error) {
    console.error('Admin suspend vendor error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to suspend vendor account',
      error: error.message
    });
  }
});

// POST /api/admin/vendors/:id/activate - Activate vendor account
router.post('/vendors/:id/activate', protect, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const vendor = await User.findById(id);
    if (!vendor || !vendor.roles.includes('vendor')) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    vendor.vendorProfile.subscription.isActive = true;
    vendor.vendorProfile.subscription.suspensionDate = undefined;
    vendor.vendorProfile.subscription.suspensionReason = undefined;

    await vendor.save();

    res.json({
      success: true,
      message: 'Vendor account activated successfully'
    });
  } catch (error) {
    console.error('Admin activate vendor error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to activate vendor account',
      error: error.message
    });
  }
});

module.exports = router;

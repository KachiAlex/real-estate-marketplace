const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { sanitizeInput, validate } = require('../middleware/validation');
const { body, param, query } = require('express-validator');
const Investment = require('../models/Investment');
const UserInvestment = require('../models/UserInvestment');
const User = require('../models/User');
const notificationService = require('../services/notificationService');

const router = express.Router();

// @desc    Get all investments
// @route   GET /api/investments
// @access  Private
router.get('/',
  protect,
  sanitizeInput,
  validate([
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
    query('type').optional().isIn(['commercial', 'residential', 'retail', 'industrial', 'land', 'reit']).withMessage('Invalid investment type'),
    query('status').optional().isIn(['draft', 'fundraising', 'active', 'completed', 'cancelled', 'paused']).withMessage('Invalid status'),
    query('city').optional().isString().withMessage('City must be a string'),
    query('state').optional().isString().withMessage('State must be a string'),
    query('featured').optional().isBoolean().withMessage('Featured must be a boolean'),
    query('minAmount').optional().isNumeric().withMessage('Minimum amount must be a number'),
    query('maxAmount').optional().isNumeric().withMessage('Maximum amount must be a number'),
    query('sortBy').optional().isIn(['createdAt', 'totalAmount', 'expectedReturn', 'progressPercentage']).withMessage('Invalid sort field'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc')
  ]),
  async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;

      // Build query
      const query = { isActive: true };

      if (req.query.type) query.type = req.query.type;
      if (req.query.status) query.status = req.query.status;
      if (req.query.city) query['location.city'] = new RegExp(req.query.city, 'i');
      if (req.query.state) query['location.state'] = new RegExp(req.query.state, 'i');
      if (req.query.featured === 'true') {
        query.featured = true;
        query.featuredUntil = { $gt: new Date() };
      }
      if (req.query.minAmount || req.query.maxAmount) {
        query.totalAmount = {};
        if (req.query.minAmount) query.totalAmount.$gte = parseFloat(req.query.minAmount);
        if (req.query.maxAmount) query.totalAmount.$lte = parseFloat(req.query.maxAmount);
      }

      // Build sort
      const sortBy = req.query.sortBy || 'createdAt';
      const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
      const sort = { [sortBy]: sortOrder };

      const investments = await Investment.find(query)
        .populate('sponsorId', 'firstName lastName email avatar')
        .sort(sort)
        .skip(skip)
        .limit(limit);

      const total = await Investment.countDocuments(query);

      res.json({
        success: true,
        data: {
          investments,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalItems: total,
            itemsPerPage: limit,
            hasNextPage: page < Math.ceil(total / limit),
            hasPrevPage: page > 1
          }
        }
      });
    } catch (error) {
      console.error('Get investments error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch investments'
      });
    }
  }
);

// @desc    Get featured investments
// @route   GET /api/investments/featured
// @access  Public
router.get('/featured',
  sanitizeInput,
  async (req, res) => {
    try {
      const investments = await Investment.getFeaturedInvestments()
        .populate('sponsorId', 'firstName lastName email avatar')
        .limit(6);

      res.json({
        success: true,
        data: investments
      });
    } catch (error) {
      console.error('Get featured investments error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch featured investments'
      });
    }
  }
);

// @desc    Get investment by ID
// @route   GET /api/investments/:id
// @access  Private
router.get('/:id',
  protect,
  sanitizeInput,
  validate([
    param('id').isMongoId().withMessage('Valid investment ID is required')
  ]),
  async (req, res) => {
    try {
      const investment = await Investment.findById(req.params.id)
        .populate('sponsorId', 'firstName lastName email avatar phone')
        .populate('verifiedBy', 'firstName lastName email');

      if (!investment) {
        return res.status(404).json({
          success: false,
          message: 'Investment not found'
        });
      }

      // Get investment statistics
      const stats = await UserInvestment.aggregate([
        { $match: { investmentId: investment._id, status: { $in: ['active', 'completed'] } } },
        {
          $group: {
            _id: null,
            totalInvestors: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            averageInvestment: { $avg: '$amount' }
          }
        }
      ]);

      res.json({
        success: true,
        data: {
          investment,
          statistics: stats[0] || { totalInvestors: 0, totalAmount: 0, averageInvestment: 0 }
        }
      });
    } catch (error) {
      console.error('Get investment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch investment'
      });
    }
  }
);

// @desc    Create new investment
// @route   POST /api/investments
// @access  Private (Investment Company/Admin)
router.post('/',
  protect,
  authorize(['investment_company', 'admin']),
  sanitizeInput,
  validate([
    body('title').trim().isLength({ min: 5, max: 200 }).withMessage('Title must be between 5 and 200 characters'),
    body('description').trim().isLength({ min: 50, max: 2000 }).withMessage('Description must be between 50 and 2000 characters'),
    body('type').isIn(['commercial', 'residential', 'retail', 'industrial', 'land', 'reit']).withMessage('Invalid investment type'),
    body('totalAmount').isNumeric().isFloat({ min: 1000000 }).withMessage('Total amount must be at least ₦1,000,000'),
    body('minimumInvestment').isNumeric().isFloat({ min: 100000 }).withMessage('Minimum investment must be at least ₦100,000'),
    body('expectedReturn').isNumeric().isFloat({ min: 0, max: 100 }).withMessage('Expected return must be between 0 and 100'),
    body('dividendRate').isNumeric().isFloat({ min: 0, max: 50 }).withMessage('Dividend rate must be between 0 and 50'),
    body('duration').isInt({ min: 1, max: 120 }).withMessage('Duration must be between 1 and 120 months'),
    body('location.address').trim().isLength({ min: 5 }).withMessage('Address is required'),
    body('location.city').trim().isLength({ min: 2 }).withMessage('City is required'),
    body('location.state').trim().isLength({ min: 2 }).withMessage('State is required'),
    body('location.coordinates.latitude').isNumeric().withMessage('Valid latitude is required'),
    body('location.coordinates.longitude').isNumeric().withMessage('Valid longitude is required'),
    body('sponsor.name').trim().isLength({ min: 2 }).withMessage('Sponsor name is required'),
    body('sponsor.experience').trim().isLength({ min: 5 }).withMessage('Sponsor experience is required')
  ]),
  async (req, res) => {
    try {
      const investmentData = {
        ...req.body,
        sponsorId: req.user._id,
        status: 'draft'
      };

      const investment = await Investment.create(investmentData);

      res.status(201).json({
        success: true,
        message: 'Investment created successfully',
        data: investment
      });
    } catch (error) {
      console.error('Create investment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create investment'
      });
    }
  }
);

// @desc    Update investment
// @route   PUT /api/investments/:id
// @access  Private (Investment Company/Admin)
router.put('/:id',
  protect,
  authorize(['investment_company', 'admin']),
  sanitizeInput,
  validate([
    param('id').isMongoId().withMessage('Valid investment ID is required')
  ]),
  async (req, res) => {
    try {
      const investment = await Investment.findById(req.params.id);

      if (!investment) {
        return res.status(404).json({
          success: false,
          message: 'Investment not found'
        });
      }

      // Check if user owns this investment or is admin
      if (investment.sponsorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this investment'
        });
      }

      // Don't allow updating certain fields if investment is active
      if (investment.status === 'active' || investment.status === 'completed') {
        const restrictedFields = ['totalAmount', 'minimumInvestment', 'expectedReturn', 'dividendRate'];
        restrictedFields.forEach(field => {
          if (req.body[field] !== undefined) {
            delete req.body[field];
          }
        });
      }

      const updatedInvestment = await Investment.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).populate('sponsorId', 'firstName lastName email avatar');

      res.json({
        success: true,
        message: 'Investment updated successfully',
        data: updatedInvestment
      });
    } catch (error) {
      console.error('Update investment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update investment'
      });
    }
  }
);

// @desc    Delete investment
// @route   DELETE /api/investments/:id
// @access  Private (Investment Company/Admin)
router.delete('/:id',
  protect,
  authorize(['investment_company', 'admin']),
  sanitizeInput,
  validate([
    param('id').isMongoId().withMessage('Valid investment ID is required')
  ]),
  async (req, res) => {
    try {
      const investment = await Investment.findById(req.params.id);

      if (!investment) {
        return res.status(404).json({
          success: false,
          message: 'Investment not found'
        });
      }

      // Check if user owns this investment or is admin
      if (investment.sponsorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to delete this investment'
        });
      }

      // Don't allow deletion if there are active investments
      const activeInvestments = await UserInvestment.countDocuments({
        investmentId: req.params.id,
        status: { $in: ['active', 'pending_approval'] }
      });

      if (activeInvestments > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete investment with active investments'
        });
      }

      investment.isActive = false;
      await investment.save();

      res.json({
        success: true,
        message: 'Investment deleted successfully'
      });
    } catch (error) {
      console.error('Delete investment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete investment'
      });
    }
  }
);

// @desc    Invest in opportunity
// @route   POST /api/investments/:id/invest
// @access  Private
router.post('/:id/invest',
  protect,
  sanitizeInput,
  validate([
    param('id').isMongoId().withMessage('Valid investment ID is required'),
    body('amount').isNumeric().isFloat({ min: 100000 }).withMessage('Investment amount must be at least ₦100,000'),
    body('paymentMethod').optional().isIn(['bank_transfer', 'card', 'escrow', 'crypto']).withMessage('Invalid payment method')
  ]),
  async (req, res) => {
    try {
      const investment = await Investment.findById(req.params.id);

      if (!investment) {
        return res.status(404).json({
          success: false,
          message: 'Investment not found'
        });
      }

      if (!investment.canInvest(req.body.amount)) {
        return res.status(400).json({
          success: false,
          message: 'Investment amount is invalid or investment is not available'
        });
      }

      // Check if user already invested in this opportunity
      const existingInvestment = await UserInvestment.findOne({
        userId: req.user._id,
        investmentId: req.params.id
      });

      if (existingInvestment) {
        return res.status(400).json({
          success: false,
          message: 'You have already invested in this opportunity'
        });
      }

      // Calculate shares
      const shares = req.body.amount / investment.minimumInvestment;
      const expectedMonthlyDividend = (req.body.amount * investment.dividendRate / 100) / 12;

      const userInvestment = await UserInvestment.create({
        userId: req.user._id,
        investmentId: req.params.id,
        investmentTitle: investment.title,
        amount: req.body.amount,
        shares,
        expectedMonthlyDividend,
        sponsorId: investment.sponsorId,
        paymentMethod: req.body.paymentMethod || 'bank_transfer',
        status: 'pending_approval'
      });

      // Update investment raised amount
      await investment.updateRaisedAmount(req.body.amount);

      // Send notification to sponsor
      await notificationService.createNotification({
        recipient: investment.sponsorId,
        sender: req.user._id,
        type: 'investment_opportunity',
        title: 'New Investment Received',
        message: `${req.user.firstName} ${req.user.lastName} invested ₦${req.body.amount.toLocaleString()} in ${investment.title}`,
        data: {
          investmentId: investment._id,
          userInvestmentId: userInvestment._id,
          amount: req.body.amount
        }
      });

      res.status(201).json({
        success: true,
        message: 'Investment submitted successfully',
        data: userInvestment
      });
    } catch (error) {
      console.error('Invest error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process investment'
      });
    }
  }
);

// @desc    Get user investments
// @route   GET /api/investments/user/my-investments
// @access  Private
router.get('/user/my-investments',
  protect,
  sanitizeInput,
  validate([
    query('status').optional().isIn(['pending_approval', 'active', 'completed', 'cancelled', 'refunded']).withMessage('Invalid status')
  ]),
  async (req, res) => {
    try {
      const options = {};
      if (req.query.status) options.status = req.query.status;

      const investments = await UserInvestment.getUserInvestments(req.user._id, options);

      res.json({
        success: true,
        data: investments
      });
    } catch (error) {
      console.error('Get user investments error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user investments'
      });
    }
  }
);

// @desc    Get user investment summary
// @route   GET /api/investments/user/summary
// @access  Private
router.get('/user/summary',
  protect,
  sanitizeInput,
  async (req, res) => {
    try {
      const summary = await UserInvestment.getUserInvestmentSummary(req.user._id);

      res.json({
        success: true,
        data: summary[0] || {
          totalInvested: 0,
          totalDividends: 0,
          activeInvestments: 0,
          totalInvestments: 0,
          averageReturn: 0
        }
      });
    } catch (error) {
      console.error('Get user investment summary error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch investment summary'
      });
    }
  }
);

// @desc    Get investment investors (for sponsors)
// @route   GET /api/investments/:id/investors
// @access  Private (Investment Company/Admin)
router.get('/:id/investors',
  protect,
  authorize(['investment_company', 'admin']),
  sanitizeInput,
  validate([
    param('id').isMongoId().withMessage('Valid investment ID is required')
  ]),
  async (req, res) => {
    try {
      const investment = await Investment.findById(req.params.id);

      if (!investment) {
        return res.status(404).json({
          success: false,
          message: 'Investment not found'
        });
      }

      // Check if user owns this investment or is admin
      if (investment.sponsorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view investors for this investment'
        });
      }

      const investors = await UserInvestment.getInvestmentInvestors(req.params.id);

      res.json({
        success: true,
        data: investors
      });
    } catch (error) {
      console.error('Get investment investors error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch investors'
      });
    }
  }
);

// @desc    Approve user investment
// @route   PUT /api/investments/user-investment/:id/approve
// @access  Private (Investment Company/Admin)
router.put('/user-investment/:id/approve',
  protect,
  authorize(['investment_company', 'admin']),
  sanitizeInput,
  validate([
    param('id').isMongoId().withMessage('Valid user investment ID is required')
  ]),
  async (req, res) => {
    try {
      const userInvestment = await UserInvestment.findById(req.params.id)
        .populate('userId', 'firstName lastName email')
        .populate('investmentId', 'title sponsorId');

      if (!userInvestment) {
        return res.status(404).json({
          success: false,
          message: 'User investment not found'
        });
      }

      // Check if user owns the investment or is admin
      if (userInvestment.investmentId.sponsorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to approve this investment'
        });
      }

      await userInvestment.approve(req.user._id);

      // Send notification to investor
      await notificationService.createNotification({
        recipient: userInvestment.userId._id,
        sender: req.user._id,
        type: 'investment_completed',
        title: 'Investment Approved',
        message: `Your investment in ${userInvestment.investmentId.title} has been approved`,
        data: {
          investmentId: userInvestment.investmentId._id,
          userInvestmentId: userInvestment._id,
          amount: userInvestment.amount
        }
      });

      res.json({
        success: true,
        message: 'Investment approved successfully',
        data: userInvestment
      });
    } catch (error) {
      console.error('Approve investment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to approve investment'
      });
    }
  }
);

// @desc    Cancel user investment
// @route   PUT /api/investments/user-investment/:id/cancel
// @access  Private (Investment Company/Admin)
router.put('/user-investment/:id/cancel',
  protect,
  authorize(['investment_company', 'admin']),
  sanitizeInput,
  validate([
    param('id').isMongoId().withMessage('Valid user investment ID is required'),
    body('reason').trim().isLength({ min: 5 }).withMessage('Cancellation reason is required')
  ]),
  async (req, res) => {
    try {
      const userInvestment = await UserInvestment.findById(req.params.id)
        .populate('userId', 'firstName lastName email')
        .populate('investmentId', 'title sponsorId');

      if (!userInvestment) {
        return res.status(404).json({
          success: false,
          message: 'User investment not found'
        });
      }

      // Check if user owns the investment or is admin
      if (userInvestment.investmentId.sponsorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to cancel this investment'
        });
      }

      await userInvestment.cancel(req.user._id, req.body.reason);

      // Send notification to investor
      await notificationService.createNotification({
        recipient: userInvestment.userId._id,
        sender: req.user._id,
        type: 'investment_completed',
        title: 'Investment Cancelled',
        message: `Your investment in ${userInvestment.investmentId.title} has been cancelled: ${req.body.reason}`,
        data: {
          investmentId: userInvestment.investmentId._id,
          userInvestmentId: userInvestment._id,
          amount: userInvestment.amount,
          reason: req.body.reason
        }
      });

      res.json({
        success: true,
        message: 'Investment cancelled successfully',
        data: userInvestment
      });
    } catch (error) {
      console.error('Cancel investment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cancel investment'
      });
    }
  }
);

module.exports = router; 
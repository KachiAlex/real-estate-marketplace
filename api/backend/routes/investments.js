const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { sanitizeInput, validate } = require('../middleware/validation');
const { param, body } = require('express-validator');


const investmentService = require('../services/investmentService');
const router = express.Router();

// @desc    Get all investments
router.get('/', protect, sanitizeInput, async (req, res) => {
  try {
    const { page = 1, limit = 20, ...filters } = req.query;
    const result = await investmentService.listInvestments({
      page: parseInt(page),
      limit: parseInt(limit),
      ...filters
    });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

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
router.get('/:id', protect, sanitizeInput, async (req, res) => {
  try {
    const investment = await investmentService.getInvestmentById(req.params.id);
    if (!investment) return res.status(404).json({ success: false, message: 'Investment not found' });
    // TODO: Add statistics if needed
    res.json({ success: true, data: investment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Create new investment
router.post('/', protect, authorize(['investment_company', 'admin']), sanitizeInput, async (req, res) => {
  try {
    const investmentData = { ...req.body, sponsorId: req.user._id, status: 'draft' };
    const investment = await investmentService.createInvestment(investmentData);
    res.status(201).json({ success: true, message: 'Investment created successfully', data: investment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update investment
router.put('/:id', protect, authorize(['investment_company', 'admin']), sanitizeInput, async (req, res) => {
  try {
    // TODO: Add sponsor/admin check and restrict fields if active/completed
    const updated = await investmentService.updateInvestment(req.params.id, req.body);
    res.json({ success: true, message: 'Investment updated successfully', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Delete investment
router.delete('/:id', protect, authorize(['investment_company', 'admin']), sanitizeInput, async (req, res) => {
  try {
    // TODO: Add sponsor/admin check and active investment check
    const deleted = await investmentService.deleteInvestment(req.params.id);
    res.json({ success: true, message: 'Investment deleted successfully', data: deleted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Invest in opportunity
router.post('/:id/invest', protect, sanitizeInput, async (req, res) => {
  try {
    const user = req.user;
    const { amount, paymentMethod } = req.body;
    const userInvestment = await investmentService.createUserInvestment({
      userId: user._id,
      investmentId: req.params.id,
      amount,
      paymentMethod,
      user
    });
    res.status(201).json({ success: true, message: 'Investment submitted successfully', data: userInvestment });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// @desc    Get user investments
router.get('/user/my-investments', protect, sanitizeInput, async (req, res) => {
  try {
    const options = {};
    if (req.query.status) options.status = req.query.status;
    const investments = await investmentService.getUserInvestments(req.user._id, options);
    res.json({ success: true, data: investments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get user investment summary
router.get('/user/summary', protect, sanitizeInput, async (req, res) => {
  try {
    const summary = await investmentService.getUserInvestmentSummary(req.user._id);
    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

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
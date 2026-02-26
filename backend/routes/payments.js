const express = require('express');

const paymentService = require('../services/paymentService');
const { sanitizeInput, validate } = require('../middleware/validation');
const { protect, authorize } = require('../middleware/auth');
const { body, param, query } = require('express-validator');
const router = require('express').Router();
const { createSubscription, getUserSubscriptions, updateSubscriptionStatus } = require('../services/paymentService');

// @desc    Get user payments
// @route   GET /api/payments
// @access  Private
router.get('/',
  protect,
  sanitizeInput,
  validate([
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
    query('status').optional().isIn(['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded']).withMessage('Invalid status'),
    query('paymentType').optional().isIn(['property_purchase', 'investment', 'escrow', 'subscription', 'commission', 'refund']).withMessage('Invalid payment type')
  ]),
  async (req, res) => {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 20;

      const result = await paymentService.listUserPayments({
        userId: req.user.id,
        status: req.query.status,
        paymentType: req.query.paymentType,
        page,
        limit
      });

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Get payments error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payments'
      });
    }
  }
);

// @desc    Get payment by ID
// @route   GET /api/payments/:id
// @access  Private
router.get('/:id',
  protect,
  sanitizeInput,
  validate([
    param('id').isString().withMessage('Valid payment ID is required')
  ]),
  async (req, res) => {
    try {
      const payment = await paymentService.getPaymentById(req.params.id);

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }

      // Check if user has access to this payment
      if (payment.userId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view this payment'
        });
      }

      res.json({
        success: true,
        data: payment
      });
    } catch (error) {
      console.error('Get payment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payment'
      });
    }
  }
);

// @desc    Initialize payment
// @route   POST /api/payments/initialize
// @access  Private
router.post('/initialize',
  protect,
  sanitizeInput,
  validate([
    body('amount').isNumeric().isFloat({ min: 100 }).withMessage('Amount must be at least â‚¦100'),
    body('paymentMethod').isIn(['flutterwave', 'paystack', 'stripe', 'bank_transfer']).withMessage('Invalid payment method'),
    body('paymentType')
      .isIn(['property_purchase', 'investment', 'escrow', 'subscription', 'commission', 'vendor_listing', 'property_verification'])
      .withMessage('Invalid payment type'),
    body('relatedEntity.type')
      .isIn(['property', 'investment', 'escrow', 'subscription', 'verification'])
      .withMessage('Invalid related entity type'),
    body('relatedEntity.id').notEmpty().withMessage('Related entity ID is required'),
    body('description').trim().isLength({ min: 5, max: 500 }).withMessage('Description must be between 5 and 500 characters'),
    body('currency').optional().isIn(['NGN', 'USD', 'EUR', 'GBP']).withMessage('Invalid currency')
  ]),
  async (req, res) => {
    try {
      const {
        amount,
        paymentMethod,
        paymentType,
        relatedEntity,
        description,
        currency = 'NGN'
      } = req.body;

      // Calculate fees based on payment method
      let platformFee = 0;
      let processingFee = 0;

      switch (paymentMethod) {
        case 'flutterwave':
          platformFee = amount * 0.025; // 2.5%
          processingFee = amount * 0.015; // 1.5%
          break;
        case 'paystack':
          platformFee = amount * 0.025; // 2.5%
          processingFee = amount * 0.015; // 1.5%
          break;
        case 'stripe':
          platformFee = amount * 0.025; // 2.5%
          processingFee = amount * 0.029; // 2.9%
          break;
        case 'bank_transfer':
          platformFee = amount * 0.025; // 2.5%
          processingFee = 0; // No processing fee for bank transfer
          break;
      }

      const totalFees = platformFee + processingFee;

      // Generate unique references
      const transactionId = `TXN${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
      const reference = `PAY${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

      const paymentData = {
        userId: req.user._id,
        transactionId,
        reference,
        amount,
        currency,
        paymentMethod,
        paymentProvider: paymentMethod,
        paymentType,
        relatedEntity,
        description,
        fees: {
          platformFee,
          processingFee,
          totalFees
        },
        status: 'pending'
      };

      try {
        const result = await paymentService.initializePayment({
          user: {
            id: req.user.id,
            email: req.user.email,
            phone: req.user.phone,
            firstName: req.user.firstName,
            lastName: req.user.lastName
          },
          amount,
          paymentMethod,
          paymentType,
          relatedEntity,
          description,
          currency
        });

        res.json({
          success: true,
          message: 'Payment initialized successfully',
          data: result
        });
      } catch (error) {
        console.error('Initialize payment error:', error);
        res.status(400).json({
          success: false,
          message: 'Failed to initialize payment',
          error: error.message
        });
      }
    } catch (error) {
      console.error('Initialize payment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to initialize payment'
      });
    }
  }
);

// @desc    Verify payment
// @route   POST /api/payments/:id/verify
// @access  Private
router.post('/:id/verify',
  protect,
  sanitizeInput,
  validate([
    param('id').isString().withMessage('Valid payment ID is required'),
    body('providerReference').optional().isString().withMessage('Provider reference must be a string')
  ]),
  async (req, res) => {
    try {
      const payment = await paymentService.verifyPayment({
        paymentId: req.params.id,
        userId: req.user.id,
        providerReference: req.body.providerReference
      });

      res.json({
        success: true,
        message: 'Payment verified successfully',
        data: payment
      });
    } catch (error) {
      const status = error.statusCode || 500;
      console.error('Verify payment error:', error);
      res.status(status).json({
        success: false,
        message: error.message || 'Failed to verify payment'
      });
    }
  }
);

// @desc    Cancel payment
// @route   PUT /api/payments/:id/cancel
// @access  Private
router.put('/:id/cancel',
  protect,
  sanitizeInput,
  validate([
    param('id').isString().withMessage('Valid payment ID is required'),
    body('reason').optional().isString().withMessage('Reason must be a string')
  ]),
  async (req, res) => {
    try {
      const payment = await paymentService.cancelPayment({
        paymentId: req.params.id,
        userId: req.user.id,
        reason: req.body.reason
      });

      res.json({
        success: true,
        message: 'Payment cancelled successfully',
        data: payment
      });
    } catch (error) {
      const status = error.statusCode || 500;
      console.error('Cancel payment error:', error);
      res.status(status).json({
        success: false,
        message: error.message || 'Failed to cancel payment'
      });
    }
  }
);

// @desc    Process refund (Admin only)
// @route   POST /api/payments/:id/refund
// @access  Private (Admin)
router.post('/:id/refund',
  protect,
  authorize(['admin']),
  sanitizeInput,
  validate([
    param('id').isString().withMessage('Valid payment ID is required'),
    body('amount').isNumeric().isFloat({ min: 1 }).withMessage('Refund amount must be at least â‚¦1'),
    body('reason').trim().isLength({ min: 5, max: 500 }).withMessage('Reason must be between 5 and 500 characters')
  ]),
  async (req, res) => {
    try {
      const payment = await paymentService.processRefund({
        paymentId: req.params.id,
        amount: req.body.amount,
        reason: req.body.reason,
        processedBy: req.user.id
      });

      res.json({
        success: true,
        message: 'Refund processed successfully',
        data: payment
      });
    } catch (error) {
      const status = error.statusCode || 500;
      console.error('Process refund error:', error);
      res.status(status).json({
        success: false,
        message: error.message || 'Failed to process refund'
      });
    }
  }
);

// @desc    Get payment statistics (Admin only)
// @route   GET /api/payments/stats/overview
// @access  Private (Admin)
router.get('/stats/overview',
  protect,
  authorize(['admin']),
  sanitizeInput,
  async (req, res) => {
    try {
      const stats = await paymentService.getPaymentStats();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Get payment stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payment statistics'
      });
    }
  }
);

// @desc    Webhook endpoint for payment providers
// @route   POST /api/payments/webhook/:provider
// @access  Public (with signature verification)
router.post('/webhook/:provider',
  sanitizeInput,
  validate([
    param('provider').isIn(['flutterwave', 'paystack', 'stripe']).withMessage('Invalid payment provider')
  ]),
  async (req, res) => {
    try {
      const { provider } = req.params;
      const webhookData = req.body;

      await paymentService.processWebhook({
        provider,
        headers: req.headers,
        payload: webhookData
      });

      res.json({
        success: true,
        message: 'Webhook processed successfully'
      });
    } catch (error) {
      console.error('Webhook processing error:', error);
      const status = error.statusCode || 500;
      res.status(status).json({
        success: false,
        message: error.message || 'Webhook processing failed'
      });
    }
  }
);

// @desc    Create vendor subscription
// @route   POST /api/subscriptions
// @access  Private
router.post('/',
  protect,
  sanitizeInput,
  validate([
    body('plan').isString().notEmpty().withMessage('Plan is required'),
    body('paymentId').isString().notEmpty().withMessage('Payment ID is required'),
    body('trialDays').optional().isInt({ min: 0, max: 30 })
  ]),
  async (req, res) => {
    try {
      const { plan, paymentId, trialDays } = req.body;
      const subscription = await createSubscription({
        userId: req.user.id,
        plan,
        paymentId,
        trialDays: trialDays || 7
      });
      res.json({ success: true, data: subscription });
    } catch (error) {
      console.error('Create subscription error:', error);
      res.status(500).json({ success: false, message: 'Failed to create subscription' });
    }
  }
);

// @desc    Get user subscriptions
// @route   GET /api/subscriptions
// @access  Private
router.get('/',
  protect,
  async (req, res) => {
    try {
      const subscriptions = await getUserSubscriptions(req.user.id);
      res.json({ success: true, data: subscriptions });
    } catch (error) {
      console.error('Get subscriptions error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch subscriptions' });
    }
  }
);

module.exports = router;


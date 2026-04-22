const express = require('express');
const rateLimit = require('express-rate-limit');

const paymentService = require('../services/paymentService');
const auditLogger = require('../services/auditLogger');
const { sanitizeInput, validate } = require('../middleware/validation');
const { protect, authorize } = require('../middleware/auth');
const { body, param, query } = require('express-validator');
const router = require('express').Router();
const { createSubscription, getUserSubscriptions, updateSubscriptionStatus } = require('../services/paymentService');

/**
 * Rate limiter for payment operations
 * Limits to 5 payment-related requests per 15 minutes per user
 * This applies to: initialize, verify, and refund endpoints
 */
const paymentRateLimiter = rateLimit({
  // Use user ID as the key for limiting (requires authentication)
  keyGenerator: (req, res) => {
    // If user is authenticated, use their ID as the key
    // Otherwise use IP address as fallback (though this endpoint requires auth)
    return req.user ? req.user.id : req.ip;
  },
  // 5 requests per 15 minutes (900000 ms)
  windowMs: 15 * 60 * 1000,
  max: 5,
  // Message returned when limit is exceeded
  message: 'Too many payment requests. Please try again in 15 minutes.',
  statusCode: 429,
  // Don't count failed requests against the limit
  skip: (req, res) => res.statusCode < 400,
  // Store in memory (can be replaced with Redis for production)
  store: undefined,
  // Get the client IP even behind proxies
  trustProxy: 1
});

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
// @rateLimit 5 requests per 15 minutes per user (critical payment operation)
router.post('/initialize',
  protect,
  paymentRateLimiter,
  sanitizeInput,
  validate([
    body('amount')
      .custom((value) => {
        const num = parseFloat(value);
        if (isNaN(num) || num <= 0) {
          throw new Error('Amount must be a valid positive number');
        }
        // Allow both kobo (100+) and naira amounts (100+)
        if (num < 100) {
          throw new Error('Amount must be at least 100');
        }
        return true;
      }),
    body('paymentMethod').isIn(['flutterwave', 'paystack', 'stripe', 'bank_transfer']).withMessage('Invalid payment method'),
    body('paymentType')
      .isIn(['property_purchase', 'investment', 'escrow', 'subscription', 'commission', 'vendor_listing', 'property_verification'])
      .withMessage('Invalid payment type'),
    body('relatedEntity').custom((value) => {
      if (!value || typeof value !== 'object') {
        throw new Error('Related entity is required');
      }
      if (!value.type || !value.id) {
        throw new Error('Related entity must have type and id');
      }
      return true;
    }),
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

        console.log('Payments route: Payment service result:', result);
        console.log('Payments route: Provider data:', result.providerData);

        // Ensure providerData is included in response
        const paymentRecord = result.payment ? (result.payment.toJSON ? result.payment.toJSON() : result.payment) : result;
        
        // Phase 3.3: Audit log the payment initialization
        auditLogger.logPaymentOperation({
          type: 'payment_initialized',
          amount,
          currency,
          status: 'pending',
          reference: paymentRecord.id || result.transactionId,
          relatedEntity: relatedEntity.id,
          metadata: {
            paymentMethod,
            paymentType,
            description
          }
        }, req);
        
        res.json({
          success: true,
          message: 'Payment initialized successfully',
          data: {
            ...paymentRecord,
            providerData: result.providerData || {}
          }
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
// @rateLimit 5 requests per 15 minutes per user (payment verification)
router.post('/:id/verify',
  protect,
  paymentRateLimiter,
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

      // Phase 3.3: Audit log the payment verification
      auditLogger.logPaymentOperation({
        type: 'payment_verified',
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        reference: payment.id,
        metadata: {
          paymentMethod: payment.paymentMethod,
          paymentType: payment.paymentType,
          providerReference: req.body.providerReference
        }
      }, req);

      res.json({
        success: true,
        message: 'Payment verified successfully',
        data: payment
      });
    } catch (error) {
      const status = error.statusCode || 500;
      console.error('Verify payment error:', error);
      
      // Phase 3.3: Audit log the failed verification
      auditLogger.logPaymentOperation({
        type: 'payment_verification_failed',
        status: 'failed',
        reference: req.params.id,
        metadata: {
          error: error.message
        }
      }, req);
      
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
// @rateLimit 5 requests per 15 minutes per user (refund operations)
router.post('/:id/refund',
  protect,
  paymentRateLimiter,
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

      // Phase 3.3: Audit log the refund operation
      auditLogger.logPaymentOperation({
        type: 'payment_refunded',
        amount: req.body.amount,
        currency: payment.currency,
        status: 'completed',
        reference: payment.id,
        metadata: {
          originalAmount: payment.amount,
          reason: req.body.reason,
          processedBy: req.user.email
        }
      }, req);

      res.json({
        success: true,
        message: 'Refund processed successfully',
        data: payment
      });
    } catch (error) {
      const status = error.statusCode || 500;
      console.error('Process refund error:', error);
      
      // Phase 3.3: Audit log the failed refund
      auditLogger.logPaymentOperation({
        type: 'payment_refund_failed',
        amount: req.body.amount,
        status: 'failed',
        reference: req.params.id,
        metadata: {
          reason: req.body.reason,
          error: error.message
        }
      }, req);
      
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


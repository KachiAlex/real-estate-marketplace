const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { sanitizeInput, validate } = require('../middleware/validation');
const { body, param, query } = require('express-validator');
const Payment = require('../models/Payment');
const User = require('../models/User');
const notificationService = require('../services/notificationService');

// Payment providers
const flutterwaveService = require('../services/flutterwaveService');
const paystackService = require('../services/paystackService');
const stripeService = require('../services/stripeService');

const router = express.Router();

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
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;

      const options = {};
      if (req.query.status) options.status = req.query.status;
      if (req.query.paymentType) options.paymentType = req.query.paymentType;

      const payments = await Payment.getUserPayments(req.user._id, options)
        .skip(skip)
        .limit(limit);

      const total = await Payment.countDocuments({
        userId: req.user._id,
        isActive: true,
        ...options
      });

      res.json({
        success: true,
        data: {
          payments,
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
    param('id').isMongoId().withMessage('Valid payment ID is required')
  ]),
  async (req, res) => {
    try {
      const payment = await Payment.findById(req.params.id)
        .populate('relatedEntity.id')
        .populate('refund.processedBy', 'firstName lastName email');

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }

      // Check if user has access to this payment
      if (payment.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
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
    body('paymentType').isIn(['property_purchase', 'investment', 'escrow', 'subscription', 'commission']).withMessage('Invalid payment type'),
    body('relatedEntity.type').isIn(['property', 'investment', 'escrow', 'subscription']).withMessage('Invalid related entity type'),
    body('relatedEntity.id').isMongoId().withMessage('Valid related entity ID is required'),
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

      const payment = await Payment.create(paymentData);

      // Add to timeline
      payment.addTimelineEvent('pending', 'Payment initialized', {
        amount,
        paymentMethod,
        paymentType
      });

      // Initialize payment with provider
      let paymentResult = {};

      try {
        switch (paymentMethod) {
          case 'flutterwave':
            paymentResult = await flutterwaveService.initializePayment({
              amount: amount + totalFees,
              currency,
              reference,
              customer: {
                email: req.user.email,
                name: `${req.user.firstName} ${req.user.lastName}`,
                phone: req.user.phone
              },
              description
            });
            break;

          case 'paystack':
            paymentResult = await paystackService.initializePayment({
              amount: (amount + totalFees) * 100, // Convert to kobo
              currency,
              reference,
              email: req.user.email,
              metadata: {
                paymentId: payment._id,
                userId: req.user._id
              }
            });
            break;

          case 'stripe':
            paymentResult = await stripeService.createPaymentIntent({
              amount: Math.round((amount + totalFees) * 100), // Convert to cents
              currency: currency.toLowerCase(),
              metadata: {
                paymentId: payment._id,
                userId: req.user._id
              }
            });
            break;

          case 'bank_transfer':
            paymentResult = {
              success: true,
              data: {
                bankDetails: {
                  bankName: 'PROPERTY ARK Bank',
                  accountNumber: '1234567890',
                  accountName: 'PROPERTY ARK Escrow Account'
                },
                reference,
                amount: amount + totalFees
              }
            };
            break;
        }

        if (paymentResult.success) {
          // Update payment with provider data
          payment.metadata[paymentMethod] = paymentResult.data;
          payment.status = 'processing';
          await payment.save();

          payment.addTimelineEvent('processing', 'Payment processing initiated', {
            provider: paymentMethod,
            providerData: paymentResult.data
          });

          res.json({
            success: true,
            message: 'Payment initialized successfully',
            data: {
              payment,
              paymentData: paymentResult.data
            }
          });
        } else {
          throw new Error(paymentResult.message || 'Failed to initialize payment');
        }
      } catch (providerError) {
        payment.status = 'failed';
        await payment.save();

        payment.addTimelineEvent('failed', 'Payment initialization failed', {
          error: providerError.message
        });

        res.status(400).json({
          success: false,
          message: 'Failed to initialize payment',
          error: providerError.message
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
    param('id').isMongoId().withMessage('Valid payment ID is required'),
    body('providerReference').optional().isString().withMessage('Provider reference must be a string')
  ]),
  async (req, res) => {
    try {
      const payment = await Payment.findById(req.params.id);

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }

      // Check if user has access to this payment
      if (payment.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to verify this payment'
        });
      }

      if (payment.status !== 'processing') {
        return res.status(400).json({
          success: false,
          message: 'Payment is not in processing status'
        });
      }

      let verificationResult = {};

      try {
        switch (payment.paymentProvider) {
          case 'flutterwave':
            verificationResult = await flutterwaveService.verifyPayment(
              req.body.providerReference || payment.metadata.flutterwave?.flwRef
            );
            break;

          case 'paystack':
            verificationResult = await paystackService.verifyPayment(
              req.body.providerReference || payment.reference
            );
            break;

          case 'stripe':
            verificationResult = await stripeService.verifyPayment(
              payment.metadata.stripe?.paymentIntentId
            );
            break;

          case 'bank_transfer':
            // For bank transfer, we'll assume it's verified if user confirms
            verificationResult = {
              success: true,
              data: {
                status: 'success',
                amount: payment.amount + payment.fees.totalFees
              }
            };
            break;
        }

        if (verificationResult.success && verificationResult.data.status === 'success') {
          payment.status = 'completed';
          payment.addTimelineEvent('completed', 'Payment verified and completed', {
            provider: payment.paymentProvider,
            verificationData: verificationResult.data
          });

          await payment.save();

          // Send notification
          await notificationService.createNotification({
            recipient: payment.userId,
            sender: null,
            type: 'payment_received',
            title: 'Payment Successful',
            message: `Your payment of â‚¦${payment.amount.toLocaleString()} has been processed successfully`,
            data: {
              paymentId: payment._id,
              amount: payment.amount,
              paymentType: payment.paymentType
            }
          });

          res.json({
            success: true,
            message: 'Payment verified successfully',
            data: payment
          });
        } else {
          payment.status = 'failed';
          payment.addTimelineEvent('failed', 'Payment verification failed', {
            provider: payment.paymentProvider,
            verificationData: verificationResult.data
          });

          await payment.save();

          res.status(400).json({
            success: false,
            message: 'Payment verification failed',
            data: verificationResult.data
          });
        }
      } catch (verificationError) {
        payment.status = 'failed';
        payment.addTimelineEvent('failed', 'Payment verification error', {
          error: verificationError.message
        });

        await payment.save();

        res.status(400).json({
          success: false,
          message: 'Payment verification failed',
          error: verificationError.message
        });
      }
    } catch (error) {
      console.error('Verify payment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify payment'
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
    param('id').isMongoId().withMessage('Valid payment ID is required'),
    body('reason').optional().isString().withMessage('Reason must be a string')
  ]),
  async (req, res) => {
    try {
      const payment = await Payment.findById(req.params.id);

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }

      // Check if user has access to this payment
      if (payment.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to cancel this payment'
        });
      }

      if (!['pending', 'processing'].includes(payment.status)) {
        return res.status(400).json({
          success: false,
          message: 'Payment cannot be cancelled in current status'
        });
      }

      payment.status = 'cancelled';
      payment.addTimelineEvent('cancelled', 'Payment cancelled by user', {
        reason: req.body.reason
      });

      await payment.save();

      res.json({
        success: true,
        message: 'Payment cancelled successfully',
        data: payment
      });
    } catch (error) {
      console.error('Cancel payment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cancel payment'
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
    param('id').isMongoId().withMessage('Valid payment ID is required'),
    body('amount').isNumeric().isFloat({ min: 1 }).withMessage('Refund amount must be at least â‚¦1'),
    body('reason').trim().isLength({ min: 5, max: 500 }).withMessage('Reason must be between 5 and 500 characters')
  ]),
  async (req, res) => {
    try {
      const payment = await Payment.findById(req.params.id);

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }

      if (payment.status !== 'completed') {
        return res.status(400).json({
          success: false,
          message: 'Only completed payments can be refunded'
        });
      }

      if (req.body.amount > payment.amount) {
        return res.status(400).json({
          success: false,
          message: 'Refund amount cannot exceed original payment amount'
        });
      }

      await payment.processRefund(req.body.amount, req.body.reason, req.user._id);

      // Send notification to user
      await notificationService.createNotification({
        recipient: payment.userId,
        sender: req.user._id,
        type: 'payment_failed',
        title: 'Payment Refunded',
        message: `Your payment of â‚¦${req.body.amount.toLocaleString()} has been refunded: ${req.body.reason}`,
        data: {
          paymentId: payment._id,
          refundAmount: req.body.amount,
          reason: req.body.reason
        }
      });

      res.json({
        success: true,
        message: 'Refund processed successfully',
        data: payment
      });
    } catch (error) {
      console.error('Process refund error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process refund'
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
      const stats = await Payment.getPaymentStats();

      const monthlyStats = await Payment.aggregate([
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            totalFees: { $sum: '$fees.totalFees' }
          }
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 12 }
      ]);

      res.json({
        success: true,
        data: {
          overview: stats[0] || {
            totalPayments: 0,
            totalAmount: 0,
            totalFees: 0,
            completedPayments: 0,
            failedPayments: 0,
            pendingPayments: 0
          },
          monthlyStats
        }
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

      // Verify webhook signature (implementation depends on provider)
      let isValidWebhook = false;

      switch (provider) {
        case 'flutterwave':
          isValidWebhook = flutterwaveService.verifyWebhook(req.headers, webhookData);
          break;
        case 'paystack':
          isValidWebhook = paystackService.verifyWebhook(req.headers, webhookData);
          break;
        case 'stripe':
          isValidWebhook = stripeService.verifyWebhook(req.headers, webhookData);
          break;
      }

      if (!isValidWebhook) {
        return res.status(400).json({
          success: false,
          message: 'Invalid webhook signature'
        });
      }

      // Process webhook based on provider
      let payment = null;
      let status = 'failed';

      switch (provider) {
        case 'flutterwave':
          payment = await Payment.findOne({ reference: webhookData.tx_ref });
          status = webhookData.status === 'successful' ? 'completed' : 'failed';
          break;
        case 'paystack':
          payment = await Payment.findOne({ reference: webhookData.data.reference });
          status = webhookData.data.status === 'success' ? 'completed' : 'failed';
          break;
        case 'stripe':
          payment = await Payment.findOne({ 'metadata.stripe.paymentIntentId': webhookData.data.object.id });
          status = webhookData.data.object.status === 'succeeded' ? 'completed' : 'failed';
          break;
      }

      if (payment && payment.status === 'processing') {
        payment.status = status;
        payment.webhookData = webhookData;
        payment.addTimelineEvent(status, `Payment ${status} via webhook`, {
          provider,
          webhookData
        });

        await payment.save();

        // Send notification
        const notificationType = status === 'completed' ? 'payment_received' : 'payment_failed';
        const title = status === 'completed' ? 'Payment Successful' : 'Payment Failed';
        const message = status === 'completed' 
          ? `Your payment of â‚¦${payment.amount.toLocaleString()} has been processed successfully`
          : `Your payment of â‚¦${payment.amount.toLocaleString()} failed to process`;

        await notificationService.createNotification({
          recipient: payment.userId,
          sender: null,
          type: notificationType,
          title,
          message,
          data: {
            paymentId: payment._id,
            amount: payment.amount,
            paymentType: payment.paymentType
          }
        });
      }

      res.json({
        success: true,
        message: 'Webhook processed successfully'
      });
    } catch (error) {
      console.error('Webhook processing error:', error);
      res.status(500).json({
        success: false,
        message: 'Webhook processing failed'
      });
    }
  }
);

module.exports = router; 


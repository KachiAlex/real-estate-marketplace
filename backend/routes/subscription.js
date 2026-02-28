const express = require('express');
const { body, validationResult } = require('express-validator');
const { Subscription, SubscriptionPlan, SubscriptionPayment, User } = require('../config/sequelizeDb');
const { protect } = require('../middleware/auth');
const paystackService = require('../services/paystackService');
const SubscriptionService = require('../services/subscriptionService');
const router = express.Router();

// Middleware to check if user is a vendor
const requireVendor = (req, res, next) => {
  if (!req.user || (!req.user.roles.includes('vendor') && req.user.role !== 'vendor')) {
    return res.status(403).json({
      success: false,
      message: 'Vendor access required'
    });
  }
  next();
};

// @desc    Get current vendor's subscription
// @route   GET /api/subscription/current
// @access  Private/Vendor
router.get('/current', protect, requireVendor, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      where: { vendorId: req.user.id },
      include: [
        {
          model: SubscriptionPlan,
          as: 'planDetails'
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    if (!subscription) {
      // Create trial subscription for new vendor
      const trialPlan = await SubscriptionPlan.findOne({
        where: { isActive: true, billingCycle: 'monthly' }
      });

      const newSubscription = await Subscription.create({
        vendorId: req.user.id,
        planId: trialPlan?.id,
        plan: trialPlan?.name || 'Vendor Monthly Plan',
        status: 'trial',
        amount: trialPlan?.amount || 50000.00,
        trialEndDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        nextPaymentDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      });

      return res.json({
        success: true,
        data: newSubscription
      });
    }

    res.json({
      success: true,
      data: subscription
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching subscription'
    });
  }
});

// @desc    Get subscription plans
// @route   GET /api/subscription/plans
// @access  Public
router.get('/plans', async (req, res) => {
  try {
    const plans = await SubscriptionPlan.findAll({
      where: { isActive: true },
      order: [['sortOrder', 'ASC'], ['amount', 'ASC']]
    });

    res.json({
      success: true,
      data: plans
    });
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching plans'
    });
  }
});

// @desc    Get payment history
// @route   GET /api/subscription/payments
// @access  Private/Vendor
router.get('/payments', protect, requireVendor, async (req, res) => {
  try {
    const payments = await SubscriptionPayment.findAll({
      where: { vendorId: req.user.id },
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: payments
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching payments'
    });
  }
});

// @desc    Initialize subscription payment with Paystack
// @route   POST /api/subscription/pay
// @access  Private/Vendor
router.post('/pay', [
  protect,
  requireVendor,
  body('planId')
    .optional({ nullable: true })
    .custom((value) => {
      if (!value) return true;
      if (value === 'vendor-default-plan') return true;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(value)) return true;
      throw new Error('Valid plan ID required');
    }),
  body('paymentMethod').isIn(['paystack']).withMessage('Paystack payment required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { planId, paymentMethod } = req.body;

    // Get subscription plan
    const plan = await SubscriptionPlan.findByPk(planId);
    if (!plan || !plan.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription plan'
      });
    }

    // Get vendor details
    const vendor = await User.findByPk(req.user.id);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Initialize payment using subscription service
    const { payment, subscription } = await SubscriptionService.initializePayment(
      req.user.id,
      plan.id,
      paymentMethod
    );

    // Initialize Paystack payment
    const paystackResult = await paystackService.initializeSubscriptionPayment({
      vendor,
      plan,
      payment,
      callbackUrl: `${process.env.CLIENT_URL || 'http://localhost:3000'}/subscription/payment/verify`
    });

    if (!paystackResult.success) {
      return res.status(500).json({
        success: false,
        message: paystackResult.message || 'Failed to initialize payment'
      });
    }

    res.json({
      success: true,
      data: {
        paymentUrl: paystackResult.data.authorizationUrl,
        reference: paystackResult.data.reference,
        amount: plan.amount,
        currency: plan.currency,
        planName: plan.name,
        subscription
      }
    });
  } catch (error) {
    console.error('Initialize payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error initializing payment'
    });
  }
});

// @desc    Verify Paystack payment
// @route   POST /api/subscription/verify
// @access  Public (webhook)
router.post('/verify', async (req, res) => {
  try {
    const { reference } = req.body;

    if (!reference) {
      return res.status(400).json({
        success: false,
        message: 'Payment reference required'
      });
    }

    // Verify payment with Paystack
    const verification = await paystackService.verifyPayment(reference);

    if (!verification.success) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }

    if (verification.data.status === 'success') {
      // Process successful payment
      await SubscriptionService.processSuccessfulPayment(
        reference,
        verification.data
      );

      res.json({
        success: true,
        message: 'Payment verified successfully',
        data: verification.data
      });
    } else {
      // Process failed payment
      await SubscriptionService.processFailedPayment(
        reference,
        verification.data
      );

      res.status(400).json({
        success: false,
        message: 'Payment failed'
      });
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error verifying payment'
    });
  }
});

// @desc    Paystack webhook handler
// @route   POST /api/subscription/webhook
// @access  Public
router.post('/webhook', async (req, res) => {
  try {
    const signature = req.headers['x-paystack-signature'];
    
    // Verify webhook signature
    const isValid = paystackService.verifyWebhook(req.headers, req.body);
    
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid webhook signature'
      });
    }

    const event = req.body.event;
    const data = req.body.data;

    // Handle webhook event
    await paystackService.handleWebhookEvent(event, data);

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handling error:', error);
    res.status(500).json({
      success: false,
      message: 'Webhook processing failed'
    });
  }
});

// @desc    Update subscription settings
// @route   PUT /api/subscription/settings
// @access  Private/Vendor
router.put('/settings', [
  protect,
  requireVendor,
  body('autoRenew').isBoolean().withMessage('Auto renew must be boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { autoRenew } = req.body;

    const subscription = await Subscription.findOne({
      where: { vendorId: req.user.id }
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    await subscription.update({ autoRenew });

    res.json({
      success: true,
      data: subscription,
      message: 'Subscription settings updated'
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating settings'
    });
  }
});

// @desc    Cancel subscription
// @route   POST /api/subscription/cancel
// @access  Private/Vendor
router.post('/cancel', protect, requireVendor, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      where: { vendorId: req.user.id }
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    if (subscription.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Subscription already cancelled'
      });
    }

    await subscription.update({
      status: 'cancelled',
      autoRenew: false,
      endDate: new Date()
    });

    res.json({
      success: true,
      data: subscription,
      message: 'Subscription cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error cancelling subscription'
    });
  }
});

// @desc    Get subscription status for UI
// @route   GET /api/subscription/status
// @access  Private/Vendor
router.get('/status', protect, requireVendor, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      where: { vendorId: req.user.id },
      include: [
        {
          model: SubscriptionPlan,
          as: 'planDetails'
        }
      ]
    });

    if (!subscription) {
      return res.json({
        success: true,
        data: {
          status: 'no_subscription',
          message: 'No active subscription',
          needsPayment: false,
          trialDaysRemaining: 90
        }
      });
    }

    const now = new Date();
    const trialEndDate = new Date(subscription.trialEndDate);
    const daysUntilTrialEnds = Math.ceil((trialEndDate - now) / (1000 * 60 * 60 * 24));
    
    let status = subscription.status;
    let needsPayment = false;
    let message = '';

    switch (subscription.status) {
      case 'trial':
        if (daysUntilTrialEnds <= 0) {
          status = 'expired';
          needsPayment = true;
          message = 'Trial expired - Payment required';
        } else if (daysUntilTrialEnds <= 7) {
          message = `Trial ends in ${daysUntilTrialEnds} days`;
        } else {
          message = `Free trial - ${daysUntilTrialEnds} days remaining`;
        }
        break;
      case 'active':
        message = 'Subscription active';
        break;
      case 'expired':
        needsPayment = true;
        message = 'Payment required - Account suspended';
        break;
      case 'suspended':
        message = 'Account suspended - Contact admin';
        break;
      case 'cancelled':
        message = 'Subscription cancelled';
        break;
    }

    res.json({
      success: true,
      data: {
        status,
        message,
        needsPayment,
        trialDaysRemaining: Math.max(0, daysUntilTrialEnds),
        subscription
      }
    });
  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching status'
    });
  }
});

module.exports = router;

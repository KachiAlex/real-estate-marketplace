const express = require('express');
const { body, validationResult } = require('express-validator');
const { Subscription, SubscriptionPlan, SubscriptionPayment, User } = require('../config/sequelizeDb');
const { protect, authorize } = require('../middleware/auth');
const SubscriptionService = require('../services/subscriptionService');
const notificationService = require('../services/notificationService');
const router = express.Router();

// All routes require admin authentication
router.use(protect);
router.use(authorize('admin'));

// @desc    Get all subscriptions with pagination and filters
// @route   GET /api/admin/subscription/subscriptions
// @access  Private/Admin
router.get('/subscriptions', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const status = req.query.status;
    const search = req.query.search;

    const where = {};
    if (status) where.status = status;
    
    const include = [
      {
        model: User,
        as: 'vendor',
        attributes: ['id', 'firstName', 'lastName', 'email', 'phone']
      },
      {
        model: SubscriptionPlan,
        as: 'planDetails',
        attributes: ['id', 'name', 'amount', 'billingCycle']
      }
    ];

    // Add search filter
    if (search) {
      include[0].where = {
        [require('sequelize').Op.or]: [
          { firstName: { [require('sequelize').Op.iLike]: `%${search}%` } },
          { lastName: { [require('sequelize').Op.iLike]: `%${search}%` } },
          { email: { [require('sequelize').Op.iLike]: `%${search}%` } }
        ]
      };
    }

    const { rows, count } = await Subscription.findAndCountAll({
      where,
      include,
      order: [['createdAt', 'DESC']],
      offset,
      limit
    });

    res.json({
      success: true,
      data: {
        subscriptions: rows,
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get subscriptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching subscriptions'
    });
  }
});

// @desc    Get subscription statistics
// @route   GET /api/admin/subscription/stats
// @access  Private/Admin
router.get('/stats', async (req, res) => {
  try {
    const stats = {
      totalSubscriptions: await Subscription.count(),
      activeSubscriptions: await Subscription.count({ where: { status: 'active' } }),
      trialSubscriptions: await Subscription.count({ where: { status: 'trial' } }),
      expiredSubscriptions: await Subscription.count({ where: { status: 'expired' } }),
      suspendedSubscriptions: await Subscription.count({ where: { status: 'suspended' } }),
      cancelledSubscriptions: await Subscription.count({ where: { status: 'cancelled' } }),
      totalRevenue: await SubscriptionPayment.sum('amount', { where: { status: 'success' } }) || 0,
      monthlyRevenue: await SubscriptionPayment.sum('amount', {
        where: {
          status: 'success',
          paidAt: {
            [require('sequelize').Op.gte]: new Date(new Date().setDate(1))
          }
        }
      }) || 0
    };

    // Get expiring trials count
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    stats.expiringTrials = await Subscription.count({
      where: {
        status: 'trial',
        trialEndDate: {
          [require('sequelize').Op.lte]: sevenDaysFromNow,
          [require('sequelize').Op.gt]: new Date()
        }
      }
    });

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching statistics'
    });
  }
});

// @desc    Get subscription details
// @route   GET /api/admin/subscription/:id
// @access  Private/Admin
router.get('/:id', async (req, res) => {
  try {
    const subscription = await Subscription.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'vendor',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'isActive']
        },
        {
          model: SubscriptionPlan,
          as: 'planDetails'
        },
        {
          model: SubscriptionPayment,
          as: 'payments',
          order: [['createdAt', 'DESC']]
        }
      ]
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
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

// @desc    Update subscription status
// @route   PUT /api/admin/subscription/:id/status
// @access  Private/Admin
router.put('/:id/status', [
  body('status').isIn(['trial', 'active', 'expired', 'suspended', 'cancelled']).withMessage('Valid status required'),
  body('reason').optional().isString().withMessage('Reason must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { status, reason } = req.body;
    const subscription = await Subscription.findByPk(req.params.id);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    const oldStatus = subscription.status;
    await subscription.update({ 
      status,
      suspensionReason: reason || null
    });

    // Send notification to vendor
    if (oldStatus !== status) {
      if (status === 'suspended') {
        await notificationService.createSubscriptionSuspendedNotification(
          subscription.vendorId,
          reason || 'Suspended by administrator'
        );
      } else if (status === 'active' && oldStatus === 'suspended') {
        await notificationService.createPaymentSuccessfulNotification(
          subscription.vendorId,
          parseFloat(subscription.amount),
          subscription.nextPaymentDate
        );
      }
    }

    res.json({
      success: true,
      data: subscription,
      message: `Subscription status updated to ${status}`
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating subscription status'
    });
  }
});

// @desc    Extend trial period
// @route   POST /api/admin/subscription/:id/extend-trial
// @access  Private/Admin
router.post('/:id/extend-trial', [
  body('days').isInt({ min: 1, max: 365 }).withMessage('Days must be between 1 and 365'),
  body('reason').isString().withMessage('Reason is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { days, reason } = req.body;
    const subscription = await Subscription.findByPk(req.params.id);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    if (subscription.status !== 'trial') {
      return res.status(400).json({
        success: false,
        message: 'Can only extend trial subscriptions'
      });
    }

    const newTrialEndDate = new Date(subscription.trialEndDate);
    newTrialEndDate.setDate(newTrialEndDate.getDate() + days);

    await subscription.update({
      trialEndDate: newTrialEndDate,
      nextPaymentDate: newTrialEndDate
    });

    // Send notification
    await notificationService.createTrialStartedNotification(
      subscription.vendorId,
      newTrialEndDate
    );

    res.json({
      success: true,
      data: subscription,
      message: `Trial extended by ${days} days`
    });
  } catch (error) {
    console.error('Extend trial error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error extending trial'
    });
  }
});

// @desc    Suspend vendor account
// @route   POST /api/admin/subscription/suspend-vendor/:vendorId
// @access  Private/Admin
router.post('/suspend-vendor/:vendorId', [
  body('reason').isString().withMessage('Reason is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { reason } = req.body;
    const vendorId = req.params.vendorId;

    await SubscriptionService.suspendVendor(vendorId, reason);

    res.json({
      success: true,
      message: 'Vendor account suspended successfully'
    });
  } catch (error) {
    console.error('Suspend vendor error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error suspending vendor'
    });
  }
});

// @desc    Get all subscription plans
// @route   GET /api/admin/subscription/plans
// @access  Private/Admin
router.get('/plans', async (req, res) => {
  try {
    const plans = await SubscriptionPlan.findAll({
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

// @desc    Create subscription plan
// @route   POST /api/admin/subscription/plans
// @access  Private/Admin
router.post('/plans', [
  body('name').isString().withMessage('Plan name is required'),
  body('amount').isDecimal().withMessage('Valid amount is required'),
  body('billingCycle').isIn(['monthly', 'yearly']).withMessage('Valid billing cycle required'),
  body('trialDays').isInt().withMessage('Trial days must be an integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const planData = req.body;
    const plan = await SubscriptionPlan.create(planData);

    res.json({
      success: true,
      data: plan,
      message: 'Subscription plan created successfully'
    });
  } catch (error) {
    console.error('Create plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating plan'
    });
  }
});

// @desc    Update subscription plan
// @route   PUT /api/admin/subscription/plans/:id
// @access  Private/Admin
router.put('/plans/:id', async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findByPk(req.params.id);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    await plan.update(req.body);

    res.json({
      success: true,
      data: plan,
      message: 'Subscription plan updated successfully'
    });
  } catch (error) {
    console.error('Update plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating plan'
    });
  }
});

// @desc    Delete subscription plan
// @route   DELETE /api/admin/subscription/plans/:id
// @access  Private/Admin
router.delete('/plans/:id', async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findByPk(req.params.id);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    // Check if plan is in use
    const subscriptionsCount = await Subscription.count({
      where: { planId: req.params.id }
    });

    if (subscriptionsCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete plan that is in use'
      });
    }

    await plan.destroy();

    res.json({
      success: true,
      message: 'Subscription plan deleted successfully'
    });
  } catch (error) {
    console.error('Delete plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting plan'
    });
  }
});

// @desc    Get payment history
// @route   GET /api/admin/subscription/payments
// @access  Private/Admin
router.get('/payments', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const status = req.query.status;

    const where = {};
    if (status) where.status = status;

    const { rows, count } = await SubscriptionPayment.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'vendor',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: Subscription,
          as: 'subscription',
          attributes: ['id', 'plan', 'status']
        }
      ],
      order: [['createdAt', 'DESC']],
      offset,
      limit
    });

    res.json({
      success: true,
      data: {
        payments: rows,
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching payments'
    });
  }
});

module.exports = router;

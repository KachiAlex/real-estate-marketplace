const { Subscription, SubscriptionPlan, SubscriptionPayment, User } = require('../config/sequelizeDb');
const notificationService = require('./notificationService');
const { v4: uuidv4 } = require('uuid');

class SubscriptionService {
  static buildDefaultPlan() {
    return {
      name: 'Vendor Monthly Plan',
      description: 'Default vendor subscription plan',
      amount: 50000.00,
      currency: 'NGN',
      billingCycle: 'monthly',
      trialDays: 90,
      isActive: true,
      features: {
        unlimited_listings: true,
        featured_properties: 10,
        priority_support: true,
        verification_badge: true,
        analytics_dashboard: true
      }
    };
  }

  static async ensureDefaultPlan() {
    try {
      let plan = await SubscriptionPlan.findOne({
        where: { isActive: true },
        order: [['sortOrder', 'ASC'], ['amount', 'ASC']]
      });

      if (plan) return plan;

      plan = await SubscriptionPlan.create(this.buildDefaultPlan());
      return plan;
    } catch (error) {
      console.error('ensureDefaultPlan error:', error.message || error);
      return this.buildDefaultPlan();
    }
  }

  // Create trial subscription for new vendor
  static async createTrialSubscription(vendorId) {
    try {
      // Get default vendor plan
      const plan = await this.ensureDefaultPlan();
      const planAmount = Number(plan?.amount || 50000);
      const planCurrency = plan?.currency || 'NGN';

      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 90); // 90 days trial

      const subscription = await Subscription.create({
        vendorId,
        planId: plan?.id || null,
        plan: plan?.name || 'Vendor Monthly Plan',
        status: 'trial',
        amount: planAmount,
        currency: planCurrency,
        trialEndDate,
        nextPaymentDate: trialEndDate,
        paymentMethod: 'paystack',
        autoRenew: true
      });

      // Send trial started notification
      await notificationService.createTrialStartedNotification(vendorId, trialEndDate);

      return subscription;
    } catch (error) {
      console.error('Error creating trial subscription:', error);
      throw error;
    }
  }

  // Get vendor's current subscription
  static async getVendorSubscription(vendorId) {
    try {
      const subscription = await Subscription.findOne({
        where: { vendorId },
        include: [
          {
            model: SubscriptionPlan,
            as: 'planDetails'
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      return subscription;
    } catch (error) {
      console.error('Error getting vendor subscription:', error);
      throw error;
    }
  }

  // Check if vendor has active subscription
  static async hasActiveSubscription(vendorId) {
    try {
      const subscription = await this.getVendorSubscription(vendorId);
      
      if (!subscription) return false;

      const now = new Date();
      
      switch (subscription.status) {
        case 'trial':
          return new Date(subscription.trialEndDate) > now;
        case 'active':
          return !subscription.endDate || new Date(subscription.endDate) > now;
        default:
          return false;
      }
    } catch (error) {
      console.error('Error checking active subscription:', error);
      return false;
    }
  }

  // Get subscription status with days remaining
  static async getSubscriptionStatus(vendorId) {
    try {
      const subscription = await this.getVendorSubscription(vendorId);
      
      if (!subscription) {
        return {
          status: 'no_subscription',
          message: 'No subscription found',
          needsPayment: false,
          trialDaysRemaining: 0,
          canAccess: false
        };
      }

      const now = new Date();
      const trialEndDate = new Date(subscription.trialEndDate);
      const daysUntilTrialEnds = Math.ceil((trialEndDate - now) / (1000 * 60 * 60 * 24));
      
      let status = subscription.status;
      let needsPayment = false;
      let message = '';
      let canAccess = false;

      switch (subscription.status) {
        case 'trial':
          canAccess = daysUntilTrialEnds > 0;
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
          canAccess = !subscription.endDate || new Date(subscription.endDate) > now;
          message = canAccess ? 'Subscription active' : 'Subscription expired';
          if (!canAccess) {
            status = 'expired';
            needsPayment = true;
          }
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

      return {
        status,
        message,
        needsPayment,
        trialDaysRemaining: Math.max(0, daysUntilTrialEnds),
        canAccess,
        subscription
      };
    } catch (error) {
      console.error('Error getting subscription status:', error);
      throw error;
    }
  }

  // Initialize payment for subscription
  static async initializePayment(vendorId, planId, paymentMethod = 'paystack') {
    try {
      let plan = null;
      if (planId && planId !== 'vendor-default-plan') {
        try {
          plan = await SubscriptionPlan.findByPk(planId);
        } catch (dbError) {
          console.warn('Failed to fetch plan from DB:', dbError.message);
        }
      }
      
      // Use default plan if not found or inactive
      if (!plan || (plan && plan.isActive === false)) {
        plan = this.buildDefaultPlan();
      }

      // Ensure plan has required fields
      const planAmount = Number(plan?.amount || 50000);
      const planCurrency = plan?.currency || 'NGN';
      // Only set planId if it's a valid UUID (from database), otherwise NULL
      const planId_safe = (plan?.id && typeof plan.id === 'string' && plan.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) ? plan.id : null;
      const planName = plan?.name || 'Vendor Monthly Plan';

      let subscription = await this.getVendorSubscription(vendorId);

      if (!subscription) {
        subscription = await Subscription.create({
          vendorId,
          planId: planId_safe,
          plan: planName,
          status: 'pending',
          amount: planAmount,
          currency: planCurrency,
          paymentMethod
        });
      } else {
        await subscription.update({
          planId: planId_safe,
          plan: planName,
          amount: planAmount,
          currency: planCurrency,
          paymentMethod
        });
      }

      // Create payment with safe values
      const transactionId = `SUB-${Date.now()}-${uuidv4().slice(0, 8)}`;
      const payment = await SubscriptionPayment.create({
        subscriptionId: subscription.id,
        vendorId,
        amount: planAmount,
        currency: planCurrency,
        paymentMethod,
        transactionId,
        status: 'pending',
        metadata: {
          planId: planId_safe,
          planName: planName,
          billingCycle: plan?.billingCycle || 'monthly'
        }
      });

      return { payment, subscription, plan };
    } catch (error) {
      console.error('Error initializing payment:', error);
      throw error;
    }
  }

  // Update payment reference after Paystack initialization
  static async updatePaymentReference(paymentId, paystackReference) {
    try {
      const payment = await SubscriptionPayment.findByPk(paymentId);
      if (payment) {
        await payment.update({ transactionId: paystackReference });
      }
      return payment;
    } catch (error) {
      console.error('Error updating payment reference:', error);
      throw error;
    }
  }

  // Process successful payment
  static async processSuccessfulPayment(paymentReference, gatewayResponse) {
    try {
      const payment = await SubscriptionPayment.findOne({
        where: { transactionId: paymentReference }
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      // Update payment status
      await payment.update({
        status: 'completed',
        paymentDate: new Date()
      });

      // Update subscription
      const subscription = await Subscription.findByPk(payment.subscriptionId);
      
      const now = new Date();
      const nextPaymentDate = new Date(now);
      nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1); // Add 1 month

      await subscription.update({
        status: 'active',
        lastPaymentDate: now,
        nextPaymentDate,
        endDate: nextPaymentDate,
        lastPaymentAttempt: null
      });

      // Send payment successful notification
      await notificationService.createPaymentSuccessfulNotification(
        payment.vendorId,
        parseFloat(payment.amount),
        nextPaymentDate
      );

      return { payment, subscription };
    } catch (error) {
      console.error('Error processing successful payment:', error);
      throw error;
    }
  }

  // Process failed payment
  static async processFailedPayment(paymentReference, gatewayResponse) {
    try {
      const payment = await SubscriptionPayment.findOne({
        where: { transactionId: paymentReference }
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      // Update payment status
      await payment.update({
        status: 'failed'
      });

      // Update subscription
      const subscription = await Subscription.findByPk(payment.subscriptionId);
      if (subscription) {
        await subscription.update({
          status: 'payment_failed',
          lastPaymentAttempt: new Date()
        });
      }

      return { payment, subscription };
    } catch (error) {
      console.error('Error processing failed payment:', error);
      throw error;
    }
  }

  // Check and update expired subscriptions
  static async updateExpiredSubscriptions() {
    try {
      const now = new Date();
      
      // Find expired trial subscriptions
      const expiredTrials = await Subscription.findAll({
        where: {
          status: 'trial',
          trialEndDate: {
            [require('sequelize').Op.lt]: now
          }
        }
      });

      for (const subscription of expiredTrials) {
        await subscription.update({ status: 'expired', lastPaymentAttempt: null });
        
        // Send trial expired notification
        await notificationService.createTrialExpiredNotification(subscription.vendorId);
      }

      // Find expired active subscriptions
      const expiredActive = await Subscription.findAll({
        where: {
          status: 'active',
          endDate: {
            [require('sequelize').Op.lt]: now
          }
        }
      });

      for (const subscription of expiredActive) {
        await subscription.update({ status: 'expired' });
      }

      return {
        expiredTrials: expiredTrials.length,
        expiredActive: expiredActive.length
      };
    } catch (error) {
      console.error('Error updating expired subscriptions:', error);
      throw error;
    }
  }

  // Get vendors with expiring trials (7 days warning)
  static async getVendorsWithExpiringTrials() {
    try {
      const warningDate = new Date();
      warningDate.setDate(warningDate.getDate() + 7); // 7 days from now

      const expiringSoon = await Subscription.findAll({
        where: {
          status: 'trial',
          trialEndDate: {
            [require('sequelize').Op.lte]: warningDate,
            [require('sequelize').Op.gt]: new Date()
          }
        },
        include: [
          {
            model: User,
            as: 'vendor'
          }
        ]
      });

      return expiringSoon;
    } catch (error) {
      console.error('Error getting expiring trials:', error);
      throw error;
    }
  }

  // Update payment reference
  static async updatePaymentReference(paymentId, reference) {
    try {
      await SubscriptionPayment.update(
        { transactionReference: reference, paystackReference: reference },
        { where: { id: paymentId } }
      );
      return true;
    } catch (error) {
      console.error('Error updating payment reference:', error);
      throw error;
    }
  }

  // Process failed payment
  static async processFailedPayment(reference, gatewayResponse) {
    try {
      const payment = await SubscriptionPayment.findOne({
        where: { transactionReference: reference }
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      await payment.update({
        status: 'failed',
        failureReason: gatewayResponse.message || 'Payment failed',
        gatewayResponse
      });

      return { payment };
    } catch (error) {
      console.error('Error processing failed payment:', error);
      throw error;
    }
  }

  // Cancel subscription
  static async cancelSubscription(subscriptionCode) {
    try {
      // Find subscription by code or reference
      const subscription = await Subscription.findOne({
        where: {
          metadata: {
            subscriptionCode: subscriptionCode
          }
        }
      });

      if (subscription) {
        await subscription.update({
          status: 'cancelled',
          autoRenew: false,
          endDate: new Date()
        });
      }

      return true;
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    }
  }

  // Suspend vendor for falsified details
  static async suspendVendor(vendorId, reason) {
    try {
      const subscription = await this.getVendorSubscription(vendorId);
      
      if (subscription) {
        await subscription.update({
          status: 'suspended',
          suspensionReason: reason,
          autoRenew: false
        });
      }

      // Also deactivate user account
      await User.update(
        { isActive: false },
        { where: { id: vendorId } }
      );

      return true;
    } catch (error) {
      console.error('Error suspending vendor:', error);
      throw error;
    }
  }
}

module.exports = SubscriptionService;

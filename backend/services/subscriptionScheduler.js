const SubscriptionService = require('./subscriptionService');
const notificationService = require('./notificationService');
const { Subscription, SubscriptionPlan, User } = require('../config/sequelizeDb');

class SubscriptionScheduler {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
  }

  // Start the scheduler (run every hour)
  start() {
    if (this.isRunning) {
      console.log('Subscription scheduler already running');
      return;
    }

    console.log('Starting subscription scheduler...');
    this.isRunning = true;
    
    // Run immediately on start
    this.runScheduledTasks();
    
    // Then run every hour
    this.intervalId = setInterval(() => {
      this.runScheduledTasks();
    }, 60 * 60 * 1000); // 1 hour
  }

  // Stop the scheduler
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('Subscription scheduler stopped');
  }

  // Main scheduled tasks runner
  async runScheduledTasks() {
    try {
      console.log('Running subscription scheduled tasks...');
      
      await Promise.all([
        this.checkExpiredSubscriptions(),
        this.checkExpiringTrials(),
        this.checkDuePayments(),
        this.processAutoRenewals(),
        this.suspendOverdueAccounts()
      ]);
      
      console.log('Subscription scheduled tasks completed');
    } catch (error) {
      console.error('Error in subscription scheduled tasks:', error);
    }
  }

  // Check and update expired subscriptions
  async checkExpiredSubscriptions() {
    try {
      const result = await SubscriptionService.updateExpiredSubscriptions();
      console.log(`Updated ${result.expiredTrials} expired trials and ${result.expiredActive} expired subscriptions`);
    } catch (error) {
      console.error('Error checking expired subscriptions:', error);
    }
  }

  // Check trials expiring soon (7 days, 3 days, 1 day)
  async checkExpiringTrials() {
    try {
      const expiringSoon = await SubscriptionService.getVendorsWithExpiringTrials();
      
      for (const subscription of expiringSoon) {
        const trialEndDate = new Date(subscription.trialEndDate);
        const now = new Date();
        const daysRemaining = Math.ceil((trialEndDate - now) / (1000 * 60 * 60 * 24));
        
        // Send notification based on urgency
        if (daysRemaining <= 1 && subscription.remindersSent < 3) {
          await notificationService.createTrialExpiringNotification(subscription.vendorId, daysRemaining);
          await subscription.update({ remindersSent: 3 });
        } else if (daysRemaining <= 3 && subscription.remindersSent < 2) {
          await notificationService.createTrialExpiringNotification(subscription.vendorId, daysRemaining);
          await subscription.update({ remindersSent: 2 });
        } else if (daysRemaining <= 7 && subscription.remindersSent < 1) {
          await notificationService.createTrialExpiringNotification(subscription.vendorId, daysRemaining);
          await subscription.update({ remindersSent: 1 });
        }
      }
      
      console.log(`Checked ${expiringSoon.length} expiring trials`);
    } catch (error) {
      console.error('Error checking expiring trials:', error);
    }
  }

  // Check payments due today
  async checkDuePayments() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const dueSubscriptions = await Subscription.findAll({
        where: {
          status: 'active',
          nextPaymentDate: {
            [require('sequelize').Op.gte]: today,
            [require('sequelize').Op.lt]: tomorrow
          },
          autoRenew: true
        },
        include: [
          { model: User, as: 'vendor' },
          { model: SubscriptionPlan, as: 'planDetails' }
        ]
      });

      for (const subscription of dueSubscriptions) {
        await this.processAutoRenewal(subscription);
      }
      
      console.log(`Processed ${dueSubscriptions.length} due payments`);
    } catch (error) {
      console.error('Error checking due payments:', error);
    }
  }

  // Process auto-renewals
  async processAutoRenewals() {
    try {
      // This is similar to checkDuePayments but more comprehensive
      const activeSubscriptions = await Subscription.findAll({
        where: {
          status: 'active',
          autoRenew: true,
          nextPaymentDate: {
            [require('sequelize').Op.lte]: new Date()
          }
        },
        include: [
          { model: User, as: 'vendor' },
          { model: SubscriptionPlan, as: 'planDetails' }
        ]
      });

      for (const subscription of activeSubscriptions) {
        await this.processAutoRenewal(subscription);
      }
      
      console.log(`Processed ${activeSubscriptions.length} auto-renewals`);
    } catch (error) {
      console.error('Error processing auto-renewals:', error);
    }
  }

  // Process individual auto-renewal
  async processAutoRenewal(subscription) {
    try {
      const { vendor, planDetails } = subscription;
      
      // Create payment record for auto-renewal
      const payment = await require('./subscriptionService').initializePayment(
        vendor.id,
        planDetails.id,
        'paystack'
      );

      // For auto-renewal, we'd typically charge the saved payment method
      // For now, we'll create a pending payment and notify the user
      await notificationService.createPaymentFailedNotification(
        vendor.id,
        parseFloat(planDetails.amount),
        'Auto-renewal requires payment method update'
      );

      // Mark subscription as pending payment
      await subscription.update({
        status: 'pending_payment',
        lastPaymentAttempt: new Date()
      });

      console.log(`Auto-renewal initiated for vendor ${vendor.id}`);
    } catch (error) {
      console.error('Error processing auto-renewal:', error);
      
      // Mark as failed and notify
      await subscription.update({
        status: 'payment_failed',
        lastPaymentAttempt: new Date()
      });
      
      await notificationService.createPaymentFailedNotification(
        subscription.vendorId,
        parseFloat(subscription.amount),
        'Auto-renewal failed'
      );
    }
  }

  // Suspend overdue accounts (7 days after payment failure)
  async suspendOverdueAccounts() {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const overdueSubscriptions = await Subscription.findAll({
        where: {
          status: ['payment_failed', 'pending_payment'],
          lastPaymentAttempt: {
            [require('sequelize').Op.lte]: sevenDaysAgo
          }
        },
        include: [
          { model: User, as: 'vendor' }
        ]
      });

      for (const subscription of overdueSubscriptions) {
        await this.suspendVendorAccount(subscription);
      }
      
      console.log(`Suspended ${overdueSubscriptions.length} overdue accounts`);
    } catch (error) {
      console.error('Error suspending overdue accounts:', error);
    }
  }

  // Suspend vendor account
  async suspendVendorAccount(subscription) {
    try {
      const reason = 'Subscription payment overdue for more than 7 days';
      
      await SubscriptionService.suspendVendor(subscription.vendorId, reason);
      
      await notificationService.createSubscriptionSuspendedNotification(
        subscription.vendorId,
        reason
      );

      console.log(`Suspended vendor ${subscription.vendorId} for overdue payment`);
    } catch (error) {
      console.error('Error suspending vendor account:', error);
    }
  }

  // Send daily summary report
  async sendDailySummary() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const stats = {
        newTrials: await Subscription.count({
          where: {
            status: 'trial',
            createdAt: { [require('sequelize').Op.gte]: today, [require('sequelize').Op.lt]: tomorrow }
          }
        }),
        expiredTrials: await Subscription.count({
          where: {
            status: 'expired',
            updatedAt: { [require('sequelize').Op.gte]: today, [require('sequelize').Op.lt]: tomorrow }
          }
        }),
        successfulPayments: await require('./subscriptionService').SubscriptionPayment.count({
          where: {
            status: 'success',
            paidAt: { [require('sequelize').Op.gte]: today, [require('sequelize').Op.lt]: tomorrow }
          }
        }),
        failedPayments: await require('./subscriptionService').SubscriptionPayment.count({
          where: {
            status: 'failed',
            createdAt: { [require('sequelize').Op.gte]: today, [require('sequelize').Op.lt]: tomorrow }
          }
        }),
        suspendedAccounts: await Subscription.count({
          where: {
            status: 'suspended',
            updatedAt: { [require('sequelize').Op.gte]: today, [require('sequelize').Op.lt]: tomorrow }
          }
        })
      };

      console.log('Daily subscription summary:', stats);
      
      // Here you could send this to admin dashboard or email
      return stats;
    } catch (error) {
      console.error('Error generating daily summary:', error);
    }
  }

  // Health check method
  async healthCheck() {
    try {
      const activeSubscriptions = await Subscription.count({ where: { status: 'active' } });
      const trialSubscriptions = await Subscription.count({ where: { status: 'trial' } });
      const expiredSubscriptions = await Subscription.count({ where: { status: 'expired' } });
      
      return {
        isRunning: this.isRunning,
        activeSubscriptions,
        trialSubscriptions,
        expiredSubscriptions,
        lastRun: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error in health check:', error);
      return { error: error.message };
    }
  }
}

module.exports = new SubscriptionScheduler();

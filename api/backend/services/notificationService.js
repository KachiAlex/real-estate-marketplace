const db = require('../config/sequelizeDb');
const notificationTemplateService = require('./notificationTemplateService');
const userService = require('./userService');
const emailService = require('./emailService');

const NotificationModel = db.Notification;
const DEFAULT_CHANNELS = { email: true, inApp: true, sms: false, push: true };

const toJSON = (inst) => (inst ? (inst.toJSON ? inst.toJSON() : inst) : null);

const normalizeId = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    if (value.id) return value.id;
    if (value._id) return value._id.toString();
  }
  return null;
};

const toFirestoreTimestamp = (value) => {
  if (!value) return null;
  if (value.toDate) return value;
  const dateValue = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(dateValue.getTime())) return null;
  return admin.firestore.Timestamp.fromDate(dateValue);
};

class NotificationService {
  constructor() { this.socketIO = null; }
  initializeSocketIO(io) { this.socketIO = io; }

  async createNotification(notificationData = {}) {
    if (!notificationData.recipient) throw new Error('Recipient is required');
    if (!notificationData.type) throw new Error('Notification type is required');

    const template = notificationData.templateId
      ? await notificationTemplateService.getTemplateById(notificationData.templateId)
      : await notificationTemplateService.getTemplateByType(notificationData.type);

    const finalChannels = { ...DEFAULT_CHANNELS, ...(notificationData.channels || {}) };

    const created = await NotificationModel.create({
      userId: notificationData.recipient,
      type: notificationData.type,
      title: notificationData.title || (template?.channels?.inApp?.title) || 'Notification',
      message: notificationData.message || (template?.channels?.inApp?.message) || '' ,
      data: notificationData.data || {},
      isRead: false
    });

    const notification = toJSON(created);
    await this.sendNotification(notification, template);
    return { success: true, data: notification };
  }

  async getUnreadCount(userId) {
    if (!userId) throw new Error('Valid userId is required');
    return await NotificationModel.count({ where: { userId, isRead: false } });
  }

  async getNotificationById(notificationId, userId) {
    const n = await NotificationModel.findByPk(notificationId);
    if (!n || n.userId !== userId) return { success: false, message: 'Notification not found' };
    return { success: true, data: toJSON(n) };
  }


  async sendNotification(notification, template = null) {
    try {
      const recipient = await userService.findById(notification.userId || notification.recipient);
      if (!recipient) throw new Error('Recipient not found');

      // email
      if (notification.channels?.email) {
        await this.sendEmailNotification(notification, recipient, template);
      }

      // in-app (already persisted)
      // push/sms are no-ops for now

      await NotificationModel.update({ sentAt: new Date() }, { where: { id: notification.id } });
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  async sendEmailNotification(notification, recipient, template) {
  try {
    const templateDoc = template || await notificationTemplateService.getTemplateByType(notification.type);
    const variables = { userName: [recipient.firstName, recipient.lastName].filter(Boolean).join(' ').trim() || recipient.email, ...notification.data };
    const rendered = templateDoc ? notificationTemplateService.renderTemplate(templateDoc, variables) : null;
    const subject = rendered?.channels?.email?.subject || notification.title;
    const html = rendered?.channels?.email?.htmlTemplate || `<p>${notification.message}</p>`;
    const text = rendered?.channels?.email?.textTemplate || notification.message;
    await emailService.sendEmail(recipient.email, subject, html, text);
  } catch (err) {
    console.error('sendEmailNotification failed:', err.message);
  }
}

  async sendInAppNotification(notification) {
    try {
      if (!this.socketIO) {
        return;
      }

      this.socketIO.to(`user_${notification.recipient}`).emit('notification', {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        priority: notification.priority,
        createdAt: notification.createdAt
      });
    } catch (error) {
      console.error('Error sending in-app notification:', error);
    }
  }

  async sendSMSNotification(notification, recipient) {
    try {
      console.log(`SMS notification placeholder to ${recipient.phone || recipient.phoneNumber || 'unknown'}: ${notification.message}`);
    } catch (error) {
      console.error('Error sending SMS notification:', error);
    }
  }

  async sendPushNotification(notification) {
    try {
      console.log(`Push notification placeholder for user ${notification.recipient}: ${notification.title}`);
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }

  async getUserNotifications(userId, options = {}) {
    try {
      const recipient = normalizeId(userId);
      if (!recipient) {
        throw new Error('Valid userId is required');
      }

      const limit = Number(options.limit) || 20;
      const page = Number(options.page) || 1;
      const offset = (page - 1) * limit;

      const where = { userId: recipient };
      if (options.status === 'unread') where.isRead = false;
      if (options.status === 'read' || options.status === 'archived') where.isRead = true;
      if (options.type) where.type = options.type;

      const { rows, count } = await NotificationModel.findAndCountAll({
        where,
        order: [['createdAt', 'DESC']],
        offset,
        limit
      });

      const unreadCount = await NotificationModel.count({ where: { userId: recipient, isRead: false } });

      return {
        success: true,
        data: {
          notifications: rows.map(toJSON),
          unreadCount,
          pagination: {
            page,
            limit,
            total: count
          }
        }
      };
    } catch (error) {
      console.error('Failed to get user notifications:', error);
      return { success: false, error: error.message };
    }
  }

  async markAsRead(notificationId, userId) {
    try {
      const n = await NotificationModel.findByPk(notificationId);
      if (!n || n.userId !== normalizeId(userId)) {
        return { success: false, message: 'Notification not found' };
      }

      await n.update({ isRead: true, readAt: new Date() });
      return { success: true, data: toJSON(n) };
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      return { success: false, error: error.message };
    }
  }

  async markAllAsRead(userId) {
    try {
      const recipient = normalizeId(userId);
      if (!recipient) throw new Error('Valid userId is required');

      await NotificationModel.update({ isRead: true, readAt: new Date() }, { where: { userId: recipient, isRead: false } });
      return { success: true };
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      return { success: false, error: error.message };
    }
  }

  async archiveNotification(notificationId, userId) {
    try {
      // Archive maps to marking as read in current schema
      const n = await NotificationModel.findByPk(notificationId);
      if (!n || n.userId !== normalizeId(userId)) return { success: false, message: 'Notification not found' };

      await n.update({ isRead: true, readAt: new Date() });
      return { success: true, data: toJSON(n) };
    } catch (error) {
      console.error('Failed to archive notification:', error);
      return { success: false, error: error.message };
    }
  }

  async deleteNotification(notificationId, userId) {
    try {
      const n = await NotificationModel.findByPk(notificationId);
      if (!n || n.userId !== normalizeId(userId)) return { success: false, message: 'Notification not found' };

      await NotificationModel.destroy({ where: { id: notificationId } });
      return { success: true };
    } catch (error) {
      console.error('Failed to delete notification:', error);
      return { success: false, error: error.message };
    }
  }

  async createPropertyVerificationNotification(property, user, isApproved, admin, notes = '') {
    const isVerified = Boolean(isApproved);
    const notificationData = {
      recipient: normalizeId(user),
      sender: normalizeId(admin),
      type: isVerified ? 'property_verified' : 'property_rejected',
      title: isVerified ? 'Property Verified' : 'Property Rejected',
      message: isVerified
        ? `Your property "${property.title}" has been verified and is now live on the marketplace.`
        : `Your property "${property.title}" has been rejected. ${notes ? `Reason: ${notes}` : ''}`,
      data: {
        propertyId: property.id || property._id,
        propertyTitle: property.title,
        isVerified,
        notes,
        adminName: admin ? `${admin.firstName || ''} ${admin.lastName || ''}`.trim() : undefined
      },
      priority: isVerified ? 'medium' : 'high',
      channels: {
        email: true,
        inApp: true,
        sms: false,
        push: true
      }
    };

    return this.createNotification(notificationData);
  }

  async createEscrowNotification(escrow, user, type, sender = null) {
    const notificationData = {
      recipient: normalizeId(user),
      sender: normalizeId(sender),
      type,
      title: this.getEscrowNotificationTitle(type),
      message: this.getEscrowNotificationMessage(type, escrow),
      data: {
        escrowId: escrow.id || escrow._id,
        propertyId: escrow.propertyId,
        amount: escrow.amount,
        status: escrow.status
      },
      priority: this.getEscrowNotificationPriority(type),
      channels: {
        email: true,
        inApp: true,
        sms: type === 'escrow_timeout',
        push: true
      }
    };

    return this.createNotification(notificationData);
  }

  getEscrowNotificationTitle(type) {
    const titles = {
      escrow_created: 'New Escrow Transaction',
      escrow_payment_received: 'Payment Received',
      escrow_disputed: 'Escrow Disputed',
      escrow_resolved: 'Escrow Resolved',
      escrow_completed: 'Escrow Completed',
      escrow_timeout: 'Escrow Timeout'
    };
    return titles[type] || 'Escrow Update';
  }

  getEscrowNotificationMessage(type, escrow) {
    const amount = escrow.amount ? Number(escrow.amount).toLocaleString() : '0';
    const messages = {
      escrow_created: `A new escrow transaction has been created for ₦${amount}.`,
      escrow_payment_received: `Payment of ₦${amount} has been received and is being processed.`,
      escrow_disputed: 'The escrow transaction has been disputed and requires admin review.',
      escrow_resolved: 'The escrow dispute has been resolved by an administrator.',
      escrow_completed: 'The escrow transaction has been completed successfully.',
      escrow_timeout: 'The escrow transaction has timed out and requires immediate attention.'
    };
    return messages[type] || 'Escrow status update';
  }

  getEscrowNotificationPriority(type) {
    const priorities = {
      escrow_created: 'medium',
      escrow_payment_received: 'medium',
      escrow_disputed: 'high',
      escrow_resolved: 'medium',
      escrow_completed: 'medium',
      escrow_timeout: 'urgent'
    };
    return priorities[type] || 'medium';
  }

  async createUserStatusNotification(user, isSuspended, admin, reason = '') {
    const notificationData = {
      recipient: normalizeId(user),
      sender: normalizeId(admin),
      type: isSuspended ? 'user_suspended' : 'user_activated',
      title: isSuspended ? 'Account Suspended' : 'Account Activated',
      message: isSuspended
        ? `Your account has been suspended. ${reason ? `Reason: ${reason}` : ''}`
        : 'Your account has been activated and you can now access all features.',
      data: {
        isSuspended,
        reason,
        adminName: admin ? `${admin.firstName || ''} ${admin.lastName || ''}`.trim() : undefined,
        statusDate: new Date().toISOString()
      },
      priority: 'high',
      channels: {
        email: true,
        sms: isSuspended,
        push: true
      }
    };
    return this.createNotification(notificationData);
  }

  // Subscription notification methods
  async createTrialStartedNotification(vendorId, trialEndDate) {
    const notificationData = {
      recipient: vendorId,
      type: 'trial_started',
      title: 'Free Trial Started',
      message: `Your 3-month free trial has started! Trial ends on ${new Date(trialEndDate).toLocaleDateString()}.`,
      data: {
        trialEndDate,
        trialDays: 90
      },
      priority: 'medium',
      channels: {
        email: true,
        inApp: true,
        sms: false,
        push: true
      }
    };
    return this.createNotification(notificationData);
  }

  async createTrialExpiringNotification(vendorId, daysRemaining) {
    const notificationData = {
      recipient: vendorId,
      type: 'trial_expiring',
      title: `Trial Expiring in ${daysRemaining} Days`,
      message: `Your free trial expires in ${daysRemaining} days. Set up your payment method to avoid interruption.`,
      data: {
        daysRemaining,
        urgency: daysRemaining <= 3 ? 'critical' : daysRemaining <= 7 ? 'warning' : 'normal'
      },
      priority: daysRemaining <= 3 ? 'high' : 'medium',
      channels: {
        email: true,
        inApp: true,
        sms: daysRemaining <= 3,
        push: true
      }
    };
    return this.createNotification(notificationData);
  }

  async createTrialExpiredNotification(vendorId) {
    const notificationData = {
      recipient: vendorId,
      type: 'trial_expired',
      title: 'Trial Expired - Account Suspended',
      message: 'Your free trial has expired. Your account is now suspended. Subscribe immediately to reactivate.',
      data: {
        accountSuspended: true,
        actionRequired: 'subscribe'
      },
      priority: 'urgent',
      channels: {
        email: true,
        inApp: true,
        sms: true,
        push: true
      }
    };
    return this.createNotification(notificationData);
  }

  async createPaymentSuccessfulNotification(vendorId, amount, nextPaymentDate) {
    const notificationData = {
      recipient: vendorId,
      type: 'payment_successful',
      title: 'Payment Successful',
      message: `Payment of ₦${amount.toLocaleString()} was successful. Your subscription is now active.`,
      data: {
        amount,
        nextPaymentDate,
        paymentDate: new Date().toISOString()
      },
      priority: 'low',
      channels: {
        email: true,
        inApp: true,
        sms: false,
        push: true
      }
    };
    return this.createNotification(notificationData);
  }

  async createPaymentFailedNotification(vendorId, amount, reason) {
    const notificationData = {
      recipient: vendorId,
      type: 'payment_failed',
      title: 'Payment Failed',
      message: `Payment of ₦${amount.toLocaleString()} failed. ${reason || 'Please update your payment method.'}`,
      data: {
        amount,
        failureReason: reason,
        actionRequired: 'update_payment'
      },
      priority: 'high',
      channels: {
        email: true,
        inApp: true,
        sms: true,
        push: true
      }
    };
    return this.createNotification(notificationData);
  }

  async createSubscriptionSuspendedNotification(vendorId, reason) {
    const notificationData = {
      recipient: vendorId,
      type: 'subscription_suspended',
      title: 'Subscription Suspended',
      message: `Your subscription has been suspended. ${reason ? `Reason: ${reason}` : 'Contact support for details.'}`,
      data: {
        suspensionReason: reason,
        accountSuspended: true,
        actionRequired: 'contact_support'
      },
      priority: 'urgent',
      channels: {
        email: true,
        inApp: true,
        sms: true,
        push: true
      }
    };
    return this.createNotification(notificationData);
  }

  async createVendorOnboardingNotification(vendorId) {
    const notificationData = {
      recipient: vendorId,
      type: 'vendor_onboarding',
      title: 'Welcome to Vendor Program',
      message: 'Welcome! You have a 3-month free trial. After that, N50,000/month applies. Falsified details = suspension.',
      data: {
        onboardingStep: 'complete',
        trialDays: 90,
        monthlyFee: 50000,
        warning: 'Falsified details will result in immediate suspension'
      },
      priority: 'medium',
      channels: {
        email: true,
        inApp: true,
        sms: false,
        push: true
      }
    };
    return this.createNotification(notificationData);
  }

  getSubscriptionNotificationMessage(type, data = {}) {
    const messages = {
      trial_started: `Your 3-month free trial has started! Trial ends on ${data.trialEndDate ? new Date(data.trialEndDate).toLocaleDateString() : '90 days from now'}.`,
      trial_expiring: `Your free trial expires in ${data.daysRemaining || 'few'} days. Set up your payment method to avoid interruption.`,
      trial_expired: 'Your free trial has expired. Your account is now suspended. Subscribe immediately to reactivate.',
      payment_successful: `Payment of ₦${data.amount?.toLocaleString() || '0'} was successful. Your subscription is now active.`,
      payment_failed: `Payment of ₦${data.amount?.toLocaleString() || '0'} failed. ${data.reason || 'Please update your payment method.'}`,
      subscription_suspended: `Your subscription has been suspended. ${data.reason || 'Contact support for details.'}`,
      vendor_onboarding: 'Welcome! You have a 3-month free trial. After that, N50,000/month applies. Falsified details = suspension.'
    };
    return messages[type] || 'Subscription notification';
  }

  getSubscriptionNotificationPriority(type) {
    const priorities = {
      trial_started: 'medium',
      trial_expiring: 'medium',
      trial_expired: 'urgent',
      payment_successful: 'low',
      payment_failed: 'high',
      subscription_suspended: 'urgent',
      vendor_onboarding: 'medium'
    };
    return priorities[type] || 'medium';
  }
}

module.exports = new NotificationService();

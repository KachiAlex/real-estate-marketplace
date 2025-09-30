const Notification = require('../models/Notification');
const NotificationTemplate = require('../models/NotificationTemplate');
const User = require('../models/User');
const emailService = require('./emailService');

class NotificationService {
  constructor() {
    this.socketIO = null;
  }

  // Initialize Socket.IO for real-time notifications
  initializeSocketIO(io) {
    this.socketIO = io;
  }

  // Create a new notification
  async createNotification(notificationData) {
    try {
      const {
        recipient,
        sender,
        type,
        title,
        message,
        data = {},
        priority = 'medium',
        channels = { email: true, inApp: true, sms: false, push: true },
        expiresAt = null,
        templateId = null,
        metadata = {}
      } = notificationData;

      // Get template if available
      let template = null;
      if (templateId) {
        template = await NotificationTemplate.findById(templateId);
      } else {
        template = await NotificationTemplate.getByType(type);
      }

      // Use template data if available
      let finalTitle = title;
      let finalMessage = message;
      let finalChannels = channels;

      if (template) {
        if (template.channels.inApp.enabled) {
          finalTitle = template.channels.inApp.title || title;
          finalMessage = template.channels.inApp.message || message;
        }
        
        // Merge channel preferences with template
        finalChannels = {
          email: channels.email && template.channels.email.enabled,
          inApp: channels.inApp && template.channels.inApp.enabled,
          sms: channels.sms && template.channels.sms.enabled,
          push: channels.push && template.channels.push.enabled
        };
      }

      // Create the notification
      const notification = new Notification({
        recipient,
        sender,
        type,
        title: finalTitle,
        message: finalMessage,
        data,
        priority,
        channels: finalChannels,
        expiresAt,
        templateId: template?._id,
        metadata
      });

      await notification.save();

      // Populate the notification for response
      const populatedNotification = await Notification.findById(notification._id)
        .populate('recipient', 'firstName lastName email avatar')
        .populate('sender', 'firstName lastName email avatar');

      // Send notifications through different channels
      await this.sendNotification(notification, template);

      return {
        success: true,
        data: populatedNotification
      };
    } catch (error) {
      console.error('Failed to create notification:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Send notification through appropriate channels
  async sendNotification(notification, template = null) {
    try {
      const recipient = await User.findById(notification.recipient);
      if (!recipient) {
        throw new Error('Recipient not found');
      }

      // Send email notification
      if (notification.channels.email) {
        await this.sendEmailNotification(notification, recipient, template);
      }

      // Send in-app notification (real-time via Socket.IO)
      if (notification.channels.inApp) {
        await this.sendInAppNotification(notification);
      }

      // Send SMS notification (if implemented)
      if (notification.channels.sms) {
        await this.sendSMSNotification(notification, recipient);
      }

      // Send push notification (if implemented)
      if (notification.channels.push) {
        await this.sendPushNotification(notification, recipient);
      }

      // Mark as sent
      notification.sentAt = new Date();
      await notification.save();

    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  // Send email notification
  async sendEmailNotification(notification, recipient, template) {
    try {
      if (!template) {
        template = await NotificationTemplate.getByType(notification.type);
      }

      if (!template || !template.channels.email.enabled) {
        console.log(`Email template not available for type: ${notification.type}`);
        return;
      }

      // Prepare variables for template
      const variables = {
        userName: `${recipient.firstName} ${recipient.lastName}`,
        ...notification.data
      };

      const result = await emailService.sendTemplateEmail(recipient, notification.type, variables);
      
      if (!result.success) {
        console.error('Failed to send email notification:', result.error);
      }
    } catch (error) {
      console.error('Error sending email notification:', error);
    }
  }

  // Send in-app notification via Socket.IO
  async sendInAppNotification(notification) {
    try {
      if (!this.socketIO) {
        console.log('Socket.IO not initialized');
        return;
      }

      // Send to specific user
      this.socketIO.to(`user_${notification.recipient}`).emit('notification', {
        id: notification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        priority: notification.priority,
        createdAt: notification.createdAt
      });

      // Send to admin users if it's a system notification
      if (notification.priority === 'high' || notification.priority === 'urgent') {
        const adminUsers = await User.find({ role: 'admin' });
        adminUsers.forEach(admin => {
          this.socketIO.to(`user_${admin._id}`).emit('admin_notification', {
            id: notification._id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            data: notification.data,
            priority: notification.priority,
            createdAt: notification.createdAt
          });
        });
      }
    } catch (error) {
      console.error('Error sending in-app notification:', error);
    }
  }

  // Send SMS notification (placeholder for future implementation)
  async sendSMSNotification(notification, recipient) {
    try {
      // TODO: Implement SMS service integration
      console.log(`SMS notification would be sent to ${recipient.phoneNumber}: ${notification.message}`);
    } catch (error) {
      console.error('Error sending SMS notification:', error);
    }
  }

  // Send push notification (placeholder for future implementation)
  async sendPushNotification(notification, recipient) {
    try {
      // TODO: Implement push notification service (Firebase, OneSignal, etc.)
      console.log(`Push notification would be sent to ${recipient._id}: ${notification.title}`);
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }

  // Get user notifications
  async getUserNotifications(userId, options = {}) {
    try {
      const notifications = await Notification.getUserNotifications(userId, options);
      const unreadCount = await Notification.getUnreadCount(userId);

      return {
        success: true,
        data: {
          notifications,
          unreadCount,
          pagination: {
            page: options.page || 1,
            limit: options.limit || 20,
            total: notifications.length
          }
        }
      };
    } catch (error) {
      console.error('Failed to get user notifications:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Mark notification as read
  async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOne({
        _id: notificationId,
        recipient: userId
      });

      if (!notification) {
        return {
          success: false,
          message: 'Notification not found'
        };
      }

      await notification.markAsRead();
      return { success: true, data: notification };
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Mark all notifications as read for a user
  async markAllAsRead(userId) {
    try {
      await Notification.updateMany(
        { recipient: userId, status: 'unread' },
        { status: 'read', readAt: new Date() }
      );

      return { success: true };
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Archive notification
  async archiveNotification(notificationId, userId) {
    try {
      const notification = await Notification.findOne({
        _id: notificationId,
        recipient: userId
      });

      if (!notification) {
        return {
          success: false,
          message: 'Notification not found'
        };
      }

      await notification.markAsArchived();
      return { success: true, data: notification };
    } catch (error) {
      console.error('Failed to archive notification:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Delete notification
  async deleteNotification(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndDelete({
        _id: notificationId,
        recipient: userId
      });

      if (!notification) {
        return {
          success: false,
          message: 'Notification not found'
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to delete notification:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Create notification for property verification
  async createPropertyVerificationNotification(property, user, isApproved, admin, notes = '') {
    const notificationData = {
      recipient: user._id,
      sender: admin._id,
      type: isApproved ? 'property_verified' : 'property_rejected',
      title: isApproved ? 'Property Approved' : 'Property Rejected',
      message: isApproved 
        ? `Your property "${property.title}" has been approved and is now live on the marketplace.`
        : `Your property "${property.title}" has been rejected. ${notes ? `Reason: ${notes}` : ''}`,
      data: {
        propertyId: property._id,
        propertyTitle: property.title,
        isApproved,
        notes,
        adminName: `${admin.firstName} ${admin.lastName}`
      },
      priority: isApproved ? 'medium' : 'high',
      channels: {
        email: true,
        inApp: true,
        sms: false,
        push: true
      }
    };

    return await this.createNotification(notificationData);
  }

  // Create notification for escrow events
  async createEscrowNotification(escrow, user, type, sender = null) {
    const notificationData = {
      recipient: user._id,
      sender: sender?._id,
      type,
      title: this.getEscrowNotificationTitle(type),
      message: this.getEscrowNotificationMessage(type, escrow),
      data: {
        escrowId: escrow._id,
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

    return await this.createNotification(notificationData);
  }

  // Helper methods for escrow notifications
  getEscrowNotificationTitle(type) {
    const titles = {
      'escrow_created': 'New Escrow Transaction',
      'escrow_payment_received': 'Payment Received',
      'escrow_disputed': 'Escrow Disputed',
      'escrow_resolved': 'Escrow Resolved',
      'escrow_completed': 'Escrow Completed',
      'escrow_timeout': 'Escrow Timeout'
    };
    return titles[type] || 'Escrow Update';
  }

  getEscrowNotificationMessage(type, escrow) {
    const messages = {
      'escrow_created': `A new escrow transaction has been created for ${escrow.amount?.toLocaleString()} NGN.`,
      'escrow_payment_received': `Payment of ${escrow.amount?.toLocaleString()} NGN has been received and is being processed.`,
      'escrow_disputed': `The escrow transaction has been disputed and requires admin review.`,
      'escrow_resolved': `The escrow dispute has been resolved by an administrator.`,
      'escrow_completed': `The escrow transaction has been completed successfully.`,
      'escrow_timeout': `The escrow transaction has timed out and requires immediate attention.`
    };
    return messages[type] || 'Escrow status update';
  }

  getEscrowNotificationPriority(type) {
    const priorities = {
      'escrow_created': 'medium',
      'escrow_payment_received': 'medium',
      'escrow_disputed': 'high',
      'escrow_resolved': 'medium',
      'escrow_completed': 'medium',
      'escrow_timeout': 'urgent'
    };
    return priorities[type] || 'medium';
  }

  // Create notification for user status changes
  async createUserStatusNotification(user, isSuspended, admin, reason = '') {
    const notificationData = {
      recipient: user._id,
      sender: admin._id,
      type: isSuspended ? 'user_suspended' : 'user_activated',
      title: isSuspended ? 'Account Suspended' : 'Account Activated',
      message: isSuspended 
        ? `Your account has been suspended. ${reason ? `Reason: ${reason}` : ''}`
        : 'Your account has been activated and you can now access all features.',
      data: {
        isSuspended,
        reason,
        adminName: `${admin.firstName} ${admin.lastName}`,
        statusDate: new Date()
      },
      priority: 'high',
      channels: {
        email: true,
        inApp: true,
        sms: isSuspended,
        push: true
      }
    };

    return await this.createNotification(notificationData);
  }
}

// Create and export singleton instance
const notificationService = new NotificationService();
module.exports = notificationService;

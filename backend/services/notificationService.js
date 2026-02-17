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
        }
      }

      // Fallback to a simple email if template is missing or disabled
      await emailService.sendEmail(
        recipient.email,
        notification.title,
        `<p>${notification.message}</p>`,
        notification.message
      );
    } catch (error) {
      console.error('Error sending email notification:', error);
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

      const db = requireDb();
      let query = db.collection(COLLECTION).where('recipient', '==', recipient);

      if (options.status) {
        query = query.where('status', '==', options.status);
      }
      if (options.type) {
        query = query.where('type', '==', options.type);
      }
      if (options.priority) {
        query = query.where('priority', '==', options.priority);
      }

      const limit = Number(options.limit) || 20;
      const page = Number(options.page) || 1;
      const skip = (page - 1) * limit;

      const snapshot = await query.orderBy('createdAt', 'desc').offset(skip).limit(limit).get();
      const notifications = snapshot.docs.map(convertNotificationDoc);

      const totalSnap = await query.count().get();
      const unreadSnap = await db.collection(COLLECTION)
        .where('recipient', '==', recipient)
        .where('status', '==', 'unread')
        .count()
        .get();

      return {
        success: true,
        data: {
          notifications,
          unreadCount: unreadSnap.data().count,
          pagination: {
            page,
            limit,
            total: totalSnap.data().count
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

  async markAsRead(notificationId, userId) {
    try {
      const db = requireDb();
      const docRef = db.collection(COLLECTION).doc(notificationId);
      const snap = await docRef.get();

      if (!snap.exists || snap.data().recipient !== normalizeId(userId)) {
        return {
          success: false,
          message: 'Notification not found'
        };
      }

      await docRef.update({
        status: 'read',
        readAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      const updated = await docRef.get();
      return { success: true, data: convertNotificationDoc(updated) };
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async markAllAsRead(userId) {
    try {
      const recipient = normalizeId(userId);
      if (!recipient) {
        throw new Error('Valid userId is required');
      }

      const db = requireDb();
      const query = await db.collection(COLLECTION)
        .where('recipient', '==', recipient)
        .where('status', '==', 'unread')
        .limit(500)
        .get();

      if (query.empty) {
        return { success: true };
      }

      const batch = db.batch();
      query.docs.forEach((doc) => {
        batch.update(doc.ref, {
          status: 'read',
          readAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      });

      await batch.commit();
      return { success: true };
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async archiveNotification(notificationId, userId) {
    try {
      const db = requireDb();
      const docRef = db.collection(COLLECTION).doc(notificationId);
      const snap = await docRef.get();

      if (!snap.exists || snap.data().recipient !== normalizeId(userId)) {
        return {
          success: false,
          message: 'Notification not found'
        };
      }

      await docRef.update({
        status: 'archived',
        archivedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      const updated = await docRef.get();
      return { success: true, data: convertNotificationDoc(updated) };
    } catch (error) {
      console.error('Failed to archive notification:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async deleteNotification(notificationId, userId) {
    try {
      const db = requireDb();
      const docRef = db.collection(COLLECTION).doc(notificationId);
      const snap = await docRef.get();

      if (!snap.exists || snap.data().recipient !== normalizeId(userId)) {
        return {
          success: false,
          message: 'Notification not found'
        };
      }

      await docRef.delete();
      return { success: true };
    } catch (error) {
      console.error('Failed to delete notification:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async createPropertyVerificationNotification(property, user, isApproved, admin, notes = '') {
    const notificationData = {
      recipient: normalizeId(user),
      sender: normalizeId(admin),
      type: isApproved ? 'property_verified' : 'property_rejected',
      title: isApproved ? 'Property Approved' : 'Property Rejected',
      message: isApproved
        ? `Your property "${property.title}" has been approved and is now live on the marketplace.`
        : `Your property "${property.title}" has been rejected. ${notes ? `Reason: ${notes}` : ''}`,
      data: {
        propertyId: property.id || property._id,
        propertyTitle: property.title,
        isApproved,
        notes,
        adminName: admin ? `${admin.firstName || ''} ${admin.lastName || ''}`.trim() : undefined
      },
      priority: isApproved ? 'medium' : 'high',
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
        inApp: true,
        sms: isSuspended,
        push: true
      }
    };

    return this.createNotification(notificationData);
  }
}

module.exports = new NotificationService();

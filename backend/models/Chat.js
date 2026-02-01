const { db, admin } = require('../config/firestore');
const { createLogger } = require('../config/logger');

const logger = createLogger('ChatModel');

class Chat {
  /**
   * Create a new chat conversation
   */
  static async createConversation(conversationData) {
    try {
      const {
        userId,
        propertyId,
        category,
        priority = 'normal',
        initialMessage,
        userType // 'buyer' or 'vendor'
      } = conversationData;

      const conversationRef = db.collection('chatConversations').doc();
      const conversationId = conversationRef.id;

      const conversation = {
        id: conversationId,
        userId,
        propertyId,
        category,
        priority,
        type: `${userType}_support`,
        status: 'active',
        unreadCount: 1,
        isStarred: false,
        isArchived: false,
        assignedTo: null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastMessage: {
          text: initialMessage,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          sender: userType,
          isRead: false,
          isAdmin: false
        }
      };

      await conversationRef.set(conversation);

      // Create initial message
      await this.addMessage(conversationId, {
        text: initialMessage,
        sender: userType,
        isAdmin: false,
        userId,
        userType
      });

      logger.info('Chat conversation created', { conversationId, userId, category });
      return { success: true, data: conversation };
    } catch (error) {
      logger.error('Error creating chat conversation', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Add a message to a conversation
   */
  static async addMessage(conversationId, messageData) {
    try {
      const {
        text,
        sender,
        isAdmin,
        userId,
        userType,
        adminName
      } = messageData;

      const messageRef = db.collection('chatConversations').doc(conversationId).collection('messages').doc();
      const messageId = messageRef.id;

      const message = {
        id: messageId,
        text,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        sender,
        isRead: isAdmin, // Admin messages are marked as read
        isAdmin: !!isAdmin,
        userId: userId || null,
        userType: userType || null,
        adminName: adminName || null
      };

      await messageRef.set(message);

      // Update conversation's last message and timestamp
      const conversationUpdate = {
        lastMessage: {
          text,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          sender,
          isRead: false,
          isAdmin: !!isAdmin
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      // If it's a user message, increment unread count
      if (!isAdmin) {
        conversationUpdate.unreadCount = admin.firestore.FieldValue.increment(1);
      } else {
        // If it's an admin message, reset unread count
        conversationUpdate.unreadCount = 0;
      }

      await db.collection('chatConversations').doc(conversationId).update(conversationUpdate);

      logger.info('Message added to conversation', { conversationId, messageId, sender });
      return { success: true, data: message };
    } catch (error) {
      logger.error('Error adding message', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all conversations for admin
   */
  static async getConversations(filters = {}) {
    try {
      let query = db.collection('chatConversations');

      // Apply filters
      if (filters.status) {
        query = query.where('status', '==', filters.status);
      }
      if (filters.priority) {
        query = query.where('priority', '==', filters.priority);
      }
      if (filters.category) {
        query = query.where('category', '==', filters.category);
      }

      // Order by last message timestamp
      query = query.orderBy('lastMessage.timestamp', 'desc');

      const snapshot = await query.get();
      const conversations = [];

      for (const doc of snapshot.docs) {
        const conversation = { id: doc.id, ...doc.data() };
        
        // Get user details
        if (conversation.userId) {
          const userDoc = await db.collection('users').doc(conversation.userId).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            conversation.contact = {
              id: conversation.userId,
              name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || userData.email || 'Unknown',
              email: userData.email || 'unknown@example.com',
              phone: userData.phone || '',
              role: userData.role || 'user',
              avatar: userData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(conversation.contact?.name || 'User')}&background=random`
            };
          }
        }

        // Get property details if applicable
        if (conversation.propertyId) {
          const propertyDoc = await db.collection('properties').doc(conversation.propertyId).get();
          if (propertyDoc.exists) {
            const propertyData = propertyDoc.data();
            conversation.property = {
              id: conversation.propertyId,
              title: propertyData.title || 'Property',
              image: propertyData.images?.[0] || propertyData.image || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=100&h=100&fit=crop'
            };
          }
        }

        conversations.push(conversation);
      }

      return { success: true, data: conversations };
    } catch (error) {
      logger.error('Error getting conversations', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get a specific conversation with messages
   */
  static async getConversation(conversationId) {
    try {
      const conversationDoc = await db.collection('chatConversations').doc(conversationId).get();
      
      if (!conversationDoc.exists) {
        return { success: false, error: 'Conversation not found' };
      }

      const conversation = { id: conversationDoc.id, ...conversationDoc.data() };

      // Get user details
      if (conversation.userId) {
        const userDoc = await db.collection('users').doc(conversation.userId).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          conversation.contact = {
            id: conversation.userId,
            name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || userData.email || 'Unknown',
            email: userData.email || 'unknown@example.com',
            phone: userData.phone || '',
            role: userData.role || 'user',
            avatar: userData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(conversation.contact?.name || 'User')}&background=random`
          };
        }
      }

      // Get property details if applicable
      if (conversation.propertyId) {
        const propertyDoc = await db.collection('properties').doc(conversation.propertyId).get();
        if (propertyDoc.exists) {
          const propertyData = propertyDoc.data();
          conversation.property = {
            id: conversation.propertyId,
            title: propertyData.title || 'Property',
            image: propertyData.images?.[0] || propertyData.image || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=100&h=100&fit=crop'
          };
        }
      }

      // Get messages
      const messagesSnapshot = await db.collection('chatConversations').doc(conversationId)
        .collection('messages')
        .orderBy('timestamp', 'asc')
        .get();

      conversation.messages = messagesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return { success: true, data: conversation };
    } catch (error) {
      logger.error('Error getting conversation', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Mark conversation as read
   */
  static async markAsRead(conversationId) {
    try {
      await db.collection('chatConversations').doc(conversationId).update({
        unreadCount: 0,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Mark all messages as read
      const messagesSnapshot = await db.collection('chatConversations').doc(conversationId)
        .collection('messages')
        .where('isRead', '==', false)
        .where('isAdmin', '==', false)
        .get();

      const batch = db.batch();
      messagesSnapshot.forEach(doc => {
        batch.update(doc.ref, { isRead: true });
      });

      await batch.commit();

      logger.info('Conversation marked as read', { conversationId });
      return { success: true };
    } catch (error) {
      logger.error('Error marking conversation as read', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Assign conversation to admin
   */
  static async assignConversation(conversationId, adminId) {
    try {
      await db.collection('chatConversations').doc(conversationId).update({
        assignedTo: adminId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      logger.info('Conversation assigned to admin', { conversationId, adminId });
      return { success: true };
    } catch (error) {
      logger.error('Error assigning conversation', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update conversation priority
   */
  static async updatePriority(conversationId, priority) {
    try {
      await db.collection('chatConversations').doc(conversationId).update({
        priority,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      logger.info('Conversation priority updated', { conversationId, priority });
      return { success: true };
    } catch (error) {
      logger.error('Error updating priority', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Archive conversation
   */
  static async archiveConversation(conversationId) {
    try {
      await db.collection('chatConversations').doc(conversationId).update({
        status: 'archived',
        isArchived: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      logger.info('Conversation archived', { conversationId });
      return { success: true };
    } catch (error) {
      logger.error('Error archiving conversation', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get chat statistics
   */
  static async getChatStats() {
    try {
      const conversationsSnapshot = await db.collection('chatConversations').get();
      const conversations = conversationsSnapshot.docs.map(doc => doc.data());

      const stats = {
        total: conversations.length,
        active: conversations.filter(c => c.status === 'active').length,
        archived: conversations.filter(c => c.status === 'archived').length,
        unread: conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0),
        urgent: conversations.filter(c => c.priority === 'urgent').length,
        byCategory: {},
        byPriority: {
          urgent: conversations.filter(c => c.priority === 'urgent').length,
          high: conversations.filter(c => c.priority === 'high').length,
          normal: conversations.filter(c => c.priority === 'normal').length
        }
      };

      // Count by category
      conversations.forEach(c => {
        stats.byCategory[c.category] = (stats.byCategory[c.category] || 0) + 1;
      });

      return { success: true, data: stats };
    } catch (error) {
      logger.error('Error getting chat stats', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user's conversations
   */
  static async getUserConversations(userId) {
    try {
      const snapshot = await db.collection('chatConversations')
        .where('userId', '==', userId)
        .where('status', '==', 'active')
        .orderBy('lastMessage.timestamp', 'desc')
        .get();

      const conversations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return { success: true, data: conversations };
    } catch (error) {
      logger.error('Error getting user conversations', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all canned responses
   */
  static async getCannedResponses() {
    try {
      const snapshot = await db.collection('cannedResponses').orderBy('createdAt', 'desc').get();
      const responses = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return { success: true, data: responses };
    } catch (error) {
      logger.error('Error getting canned responses', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Add a new canned response
   */
  static async addCannedResponse(title, message, category) {
    try {
      const responseRef = db.collection('cannedResponses').doc();
      const cannedResponse = {
        id: responseRef.id,
        title,
        message,
        category,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      await responseRef.set(cannedResponse);
      logger.info('Canned response created', { id: responseRef.id, category });
      return { success: true, data: cannedResponse };
    } catch (error) {
      logger.error('Error adding canned response', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete a canned response
   */
  static async deleteCannedResponse(id) {
    try {
      await db.collection('cannedResponses').doc(id).delete();
      logger.info('Canned response deleted', { id });
      return { success: true };
    } catch (error) {
      logger.error('Error deleting canned response', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Auto-archive inactive conversations (30 days)
   */
  static async autoArchiveInactiveConversations(daysInactive = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysInactive);
      const cutoffTimestamp = admin.firestore.Timestamp.fromDate(cutoffDate);

      const snapshot = await db.collection('chatConversations')
        .where('status', '==', 'active')
        .where('updatedAt', '<', cutoffTimestamp)
        .get();

      const batch = db.batch();
      let archivedCount = 0;

      snapshot.forEach(doc => {
        batch.update(doc.ref, {
          status: 'archived',
          isArchived: true,
          autoArchived: true,
          autoArchivedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        archivedCount++;
      });

      await batch.commit();
      logger.info('Auto-archived conversations', { count: archivedCount, daysInactive });
      return { success: true, data: { archivedCount } };
    } catch (error) {
      logger.error('Error auto-archiving conversations', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get conversations pending auto-archive (approaching 30 days)
   */
  static async getPendingAutoArchive(daysWarning = 28) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysWarning);
      const cutoffTimestamp = admin.firestore.Timestamp.fromDate(cutoffDate);

      const snapshot = await db.collection('chatConversations')
        .where('status', '==', 'active')
        .where('updatedAt', '<', cutoffTimestamp)
        .orderBy('updatedAt', 'desc')
        .get();

      const conversations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return { success: true, data: conversations };
    } catch (error) {
      logger.error('Error getting pending auto-archive conversations', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = Chat;

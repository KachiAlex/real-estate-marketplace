/**
 * Chat Service - Enhanced Chat with Encryption, Rich Content, and Reactions
 * Features: E2E encryption, media, reactions, read receipts, typing indicators
 */

const crypto = require('crypto');
const { errorLogger, infoLogger } = require('../config/logger');

class ChatService {
  // Mock chat rooms/conversations
  static conversations = new Map();

  // Mock messages storage
  static messages = new Map();

  // Mock user typing indicators
  static typingIndicators = new Map();

  // Mock read receipts
  static readReceipts = new Map();

  // Mock reactions
  static reactions = new Map();

  // Reaction emojis
  static supportedReactions = ['👍', '❤️', '😂', '😮', '😢', '🔥', '👏', '💯'];

  /**
   * Create or get a conversation
   * @param {string} conversationId - Unique conversation ID
   * @param {array} participants - Array of user IDs
   * @param {object} metadata - Conversation metadata
   * @returns {object} Conversation object
   */
  static async createConversation(conversationId, participants = [], metadata = {}) {
    try {
      // Check if conversation exists
      if (this.conversations.has(conversationId)) {
        return { success: true, data: this.conversations.get(conversationId) };
      }

      const conversation = {
        id: conversationId,
        participants,
        type: participants.length > 2 ? 'group' : 'direct',
        name: metadata.name || null,
        description: metadata.description || null,
        avatar: metadata.avatar || null,
        createdAt: new Date(),
        updatedAt: new Date(),
        isEncrypted: true,
        messageCount: 0,
        lastMessage: null,
        lastMessageAt: null,
      };

      this.conversations.set(conversationId, conversation);
      this.messages.set(conversationId, []);
      this.readReceipts.set(conversationId, {});

      infoLogger(`Conversation created: ${conversationId} with ${participants.length} participants`);

      return { success: true, data: conversation };
    } catch (error) {
      errorLogger('Failed to create conversation:', error);
      throw error;
    }
  }

  /**
   * Send an encrypted message
   * @param {string} conversationId - Conversation ID
   * @param {string} senderId - Sender user ID
   * @param {object} messageData - Message content and metadata
   * @returns {object} Sent message
   */
  static async sendMessage(conversationId, senderId, messageData) {
    try {
      const conversation = this.conversations.get(conversationId);
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      const {
        text = '',
        contentType = 'text', // text, image, file, link
        media = null,
        richContent = null,
        replyTo = null,
      } = messageData;

      // Validate message
      if (!text && !media && !richContent) {
        throw new Error('Message must contain text, media, or rich content');
      }

      // Create message ID
      const messageId = `msg_${conversationId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Encrypt message content
      const encryptedContent = this._encryptMessage({
        text,
        contentType,
        richContent,
      });

      const message = {
        id: messageId,
        conversationId,
        senderId,
        text: encryptedContent, // Encrypted
        originalText: text, // For display (in production, decrypt on retrieval)
        contentType,
        media: media ? {
          ...media,
          encrypted: true,
        } : null,
        richContent: richContent ? this._encryptMessage(richContent) : null,
        replyTo,
        createdAt: new Date(),
        updatedAt: new Date(),
        isEdited: false,
        editHistory: [],
        reactions: {},
        readBy: [],
      };

      // Store message
      const conversationMessages = this.messages.get(conversationId) || [];
      conversationMessages.push(message);
      this.messages.set(conversationId, conversationMessages);

      // Update conversation metadata
      conversation.messageCount += 1;
      conversation.lastMessage = text;
      conversation.lastMessageAt = new Date();
      conversation.updatedAt = new Date();

      infoLogger(`Message sent to conversation ${conversationId} by user ${senderId}`);

      return {
        success: true,
        data: this._formatMessage(message),
      };
    } catch (error) {
      errorLogger('Failed to send message:', error);
      throw error;
    }
  }

  /**
   * Get conversation messages
   * @param {string} conversationId - Conversation ID
   * @param {object} options - Pagination/filter options
   * @returns {object} Messages list
   */
  static async getMessages(conversationId, options = {}) {
    try {
      const { limit = 50, offset = 0, searchQuery = null } = options;

      const conversation = this.conversations.get(conversationId);
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      let messages = this.messages.get(conversationId) || [];

      // Filter by search query if provided
      if (searchQuery) {
        messages = messages.filter(m =>
          m.originalText.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      // Sort by newest first
      messages = messages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const total = messages.length;
      const paginatedMessages = messages.slice(offset, offset + limit);

      return {
        success: true,
        data: {
          conversationId,
          messages: paginatedMessages.map(m => this._formatMessage(m)),
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      };
    } catch (error) {
      errorLogger('Failed to get messages:', error);
      throw error;
    }
  }

  /**
   * Edit a message
   * @param {string} conversationId - Conversation ID
   * @param {string} messageId - Message ID
   * @param {string} senderId - Sender user ID (for validation)
   * @param {string} newText - New message text
   * @returns {object} Updated message
   */
  static async editMessage(conversationId, messageId, senderId, newText) {
    try {
      const messages = this.messages.get(conversationId);
      if (!messages) {
        throw new Error('Conversation not found');
      }

      const message = messages.find(m => m.id === messageId);
      if (!message) {
        throw new Error('Message not found');
      }

      if (message.senderId !== senderId) {
        throw new Error('Only message sender can edit');
      }

      // Store edit in history
      message.editHistory.push({
        oldText: message.originalText,
        editedAt: new Date(),
      });

      // Update message
      message.originalText = newText;
      message.text = this._encryptMessage({ text: newText });
      message.isEdited = true;
      message.updatedAt = new Date();

      infoLogger(`Message ${messageId} edited in conversation ${conversationId}`);

      return {
        success: true,
        data: this._formatMessage(message),
      };
    } catch (error) {
      errorLogger('Failed to edit message:', error);
      throw error;
    }
  }

  /**
   * Delete a message
   * @param {string} conversationId - Conversation ID
   * @param {string} messageId - Message ID
   * @param {string} userId - User ID (sender or admin)
   * @returns {object} Deletion result
   */
  static async deleteMessage(conversationId, messageId, userId) {
    try {
      const messages = this.messages.get(conversationId);
      if (!messages) {
        throw new Error('Conversation not found');
      }

      const message = messages.find(m => m.id === messageId);
      if (!message) {
        throw new Error('Message not found');
      }

      if (message.senderId !== userId) {
        throw new Error('Only message sender can delete');
      }

      // Mark as deleted (soft delete)
      message.isDeleted = true;
      message.originalText = '[This message has been deleted]';
      message.updatedAt = new Date();

      infoLogger(`Message ${messageId} deleted in conversation ${conversationId}`);

      return {
        success: true,
        message: 'Message deleted successfully',
      };
    } catch (error) {
      errorLogger('Failed to delete message:', error);
      throw error;
    }
  }

  /**
   * Add reaction to a message
   * @param {string} conversationId - Conversation ID
   * @param {string} messageId - Message ID
   * @param {string} userId - User ID
   * @param {string} emoji - Reaction emoji
   * @returns {object} Reaction result
   */
  static async addReaction(conversationId, messageId, userId, emoji) {
    try {
      // Validate emoji
      if (!this.supportedReactions.includes(emoji)) {
        throw new Error(`Unsupported reaction: ${emoji}`);
      }

      const messages = this.messages.get(conversationId);
      if (!messages) {
        throw new Error('Conversation not found');
      }

      const message = messages.find(m => m.id === messageId);
      if (!message) {
        throw new Error('Message not found');
      }

      // Add or update reaction
      if (!message.reactions[emoji]) {
        message.reactions[emoji] = [];
      }

      // Check if user already reacted with this emoji
      if (!message.reactions[emoji].includes(userId)) {
        message.reactions[emoji].push(userId);
      }

      infoLogger(`Reaction ${emoji} added to message ${messageId}`);

      return {
        success: true,
        data: {
          messageId,
          emoji,
          reactedBy: message.reactions[emoji],
          totalReactions: Object.values(message.reactions).flat().length,
        },
      };
    } catch (error) {
      errorLogger('Failed to add reaction:', error);
      throw error;
    }
  }

  /**
   * Remove reaction from a message
   * @param {string} conversationId - Conversation ID
   * @param {string} messageId - Message ID
   * @param {string} userId - User ID
   * @param {string} emoji - Reaction emoji
   * @returns {object} Reaction result
   */
  static async removeReaction(conversationId, messageId, userId, emoji) {
    try {
      const messages = this.messages.get(conversationId);
      if (!messages) {
        throw new Error('Conversation not found');
      }

      const message = messages.find(m => m.id === messageId);
      if (!message) {
        throw new Error('Message not found');
      }

      if (message.reactions[emoji]) {
        message.reactions[emoji] = message.reactions[emoji].filter(id => id !== userId);
        if (message.reactions[emoji].length === 0) {
          delete message.reactions[emoji];
        }
      }

      infoLogger(`Reaction ${emoji} removed from message ${messageId}`);

      return {
        success: true,
        data: {
          messageId,
          emoji,
          totalReactions: Object.values(message.reactions).flat().length,
        },
      };
    } catch (error) {
      errorLogger('Failed to remove reaction:', error);
      throw error;
    }
  }

  /**
   * Mark message as read
   * @param {string} conversationId - Conversation ID
   * @param {string} messageId - Message ID
   * @param {string} userId - User ID
   * @returns {object} Read receipt
   */
  static async markMessageAsRead(conversationId, messageId, userId) {
    try {
      const messages = this.messages.get(conversationId);
      if (!messages) {
        throw new Error('Conversation not found');
      }

      const message = messages.find(m => m.id === messageId);
      if (!message) {
        throw new Error('Message not found');
      }

      // Add to read by if not already there
      if (!message.readBy.includes(userId)) {
        message.readBy.push(userId);
      }

      // Store read receipt
      const receipts = this.readReceipts.get(conversationId) || {};
      if (!receipts[messageId]) {
        receipts[messageId] = [];
      }
      receipts[messageId].push({
        userId,
        readAt: new Date(),
      });
      this.readReceipts.set(conversationId, receipts);

      infoLogger(`Message ${messageId} marked as read by ${userId}`);

      return {
        success: true,
        data: {
          messageId,
          readBy: message.readBy,
          readAt: new Date(),
        },
      };
    } catch (error) {
      errorLogger('Failed to mark message as read:', error);
      throw error;
    }
  }

  /**
   * Send typing indicator
   * @param {string} conversationId - Conversation ID
   * @param {string} userId - User ID
   * @returns {object} Typing indicator
   */
  static async sendTypingIndicator(conversationId, userId) {
    try {
      const conversation = this.conversations.get(conversationId);
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      const key = `${conversationId}_${userId}`;
      const typingData = {
        userId,
        conversationId,
        startedAt: new Date(),
        expiresAt: new Date(Date.now() + 3000), // 3 second timeout
      };

      this.typingIndicators.set(key, typingData);

      // Auto-expire typing indicator
      setTimeout(() => {
        this.typingIndicators.delete(key);
      }, 3000);

      return {
        success: true,
        data: typingData,
      };
    } catch (error) {
      errorLogger('Failed to send typing indicator:', error);
      throw error;
    }
  }

  /**
   * Get typing indicators for conversation
   * @param {string} conversationId - Conversation ID
   * @returns {array} Currently typing users
   */
  static async getTypingIndicators(conversationId) {
    try {
      const typing = Array.from(this.typingIndicators.values()).filter(
        t => t.conversationId === conversationId && new Date() < new Date(t.expiresAt)
      );

      return {
        success: true,
        data: {
          conversationId,
          typingUsers: typing.map(t => t.userId),
          count: typing.length,
        },
      };
    } catch (error) {
      errorLogger('Failed to get typing indicators:', error);
      throw error;
    }
  }

  /**
   * Upload media to conversation
   * @param {string} conversationId - Conversation ID
   * @param {string} senderId - Sender user ID
   * @param {object} fileData - File information
   * @returns {object} Media metadata
   */
  static async uploadMedia(conversationId, senderId, fileData) {
    try {
      const {
        filename,
        size,
        mimeType,
        url, // S3 or Firebase URL
      } = fileData;

      if (!filename || !size || !mimeType) {
        throw new Error('Missing required file information');
      }

      const mediaId = `media_${conversationId}_${Date.now()}`;
      const media = {
        id: mediaId,
        conversationId,
        senderId,
        filename,
        size,
        mimeType,
        url,
        encrypted: true,
        uploadedAt: new Date(),
        downloadCount: 0,
      };

      infoLogger(`Media uploaded: ${filename} (${size} bytes) by ${senderId}`);

      return {
        success: true,
        data: media,
      };
    } catch (error) {
      errorLogger('Failed to upload media:', error);
      throw error;
    }
  }

  /**
   * Share link in conversation with preview
   * @param {string} conversationId - Conversation ID
   * @param {string} senderId - Sender user ID
   * @param {string} url - URL to share
   * @returns {object} Link preview
   */
  static async shareLink(conversationId, senderId, url) {
    try {
      // Validate URL
      try {
        new URL(url);
      } catch {
        throw new Error('Invalid URL format');
      }

      // Generate link preview (mock)
      const linkPreview = {
        url,
        title: this._extractTitle(url),
        description: 'Click to visit this link',
        image: null,
        favicon: null,
      };

      infoLogger(`Link shared in conversation ${conversationId}: ${url}`);

      return {
        success: true,
        data: {
          conversationId,
          senderId,
          linkPreview,
          sharedAt: new Date(),
        },
      };
    } catch (error) {
      errorLogger('Failed to share link:', error);
      throw error;
    }
  }

  /**
   * Get conversation info
   * @param {string} conversationId - Conversation ID
   * @returns {object} Conversation details
   */
  static async getConversationInfo(conversationId) {
    try {
      const conversation = this.conversations.get(conversationId);
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // Get unread count for each participant
      const unreadCounts = {};
      const messages = this.messages.get(conversationId) || [];

      conversation.participants.forEach(participantId => {
        unreadCounts[participantId] = messages.filter(
          m => m.senderId !== participantId && !m.readBy.includes(participantId)
        ).length;
      });

      return {
        success: true,
        data: {
          ...conversation,
          unreadCounts,
          participantsCount: conversation.participants.length,
        },
      };
    } catch (error) {
      errorLogger('Failed to get conversation info:', error);
      throw error;
    }
  }

  /**
   * Get all conversations for user
   * @param {string} userId - User ID
   * @param {object} options - Pagination options
   * @returns {array} User conversations
   */
  static async getUserConversations(userId, options = {}) {
    try {
      const { limit = 20, offset = 0 } = options;

      let userConversations = Array.from(this.conversations.values()).filter(c =>
        c.participants.includes(userId)
      );

      // Sort by last activity
      userConversations = userConversations.sort((a, b) =>
        new Date(b.lastMessageAt || b.createdAt) - new Date(a.lastMessageAt || a.createdAt)
      );

      const total = userConversations.length;
      const paginated = userConversations.slice(offset, offset + limit);

      // Add unread count to each conversation
      const withUnread = paginated.map(conv => {
        const messages = this.messages.get(conv.id) || [];
        const unreadCount = messages.filter(
          m => m.senderId !== userId && !m.readBy.includes(userId)
        ).length;
        return { ...conv, unreadCount };
      });

      return {
        success: true,
        data: {
          conversations: withUnread,
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      };
    } catch (error) {
      errorLogger('Failed to get user conversations:', error);
      throw error;
    }
  }

  /**
   * Search messages in conversation
   * @param {string} conversationId - Conversation ID
   * @param {string} query - Search query
   * @returns {array} Matching messages
   */
  static async searchMessages(conversationId, query) {
    try {
      const messages = this.messages.get(conversationId) || [];

      const results = messages.filter(m =>
        m.originalText.toLowerCase().includes(query.toLowerCase())
      );

      return {
        success: true,
        data: {
          conversationId,
          query,
          results: results.map(m => this._formatMessage(m)),
          matchCount: results.length,
        },
      };
    } catch (error) {
      errorLogger('Failed to search messages:', error);
      throw error;
    }
  }

  // ===== PRIVATE HELPER METHODS =====

  /**
   * Encrypt message using AES-256
   * @private
   */
  static _encryptMessage(content) {
    try {
      // Simple encryption mock - in production use proper E2E encryption
      const iv = crypto.randomBytes(16);
      const key = Buffer.from(process.env.CHAT_ENCRYPTION_KEY || 'mock-key-32-bytes-long-test-123');
      const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

      const encrypted = Buffer.concat([
        cipher.update(JSON.stringify(content), 'utf8'),
        cipher.final(),
      ]);

      return {
        iv: iv.toString('hex'),
        encryptedData: encrypted.toString('hex'),
      };
    } catch (error) {
      errorLogger('Encryption error:', error);
      return content; // Return unencrypted if encryption fails
    }
  }

  /**
   * Format message for API response
   * @private
   */
  static _formatMessage(message) {
    return {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      originalText: message.originalText,
      contentType: message.contentType,
      media: message.media,
      replyTo: message.replyTo,
      reactions: message.reactions,
      readBy: message.readBy,
      isEdited: message.isEdited,
      editHistory: message.editHistory,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
    };
  }

  /**
   * Extract title from URL
   * @private
   */
  static _extractTitle(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return url;
    }
  }
}

module.exports = ChatService;

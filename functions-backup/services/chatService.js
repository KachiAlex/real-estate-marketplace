const Chat = require('../models/Chat');
const { createLogger } = require('../config/logger');

const logger = createLogger('ChatService');

class ChatService {
  constructor() {
    this.io = null;
  }

  /**
   * Initialize Socket.IO for real-time chat
   */
  initializeSocketIO(io) {
    this.io = io;

    // Handle socket connections
    io.on('connection', (socket) => {
      logger.info('Socket connected', { socketId: socket.id });

      // Join admin room for support agents
      socket.on('join-admin-room', (data) => {
        socket.join('admin-support');
        logger.info('Admin joined support room', { socketId: socket.id, adminId: data.adminId });
      });

      // Join user room for specific user
      socket.on('join-user-room', (data) => {
        const userRoom = `user-${data.userId}`;
        socket.join(userRoom);
        logger.info('User joined room', { socketId: socket.id, userId: data.userId, room: userRoom });
      });

      // Handle new conversation creation
      socket.on('create-conversation', async (data) => {
        try {
          const result = await Chat.createConversation(data);
          
          if (result.success) {
            // Notify admin room
            io.to('admin-support').emit('new-conversation', {
              conversation: result.data,
              notification: {
                type: 'new_chat',
                message: `New ${data.category} from ${data.userType}`,
                priority: data.priority,
                conversationId: result.data.id
              }
            });

            // Notify user
            const userRoom = `user-${data.userId}`;
            io.to(userRoom).emit('conversation-created', result.data);
          }

          socket.emit('conversation-created-response', result);
        } catch (error) {
          logger.error('Error creating conversation via socket', error);
          socket.emit('conversation-created-response', { success: false, error: error.message });
        }
      });

      // Handle new messages
      socket.on('send-message', async (data) => {
        try {
          const result = await Chat.addMessage(data.conversationId, {
            text: data.message,
            sender: data.sender,
            isAdmin: data.isAdmin,
            userId: data.userId,
            userType: data.userType,
            adminName: data.adminName
          });

          if (result.success) {
            const messageData = {
              conversationId: data.conversationId,
              message: result.data,
              sender: data.sender,
              isAdmin: data.isAdmin
            };

            // Notify admin room if it's a user message
            if (!data.isAdmin) {
              io.to('admin-support').emit('new-message', messageData);
            }

            // Notify user room if it's an admin message
            if (data.isAdmin && data.userId) {
              const userRoom = `user-${data.userId}`;
              io.to(userRoom).emit('new-message', messageData);
            }

            // Also notify the specific conversation participants
            socket.broadcast.emit('message-updated', messageData);
          }

          socket.emit('message-sent-response', result);
        } catch (error) {
          logger.error('Error sending message via socket', error);
          socket.emit('message-sent-response', { success: false, error: error.message });
        }
      });

      // Handle typing indicators
      socket.on('typing', (data) => {
        socket.broadcast.emit('user-typing', {
          conversationId: data.conversationId,
          user: data.user,
          isTyping: data.isTyping
        });
      });

      // Handle conversation status updates
      socket.on('update-conversation-status', async (data) => {
        try {
          let result;
          
          switch (data.action) {
            case 'mark-read':
              result = await Chat.markAsRead(data.conversationId);
              break;
            case 'assign':
              result = await Chat.assignConversation(data.conversationId, data.adminId);
              break;
            case 'update-priority':
              result = await Chat.updatePriority(data.conversationId, data.priority);
              break;
            case 'archive':
              result = await Chat.archiveConversation(data.conversationId);
              break;
            default:
              result = { success: false, error: 'Invalid action' };
          }

          if (result.success) {
            io.to('admin-support').emit('conversation-updated', {
              conversationId: data.conversationId,
              action: data.action,
              data: data
            });
          }

          socket.emit('status-update-response', result);
        } catch (error) {
          logger.error('Error updating conversation status', error);
          socket.emit('status-update-response', { success: false, error: error.message });
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        logger.info('Socket disconnected', { socketId: socket.id });
      });
    });

    logger.info('Chat service initialized with Socket.IO');
  }

  /**
   * Get all conversations for admin
   */
  async getConversations(filters = {}) {
    return await Chat.getConversations(filters);
  }

  /**
   * Get a specific conversation
   */
  async getConversation(conversationId) {
    return await Chat.getConversation(conversationId);
  }

  /**
   * Send a message
   */
  async sendMessage(conversationId, message, isAdmin = false, userId = null, userType = null, adminName = null) {
    const result = await Chat.addMessage(conversationId, {
      text: message,
      sender: isAdmin ? 'admin' : (userType || 'user'),
      isAdmin,
      userId,
      userType,
      adminName
    });

    // Emit real-time update if Socket.IO is available
    if (this.io && result.success) {
      const messageData = {
        conversationId,
        message: result.data,
        sender: isAdmin ? 'admin' : (userType || 'user'),
        isAdmin
      };

      // Notify admin room if it's a user message
      if (!isAdmin) {
        this.io.to('admin-support').emit('new-message', messageData);
      }

      // Notify user room if it's an admin message
      if (isAdmin && userId) {
        const userRoom = `user-${userId}`;
        this.io.to(userRoom).emit('new-message', messageData);
      }
    }

    return result;
  }

  /**
   * Create new conversation
   */
  async createConversation(userId, message, category, propertyId = null, userType = 'buyer') {
    const result = await Chat.createConversation({
      userId,
      propertyId,
      category,
      initialMessage: message,
      userType
    });

    // Emit real-time update if Socket.IO is available
    if (this.io && result.success) {
      // Notify admin room
      this.io.to('admin-support').emit('new-conversation', {
        conversation: result.data,
        notification: {
          type: 'new_chat',
          message: `New ${category} from ${userType}`,
          priority: result.data.priority,
          conversationId: result.data.id
        }
      });

      // Notify user
      const userRoom = `user-${userId}`;
      this.io.to(userRoom).emit('conversation-created', result.data);
    }

    return result;
  }

  /**
   * Mark conversation as read
   */
  async markAsRead(conversationId) {
    return await Chat.markAsRead(conversationId);
  }

  /**
   * Assign conversation to admin
   */
  async assignConversation(conversationId, adminId) {
    return await Chat.assignConversation(conversationId, adminId);
  }

  /**
   * Update conversation priority
   */
  async updatePriority(conversationId, priority) {
    return await Chat.updatePriority(conversationId, priority);
  }

  /**
   * Archive conversation
   */
  async archiveConversation(conversationId) {
    return await Chat.archiveConversation(conversationId);
  }

  /**
   * Get chat statistics
   */
  async getChatStats() {
    return await Chat.getChatStats();
  }

  /**
   * Get user's conversations
   */
  async getUserConversations(userId) {
    return await Chat.getUserConversations(userId);
  }
}

// Create singleton instance
const chatService = new ChatService();

module.exports = chatService;

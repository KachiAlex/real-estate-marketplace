const { createLogger } = require('../config/logger');
const db = require('../config/sequelizeDb');

const logger = createLogger('SocketMessagingService');

class SocketMessagingService {
  constructor(io) {
    this.io = io;
    this.userSockets = new Map(); // userId -> Set of socket IDs
    this.conversationRooms = new Map(); // chatId -> Set of socket IDs
  }

  /**
   * Initialize Socket.IO connection handlers
   */
  initializeHandlers() {
    this.io.on('connection', (socket) => {
      logger.info('Socket connected', { socketId: socket.id });

      // User joins their personal room for notifications
      socket.on('user:join', (userId) => {
        socket.join(`user:${userId}`);
        if (!this.userSockets.has(userId)) {
          this.userSockets.set(userId, new Set());
        }
        this.userSockets.get(userId).add(socket.id);
        logger.info('User joined personal room', { userId, socketId: socket.id });
      });

      // User joins a conversation room
      socket.on('chat:join', (chatId) => {
        socket.join(`chat:${chatId}`);
        if (!this.conversationRooms.has(chatId)) {
          this.conversationRooms.set(chatId, new Set());
        }
        this.conversationRooms.get(chatId).add(socket.id);
        logger.info('User joined chat room', { chatId, socketId: socket.id });

        // Notify other participants
        socket.to(`chat:${chatId}`).emit('chat:user-joined', { chatId });
      });

      // User leaves a conversation room
      socket.on('chat:leave', (chatId) => {
        socket.leave(`chat:${chatId}`);
        const room = this.conversationRooms.get(chatId);
        if (room) {
          room.delete(socket.id);
          if (room.size === 0) {
            this.conversationRooms.delete(chatId);
          }
        }
        logger.info('User left chat room', { chatId, socketId: socket.id });

        // Notify other participants
        socket.to(`chat:${chatId}`).emit('chat:user-left', { chatId });
      });

      // Receive real-time message
      socket.on('chat:message', async (data) => {
        try {
          const { chatId, senderId, recipientId, propertyId, content } = data;

          logger.info('Receiving real-time message', {
            chatId,
            senderId,
            socketId: socket.id
          });

          // Create message in database
          const message = await db.Message.create({
            senderId: senderId,
            recipientId: recipientId,
            propertyId: propertyId,
            subject: 'Inquiry',
            content: content.trim(),
            isRead: false
          });

          if (!message) {
            socket.emit('chat:error', {
              error: 'Failed to save message'
            });
            return;
          }

          // Update conversation lastMessage
          const [participant1, participant2] = [senderId, recipientId].sort();
          await db.Conversation.findOrCreate({
            where: {
              propertyId: propertyId,
              participant1Id: participant1,
              participant2Id: participant2
            },
            defaults: {
              lastMessageId: message.id,
              lastMessageAt: new Date()
            }
          }).then(([conv]) => {
            conv.update({
              lastMessageId: message.id,
              lastMessageAt: new Date()
            });
          });

          // Broadcast message to all users in the conversation
          this.io.to(`chat:${chatId}`).emit('chat:message-received', {
            id: message.id,
            chatId: chatId,
            senderId: senderId,
            content: message.content,
            timestamp: message.createdAt
          });

          // Send notification to recipient's personal room
          this.io.to(`user:${recipientId}`).emit('chat:notification', {
            type: 'new_message',
            chatId: chatId,
            from: senderId,
            preview: content.substring(0, 50)
          });

          logger.info('Message broadcasted', { messageId: message.id, chatId });
        } catch (error) {
          logger.error('Error handling real-time message', {
            error: error.message,
            data
          });
          socket.emit('chat:error', {
            error: error.message || 'Failed to send message'
          });
        }
      });

      // Typing indicator
      socket.on('chat:typing', (data) => {
        const { chatId, userId, isTyping } = data;
        logger.info('Typing indicator', { chatId, userId, isTyping });

        // Broadcast to other users in conversation (excluding sender)
        socket.to(`chat:${chatId}`).emit('chat:user-typing', {
          chatId: chatId,
          userId: userId,
          isTyping: isTyping
        });
      });

      // Read receipt
      socket.on('chat:mark-read', async (data) => {
        try {
          const { chatId, userId, messageIds } = data;

          logger.info('Marking messages as read', {
            chatId,
            userId,
            count: messageIds?.length || 0
          });

          // Mark messages as read in database
          if (messageIds && Array.isArray(messageIds)) {
            await db.Message.update(
              { isRead: true, readAt: new Date() },
              {
                where: {
                  id: messageIds,
                  recipientId: userId
                }
              }
            );
          }

          // Notify sender that messages are read
          this.io.to(`chat:${chatId}`).emit('chat:messages-read', {
            chatId: chatId,
            userId: userId,
            messageIds: messageIds
          });

          logger.info('Messages marked as read', { chatId, userId });
        } catch (error) {
          logger.error('Error marking messages as read', {
            error: error.message,
            data
          });
        }
      });

      // Disconnect
      socket.on('disconnect', () => {
        logger.info('Socket disconnected', { socketId: socket.id });

        // Clean up user socket tracking
        for (const [userId, sockets] of this.userSockets.entries()) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            this.userSockets.delete(userId);
          }
        }

        // Clean up conversation room tracking
        for (const [chatId, sockets] of this.conversationRooms.entries()) {
          if (sockets.has(socket.id)) {
            sockets.delete(socket.id);
            if (sockets.size === 0) {
              this.conversationRooms.delete(chatId);
            }
          }
        }
      });

      // Error handling
      socket.on('error', (error) => {
        logger.error('Socket error', { socketId: socket.id, error: error.message });
      });
    });
  }

  /**
   * Send a notification to a specific user
   */
  notifyUser(userId, type, data) {
    this.io.to(`user:${userId}`).emit(`notification:${type}`, data);
  }

  /**
   * Broadcast to a conversation
   */
  broadcastToConversation(chatId, event, data) {
    this.io.to(`chat:${chatId}`).emit(event, data);
  }
}

module.exports = SocketMessagingService;

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { createLogger } = require('../config/logger');
const db = require('../config/sequelizeDb');

const logger = createLogger('ChatsRoutes');

/**
 * @route   POST /api/chats/start
 * @desc    Start a new chat between buyer and vendor for a property
 * @access  Private
 * @body    { buyerId, vendorId, propertyId, starterId, initialMessage }
 * @returns { success: bool, chatId: string, message?: string }
 */
router.post('/start', authenticateToken, async (req, res) => {
  try {
    const { buyerId, vendorId, propertyId, starterId, initialMessage } = req.body;

    // Validate required fields
    if (!buyerId || !vendorId || !propertyId || !starterId || !initialMessage) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: buyerId, vendorId, propertyId, starterId, initialMessage'
      });
    }

    // Verify that the requester is the starterId
    if (req.user.id !== starterId) {
      return res.status(403).json({
        success: false,
        error: 'You can only start chats as yourself'
      });
    }

    logger.info('Starting chat', { buyerId, vendorId, propertyId, starterId });

    // Create a message record to start the conversation
    const message = await db.Message.create({
      senderId: starterId,
      recipientId: vendorId === starterId ? buyerId : vendorId,
      propertyId: propertyId,
      subject: 'Property Inquiry',
      content: initialMessage,
      isRead: false
    });

    if (!message) {
      return res.status(500).json({
        success: false,
        error: 'Failed to create message'
      });
    }

    // Return a chatId that can be used to identify this conversation
    // For now, we'll use a combination of propertyId and the lesser of the two userIds to form a stable chat ID
    const sortedIds = [buyerId, vendorId].sort();
    const chatId = `${propertyId}-${sortedIds[0]}-${sortedIds[1]}`;

    logger.info('Chat started successfully', { chatId, messageId: message.id });

    return res.json({
      success: true,
      chatId: chatId,
      messageId: message.id,
      message: 'Chat initialized successfully'
    });
  } catch (error) {
    logger.error('Error starting chat', { error: error.message, stack: error.stack });
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to start chat'
    });
  }
});

/**
 * @route   GET /api/chats/conversations
 * @desc    Fetch all conversations for authenticated user
 * @access  Private
 * @returns { success: bool, data: conversations[] }
 */
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    logger.info('Fetching conversations for user', { userId });

    // Get all messages where user is sender or recipient
    const messages = await db.Message.findAll({
      where: {
        [db.Sequelize.Op.or]: [
          { senderId: userId },
          { recipientId: userId }
        ]
      },
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: db.User,
          as: 'sender',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone']
        },
        {
          model: db.User,
          as: 'recipient',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone']
        }
      ]
    });

    if (!messages || messages.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    // Group messages by conversation (propertyId + participant pair)
    const conversationsMap = {};
    messages.forEach((msg) => {
      const otherUserId = msg.senderId === userId ? msg.recipientId : msg.senderId;
      const conversationKey = `${msg.propertyId}-${userId}-${otherUserId}`;

      if (!conversationsMap[conversationKey]) {
        const otherUser = msg.senderId === userId ? msg.recipient : msg.sender;
        conversationsMap[conversationKey] = {
          id: conversationKey,
          propertyId: msg.propertyId,
          contact: {
            id: otherUserId,
            name: otherUser ? `${otherUser.firstName} ${otherUser.lastName}` : 'Unknown',
            role: 'vendor',
            email: otherUser?.email,
            phone: otherUser?.phone
          },
          lastMessage: {
            text: msg.content,
            timestamp: msg.createdAt
          },
          unreadCount: 0
        };
      }

      // Count unread messages
      if (!msg.isRead && msg.recipientId === userId) {
        conversationsMap[conversationKey].unreadCount++;
      }
    });

    const conversations = Object.values(conversationsMap);

    return res.json({
      success: true,
      data: conversations
    });
  } catch (error) {
    logger.error('Error fetching conversations', { error: error.message });
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch conversations'
    });
  }
});

/**
 * @route   GET /api/chats/:chatId/messages
 * @desc    Fetch messages for a specific chat
 * @access  Private
 * @params  chatId (format: propertyId-userId1-userId2)
 * @returns { success: bool, data: messages[] }
 */
router.get('/:chatId/messages', authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;

    logger.info('Fetching messages for chat', { chatId, userId });

    // Parse the chatId to extract propertyId and participants
    const [propertyId, user1, user2] = chatId.split('-');

    // Verify user is participant
    if (userId !== user1 && userId !== user2) {
      return res.status(403).json({
        success: false,
        error: 'You are not a participant in this chat'
      });
    }

    const otherUserId = userId === user1 ? user2 : user1;

    // Fetch all messages in this conversation
    const messages = await db.Message.findAll({
      where: {
        propertyId: propertyId,
        [db.Sequelize.Op.or]: [
          {
            senderId: userId,
            recipientId: otherUserId
          },
          {
            senderId: otherUserId,
            recipientId: userId
          }
        ]
      },
      order: [['createdAt', 'ASC']],
      include: [
        {
          model: db.User,
          as: 'sender',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });

    // Mark all unread messages as read
    await db.Message.update(
      { isRead: true, readAt: new Date() },
      {
        where: {
          propertyId: propertyId,
          recipientId: userId,
          senderId: otherUserId,
          isRead: false
        }
      }
    );

    const formattedMessages = messages.map(msg => ({
      id: msg.id,
      senderId: msg.senderId,
      senderName: msg.sender ? `${msg.sender.firstName} ${msg.sender.lastName}` : 'Unknown',
      content: msg.content,
      timestamp: msg.createdAt,
      isRead: msg.isRead
    }));

    return res.json({
      success: true,
      data: formattedMessages
    });
  } catch (error) {
    logger.error('Error fetching messages', { error: error.message });
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch messages'
    });
  }
});

/**
 * @route   POST /api/chats/:chatId/messages
 * @desc    Send a message in a chat
 * @access  Private
 * @params  chatId
 * @body    { content }
 * @returns { success: bool, data: message }
 */
router.post('/:chatId/messages', authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content } = req.body;
    const senderId = req.user.id;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Message content is required'
      });
    }

    logger.info('Sending message in chat', { chatId, senderId });

    // Parse the chatId
    const [propertyId, user1, user2] = chatId.split('-');

    // Verify user is participant
    if (senderId !== user1 && senderId !== user2) {
      return res.status(403).json({
        success: false,
        error: 'You are not a participant in this chat'
      });
    }

    const recipientId = senderId === user1 ? user2 : user1;

    // Create message
    const message = await db.Message.create({
      senderId: senderId,
      recipientId: recipientId,
      propertyId: propertyId,
      subject: 'Inquiry',
      content: content,
      isRead: false
    });

    if (!message) {
      return res.status(500).json({
        success: false,
        error: 'Failed to send message'
      });
    }

    return res.status(201).json({
      success: true,
      data: {
        id: message.id,
        senderId: message.senderId,
        content: message.content,
        timestamp: message.createdAt
      }
    });
  } catch (error) {
    logger.error('Error sending message', { error: error.message });
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to send message'
    });
  }
});

module.exports = router;

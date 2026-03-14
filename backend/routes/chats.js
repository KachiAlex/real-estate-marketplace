const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { createLogger } = require('../config/logger');
const db = require('../config/sequelizeDb');
const { v4: uuidv4 } = require('uuid');

const logger = createLogger('ChatsRoutes');

// Try to relax FK constraint on startup for mock data compatibility
let constraintRelaxed = false;
async function relaxForeignKeyConstraint() {
  if (constraintRelaxed) return;
  
  try {
    // PostgreSQL: Drop the FK constraint if it exists
    await db.sequelize.query(
      `ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_propertyId_fkey`
    );
    logger.info('✓ Dropped conversations_propertyId_fkey constraint for mock data compatibility');
    constraintRelaxed = true;
  } catch (error) {
    logger.warn('Could not drop FK constraint (it may not exist):', error.message);
    constraintRelaxed = true; // Don't retry
  }
}

/**
 * @route   POST /api/chats/start
 * @desc    Start a new chat between buyer and vendor for a property
 * @access  Private
 * @body    { buyerId, vendorId, propertyId, starterId, initialMessage }
 * @returns { success: bool, chatId: string, message?: string }
 */
router.post('/start', authenticateToken, async (req, res) => {
  try {
    // Verify models are available
    if (!db || !db.Conversation || !db.Message || !db.User) {
      logger.error('Database models not initialized', { 
        hasDb: !!db, 
        hasConversation: !!db?.Conversation, 
        hasMessage: !!db?.Message,
        hasUser: !!db?.User
      });
      return res.status(500).json({
        success: false,
        error: 'Database models not available. Please try again.'
      });
    }

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

    // Ensure both participants exist in the database (create if missing)
    const MOCK_VENDOR_ID = '550e8400-e29b-41d4-a716-446655440001';
    
    // Check if vendor exists, create if it's the mock vendor ID
    if (vendorId === MOCK_VENDOR_ID) {
      const vendorExists = await db.User.findByPk(vendorId);
      if (!vendorExists) {
        logger.info('Creating mock vendor user on-demand...');
        try {
          await db.User.create({
            id: vendorId,
            firstName: 'Mock',
            lastName: 'Vendor',
            email: 'mock.vendor@propertyark.com',
            password: '$2a$10$abcdefghijklmnopqrstuvwxyz',
            role: 'vendor',
            roles: ['vendor'],
            isVerified: true,
            isActive: true,
            status: 'active'
          });
          logger.info('✓ Mock vendor created on-demand');
        } catch (userErr) {
          if (!userErr.message.includes('unique')) {
            logger.warn('Could not create mock vendor:', userErr.message);
          }
        }
      }
    }

    // Verify buyer exists
    const buyerExists = await db.User.findByPk(buyerId);
    if (!buyerExists) {
      return res.status(400).json({
        success: false,
        error: 'Buyer user not found'
      });
    }

    // Verify vendor exists
    const vendorExists = await db.User.findByPk(vendorId);
    if (!vendorExists) {
      return res.status(400).json({
        success: false,
        error: 'Vendor user not found'
      });
    }

    // Verify property exists
    const propertyExists = await db.Property.findByPk(propertyId);
    if (!propertyExists) {
      return res.status(400).json({
        success: false,
        error: 'Property not found'
      });
    }

    // Ensure participant IDs are sorted for consistent conversation lookup
    const [participant1Id, participant2Id] = [buyerId, vendorId].sort();

    // Find or create conversation
    let conversation;
    try {
      conversation = await db.Conversation.findOne({
        where: {
          propertyId: propertyId,
          participant1Id: participant1Id,
          participant2Id: participant2Id
        }
      });

      if (!conversation) {
        conversation = await db.Conversation.create({
          propertyId: propertyId,
          participant1Id,
          participant2Id,
          lastMessageAt: new Date()
        });
        logger.info('Created new conversation', { conversationId: conversation.id });
      }
    } catch (convErr) {
      logger.error('Failed to create conversation:', convErr.message);
      return res.status(500).json({
        success: false,
        error: `Cannot create conversation: ${convErr.message}`
      });
    }

    // Create the initial message
    let message;
    try {
      const msgData = {
        senderId: starterId,
        recipientId: vendorId === starterId ? buyerId : vendorId,
        propertyId: propertyId,
        subject: 'Property Inquiry',
        content: initialMessage,
        isRead: false
      };
      message = await db.Message.create(msgData);
    } catch (msgErr) {
      logger.warn('Message.create failed, attempting raw insert:', msgErr.message);
      try {
        const msgId = uuidv4();
        await db.sequelize.query(
          `INSERT INTO messages (id, "senderId", "recipientId", "propertyId", subject, content, "isRead", "createdAt", "updatedAt")
           VALUES (:id, :senderId, :recipientId, :propertyId, :subject, :content, :isRead, :createdAt, :updatedAt)`,
          {
            replacements: {
              id: msgId,
              senderId: starterId,
              recipientId: vendorId === starterId ? buyerId : vendorId,
              propertyId: propertyId,
              subject: 'Property Inquiry',
              content: initialMessage,
              isRead: false,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          }
        );
        message = { id: msgId };
      } catch (rawErr) {
        logger.error('Message raw insert failed:', rawErr.message);
        return res.status(500).json({
          success: false,
          error: `Cannot create message: ${rawErr.message}`
        });
      }
    }

    if (!message) {
      return res.status(500).json({
        success: false,
        error: 'Failed to create message'
      });
    }

    // Update conversation's lastMessage pointers
    try {
      if (typeof conversation.update === 'function') {
        await conversation.update({
          lastMessageId: message.id,
          lastMessageAt: new Date()
        });
      } else {
        // Raw update for fallback
        await db.sequelize.query(
          `UPDATE conversations SET "lastMessageId" = :messageId, "lastMessageAt" = :now WHERE id = :conversationId`,
          {
            replacements: {
              messageId: message.id,
              conversationId: conversation.id,
              now: new Date()
            }
          }
        );
      }
    } catch (updateErr) {
      logger.warn('Failed to update conversation (non-fatal):', updateErr.message);
    }

    // Use stable chatId format
    const chatId = `${propertyId}-${participant1Id}-${participant2Id}`;

    logger.info('Chat started successfully', { chatId, messageId: message.id, conversationId: conversation.id });

    return res.json({
      success: true,
      chatId: chatId,
      conversationId: conversation.id,
      messageId: message.id,
      message: 'Chat initialized successfully'
    });
  } catch (error) {
    logger.error('Error starting chat', { error: error.message, stack: error.stack });
    console.error('Chat error details:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to start chat'
    });
  }
});

/**
 * @route   GET /api/chats/conversations
 * @desc    Fetch all conversations for authenticated user with pagination
 * @access  Private
 * @query   page=1, limit=20
 * @returns { success: bool, data: conversations[], meta: { total, page, limit } }
 */
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    logger.info('Fetching conversations for user', { userId, page, limit });

    // Get conversations where user is either participant
    const { count, rows: conversations } = await db.Conversation.findAndCountAll({
      where: {
        [db.Sequelize.Op.or]: [
          { participant1Id: userId },
          { participant2Id: userId }
        ]
      },
      include: [
        {
          model: db.User,
          as: 'participant1',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone']
        },
        {
          model: db.User,
          as: 'participant2',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone']
        },
        {
          model: db.Property,
          as: 'property',
          attributes: ['id', 'title', 'price']
        }
      ],
      order: [['lastMessageAt', 'DESC']],
      limit: limit,
      offset: offset
    });

    // Format conversations for frontend
    const formattedConversations = conversations.map((conv) => {
      const otherParticipant = conv.participant1Id === userId ? conv.participant2 : conv.participant1;
      return {
        id: `${conv.propertyId}-${conv.participant1Id}-${conv.participant2Id}`,
        conversationId: conv.id,
        propertyId: conv.propertyId,
        contact: {
          id: otherParticipant.id,
          name: `${otherParticipant.firstName} ${otherParticipant.lastName}`,
          role: 'vendor',
          email: otherParticipant.email,
          phone: otherParticipant.phone
        },
        property: {
          id: conv.property.id,
          title: conv.property.title,
          price: conv.property.price
        },
        lastMessageAt: conv.lastMessageAt
      };
    });

    return res.json({
      success: true,
      data: formattedConversations,
      meta: {
        total: count,
        page: page,
        limit: limit,
        pages: Math.ceil(count / limit)
      }
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
 * @desc    Fetch messages for a specific chat with pagination
 * @access  Private
 * @params  chatId (format: propertyId-participant1Id-participant2Id)
 * @query   page=1, limit=50
 * @returns { success: bool, data: messages[], meta: { total, page, limit } }
 */
router.get('/:chatId/messages', authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 50));
    const offset = (page - 1) * limit;

    logger.info('Fetching messages for chat', { chatId, userId, page, limit });

    // Parse the chatId to extract propertyId and participants
    const [propertyId, participant1, participant2] = chatId.split('-');

    // Verify user is participant
    if (userId !== participant1 && userId !== participant2) {
      return res.status(403).json({
        success: false,
        error: 'You are not a participant in this chat'
      });
    }

    const otherUserId = userId === participant1 ? participant2 : participant1;

    // Fetch messages with pagination
    const { count, rows: messages } = await db.Message.findAndCountAll({
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
      include: [
        {
          model: db.User,
          as: 'sender',
          attributes: ['id', 'firstName', 'lastName']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: limit,
      offset: offset,
      subQuery: false
    });

    // Reverse to show oldest first
    const reversedMessages = messages.reverse();

    // Mark all unread messages as read in background (don't await)
    db.Message.update(
      { isRead: true, readAt: new Date() },
      {
        where: {
          propertyId: propertyId,
          recipientId: userId,
          senderId: otherUserId,
          isRead: false
        }
      }
    ).catch(err => logger.error('Failed to mark messages as read', { error: err.message }));

    const formattedMessages = reversedMessages.map(msg => ({
      id: msg.id,
      senderId: msg.senderId,
      senderName: msg.sender ? `${msg.sender.firstName} ${msg.sender.lastName}` : 'Unknown',
      content: msg.content,
      timestamp: msg.createdAt,
      isRead: msg.isRead
    }));

    return res.json({
      success: true,
      data: formattedMessages,
      meta: {
        total: count,
        page: page,
        limit: limit,
        pages: Math.ceil(count / limit)
      }
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

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Message content is required'
      });
    }

    logger.info('Sending message in chat', { chatId, senderId });

    // Parse the chatId
    const [propertyId, participant1, participant2] = chatId.split('-');

    // Verify user is participant
    if (senderId !== participant1 && senderId !== participant2) {
      return res.status(403).json({
        success: false,
        error: 'You are not a participant in this chat'
      });
    }

    const recipientId = senderId === participant1 ? participant2 : participant1;

    // Create message
    const message = await db.Message.create({
      senderId: senderId,
      recipientId: recipientId,
      propertyId: propertyId,
      subject: 'Inquiry',
      content: content.trim(),
      isRead: false
    });

    if (!message) {
      return res.status(500).json({
        success: false,
        error: 'Failed to send message'
      });
    }

    // Update or create conversation
    const sortedParticipants = [participant1, participant2].sort();
    await db.Conversation.findOrCreate({
      where: {
        propertyId: propertyId,
        participant1Id: sortedParticipants[0],
        participant2Id: sortedParticipants[1]
      },
      defaults: {
        lastMessageId: message.id,
        lastMessageAt: new Date()
      }
    }).then(([conv]) => {
      // Update lastMessage pointers
      conv.update({
        lastMessageId: message.id,
        lastMessageAt: new Date()
      }).catch(err => logger.error('Failed to update conversation', { error: err.message }));
    });

    return res.status(201).json({
      success: true,
      data: {
        id: message.id,
        senderId: message.senderId,
        recipientId: message.recipientId,
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

/**
 * @route   PUT /api/chats/:chatId/messages/:messageId
 * @desc    Edit a sent message
 * @access  Private (only sender can edit)
 * @params  chatId, messageId
 * @body    { content }
 * @returns { success: bool, data: message }
 */
router.put('/:chatId/messages/:messageId', authenticateToken, async (req, res) => {
  try {
    const { chatId, messageId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Message content cannot be empty'
      });
    }

    logger.info('Editing message', { chatId, messageId, userId });

    // Fetch the message
    const message = await db.Message.findByPk(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }

    // Verify sender is owner
    if (message.senderId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only edit your own messages'
      });
    }

    // Verify message is not deleted
    if (message.deletedAt) {
      return res.status(410).json({
        success: false,
        error: 'Cannot edit a deleted message'
      });
    }

    // Store original content and update message
    const originalContent = message.originalContent || message.content;
    await message.update({
      content: content.trim(),
      originalContent: originalContent,
      editedAt: new Date()
    });

    return res.json({
      success: true,
      data: {
        id: message.id,
        content: message.content,
        editedAt: message.editedAt
      }
    });
  } catch (error) {
    logger.error('Error editing message', { error: error.message });
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to edit message'
    });
  }
});

/**
 * @route   DELETE /api/chats/:chatId/messages/:messageId
 * @desc    Soft-delete a message (only sender can delete)
 * @access  Private
 * @params  chatId, messageId
 * @returns { success: bool }
 */
router.delete('/:chatId/messages/:messageId', authenticateToken, async (req, res) => {
  try {
    const { chatId, messageId } = req.params;
    const userId = req.user.id;

    logger.info('Deleting message', { chatId, messageId, userId });

    // Fetch the message
    const message = await db.Message.findByPk(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }

    // Verify sender is owner
    if (message.senderId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only delete your own messages'
      });
    }

    // Soft delete
    await message.update({
      deletedAt: new Date(),
      deletedBy: userId
    });

    logger.info('Message soft-deleted', { messageId });

    return res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting message', { error: error.message });
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete message'
    });
  }
});

/**
 * @route   GET /api/chats/:chatId/search
 * @desc    Search messages in a conversation (full-text search)
 * @access  Private
 * @params  chatId
 * @query   q=searchTerm, page=1, limit=20
 * @returns { success: bool, data: messages[], meta: { total, page } }
 */
router.get('/:chatId/search', authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { q: searchQuery } = req.query;
    const userId = req.user.id;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    if (!searchQuery || searchQuery.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    logger.info('Searching messages', { chatId, searchQuery, userId });

    // Parse the chatId
    const [propertyId, participant1, participant2] = chatId.split('-');

    // Verify user is participant
    if (userId !== participant1 && userId !== participant2) {
      return res.status(403).json({
        success: false,
        error: 'You are not a participant in this chat'
      });
    }

    const otherUserId = userId === participant1 ? participant2 : participant1;

    // Search with PostgreSQL full-text search
    const { count, rows: messages } = await db.Message.findAndCountAll({
      where: {
        propertyId: propertyId,
        deletedAt: null,
        [db.Sequelize.Op.or]: [
          {
            senderId: userId,
            recipientId: otherUserId
          },
          {
            senderId: otherUserId,
            recipientId: userId
          }
        ],
        content: {
          [db.Sequelize.Op.iLike]: `%${searchQuery}%`
        }
      },
      include: [
        {
          model: db.User,
          as: 'sender',
          attributes: ['id', 'firstName', 'lastName']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: limit,
      offset: offset,
      subQuery: false
    });

    const formattedMessages = messages.map(msg => ({
      id: msg.id,
      senderId: msg.senderId,
      senderName: msg.sender ? `${msg.sender.firstName} ${msg.sender.lastName}` : 'Unknown',
      content: msg.content,
      timestamp: msg.createdAt,
      editedAt: msg.editedAt
    }));

    return res.json({
      success: true,
      data: formattedMessages,
      meta: {
        query: searchQuery,
        total: count,
        page: page,
        limit: limit,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    logger.error('Error searching messages', { error: error.message });
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to search messages'
    });
  }
});

module.exports = router;

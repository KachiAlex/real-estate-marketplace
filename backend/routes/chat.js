const express = require('express');
const router = express.Router();
const chatService = require('../services/chatService');
const { authenticateToken } = require('../middleware/auth');
const { createLogger } = require('../config/logger');

const logger = createLogger('ChatRoutes');

// Middleware to validate request body
const validateRequestBody = (requiredFields) => {
  return (req, res, next) => {
    console.log('[Chat] Request body validation - required fields:', requiredFields);
    console.log('[Chat] Actual request body:', JSON.stringify(req.body));
    console.log('[Chat] Body keys:', Object.keys(req.body || {}));
    const missingFields = requiredFields.filter(field => {
      const value = req.body?.[field];
      const isMissing = !value && value !== 0 && value !== false;
      console.log(`[Chat] Field '${field}': value="${value}", isMissing=${isMissing}`);
      return isMissing;
    });
    if (missingFields.length > 0) {
      console.warn('[Chat] Missing fields:', missingFields);
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      });
    }
    next();
  };
};

/**
 * @route   POST /api/chat/conversations
 * @desc    Create new conversation (for when buyer/vendor initiates chat)
 * @access  Private
 */
router.post('/conversations', authenticateToken, validateRequestBody(['message', 'category']), async (req, res) => {
  try {
    const { message, category, propertyId } = req.body;
    // Use authenticated user's ID, not the one from request body
    const userId = req.user.id || req.user.uid || req.user.email;
    const userType = req.user.role || 'buyer';

    const result = await chatService.createConversation(userId, message, category, propertyId, userType);
    
    if (result.success) {
      res.status(201).json({
        success: true,
        data: result.data,
        message: 'Conversation created successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    logger.error('Error creating conversation', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/chat/conversations
 * @desc    Get user's conversations
 * @access  Private
 */
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await chatService.getUserConversations(userId);
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        message: 'Conversations retrieved successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    logger.error('Error getting user conversations', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/chat/send
 * @desc    Send a message as user
 * @access  Private
 */
router.post('/send', authenticateToken, validateRequestBody(['conversationId', 'message']), async (req, res) => {
  try {
    const { conversationId, message } = req.body;
    const userId = req.user.id;
    const userType = req.user.role || 'buyer';

    const result = await chatService.sendMessage(
      conversationId,
      message,
      false, // isAdmin
      userId,
      userType
    );
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        message: 'Message sent successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    logger.error('Error sending user message', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;

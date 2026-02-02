const express = require('express');
const router = express.Router();
const chatService = require('../services/chatService');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { createLogger } = require('../config/logger');

const logger = createLogger('AdminChatRoutes');

// Middleware to validate request body
const validateRequestBody = (requiredFields) => {
  return (req, res, next) => {
    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      });
    }
    next();
  };
};

/**
 * @route   GET /api/admin/chat/conversations
 * @desc    Get all conversations for admin
 * @access  Admin
 */
router.get('/conversations', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      priority: req.query.priority,
      category: req.query.category,
      search: req.query.search
    };

    // Remove undefined filters
    Object.keys(filters).forEach(key => filters[key] === undefined && delete filters[key]);

    const result = await chatService.getConversations(filters);
    
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
    logger.error('Error getting conversations', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/admin/chat/conversations/:id
 * @desc    Get a specific conversation with messages
 * @access  Admin
 */
router.get('/conversations/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await chatService.getConversation(id);
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        message: 'Conversation retrieved successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    logger.error('Error getting conversation', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/admin/chat/send
 * @desc    Send a message as admin
 * @access  Admin
 */
router.post('/send', authenticateToken, requireAdmin, validateRequestBody(['conversationId', 'message']), async (req, res) => {
  try {
    const { conversationId, message, userId, userType } = req.body;
    const adminId = req.user.id;
    const adminName = req.user.firstName ? `${req.user.firstName} ${req.user.lastName}`.trim() : 'Admin Support';

    const result = await chatService.sendMessage(
      conversationId,
      message,
      true, // isAdmin
      null, // userId (admin message)
      null, // userType (admin message)
      adminName
    );
    
    if (result.success) {
      // Log successful send
      logger.info('Admin message sent successfully', {
        conversationId,
        adminId,
        adminName,
        userId,
        userType,
        timestamp: new Date().toISOString()
      });

      // Attempt to send email notification to customer
      if (userId) {
        try {
          const emailResult = await chatService.notifyUserOfNewMessage(
            userId,
            conversationId,
            message,
            adminName
          ).catch(err => {
            logger.warn('Failed to send email notification', err);
            // Don't fail the response if email fails
            return { success: false };
          });
          
          if (emailResult.success) {
            logger.info('Email notification sent to user', { userId });
          }
        } catch (emailErr) {
          logger.warn('Email notification error', emailErr);
        }
      }

      res.json({
        success: true,
        data: result.data,
        message: 'Message sent successfully to customer'
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    logger.error('Error sending admin message', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/admin/chat/conversations/:id/read
 * @desc    Mark conversation as read
 * @access  Admin
 */
router.post('/conversations/:id/read', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await chatService.markAsRead(id);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Conversation marked as read'
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    logger.error('Error marking conversation as read', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/admin/chat/conversations/:id/assign
 * @desc    Assign conversation to admin
 * @access  Admin
 */
router.post('/conversations/:id/assign', authenticateToken, requireAdmin, validateRequestBody(['adminId']), async (req, res) => {
  try {
    const { id } = req.params;
    const { adminId } = req.body;
    const result = await chatService.assignConversation(id, adminId);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Conversation assigned successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    logger.error('Error assigning conversation', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/admin/chat/conversations/:id/priority
 * @desc    Update conversation priority
 * @access  Admin
 */
router.post('/conversations/:id/priority', authenticateToken, requireAdmin, validateRequestBody(['priority']), async (req, res) => {
  try {
    const { id } = req.params;
    const { priority } = req.body;
    const result = await chatService.updatePriority(id, priority);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Priority updated successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    logger.error('Error updating priority', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/admin/chat/conversations/:id/archive
 * @desc    Archive conversation
 * @access  Admin
 */
router.post('/conversations/:id/archive', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await chatService.archiveConversation(id);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Conversation archived successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    logger.error('Error archiving conversation', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/admin/chat/stats
 * @desc    Get chat statistics
 * @access  Admin
 */
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await chatService.getChatStats();
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        message: 'Chat statistics retrieved successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    logger.error('Error getting chat stats', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/admin/chat/canned-responses
 * @desc    Get all canned responses for quick replies
 * @access  Admin
 */
router.get('/canned-responses', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await chatService.getCannedResponses();
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        message: 'Canned responses retrieved successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    logger.error('Error getting canned responses', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/admin/chat/canned-responses
 * @desc    Create a new canned response
 * @access  Admin
 */
router.post('/canned-responses', authenticateToken, requireAdmin, validateRequestBody(['title', 'message', 'category']), async (req, res) => {
  try {
    const { title, message, category } = req.body;
    const result = await chatService.addCannedResponse(title, message, category);
    
    if (result.success) {
      res.status(201).json({
        success: true,
        data: result.data,
        message: 'Canned response created successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    logger.error('Error creating canned response', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route   DELETE /api/admin/chat/canned-responses/:id
 * @desc    Delete a canned response
 * @access  Admin
 */
router.delete('/canned-responses/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await chatService.deleteCannedResponse(id);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Canned response deleted successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    logger.error('Error deleting canned response', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;

/**
 * Chat Enhanced Routes - Real-time Messaging with Encryption & Rich Content
 * Endpoints for messaging, reactions, typing, file uploads, and link sharing
 */

const express = require('express');
const router = express.Router();
const ChatService = require('../services/chatEnhancedService');
const { protect } = require('../middleware/auth');
const { errorLogger, infoLogger } = require('../config/logger');

/**
 * @route   POST /api/chat/conversations
 * @desc    Create a new conversation
 * @access  Private
 * @body    participants, name (optional), description (optional)
 */
router.post('/conversations', protect, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { participants = [], name = null, description = null } = req.body;

    // Validate participants
    if (!Array.isArray(participants) || participants.length < 1) {
      return res.status(400).json({
        success: false,
        message: 'At least one participant is required',
      });
    }

    // Add sender to participants if not already included
    const allParticipants = [...new Set([userId, ...participants])];

    // Generate conversation ID
    const conversationId = `conv_${allParticipants.sort().join('_')}_${Date.now()}`;

    const result = await ChatService.createConversation(conversationId, allParticipants, {
      name,
      description,
    });

    infoLogger(`Conversation created by ${userId}: ${conversationId}`);

    res.status(201).json({
      success: true,
      data: result.data,
      message: 'Conversation created successfully',
    });
  } catch (error) {
    errorLogger('Create conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create conversation',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/chat/conversations
 * @desc    Get user's conversations
 * @access  Private
 */
router.get('/conversations', protect, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = Math.max(parseInt(req.query.offset) || 0, 0);

    const result = await ChatService.getUserConversations(userId, { limit, offset });

    res.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    errorLogger('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversations',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/chat/conversations/:conversationId
 * @desc    Get conversation info and details
 * @access  Private
 */
router.get('/conversations/:conversationId', protect, async (req, res) => {
  try {
    const { conversationId } = req.params;

    const result = await ChatService.getConversationInfo(conversationId);

    res.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    errorLogger('Get conversation info error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversation info',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/chat/conversations/:conversationId/messages
 * @desc    Get messages from a conversation
 * @access  Private
 * @query   limit, offset, search
 */
router.get('/conversations/:conversationId/messages', protect, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const offset = Math.max(parseInt(req.query.offset) || 0, 0);
    const searchQuery = req.query.search || null;

    const result = await ChatService.getMessages(conversationId, { limit, offset, searchQuery });

    res.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    errorLogger('Get messages error:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/chat/conversations/:conversationId/messages
 * @desc    Send a message to conversation
 * @access  Private
 * @body    text, contentType, media, richContent, replyTo
 */
router.post('/conversations/:conversationId/messages', protect, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { conversationId } = req.params;
    const { text = '', contentType = 'text', media = null, richContent = null, replyTo = null } = req.body;

    if (!text && !media && !richContent) {
      return res.status(400).json({
        success: false,
        message: 'Message must contain text, media, or rich content',
      });
    }

    const result = await ChatService.sendMessage(conversationId, userId, {
      text,
      contentType,
      media,
      richContent,
      replyTo,
    });

    infoLogger(`Message sent to ${conversationId} by ${userId}`);

    res.status(201).json({
      success: true,
      data: result.data,
      message: 'Message sent successfully',
    });
  } catch (error) {
    errorLogger('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message,
    });
  }
});

/**
 * @route   PUT /api/chat/conversations/:conversationId/messages/:messageId
 * @desc    Edit a message
 * @access  Private
 * @body    text
 */
router.put('/conversations/:conversationId/messages/:messageId', protect, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { conversationId, messageId } = req.params;
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message text is required',
      });
    }

    const result = await ChatService.editMessage(conversationId, messageId, userId, text);

    infoLogger(`Message ${messageId} edited by ${userId}`);

    res.json({
      success: true,
      data: result.data,
      message: 'Message edited successfully',
    });
  } catch (error) {
    errorLogger('Edit message error:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message.includes('Only message sender')) {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to edit message',
      error: error.message,
    });
  }
});

/**
 * @route   DELETE /api/chat/conversations/:conversationId/messages/:messageId
 * @desc    Delete a message
 * @access  Private
 */
router.delete('/conversations/:conversationId/messages/:messageId', protect, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { conversationId, messageId } = req.params;

    const result = await ChatService.deleteMessage(conversationId, messageId, userId);

    infoLogger(`Message ${messageId} deleted by ${userId}`);

    res.json({
      success: true,
      message: 'Message deleted successfully',
    });
  } catch (error) {
    errorLogger('Delete message error:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message.includes('Only message sender')) {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to delete message',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/chat/conversations/:conversationId/messages/:messageId/reactions
 * @desc    Add reaction to a message
 * @access  Private
 * @body    emoji
 */
router.post('/conversations/:conversationId/messages/:messageId/reactions', protect, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { conversationId, messageId } = req.params;
    const { emoji } = req.body;

    if (!emoji) {
      return res.status(400).json({
        success: false,
        message: 'Emoji is required',
      });
    }

    const result = await ChatService.addReaction(conversationId, messageId, userId, emoji);

    infoLogger(`Reaction ${emoji} added to ${messageId} by ${userId}`);

    res.status(201).json({
      success: true,
      data: result.data,
      message: 'Reaction added successfully',
    });
  } catch (error) {
    errorLogger('Add reaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add reaction',
      error: error.message,
    });
  }
});

/**
 * @route   DELETE /api/chat/conversations/:conversationId/messages/:messageId/reactions
 * @desc    Remove reaction from a message
 * @access  Private
 * @query   emoji
 */
router.delete('/conversations/:conversationId/messages/:messageId/reactions', protect, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { conversationId, messageId } = req.params;
    const { emoji } = req.query;

    if (!emoji) {
      return res.status(400).json({
        success: false,
        message: 'Emoji is required',
      });
    }

    const result = await ChatService.removeReaction(conversationId, messageId, userId, emoji);

    infoLogger(`Reaction ${emoji} removed from ${messageId} by ${userId}`);

    res.json({
      success: true,
      data: result.data,
      message: 'Reaction removed successfully',
    });
  } catch (error) {
    errorLogger('Remove reaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove reaction',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/chat/conversations/:conversationId/messages/:messageId/read
 * @desc    Mark message as read
 * @access  Private
 */
router.post('/conversations/:conversationId/messages/:messageId/read', protect, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { conversationId, messageId } = req.params;

    const result = await ChatService.markMessageAsRead(conversationId, messageId, userId);

    infoLogger(`Message ${messageId} marked as read by ${userId}`);

    res.json({
      success: true,
      data: result.data,
      message: 'Message marked as read',
    });
  } catch (error) {
    errorLogger('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark message as read',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/chat/conversations/:conversationId/typing
 * @desc    Send typing indicator
 * @access  Private
 */
router.post('/conversations/:conversationId/typing', protect, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { conversationId } = req.params;

    const result = await ChatService.sendTypingIndicator(conversationId, userId);

    res.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    errorLogger('Typing indicator error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send typing indicator',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/chat/conversations/:conversationId/typing
 * @desc    Get typing indicators in conversation
 * @access  Private
 */
router.get('/conversations/:conversationId/typing', protect, async (req, res) => {
  try {
    const { conversationId } = req.params;

    const result = await ChatService.getTypingIndicators(conversationId);

    res.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    errorLogger('Get typing indicators error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch typing indicators',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/chat/conversations/:conversationId/media
 * @desc    Upload media to conversation
 * @access  Private
 * @body    filename, size, mimeType, url
 */
router.post('/conversations/:conversationId/media', protect, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { conversationId } = req.params;
    const { filename, size, mimeType, url } = req.body;

    if (!filename || !size || !mimeType || !url) {
      return res.status(400).json({
        success: false,
        message: 'filename, size, mimeType, and url are required',
      });
    }

    const result = await ChatService.uploadMedia(conversationId, userId, {
      filename,
      size,
      mimeType,
      url,
    });

    infoLogger(`Media uploaded to ${conversationId} by ${userId}`);

    res.status(201).json({
      success: true,
      data: result.data,
      message: 'Media uploaded successfully',
    });
  } catch (error) {
    errorLogger('Media upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload media',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/chat/conversations/:conversationId/share-link
 * @desc    Share a link with preview
 * @access  Private
 * @body    url
 */
router.post('/conversations/:conversationId/share-link', protect, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { conversationId } = req.params;
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'URL is required',
      });
    }

    const result = await ChatService.shareLink(conversationId, userId, url);

    infoLogger(`Link shared in ${conversationId} by ${userId}`);

    res.status(201).json({
      success: true,
      data: result.data,
      message: 'Link shared successfully',
    });
  } catch (error) {
    errorLogger('Share link error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to share link',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/chat/conversations/:conversationId/search
 * @desc    Search messages in conversation
 * @access  Private
 * @query   q (search query)
 */
router.get('/conversations/:conversationId/search', protect, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { q } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }

    const result = await ChatService.searchMessages(conversationId, q);

    res.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    errorLogger('Search messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search messages',
      error: error.message,
    });
  }
});

module.exports = router;

const express = require('express');
const { protect } = require('../middleware/auth');
const { sanitizeInput, validate } = require('../middleware/validation');
const { body, param, query } = require('express-validator');
const notificationService = require('../services/notificationService');

const router = express.Router();

const getUserId = (user = {}) => user.id || user._id;
const validateNotificationId = param('id')
  .isString()
  .trim()
  .isLength({ min: 1 })
  .withMessage('Valid notification ID is required');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
router.get('/',
  protect,
  sanitizeInput,
  validate([
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('status').optional().isIn(['unread', 'read', 'archived']).withMessage('Invalid status'),
    query('type').optional().isString().withMessage('Type must be a string'),
    query('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority')
  ]),
  async (req, res) => {
    try {
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        status: req.query.status,
        type: req.query.type,
        priority: req.query.priority
      };

      const result = await notificationService.getUserNotifications(getUserId(req.user), options);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      console.error('Get notifications error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get notifications'
      });
    }
  }
);

// @desc    Get notification by ID
// @route   GET /api/notifications/:id
// @access  Private
router.get('/:id',
  protect,
  sanitizeInput,
  validate([validateNotificationId]),
  async (req, res) => {
    try {
      const result = await notificationService.getNotificationById(req.params.id, getUserId(req.user));

      if (!result.success) {
        return res.status(result.message === 'Notification not found' ? 404 : 500).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Get notification error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get notification'
      });
    }
  }
);

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
router.put('/:id/read',
  protect,
  sanitizeInput,
  validate([validateNotificationId]),
  async (req, res) => {
    try {
      const result = await notificationService.markAsRead(req.params.id, getUserId(req.user));
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(result.message === 'Notification not found' ? 404 : 500).json(result);
      }
    } catch (error) {
      console.error('Mark as read error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark notification as read'
      });
    }
  }
);

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
router.put('/read-all',
  protect,
  sanitizeInput,
  async (req, res) => {
    try {
      const result = await notificationService.markAllAsRead(getUserId(req.user));
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      console.error('Mark all as read error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark all notifications as read'
      });
    }
  }
);

// @desc    Archive notification
// @route   PUT /api/notifications/:id/archive
// @access  Private
router.put('/:id/archive',
  protect,
  sanitizeInput,
  validate([validateNotificationId]),
  async (req, res) => {
    try {
      const result = await notificationService.archiveNotification(req.params.id, getUserId(req.user));
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(result.message === 'Notification not found' ? 404 : 500).json(result);
      }
    } catch (error) {
      console.error('Archive notification error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to archive notification'
      });
    }
  }
);

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
router.delete('/:id',
  protect,
  sanitizeInput,
  validate([validateNotificationId]),
  async (req, res) => {
    try {
      const result = await notificationService.deleteNotification(req.params.id, getUserId(req.user));
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(result.message === 'Notification not found' ? 404 : 500).json(result);
      }
    } catch (error) {
      console.error('Delete notification error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete notification'
      });
    }
  }
);

// @desc    Get unread count
// @route   GET /api/notifications/unread/count
// @access  Private
router.get('/unread/count',
  protect,
  sanitizeInput,
  async (req, res) => {
    try {
      const unreadCount = await notificationService.getUnreadCount(getUserId(req.user));

      res.json({
        success: true,
        data: { unreadCount }
      });
    } catch (error) {
      console.error('Get unread count error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get unread count'
      });
    }
  }
);

// @desc    Create test notification (admin only)
// @route   POST /api/notifications/test
// @access  Private (Admin)
router.post('/test',
  protect,
  sanitizeInput,
  validate([
    body('type').isIn([
      'property_verified',
      'property_rejected',
      'escrow_created',
      'escrow_payment_received',
      'escrow_disputed',
      'escrow_resolved',
      'escrow_completed',
      'escrow_timeout',
      'user_suspended',
      'user_activated',
      'inspection_requested',
      'inspection_scheduled',
      'inspection_completed',
      'investment_opportunity',
      'investment_completed',
      'payment_received',
      'payment_failed',
      'system_maintenance',
      'general'
    ]).withMessage('Invalid notification type'),
    body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title is required and must be less than 200 characters'),
    body('message').trim().isLength({ min: 1, max: 1000 }).withMessage('Message is required and must be less than 1000 characters'),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
    body('data').optional().isObject().withMessage('Data must be an object'),
    body('recipient').optional().isString().trim().isLength({ min: 1 }).withMessage('Recipient must be a valid ID')
  ]),
  async (req, res) => {
    try {
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
      }

      const recipientId = req.body.recipient || req.body.recipientId || getUserId(req.user);
      const notificationData = {
        recipient: recipientId,
        sender: null,
        type: req.body.type,
        title: req.body.title,
        message: req.body.message,
        data: req.body.data || {},
        priority: req.body.priority || 'medium',
        channels: {
          email: true,
          inApp: true,
          sms: false,
          push: true
        }
      };

      const result = await notificationService.createNotification(notificationData);
      
      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      console.error('Create test notification error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create test notification'
      });
    }
  }
);

module.exports = router;

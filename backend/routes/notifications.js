const express = require('express');
const { protect } = require('../middleware/auth');
const { sanitizeInput, validate } = require('../middleware/validation');
const { body, param, query } = require('express-validator');
const notificationService = require('../services/notificationService');
const Notification = require('../models/Notification');

const router = express.Router();

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

      const result = await notificationService.getUserNotifications(req.user._id, options);
      
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
  validate([
    param('id').isMongoId().withMessage('Valid notification ID is required')
  ]),
  async (req, res) => {
    try {
      const notification = await Notification.findOne({
        _id: req.params.id,
        recipient: req.user._id
      }).populate('sender', 'firstName lastName email avatar');

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }

      res.json({
        success: true,
        data: notification
      });
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
  validate([
    param('id').isMongoId().withMessage('Valid notification ID is required')
  ]),
  async (req, res) => {
    try {
      const result = await notificationService.markAsRead(req.params.id, req.user._id);
      
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
      const result = await notificationService.markAllAsRead(req.user._id);
      
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
  validate([
    param('id').isMongoId().withMessage('Valid notification ID is required')
  ]),
  async (req, res) => {
    try {
      const result = await notificationService.archiveNotification(req.params.id, req.user._id);
      
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
  validate([
    param('id').isMongoId().withMessage('Valid notification ID is required')
  ]),
  async (req, res) => {
    try {
      const result = await notificationService.deleteNotification(req.params.id, req.user._id);
      
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
      const unreadCount = await Notification.getUnreadCount(req.user._id);
      
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
    body('data').optional().isObject().withMessage('Data must be an object')
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

      const notificationData = {
        recipient: req.user._id, // Send to self for testing
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

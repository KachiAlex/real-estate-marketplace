const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { createLogger } = require('../config/logger');
const emailService = require('../services/emailService');
const db = require('../config/sequelizeDb');
const { v4: uuidv4 } = require('uuid');

const logger = createLogger('SupportRoutes');

/**
 * @route   POST /api/support/inquiry
 * @desc    Create a new support inquiry (simple ticket system)
 * @access  Private
 */
router.post('/inquiry', authenticateToken, async (req, res) => {
  try {
    logger.info('Incoming support inquiry request', {
      userId: req.user?.id || req.user?.uid || 'unknown',
      userEmail: req.user?.email || 'unknown',
      ip: req.ip,
      category: req.body?.category || null,
      subjectPreview: req.body?.subject ? String(req.body.subject).slice(0, 120) : null
    });

    const { subject, message, category, priority = 'medium' } = req.body || {};

    if (!subject || !message || !category) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: subject, message and category'
      });
    }

    const userId = req.user.id || req.user.uid || req.user.email;
    const userEmail = req.user.email || 'unknown@example.com';
    const userName = req.user.firstName && req.user.lastName
      ? `${req.user.firstName} ${req.user.lastName}`
      : req.user.name || req.user.displayName || 'Unknown User';

    const inquiry = await db.SupportInquiry.create({
      id: uuidv4(),
      userId,
      subject: subject.trim(),
      message,
      category,
      priority,
      status: 'open'
    });

    logger.info('Support inquiry created', {
      inquiryId: inquiry.id,
      userId,
      category,
      userEmail
    });

    try {
      const raw = process.env.SUPPORT_EMAIL || '';
      const emails = raw.split(',').map(e => e.trim()).filter(Boolean);
      if (emails.length > 0) {
        const recipients = emails.map(e => ({ email: e }));
        const variables = {
          userName,
          userEmail,
          category,
          message,
          priority,
          createdAt: inquiry.createdAt ? inquiry.createdAt.toLocaleString() : new Date().toLocaleString(),
          inquiryUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/support/${inquiry.id}`
        };
        const sendResult = await emailService.sendBulkEmails(recipients, 'support_inquiry', variables);
        logger.info('Support inquiry notification send result', { inquiryId: inquiry.id, sendResult });
      } else {
        logger.warn('SUPPORT_EMAIL not set; skipping support inquiry email notification');
      }
    } catch (err) {
      logger.error('Error sending support inquiry notification email', err);
    }

    return res.status(201).json({
      success: true,
      data: inquiry,
      message: 'Your inquiry has been submitted successfully. Our support team will respond shortly.'
    });
  } catch (error) {
    logger.error('Error creating support inquiry', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to submit inquiry. Please try again.'
    });
  }
});

/**
 * @route   GET /api/support/inquiries
 * @desc    Get user's support inquiries
 * @access  Private
 */
router.get('/inquiries', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id || req.user.uid || req.user.email;

    const inquiries = await db.SupportInquiry.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    return res.json({
      success: true,
      data: inquiries
    });
  } catch (error) {
    logger.error('Error fetching support inquiries', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch inquiries'
    });
  }
});

/**
 * @route   GET /api/admin/support/inquiries
 * @desc    Get all support inquiries (admin only)
 * @access  Private/Admin
 */
router.get('/admin/inquiries', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only admins can access this route'
      });
    }

    const inquiries = await db.SupportInquiry.findAll({
      include: [{ model: db.User, as: 'user', attributes: ['id', 'email', 'firstName', 'lastName'] }],
      order: [['createdAt', 'DESC']],
      limit: 100
    });

    return res.json({
      success: true,
      data: inquiries
    });
  } catch (error) {
    logger.error('Error fetching admin support inquiries', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch inquiries'
    });
  }
});

/**
 * @route   PUT /api/admin/support/inquiries/:id
 * @desc    Update support inquiry status (admin only)
 * @access  Private/Admin
 */
router.put('/admin/inquiries/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, isRead } = req.body;

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only admins can access this route'
      });
    }

    const inquiry = await db.SupportInquiry.findByPk(id);
    if (!inquiry) {
      return res.status(404).json({
        success: false,
        error: 'Inquiry not found'
      });
    }

    if (status) inquiry.status = status;
    if (typeof isRead === 'boolean') inquiry.isRead = isRead;
    await inquiry.save();

    logger.info('Support inquiry updated', { inquiryId: id, updates: { status, isRead } });

    return res.json({
      success: true,
      data: inquiry,
      message: 'Inquiry updated successfully'
    });
  } catch (error) {
    logger.error('Error updating support inquiry', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update inquiry'
    });
  }
});

module.exports = router;

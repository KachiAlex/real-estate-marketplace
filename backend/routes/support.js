const express = require('express');
const router = express.Router();
const { db, admin } = require('../config/firestore');
const { authenticateToken } = require('../middleware/auth');
const { createLogger } = require('../config/logger');
const emailService = require('../services/emailService');

const logger = createLogger('SupportRoutes');

/**
 * @route   POST /api/support/inquiry
 * @desc    Create a new support inquiry (simple ticket system)
 * @access  Private
 */
router.post('/inquiry', authenticateToken, async (req, res) => {
  try {
    const { message, category, priority = 'medium', subject } = req.body;

    // Validate required fields
    if (!message || !category) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: message and category'
      });
    }

    const inquiryRef = db.collection('supportInquiries').doc();
    const inquiryId = inquiryRef.id;

    // Get user info
    const userId = req.user.id || req.user.uid || req.user.email;
    const userEmail = req.user.email || 'unknown@example.com';
    const userName = req.user.firstName && req.user.lastName
      ? `${req.user.firstName} ${req.user.lastName}`
      : req.user.name || 'Unknown User';

    const inquiry = {
      id: inquiryId,
      userId,
      userEmail,
      userName,
      message,
      category,
      priority,
      subject: subject || `Support Inquiry - ${category}`,
      status: 'new',
      isRead: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Save inquiry to Firestore
    await inquiryRef.set(inquiry);

    logger.info('Support inquiry created', {
      inquiryId,
      userId,
      category,
      priority
    });

    // Attempt to notify admins via email (if SUPPORT_EMAIL configured)
    try {
      const raw = process.env.SUPPORT_EMAIL || '';
      const recipients = raw.split(',').map(email => email.trim()).filter(email => email);

      if (recipients.length > 0) {
        const variables = {
          userName,
          userEmail,
          category,
          priority,
          message,
          inquiryId,
          inquiryUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/support/${inquiryId}`
        };

        const sendResult = await emailService.sendBulkEmails(recipients, 'support_inquiry', variables);
        logger.info('Support inquiry notification send result', { inquiryId, sendResult });
      } else {
        logger.warn('SUPPORT_EMAIL not set; skipping support inquiry email notification');
      }
    } catch (emailErr) {
      logger.error('Error sending support inquiry notification email', emailErr);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Your inquiry has been submitted successfully. Our support team will respond shortly.',
      data: {
        id: inquiryId,
        status: 'new'
      }
    });

  } catch (error) {
    logger.error('Error creating support inquiry', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit inquiry. Please try again later.'
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

    const snapshot = await db.collection('supportInquiries')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    const inquiries = [];
    snapshot.forEach(doc => {
      inquiries.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
      });
    });

    res.json({
      success: true,
      data: inquiries
    });

  } catch (error) {
    logger.error('Error fetching support inquiries', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load inquiries'
    });
  }
});

/**
 * @route   GET /api/admin/support/inquiries
 * @desc    Get all support inquiries (admin only)
 * @access  Private (Admin)
 */
router.get('/admin/support/inquiries', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.role || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const snapshot = await db.collection('supportInquiries')
      .orderBy('createdAt', 'desc')
      .get();

    const inquiries = [];
    snapshot.forEach(doc => {
      inquiries.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
      });
    });

    res.json({
      success: true,
      data: inquiries
    });

  } catch (error) {
    logger.error('Error fetching admin support inquiries', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load inquiries'
    });
  }
});

/**
 * @route   PUT /api/admin/support/inquiries/:id
 * @desc    Update support inquiry status (admin only)
 * @access  Private (Admin)
 */
router.put('/admin/support/inquiries/:id', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.role || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const { id } = req.params;
    const { status, isRead } = req.body;

    const updateData = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (status) updateData.status = status;
    if (typeof isRead === 'boolean') updateData.isRead = isRead;

    await db.collection('supportInquiries').doc(id).update(updateData);

    logger.info('Support inquiry updated', { inquiryId: id, status, isRead });

    res.json({
      success: true,
      message: 'Inquiry updated successfully'
    });

  } catch (error) {
    logger.error('Error updating support inquiry', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update inquiry'
    });
  }
});

module.exports = router;

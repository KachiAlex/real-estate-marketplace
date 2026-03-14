const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { createLogger } = require('../config/logger');
const db = require('../config/sequelizeDb');

const logger = createLogger('InquiriesRoutes');

/**
 * @route   GET /api/inquiries
 * @desc    Get all inquiries for the authenticated buyer
 * @access  Private
 * @query   page=1, limit=20, status=pending|responded|closed
 * @returns { success: bool, data: inquiries[], meta: { total, page, limit } }
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const buyerId = req.user.id;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const status = req.query.status;

    logger.info('Fetching inquiries for buyer', { buyerId, page, limit, status });

    const where = { buyerId };
    if (status) {
      where.status = status;
    }

    const { count, rows: inquiries } = await db.PropertyInquiry.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    return res.json({
      success: true,
      data: inquiries,
      meta: {
        total: count,
        page,
        limit,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching inquiries', { error: error.message });
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch inquiries'
    });
  }
});

/**
 * @route   POST /api/inquiries
 * @desc    Create a new inquiry
 * @access  Private
 * @body    { propertyId, vendorId, propertyTitle, propertyPrice, propertyImage, inquiryType, message, conversationId }
 * @returns { success: bool, data: inquiry }
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const buyerId = req.user.id;
    const {
      propertyId,
      vendorId,
      propertyTitle,
      propertyPrice,
      propertyImage,
      inquiryType = 'message',
      message,
      conversationId
    } = req.body;

    // Validate required fields
    if (!propertyId) {
      return res.status(400).json({
        success: false,
        error: 'propertyId is required'
      });
    }

    logger.info('Creating inquiry', { buyerId, propertyId, inquiryType });

    // Check if inquiry already exists for this property and buyer
    const existingInquiry = await db.PropertyInquiry.findOne({
      where: {
        propertyId,
        buyerId,
        status: ['pending', 'responded']
      }
    });

    // If inquiry already exists and is not closed, return it
    if (existingInquiry) {
      logger.info('Inquiry already exists', { inquiryId: existingInquiry.id });
      return res.json({
        success: true,
        data: existingInquiry,
        isExisting: true
      });
    }

    // Create new inquiry
    const inquiry = await db.PropertyInquiry.create({
      propertyId,
      buyerId,
      vendorId: vendorId || null,
      conversationId: conversationId || null,
      propertyTitle,
      propertyPrice,
      propertyImage,
      inquiryType,
      message,
      status: 'pending'
    });

    logger.info('Inquiry created successfully', { inquiryId: inquiry.id });

    return res.json({
      success: true,
      data: inquiry
    });
  } catch (error) {
    logger.error('Error creating inquiry', { error: error.message });
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to create inquiry'
    });
  }
});

/**
 * @route   PUT /api/inquiries/:inquiryId
 * @desc    Update inquiry status
 * @access  Private
 * @body    { status: pending|responded|closed }
 * @returns { success: bool, data: inquiry }
 */
router.put('/:inquiryId', authenticateToken, async (req, res) => {
  try {
    const { inquiryId } = req.params;
    const buyerId = req.user.id;
    const { status } = req.body;

    // Validate status
    if (!['pending', 'responded', 'closed'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be: pending, responded, or closed'
      });
    }

    const inquiry = await db.PropertyInquiry.findOne({
      where: { id: inquiryId, buyerId }
    });

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        error: 'Inquiry not found'
      });
    }

    await inquiry.update({
      status,
      respondedAt: status === 'responded' ? new Date() : inquiry.respondedAt
    });

    logger.info('Inquiry updated', { inquiryId, newStatus: status });

    return res.json({
      success: true,
      data: inquiry
    });
  } catch (error) {
    logger.error('Error updating inquiry', { error: error.message });
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to update inquiry'
    });
  }
});

module.exports = router;

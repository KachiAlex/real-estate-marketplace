const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { sanitizeInput, validate } = require('../middleware/validation');
const { body, param, query } = require('express-validator');
const EscrowTransaction = require('../models/EscrowTransaction');
const Property = require('../models/Property');
const User = require('../models/User');
const notificationService = require('../services/notificationService');

const router = express.Router();

// @desc    Get escrow transactions
// @route   GET /api/escrow
// @access  Private
router.get('/',
  protect,
  sanitizeInput,
  validate([
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
    query('status').optional().isIn(['initiated', 'pending', 'active', 'completed', 'cancelled', 'disputed', 'refunded']).withMessage('Invalid status'),
    query('type').optional().isIn(['buyer', 'seller', 'admin']).withMessage('Invalid type')
  ]),
  async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;

      // Build query based on user role and type
      let query = {};
      
      if (req.user.role === 'admin') {
        // Admin can see all transactions
        if (req.query.status) query.status = req.query.status;
      } else {
        // Regular users can only see their transactions
        if (req.query.type === 'buyer') {
          query.buyerId = req.user._id;
        } else if (req.query.type === 'seller') {
          query.sellerId = req.user._id;
        } else {
          // Show both buyer and seller transactions
          query.$or = [
            { buyerId: req.user._id },
            { sellerId: req.user._id }
          ];
        }
        
        if (req.query.status) query.status = req.query.status;
      }

      const transactions = await EscrowTransaction.find(query)
        .populate('propertyId', 'title price location images')
        .populate('buyerId', 'firstName lastName email phone')
        .populate('sellerId', 'firstName lastName email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await EscrowTransaction.countDocuments(query);

      res.json({
        success: true,
        data: {
          transactions,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalItems: total,
            itemsPerPage: limit,
            hasNextPage: page < Math.ceil(total / limit),
            hasPrevPage: page > 1
          }
        }
      });
    } catch (error) {
      console.error('Get escrow transactions error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch escrow transactions'
      });
    }
  }
);

// @desc    Get escrow transaction by ID
// @route   GET /api/escrow/:id
// @access  Private
router.get('/:id',
  protect,
  sanitizeInput,
  validate([
    param('id').isMongoId().withMessage('Valid escrow transaction ID is required')
  ]),
  async (req, res) => {
    try {
      const transaction = await EscrowTransaction.findById(req.params.id)
        .populate('propertyId', 'title price location images description')
        .populate('buyerId', 'firstName lastName email phone avatar')
        .populate('sellerId', 'firstName lastName email phone avatar')
        .populate('dispute.filedBy', 'firstName lastName email')
        .populate('mediation.initiatedBy', 'firstName lastName email')
        .populate('mediation.resolvedBy', 'firstName lastName email')
        .populate('documents.uploadedBy', 'firstName lastName email')
        .populate('timeline.performedBy', 'firstName lastName email');

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Escrow transaction not found'
        });
      }

      // Check if user has access to this transaction
      const hasAccess = req.user.role === 'admin' || 
                       transaction.buyerId._id.toString() === req.user._id.toString() ||
                       transaction.sellerId._id.toString() === req.user._id.toString();

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view this transaction'
        });
      }

      res.json({
        success: true,
        data: transaction
      });
    } catch (error) {
      console.error('Get escrow transaction error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch escrow transaction'
      });
    }
  }
);

// @desc    Create new escrow transaction
// @route   POST /api/escrow
// @access  Private
router.post('/',
  protect,
  sanitizeInput,
  validate([
    body('propertyId').isMongoId().withMessage('Valid property ID is required'),
    body('amount').isNumeric().isFloat({ min: 100000 }).withMessage('Amount must be at least ₦100,000'),
    body('paymentMethod').isIn(['flutterwave', 'paystack', 'bank_transfer', 'cash']).withMessage('Invalid payment method'),
    body('expectedCompletion').isISO8601().withMessage('Valid expected completion date is required'),
    body('currency').optional().isIn(['NGN', 'USD', 'EUR', 'GBP']).withMessage('Invalid currency')
  ]),
  async (req, res) => {
    try {
      const property = await Property.findById(req.body.propertyId);

      if (!property) {
        return res.status(404).json({
          success: false,
          message: 'Property not found'
        });
      }

      // Check if user is not the property owner
      if (property.ownerId.toString() === req.user._id.toString()) {
        return res.status(400).json({
          success: false,
          message: 'You cannot create an escrow transaction for your own property'
        });
      }

      // Check if property is available
      if (property.status !== 'available') {
        return res.status(400).json({
          success: false,
          message: 'Property is not available for purchase'
        });
      }

      // Check if there's already an active escrow for this property
      const existingEscrow = await EscrowTransaction.findOne({
        propertyId: req.body.propertyId,
        status: { $in: ['initiated', 'pending', 'active'] }
      });

      if (existingEscrow) {
        return res.status(400).json({
          success: false,
          message: 'An active escrow transaction already exists for this property'
        });
      }

      // Calculate fees
      const platformFee = req.body.amount * 0.025; // 2.5% platform fee
      const processingFee = req.body.amount * 0.015; // 1.5% processing fee
      const totalFees = platformFee + processingFee;

      // Generate unique transaction ID
      const transactionId = `ESC${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
      const paymentReference = `PAY${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

      const escrowData = {
        propertyId: req.body.propertyId,
        buyerId: req.user._id,
        sellerId: property.ownerId,
        amount: req.body.amount,
        currency: req.body.currency || 'NGN',
        paymentMethod: req.body.paymentMethod,
        paymentReference,
        transactionId,
        expectedCompletion: new Date(req.body.expectedCompletion),
        fees: {
          platformFee,
          processingFee,
          totalFees
        },
        status: 'initiated'
      };

      const transaction = await EscrowTransaction.create(escrowData);

      // Add to timeline
      transaction.timeline.push({
        action: 'transaction_created',
        description: 'Escrow transaction initiated',
        performedBy: req.user._id,
        metadata: {
          amount: req.body.amount,
          paymentMethod: req.body.paymentMethod
        }
      });

      await transaction.save();

      // Populate the transaction for response
      await transaction.populate([
        { path: 'propertyId', select: 'title price location images' },
        { path: 'buyerId', select: 'firstName lastName email phone' },
        { path: 'sellerId', select: 'firstName lastName email phone' }
      ]);

      // Send notifications
      await notificationService.createNotification({
        recipient: property.ownerId,
        sender: req.user._id,
        type: 'escrow_created',
        title: 'New Escrow Transaction',
        message: `${req.user.firstName} ${req.user.lastName} initiated an escrow transaction for ${property.title}`,
        data: {
          transactionId: transaction._id,
          amount: req.body.amount,
          propertyId: property._id
        }
      });

      res.status(201).json({
        success: true,
        message: 'Escrow transaction created successfully',
        data: transaction
      });
    } catch (error) {
      console.error('Create escrow transaction error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create escrow transaction'
      });
    }
  }
);

// @desc    Update escrow transaction status
// @route   PUT /api/escrow/:id/status
// @access  Private
router.put('/:id/status',
  protect,
  sanitizeInput,
  validate([
    param('id').isMongoId().withMessage('Valid escrow transaction ID is required'),
    body('status').isIn(['pending', 'active', 'completed', 'cancelled', 'disputed']).withMessage('Invalid status'),
    body('notes').optional().isString().withMessage('Notes must be a string')
  ]),
  async (req, res) => {
    try {
      const transaction = await EscrowTransaction.findById(req.params.id)
        .populate('buyerId', 'firstName lastName email')
        .populate('sellerId', 'firstName lastName email')
        .populate('propertyId', 'title');

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Escrow transaction not found'
        });
      }

      // Check authorization
      const isBuyer = transaction.buyerId._id.toString() === req.user._id.toString();
      const isSeller = transaction.sellerId._id.toString() === req.user._id.toString();
      const isAdmin = req.user.role === 'admin';

      if (!isBuyer && !isSeller && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this transaction'
        });
      }

      // Validate status transitions
      const validTransitions = {
        'initiated': ['pending', 'cancelled'],
        'pending': ['active', 'cancelled'],
        'active': ['completed', 'disputed', 'cancelled'],
        'disputed': ['completed', 'cancelled'],
        'completed': [],
        'cancelled': [],
        'refunded': []
      };

      if (!validTransitions[transaction.status]?.includes(req.body.status)) {
        return res.status(400).json({
          success: false,
          message: `Cannot change status from ${transaction.status} to ${req.body.status}`
        });
      }

      // Role-based status change restrictions
      if (req.body.status === 'completed' && !isSeller && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Only seller or admin can mark transaction as completed'
        });
      }

      if (req.body.status === 'disputed' && !isBuyer && !isSeller) {
        return res.status(403).json({
          success: false,
          message: 'Only buyer or seller can dispute transaction'
        });
      }

      const oldStatus = transaction.status;
      transaction.status = req.body.status;

      // Update completion date if completed
      if (req.body.status === 'completed') {
        transaction.actualCompletion = new Date();
      }

      // Add to timeline
      transaction.timeline.push({
        action: 'status_changed',
        description: `Status changed from ${oldStatus} to ${req.body.status}`,
        performedBy: req.user._id,
        metadata: {
          oldStatus,
          newStatus: req.body.status,
          notes: req.body.notes
        }
      });

      await transaction.save();

      // Send notifications based on status change
      let notificationType, title, message;
      
      switch (req.body.status) {
        case 'pending':
          notificationType = 'escrow_payment_received';
          title = 'Payment Received';
          message = `Payment of ₦${transaction.amount.toLocaleString()} has been received for ${transaction.propertyId.title}`;
          break;
        case 'active':
          notificationType = 'escrow_active';
          title = 'Escrow Active';
          message = `Escrow transaction for ${transaction.propertyId.title} is now active`;
          break;
        case 'completed':
          notificationType = 'escrow_completed';
          title = 'Transaction Completed';
          message = `Escrow transaction for ${transaction.propertyId.title} has been completed`;
          break;
        case 'disputed':
          notificationType = 'escrow_disputed';
          title = 'Transaction Disputed';
          message = `Escrow transaction for ${transaction.propertyId.title} has been disputed`;
          break;
        case 'cancelled':
          notificationType = 'escrow_cancelled';
          title = 'Transaction Cancelled';
          message = `Escrow transaction for ${transaction.propertyId.title} has been cancelled`;
          break;
      }

      // Notify both parties
      const recipients = [transaction.buyerId._id, transaction.sellerId._id];
      for (const recipientId of recipients) {
        if (recipientId.toString() !== req.user._id.toString()) {
          await notificationService.createNotification({
            recipient: recipientId,
            sender: req.user._id,
            type: notificationType,
            title,
            message,
            data: {
              transactionId: transaction._id,
              propertyId: transaction.propertyId._id,
              amount: transaction.amount
            }
          });
        }
      }

      res.json({
        success: true,
        message: 'Transaction status updated successfully',
        data: transaction
      });
    } catch (error) {
      console.error('Update escrow status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update transaction status'
      });
    }
  }
);

// @desc    File a dispute
// @route   POST /api/escrow/:id/dispute
// @access  Private
router.post('/:id/dispute',
  protect,
  sanitizeInput,
  validate([
    param('id').isMongoId().withMessage('Valid escrow transaction ID is required'),
    body('reason').isIn(['property_condition', 'title_issues', 'seller_non_compliance', 'buyer_non_compliance', 'payment_issues', 'other']).withMessage('Invalid dispute reason'),
    body('description').trim().isLength({ min: 10, max: 1000 }).withMessage('Description must be between 10 and 1000 characters'),
    body('evidence').optional().isArray().withMessage('Evidence must be an array')
  ]),
  async (req, res) => {
    try {
      const transaction = await EscrowTransaction.findById(req.params.id)
        .populate('buyerId', 'firstName lastName email')
        .populate('sellerId', 'firstName lastName email')
        .populate('propertyId', 'title');

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Escrow transaction not found'
        });
      }

      // Check if user is part of this transaction
      const isBuyer = transaction.buyerId._id.toString() === req.user._id.toString();
      const isSeller = transaction.sellerId._id.toString() === req.user._id.toString();

      if (!isBuyer && !isSeller) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to file dispute for this transaction'
        });
      }

      // Check if transaction can be disputed
      if (!['active', 'pending'].includes(transaction.status)) {
        return res.status(400).json({
          success: false,
          message: 'Transaction cannot be disputed in current status'
        });
      }

      // Check if dispute already exists
      if (transaction.dispute && transaction.dispute.filedBy) {
        return res.status(400).json({
          success: false,
          message: 'Dispute already filed for this transaction'
        });
      }

      transaction.status = 'disputed';
      transaction.dispute = {
        reason: req.body.reason,
        description: req.body.description,
        evidence: req.body.evidence || [],
        filedBy: req.user._id,
        filedAt: new Date()
      };

      // Add to timeline
      transaction.timeline.push({
        action: 'dispute_filed',
        description: `Dispute filed: ${req.body.reason}`,
        performedBy: req.user._id,
        metadata: {
          reason: req.body.reason,
          description: req.body.description
        }
      });

      await transaction.save();

      // Send notifications
      const recipients = [transaction.buyerId._id, transaction.sellerId._id];
      for (const recipientId of recipients) {
        if (recipientId.toString() !== req.user._id.toString()) {
          await notificationService.createNotification({
            recipient: recipientId,
            sender: req.user._id,
            type: 'escrow_disputed',
            title: 'Transaction Disputed',
            message: `A dispute has been filed for the escrow transaction of ${transaction.propertyId.title}`,
            data: {
              transactionId: transaction._id,
              propertyId: transaction.propertyId._id,
              disputeReason: req.body.reason
            }
          });
        }
      }

      // Notify admin
      const adminUsers = await User.find({ role: 'admin' });
      for (const admin of adminUsers) {
        await notificationService.createNotification({
          recipient: admin._id,
          sender: req.user._id,
          type: 'escrow_disputed',
          title: 'New Dispute Filed',
          message: `A dispute has been filed for escrow transaction ${transaction.transactionId}`,
          data: {
            transactionId: transaction._id,
            propertyId: transaction.propertyId._id,
            disputeReason: req.body.reason
          }
        });
      }

      res.json({
        success: true,
        message: 'Dispute filed successfully',
        data: transaction
      });
    } catch (error) {
      console.error('File dispute error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to file dispute'
      });
    }
  }
);

// @desc    Resolve dispute (Admin only)
// @route   PUT /api/escrow/:id/resolve-dispute
// @access  Private (Admin)
router.put('/:id/resolve-dispute',
  protect,
  authorize(['admin']),
  sanitizeInput,
  validate([
    param('id').isMongoId().withMessage('Valid escrow transaction ID is required'),
    body('resolution').isIn(['buyer_favor', 'seller_favor', 'partial_refund', 'full_refund']).withMessage('Invalid resolution'),
    body('adminNotes').trim().isLength({ min: 10, max: 1000 }).withMessage('Admin notes must be between 10 and 1000 characters')
  ]),
  async (req, res) => {
    try {
      const transaction = await EscrowTransaction.findById(req.params.id)
        .populate('buyerId', 'firstName lastName email')
        .populate('sellerId', 'firstName lastName email')
        .populate('propertyId', 'title');

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Escrow transaction not found'
        });
      }

      if (transaction.status !== 'disputed') {
        return res.status(400).json({
          success: false,
          message: 'Transaction is not in disputed status'
        });
      }

      transaction.dispute.resolution = req.body.resolution;
      transaction.dispute.resolvedAt = new Date();
      transaction.dispute.adminNotes = req.body.adminNotes;

      // Update transaction status based on resolution
      if (req.body.resolution === 'full_refund') {
        transaction.status = 'refunded';
      } else {
        transaction.status = 'completed';
        transaction.actualCompletion = new Date();
      }

      // Add to timeline
      transaction.timeline.push({
        action: 'dispute_resolved',
        description: `Dispute resolved: ${req.body.resolution}`,
        performedBy: req.user._id,
        metadata: {
          resolution: req.body.resolution,
          adminNotes: req.body.adminNotes
        }
      });

      await transaction.save();

      // Send notifications
      const recipients = [transaction.buyerId._id, transaction.sellerId._id];
      for (const recipientId of recipients) {
        await notificationService.createNotification({
          recipient: recipientId,
          sender: req.user._id,
          type: 'escrow_resolved',
          title: 'Dispute Resolved',
          message: `The dispute for ${transaction.propertyId.title} has been resolved: ${req.body.resolution}`,
          data: {
            transactionId: transaction._id,
            propertyId: transaction.propertyId._id,
            resolution: req.body.resolution
          }
        });
      }

      res.json({
        success: true,
        message: 'Dispute resolved successfully',
        data: transaction
      });
    } catch (error) {
      console.error('Resolve dispute error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to resolve dispute'
      });
    }
  }
);

// @desc    Upload document to escrow transaction
// @route   POST /api/escrow/:id/documents
// @access  Private
router.post('/:id/documents',
  protect,
  sanitizeInput,
  validate([
    param('id').isMongoId().withMessage('Valid escrow transaction ID is required'),
    body('type').isIn(['contract', 'inspection_report', 'title_deed', 'receipt', 'other']).withMessage('Invalid document type'),
    body('url').isURL().withMessage('Valid document URL is required'),
    body('name').trim().isLength({ min: 1, max: 200 }).withMessage('Document name is required')
  ]),
  async (req, res) => {
    try {
      const transaction = await EscrowTransaction.findById(req.params.id);

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Escrow transaction not found'
        });
      }

      // Check if user is part of this transaction
      const isBuyer = transaction.buyerId.toString() === req.user._id.toString();
      const isSeller = transaction.sellerId.toString() === req.user._id.toString();
      const isAdmin = req.user.role === 'admin';

      if (!isBuyer && !isSeller && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to upload documents for this transaction'
        });
      }

      const document = {
        type: req.body.type,
        url: req.body.url,
        name: req.body.name,
        uploadedBy: req.user._id
      };

      transaction.documents.push(document);

      // Add to timeline
      transaction.timeline.push({
        action: 'document_uploaded',
        description: `Document uploaded: ${req.body.name}`,
        performedBy: req.user._id,
        metadata: {
          documentType: req.body.type,
          documentName: req.body.name
        }
      });

      await transaction.save();

      res.json({
        success: true,
        message: 'Document uploaded successfully',
        data: transaction
      });
    } catch (error) {
      console.error('Upload document error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload document'
      });
    }
  }
);

// @desc    Get escrow statistics
// @route   GET /api/escrow/stats/overview
// @access  Private (Admin)
router.get('/stats/overview',
  protect,
  authorize(['admin']),
  sanitizeInput,
  async (req, res) => {
    try {
      const stats = await EscrowTransaction.aggregate([
        {
          $group: {
            _id: null,
            totalTransactions: { $sum: 1 },
            totalVolume: { $sum: '$amount' },
            totalFees: { $sum: '$fees.totalFees' },
            activeTransactions: {
              $sum: { $cond: [{ $in: ['$status', ['initiated', 'pending', 'active']] }, 1, 0] }
            },
            completedTransactions: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            },
            disputedTransactions: {
              $sum: { $cond: [{ $eq: ['$status', 'disputed'] }, 1, 0] }
            }
          }
        }
      ]);

      const monthlyStats = await EscrowTransaction.aggregate([
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 },
            volume: { $sum: '$amount' },
            fees: { $sum: '$fees.totalFees' }
          }
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 12 }
      ]);

      res.json({
        success: true,
        data: {
          overview: stats[0] || {
            totalTransactions: 0,
            totalVolume: 0,
            totalFees: 0,
            activeTransactions: 0,
            completedTransactions: 0,
            disputedTransactions: 0
          },
          monthlyStats
        }
      });
    } catch (error) {
      console.error('Get escrow stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch escrow statistics'
      });
    }
  }
);

module.exports = router; 
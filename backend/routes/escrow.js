const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { sanitizeInput, validate } = require('../middleware/validation');
const { body, param, query } = require('express-validator');
const escrowService = require('../services/escrowService.clean');

const router = require('express').Router();

const getUserId = (user = {}) => user.id || user._id;
const validateEscrowId = param('id')
  .isString()
  .trim()
  .isLength({ min: 1 })
  .withMessage('Valid escrow transaction ID is required');

const handleServiceError = (res, error, fallbackMessage) => {
  console.error(fallbackMessage, error);
  const status = error.statusCode || 500;
  res.status(status).json({
    success: false,
    message: error.message || fallbackMessage
  });
};

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
      const result = await escrowService.listTransactions({
        user: req.user,
        status: req.query.status,
        type: req.query.type,
        page: req.query.page,
        limit: req.query.limit
      });

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      handleServiceError(res, error, 'Failed to fetch escrow transactions');
    }
  }
);

// @desc    Get escrow transaction by ID
// @route   GET /api/escrow/:id
// @access  Private
router.get('/:id',
  protect,
  sanitizeInput,
  validate([validateEscrowId]),
  async (req, res) => {
    try {
      const transaction = await escrowService.getTransactionById(req.params.id);

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Escrow transaction not found'
        });
      }

      const userId = getUserId(req.user);
      const hasAccess = req.user.role === 'admin' || transaction.buyerId === userId || transaction.sellerId === userId;

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
      handleServiceError(res, error, 'Failed to fetch escrow transaction');
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
    body('propertyId').isString().trim().isLength({ min: 1 }).withMessage('Valid property ID is required'),
    body('amount').isNumeric().isFloat({ min: 100000 }).withMessage('Amount must be at least ₦100,000'),
    body('paymentMethod').isIn(['flutterwave', 'paystack', 'bank_transfer', 'cash']).withMessage('Invalid payment method'),
    body('expectedCompletion').isISO8601().withMessage('Valid expected completion date is required'),
    body('currency').optional().isIn(['NGN', 'USD', 'EUR', 'GBP']).withMessage('Invalid currency')
  ]),
  async (req, res) => {
    try {
      const transaction = await escrowService.createTransaction({
        propertyId: req.body.propertyId,
        amount: Number(req.body.amount),
        paymentMethod: req.body.paymentMethod,
        expectedCompletion: req.body.expectedCompletion,
        currency: req.body.currency,
        buyer: req.user
      });

      res.status(201).json({
        success: true,
        message: 'Escrow transaction created successfully',
        data: transaction
      });
    } catch (error) {
      handleServiceError(res, error, 'Failed to create escrow transaction');
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
    validateEscrowId,
    body('status').isIn(['pending', 'active', 'completed', 'cancelled', 'disputed']).withMessage('Invalid status'),
    body('notes').optional().isString().withMessage('Notes must be a string')
  ]),
  async (req, res) => {
    try {
      const updated = await escrowService.updateStatus({
        transactionId: req.params.id,
        status: req.body.status,
        user: req.user,
        notes: req.body.notes
      });

      res.json({
        success: true,
        message: 'Transaction status updated successfully',
        data: updated
      });
    } catch (error) {
      handleServiceError(res, error, 'Failed to update transaction status');
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
    validateEscrowId,
    body('reason').isIn(['property_condition', 'title_issues', 'seller_non_compliance', 'buyer_non_compliance', 'payment_issues', 'other']).withMessage('Invalid dispute reason'),
    body('description').trim().isLength({ min: 10, max: 1000 }).withMessage('Description must be between 10 and 1000 characters'),
    body('evidence').optional().isArray().withMessage('Evidence must be an array')
  ]),
  async (req, res) => {
    try {
      const transaction = await escrowService.fileDispute({
        transactionId: req.params.id,
        reason: req.body.reason,
        description: req.body.description,
        evidence: req.body.evidence,
        user: req.user
      });

      res.json({
        success: true,
        message: 'Dispute filed successfully',
        data: transaction
      });
    } catch (error) {
      handleServiceError(res, error, 'Failed to file dispute');
    }
  }
);

// @desc    Resolve dispute (Admin only)
// @route   PUT /api/escrow/:id/resolve-dispute
// @access  Private (Admin)
router.put('/:id/resolve-dispute',
  protect,
  authorize('admin'),
  sanitizeInput,
  validate([
    validateEscrowId,
    body('resolution').isIn(['buyer_favor', 'seller_favor', 'partial_refund', 'full_refund']).withMessage('Invalid resolution'),
    body('adminNotes').trim().isLength({ min: 10, max: 1000 }).withMessage('Admin notes must be between 10 and 1000 characters')
  ]),
  async (req, res) => {
    try {
      const transaction = await escrowService.resolveDispute({
        transactionId: req.params.id,
        resolution: req.body.resolution,
        adminNotes: req.body.adminNotes,
        user: req.user
      });

      res.json({
        success: true,
        message: 'Dispute resolved successfully',
        data: transaction
      });
    } catch (error) {
      handleServiceError(res, error, 'Failed to resolve dispute');
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
    validateEscrowId,
    body('type').isIn(['contract', 'inspection_report', 'title_deed', 'receipt', 'other']).withMessage('Invalid document type'),
    body('url').isURL().withMessage('Valid document URL is required'),
    body('name').trim().isLength({ min: 1, max: 200 }).withMessage('Document name is required')
  ]),
  async (req, res) => {
    try {
      const transaction = await escrowService.addDocument({
        transactionId: req.params.id,
        type: req.body.type,
        url: req.body.url,
        name: req.body.name,
        user: req.user
      });

      res.json({
        success: true,
        message: 'Document uploaded successfully',
        data: transaction
      });
    } catch (error) {
      handleServiceError(res, error, 'Failed to upload document');
    }
  }
);

// @desc    Get escrow statistics
// @route   GET /api/escrow/stats/overview
// @access  Private (Admin)
router.get('/stats/overview',
  protect,
  authorize('admin'),
  sanitizeInput,
  async (req, res) => {
    try {
      const stats = await escrowService.getStatistics();
      res.json({ success: true, data: stats });
    } catch (error) {
      handleServiceError(res, error, 'Failed to fetch escrow statistics');
    }
  }
);

module.exports = router;
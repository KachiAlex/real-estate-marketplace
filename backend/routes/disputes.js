const express = require('express');
const { body, param, query } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const { sanitizeInput, validate } = require('../middleware/validation');
const disputeService = require('../services/disputeService');

const router = express.Router();

const handleError = (res, error, fallbackMessage) => {
  console.error('[disputes] ', fallbackMessage, error);
  const statusCode = error.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: error.message || fallbackMessage
  });
};

const disputeIdParam = param('id')
  .isString()
  .trim()
  .notEmpty()
  .withMessage('Valid dispute ID is required');

router.get('/',
  protect,
  sanitizeInput,
  validate([
    query('status')
      .optional()
      .isIn(disputeService.STATUS_FLOW)
      .withMessage('Invalid status filter')
  ]),
  async (req, res) => {
    try {
      const disputes = await disputeService.listDisputes({
        user: req.user,
        status: req.query.status
      });

      res.json({
        success: true,
        data: disputes
      });
    } catch (error) {
      handleError(res, error, 'Failed to fetch disputes');
    }
  }
);

router.get('/:id',
  protect,
  sanitizeInput,
  validate([disputeIdParam]),
  async (req, res) => {
    try {
      const dispute = await disputeService.getDisputeById(req.params.id, req.user);
      res.json({
        success: true,
        data: dispute
      });
    } catch (error) {
      handleError(res, error, 'Failed to fetch dispute');
    }
  }
);

router.post('/',
  protect,
  sanitizeInput,
  validate([
    body('reason')
      .isIn(disputeService.VALID_REASONS)
      .withMessage('Invalid dispute reason'),
    body('description')
      .trim()
      .isLength({ min: 10, max: 1500 })
      .withMessage('Description must be between 10 and 1500 characters'),
    body('attachments')
      .optional()
      .isArray()
      .withMessage('Attachments must be an array'),
    body('propertyId')
      .optional()
      .isString()
      .withMessage('Property ID must be a string'),
    body('escrowId')
      .optional()
      .isString()
      .withMessage('Escrow ID must be a string'),
    body('counterpartyId')
      .optional()
      .isString()
      .withMessage('Counterparty ID must be a string'),
    body()
      .custom((value) => {
        if (!value.propertyId && !value.escrowId) {
          throw new Error('Either propertyId or escrowId is required');
        }
        return true;
      })
  ]),
  async (req, res) => {
    try {
      const dispute = await disputeService.createDispute({
        user: req.user,
        propertyId: req.body.propertyId,
        escrowId: req.body.escrowId,
        counterpartyId: req.body.counterpartyId,
        reason: req.body.reason,
        description: req.body.description,
        attachments: req.body.attachments
      });

      res.status(201).json({
        success: true,
        message: 'Dispute created successfully',
        data: dispute
      });
    } catch (error) {
      handleError(res, error, 'Failed to create dispute');
    }
  }
);

router.post('/:id/messages',
  protect,
  sanitizeInput,
  validate([
    disputeIdParam,
    body('message')
      .trim()
      .isLength({ min: 2, max: 1500 })
      .withMessage('Message must be between 2 and 1500 characters'),
    body('attachments')
      .optional()
      .isArray()
      .withMessage('Attachments must be an array')
  ]),
  async (req, res) => {
    try {
      const dispute = await disputeService.addMessage({
        disputeId: req.params.id,
        message: req.body.message,
        attachments: req.body.attachments,
        user: req.user
      });

      res.json({
        success: true,
        message: 'Message added successfully',
        data: dispute
      });
    } catch (error) {
      handleError(res, error, 'Failed to add dispute message');
    }
  }
);

router.patch('/:id/status',
  protect,
  authorize('admin'),
  sanitizeInput,
  validate([
    disputeIdParam,
    body('status')
      .isIn(disputeService.STATUS_FLOW)
      .withMessage('Invalid dispute status'),
    body('resolutionNotes')
      .optional()
      .trim()
      .isLength({ max: 1500 })
      .withMessage('Resolution notes cannot exceed 1500 characters'),
    body('resolution')
      .optional()
      .isString()
  ]),
  async (req, res) => {
    try {
      const dispute = await disputeService.updateStatus({
        disputeId: req.params.id,
        status: req.body.status,
        resolutionNotes: req.body.resolutionNotes,
        resolution: req.body.resolution,
        user: req.user
      });

      res.json({
        success: true,
        message: 'Dispute status updated successfully',
        data: dispute
      });
    } catch (error) {
      handleError(res, error, 'Failed to update dispute status');
    }
  }
);

module.exports = router;

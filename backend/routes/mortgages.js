const express = require('express');
const { body, validationResult } = require('express-validator');
const MortgageApplication = require('../models/MortgageApplication');
const MortgageBank = require('../models/MortgageBank');
const Property = require('../models/Property');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @desc    Apply for a mortgage
// @route   POST /api/mortgages/apply
// @access  Private (buyer)
router.post(
  '/apply',
  protect,
  [
    body('propertyId').notEmpty().withMessage('Property is required'),
    body('mortgageBankId').notEmpty().withMessage('Mortgage bank is required'),
    body('requestedAmount').isNumeric().withMessage('Requested amount must be a number'),
    body('downPayment').isNumeric().withMessage('Down payment must be a number'),
    body('loanTermYears').isInt({ min: 1, max: 30 }).withMessage('Loan term must be between 1 and 30 years'),
    body('interestRate').isNumeric().withMessage('Interest rate must be a number')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const {
        propertyId,
        mortgageBankId,
        productId,
        requestedAmount,
        downPayment,
        loanTermYears,
        interestRate,
        employmentDetails,
        documents
      } = req.body;

      // Validate property and bank exist
      const property = await Property.findById(propertyId);
      if (!property) {
        return res.status(404).json({ success: false, message: 'Property not found' });
      }

      const bank = await MortgageBank.findById(mortgageBankId);
      if (!bank || !bank.isActive || bank.verificationStatus !== 'approved') {
        return res.status(400).json({ success: false, message: 'Selected mortgage bank is not available' });
      }

      // Simple monthly payment estimate (interest-only approximation)
      const principal = requestedAmount;
      const monthlyRate = interestRate / 100 / 12;
      const numberOfPayments = loanTermYears * 12;
      const estimatedMonthlyPayment =
        monthlyRate === 0
          ? principal / numberOfPayments
          : (principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
            (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

      const application = await MortgageApplication.create({
        property: property._id,
        buyer: req.user.id,
        mortgageBank: bank._id,
        productId: productId || undefined,
        requestedAmount,
        downPayment,
        loanTermYears,
        interestRate,
        estimatedMonthlyPayment: Math.round(estimatedMonthlyPayment),
        employmentDetails,
        documents: documents || []
      });

      return res.status(201).json({
        success: true,
        data: application
      });
    } catch (error) {
      console.error('Error creating mortgage application:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error creating mortgage application'
      });
    }
  }
);

// @desc    Get mortgage applications (buyer sees own, bank sees assigned, admin sees all)
// @route   GET /api/mortgages
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    }

    if (req.user.role === 'admin') {
      // admins see all applications
    } else if (req.user.role === 'mortgage_bank') {
      if (!req.user.mortgageBankProfile) {
        return res.status(400).json({
          success: false,
          message: 'Mortgage bank profile not linked to this user'
        });
      }
      query.mortgageBank = req.user.mortgageBankProfile;
    } else {
      // buyers see their own applications
      query.buyer = req.user.id;
    }

    const applications = await MortgageApplication.find(query)
      .populate('property', 'title price location')
      .populate('buyer', 'firstName lastName email')
      .populate('mortgageBank', 'name');

    return res.json({
      success: true,
      count: applications.length,
      data: applications
    });
  } catch (error) {
    console.error('Error fetching mortgage applications:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching applications'
    });
  }
});

// @desc    Get single mortgage application
// @route   GET /api/mortgages/:id
// @access  Private (buyer owns, bank owns, or admin)
router.get('/:id', protect, async (req, res) => {
  try {
    const app = await MortgageApplication.findById(req.params.id)
      .populate('property', 'title price location')
      .populate('buyer', 'firstName lastName email')
      .populate('mortgageBank', 'name');

    if (!app) {
      return res.status(404).json({ success: false, message: 'Mortgage application not found' });
    }

    const isBuyer = app.buyer.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    const isBank =
      req.user.role === 'mortgage_bank' &&
      req.user.mortgageBankProfile &&
      app.mortgageBank.toString() === req.user.mortgageBankProfile.toString();

    if (!isBuyer && !isAdmin && !isBank) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this application'
      });
    }

    return res.json({
      success: true,
      data: app
    });
  } catch (error) {
    console.error('Error fetching mortgage application:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching application'
    });
  }
});

// @desc    Bank review / decision on mortgage application
// @route   PUT /api/mortgages/:id/review
// @access  Private (mortgage_bank, admin)
router.put(
  '/:id/review',
  protect,
  authorize('mortgage_bank', 'admin'),
  [
    body('decision')
      .isIn(['approved', 'rejected', 'needs_more_info'])
      .withMessage('Decision must be approved, rejected, or needs_more_info')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const app = await MortgageApplication.findById(req.params.id);
      if (!app) {
        return res.status(404).json({ success: false, message: 'Mortgage application not found' });
      }

      // Check authorization for mortgage bank
      if (req.user.role === 'mortgage_bank') {
        if (
          !req.user.mortgageBankProfile ||
          app.mortgageBank.toString() !== req.user.mortgageBankProfile.toString()
        ) {
          return res.status(403).json({
            success: false,
            message: 'Not authorized to review this application'
          });
        }
      }

      const { decision, notes, conditions, loanTerms } = req.body;

      app.status =
        decision === 'approved' ? 'approved' : decision === 'rejected' ? 'rejected' : 'needs_more_info';
      app.bankReview = {
        reviewedBy: req.user.id,
        reviewedAt: new Date(),
        decision,
        notes: notes || '',
        conditions: conditions || [],
        loanTerms: loanTerms || app.bankReview?.loanTerms
      };

      await app.save();

      return res.json({
        success: true,
        message: 'Mortgage application updated successfully',
        data: app
      });
    } catch (error) {
      console.error('Error reviewing mortgage application:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error reviewing application'
      });
    }
  }
);

module.exports = router;



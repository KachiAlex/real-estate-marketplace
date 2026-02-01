const express = require('express');
const { body, validationResult } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const mortgageApplicationService = require('../services/mortgageApplicationService');
const { errorLogger } = require('../config/logger');

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

      const application = await mortgageApplicationService.applyForMortgage({
        buyerId: req.user.id,
        propertyId: req.body.propertyId,
        mortgageBankId: req.body.mortgageBankId,
        productId: req.body.productId,
        requestedAmount: req.body.requestedAmount,
        downPayment: req.body.downPayment,
        loanTermYears: req.body.loanTermYears,
        interestRate: req.body.interestRate,
        employmentDetails: req.body.employmentDetails,
        documents: req.body.documents || []
      });

      return res.status(201).json({
        success: true,
        data: application
      });
    } catch (error) {
      const status = error.statusCode || 500;
      if (status === 500) {
        errorLogger(error, req, { context: 'Mortgage application creation' });
      }
      return res.status(status).json({
        success: false,
        message: error.message || 'Server error while creating mortgage application'
      });
    }
  }
);

// @desc    Submit pre-qualification request
// @route   POST /api/mortgages/prequalify
// @access  Private (buyer)
router.post(
  '/prequalify',
  protect,
  [
    body('mortgageBankId').notEmpty().withMessage('Mortgage bank is required'),
    body('employmentDetails').isObject().withMessage('Employment details are required')
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

      const prequalification = await mortgageApplicationService.submitPrequalification({
        buyerId: req.user.id,
        mortgageBankId: req.body.mortgageBankId,
        employmentDetails: req.body.employmentDetails,
        documents: req.body.documents || []
      });

      return res.status(201).json({
        success: true,
        message: 'Pre-qualification request submitted successfully. You will be contacted within 24 hours.',
        data: prequalification
      });
    } catch (error) {
      const status = error.statusCode || 500;
      if (status === 500) {
        errorLogger(error, req, { context: 'Mortgage prequalification creation' });
      }
      return res.status(status).json({
        success: false,
        message: error.message || 'Server error while creating pre-qualification request'
      });
    }
  }
);

// @desc    Get mortgage applications (buyer sees own, bank sees assigned, admin sees all)
// @route   GET /api/mortgages
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const applications = await mortgageApplicationService.listMortgageApplications({
      role: req.user.role,
      userId: req.user.id,
      mortgageBankId: req.user.mortgageBankProfile,
      status: req.query.status
    });

    return res.json({
      success: true,
      count: applications.length,
      data: applications
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Server error fetching applications'
    });
  }
});

// @desc    Get single mortgage application
// @route   GET /api/mortgages/:id
// @access  Private (buyer owns, bank owns, or admin)
router.get('/:id', protect, async (req, res) => {
  try {
    const app = await mortgageApplicationService.getMortgageApplicationById(req.params.id);

    if (!app) {
      return res.status(404).json({ success: false, message: 'Mortgage application not found' });
    }

    const isBuyer = app.buyer?.id === req.user.id;
    const isAdmin = req.user.role === 'admin';
    const isBank =
      req.user.role === 'mortgage_bank' &&
      req.user.mortgageBankProfile &&
      app.mortgageBank?.id === req.user.mortgageBankProfile;

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

      const updated = await mortgageApplicationService.reviewMortgageApplication({
        applicationId: req.params.id,
        reviewer: {
          id: req.user.id,
          role: req.user.role,
          mortgageBankProfile: req.user.mortgageBankProfile
        },
        decision: req.body.decision,
        notes: req.body.notes,
        conditions: req.body.conditions,
        loanTerms: req.body.loanTerms
      });

      if (!updated) {
        return res.status(404).json({ success: false, message: 'Mortgage application not found' });
      }

      return res.json({
        success: true,
        message: 'Mortgage application updated successfully',
        data: updated
      });
    } catch (error) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Server error reviewing application'
      });
    }
  }
);

// @desc    Activate approved mortgage application (convert to active mortgage)
// @route   POST /api/mortgages/:id/activate
// @access  Private (buyer, mortgage_bank, admin)
router.post(
  '/:id/activate',
  protect,
  async (req, res) => {
    try {
      const mortgage = await mortgageApplicationService.activateMortgage({
        applicationId: req.params.id,
        actor: {
          id: req.user.id,
          role: req.user.role,
          mortgageBankProfile: req.user.mortgageBankProfile
        }
      });

      return res.status(201).json({
        success: true,
        message: 'Mortgage activated successfully',
        data: mortgage
      });
    } catch (error) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Server error activating mortgage'
      });
    }
  }
);

// @desc    Get active mortgages (buyer sees own, bank sees assigned, admin sees all)
// @route   GET /api/mortgages/active
// @access  Private
router.get('/active', protect, async (req, res) => {
  try {
    const mortgages = await mortgageApplicationService.listActiveMortgages({
      role: req.user.role,
      userId: req.user.id,
      mortgageBankId: req.user.mortgageBankProfile,
      status: req.query.status || 'active'
    });

    return res.json({
      success: true,
      count: mortgages.length,
      data: mortgages
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Server error fetching active mortgages'
    });
  }
});

// @desc    Get single active mortgage
// @route   GET /api/mortgages/active/:id
// @access  Private (buyer owns, bank owns, or admin)
router.get('/active/:id', protect, async (req, res) => {
  try {
    const mortgage = await mortgageApplicationService.getMortgageById(req.params.id);

    if (!mortgage) {
      return res.status(404).json({
        success: false,
        message: 'Mortgage not found'
      });
    }

    const isBuyer = mortgage.buyer?.id === req.user.id;
    const isAdmin = req.user.role === 'admin';
    const isBank =
      req.user.role === 'mortgage_bank' &&
      req.user.mortgageBankProfile &&
      mortgage.mortgageBank?.id === req.user.mortgageBankProfile;

    if (!isBuyer && !isAdmin && !isBank) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this mortgage'
      });
    }

    return res.json({
      success: true,
      data: mortgage
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Server error fetching mortgage'
    });
  }
});

module.exports = router;



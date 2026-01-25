const express = require('express');
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const mortgageBankService = require('../services/mortgageBankService');
const userService = require('../services/userService');

const router = express.Router();

// @desc    Register new mortgage bank
// @route   POST /api/mortgage-banks/register
// @access  Public
router.post('/register', [
  body('name').trim().isLength({ min: 2, max: 200 }).withMessage('Bank name must be between 2 and 200 characters'),
  body('registrationNumber').trim().notEmpty().withMessage('Registration number is required'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
  body('address.street').trim().notEmpty().withMessage('Street address is required'),
  body('address.city').trim().notEmpty().withMessage('City is required'),
  body('address.state').trim().notEmpty().withMessage('State is required'),
  body('contactPerson.firstName').trim().notEmpty().withMessage('Contact person first name is required'),
  body('contactPerson.lastName').trim().notEmpty().withMessage('Contact person last name is required'),
  body('contactPerson.email').isEmail().normalizeEmail().withMessage('Contact person email must be valid'),
  body('contactPerson.phone').trim().notEmpty().withMessage('Contact person phone is required'),
  body('contactPerson.position').trim().notEmpty().withMessage('Contact person position is required'),
  body('userAccount.firstName').trim().isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters'),
  body('userAccount.lastName').trim().isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters'),
  body('userAccount.email').isEmail().normalizeEmail().withMessage('User account email must be valid'),
  body('userAccount.password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  validate
], async (req, res) => {
  try {
    const {
      name,
      registrationNumber,
      email,
      phone,
      address,
      contactPerson,
      userAccount,
      documents
    } = req.body;

    const result = await mortgageBankService.registerMortgageBank({
      name,
      registrationNumber,
      email,
      phone,
      address,
      contactPerson,
      userAccount,
      documents
    });

    res.status(201).json({
      success: true,
      message: 'Mortgage bank registration submitted successfully. Please wait for admin verification.',
      data: result
    });
  } catch (error) {
    console.error('Error registering mortgage bank:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering mortgage bank',
      error: error.message
    });
  }
});

// @desc    Get all mortgage banks
// @route   GET /api/mortgage-banks
// @access  Public (active only) / Private (admin sees all)
router.get('/', protect, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const banks = await mortgageBankService.listMortgageBanks({
      isAdmin,
      includeDocuments: false
    });

    res.json({
      success: true,
      count: banks.length,
      data: banks
    });
  } catch (error) {
    console.error('Error fetching mortgage banks:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching mortgage banks',
      error: error.message
    });
  }
});

// @desc    Get single mortgage bank
// @route   GET /api/mortgage-banks/:id
// @access  Public (if active) / Private (bank owner or admin)
router.get('/:id', protect, async (req, res) => {
  try {
    const bank = await mortgageBankService.getMortgageBankById(req.params.id);

    if (!bank) {
      return res.status(404).json({
        success: false,
        message: 'Mortgage bank not found'
      });
    }

    const isOwner = bank.userAccount?.id === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin && (!bank.isActive || bank.verificationStatus !== 'approved')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: bank
    });
  } catch (error) {
    console.error('Error fetching mortgage bank:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching mortgage bank',
      error: error.message
    });
  }
});

// @desc    Update mortgage bank profile
// @route   PUT /api/mortgage-banks/:id
// @access  Private (bank owner only)
router.put('/:id', protect, authorize('mortgage_bank'), [
  body('name').optional().trim().isLength({ min: 2, max: 200 }).withMessage('Bank name must be between 2 and 200 characters'),
  body('phone').optional().trim().notEmpty().withMessage('Phone number is required'),
  body('contactPerson.firstName').optional().trim().notEmpty().withMessage('Contact person first name is required'),
  body('contactPerson.lastName').optional().trim().notEmpty().withMessage('Contact person last name is required'),
  body('contactPerson.email').optional().isEmail().normalizeEmail().withMessage('Contact person email must be valid'),
  body('contactPerson.phone').optional().trim().notEmpty().withMessage('Contact person phone is required'),
  validate
], async (req, res) => {
  try {
    const bank = await mortgageBankService.getMortgageBankById(req.params.id);

    if (!bank) {
      return res.status(404).json({
        success: false,
        message: 'Mortgage bank not found'
      });
    }

    if (bank.userAccount?.id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this bank'
      });
    }

    const allowedUpdates = ['name', 'phone', 'address', 'contactPerson'];
    const updates = {};

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const updatedBank = await mortgageBankService.updateMortgageBankProfile(req.params.id, updates);

    res.json({
      success: true,
      message: 'Bank profile updated successfully',
      data: updatedBank
    });
  } catch (error) {
    console.error('Error updating mortgage bank:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating mortgage bank',
      error: error.message
    });
  }
});

// @desc    Get bank's mortgage products
// @route   GET /api/mortgage-banks/:id/products
// @access  Public (if bank is active)
router.get('/:id/products', async (req, res) => {
  try {
    const bank = await mortgageBankService.getMortgageBankById(req.params.id);

    if (!bank) {
      return res.status(404).json({
        success: false,
        message: 'Mortgage bank not found'
      });
    }

    if (!bank.isActive || bank.verificationStatus !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'Bank is not active'
      });
    }

    const activeProducts = (bank.mortgageProducts || []).filter(product => product.isActive);

    res.json({
      success: true,
      bankName: bank.name,
      count: activeProducts.length,
      data: activeProducts
    });
  } catch (error) {
    console.error('Error fetching bank products:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bank products',
      error: error.message
    });
  }
});

// @desc    Add mortgage product
// @route   POST /api/mortgage-banks/:id/products
// @access  Private (bank owner only)
router.post('/:id/products', protect, authorize('mortgage_bank'), [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('minLoanAmount').isNumeric().withMessage('Minimum loan amount must be a number'),
  body('maxLoanAmount').isNumeric().withMessage('Maximum loan amount must be a number'),
  body('minDownPaymentPercent').isNumeric().withMessage('Down payment percent must be a number'),
  body('maxLoanTerm').isNumeric().withMessage('Loan term must be a number'),
  body('interestRate').isNumeric().withMessage('Interest rate must be a number'),
  validate
], async (req, res) => {
  try {
    const product = await mortgageBankService.addMortgageProduct(
      req.params.id,
      req.user.id,
      {
        name: req.body.name,
        description: req.body.description,
        minLoanAmount: req.body.minLoanAmount,
        maxLoanAmount: req.body.maxLoanAmount,
        minDownPaymentPercent: req.body.minDownPaymentPercent,
        maxLoanTerm: req.body.maxLoanTerm,
        interestRate: req.body.interestRate,
        interestRateType: req.body.interestRateType,
        eligibilityCriteria: req.body.eligibilityCriteria
      }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Mortgage bank not found'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Mortgage product added successfully',
      data: product
    });
  } catch (error) {
    console.error('Error adding mortgage product:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Error adding mortgage product'
    });
  }
});

// @desc    Update mortgage product
// @route   PUT /api/mortgage-banks/:id/products/:productId
// @access  Private (bank owner only)
router.put('/:id/products/:productId', protect, authorize('mortgage_bank'), [
  body('name').optional().trim().notEmpty().withMessage('Product name is required'),
  body('minLoanAmount').optional().isNumeric().withMessage('Minimum loan amount must be a number'),
  body('maxLoanAmount').optional().isNumeric().withMessage('Maximum loan amount must be a number'),
  validate
], async (req, res) => {
  try {
    const product = await mortgageBankService.updateMortgageProduct(
      req.params.id,
      req.user.id,
      req.params.productId,
      req.body
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Mortgage bank or product not found'
      });
    }

    res.json({
      success: true,
      message: 'Mortgage product updated successfully',
      data: product
    });
  } catch (error) {
    console.error('Error updating mortgage product:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Error updating mortgage product'
    });
  }
});

// @desc    Delete mortgage product
// @route   DELETE /api/mortgage-banks/:id/products/:productId
// @access  Private (bank owner only)
router.delete('/:id/products/:productId', protect, authorize('mortgage_bank'), async (req, res) => {
  try {
    const deleted = await mortgageBankService.deleteMortgageProduct(
      req.params.id,
      req.user.id,
      req.params.productId
    );

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Mortgage bank or product not found'
      });
    }

    res.json({
      success: true,
      message: 'Mortgage product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting mortgage product:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Error deleting mortgage product'
    });
  }
});

module.exports = router;


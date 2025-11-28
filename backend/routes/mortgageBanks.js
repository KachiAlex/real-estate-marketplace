const express = require('express');
const { body } = require('express-validator');
const MortgageBank = require('../models/MortgageBank');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

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

    // Check if bank with registration number already exists
    const existingBank = await MortgageBank.findOne({ registrationNumber });
    if (existingBank) {
      return res.status(400).json({
        success: false,
        message: 'A bank with this registration number already exists'
      });
    }

    // Check if email is already in use
    const existingEmail = await MortgageBank.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'A bank with this email already exists'
      });
    }

    // Check if user account email already exists
    const existingUser = await User.findOne({ email: userAccount.email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User account with this email already exists'
      });
    }

    // Create user account for the bank
    const bankUser = await User.create({
      firstName: userAccount.firstName,
      lastName: userAccount.lastName,
      email: userAccount.email,
      password: userAccount.password,
      phone: contactPerson.phone,
      role: 'mortgage_bank',
      isVerified: false,
      isActive: false  // Will be activated after admin approval
    });

    // Create mortgage bank profile
    const mortgageBank = await MortgageBank.create({
      name,
      registrationNumber,
      email,
      phone,
      address: {
        street: address.street,
        city: address.city,
        state: address.state,
        country: address.country || 'Nigeria',
        zipCode: address.zipCode || ''
      },
      contactPerson: {
        firstName: contactPerson.firstName,
        lastName: contactPerson.lastName,
        email: contactPerson.email,
        phone: contactPerson.phone,
        position: contactPerson.position
      },
      documents: documents || [],
      userAccount: bankUser._id,
      verificationStatus: 'pending',
      isActive: false
    });

    // Link bank profile to user account
    bankUser.mortgageBankProfile = mortgageBank._id;
    await bankUser.save();

    res.status(201).json({
      success: true,
      message: 'Mortgage bank registration submitted successfully. Please wait for admin verification.',
      data: {
        bank: mortgageBank,
        user: {
          id: bankUser._id,
          email: bankUser.email,
          role: bankUser.role
        }
      }
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
    
    // Build query - admins see all, public sees only active and approved
    const query = isAdmin ? {} : { isActive: true, verificationStatus: 'approved' };

    const banks = await MortgageBank.find(query)
      .populate('userAccount', 'firstName lastName email')
      .select('-documents')  // Don't send documents in list view
      .sort({ createdAt: -1 });

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
    const bank = await MortgageBank.findById(req.params.id)
      .populate('userAccount', 'firstName lastName email')
      .populate('verifiedBy', 'firstName lastName email');

    if (!bank) {
      return res.status(404).json({
        success: false,
        message: 'Mortgage bank not found'
      });
    }

    // Check access - public can see active banks, bank owner and admin can see all
    const isOwner = bank.userAccount?._id?.toString() === req.user.id;
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
    const bank = await MortgageBank.findById(req.params.id);

    if (!bank) {
      return res.status(404).json({
        success: false,
        message: 'Mortgage bank not found'
      });
    }

    // Check if user owns this bank
    if (bank.userAccount?.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this bank'
      });
    }

    // Only allow updating certain fields (not verification status, etc.)
    const allowedUpdates = ['name', 'phone', 'address', 'contactPerson'];
    const updates = {};
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const updatedBank = await MortgageBank.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('userAccount', 'firstName lastName email');

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
    const bank = await MortgageBank.findById(req.params.id)
      .select('name mortgageProducts isActive verificationStatus');

    if (!bank) {
      return res.status(404).json({
        success: false,
        message: 'Mortgage bank not found'
      });
    }

    // Only show products if bank is active and approved
    if (!bank.isActive || bank.verificationStatus !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'Bank is not active'
      });
    }

    // Filter only active products
    const activeProducts = bank.mortgageProducts.filter(product => product.isActive);

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
    const bank = await MortgageBank.findById(req.params.id);

    if (!bank) {
      return res.status(404).json({
        success: false,
        message: 'Mortgage bank not found'
      });
    }

    // Check if user owns this bank
    if (bank.userAccount?.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add products to this bank'
      });
    }

    const newProduct = {
      name: req.body.name,
      description: req.body.description || '',
      minLoanAmount: req.body.minLoanAmount,
      maxLoanAmount: req.body.maxLoanAmount,
      minDownPaymentPercent: req.body.minDownPaymentPercent,
      maxLoanTerm: req.body.maxLoanTerm,
      interestRate: req.body.interestRate,
      interestRateType: req.body.interestRateType || 'fixed',
      eligibilityCriteria: {
        minMonthlyIncome: req.body.eligibilityCriteria?.minMonthlyIncome || 0,
        minCreditScore: req.body.eligibilityCriteria?.minCreditScore || 0,
        employmentDuration: req.body.eligibilityCriteria?.employmentDuration || 0
      },
      isActive: true
    };

    bank.mortgageProducts.push(newProduct);
    await bank.save();

    res.status(201).json({
      success: true,
      message: 'Mortgage product added successfully',
      data: bank.mortgageProducts[bank.mortgageProducts.length - 1]
    });
  } catch (error) {
    console.error('Error adding mortgage product:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding mortgage product',
      error: error.message
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
    const bank = await MortgageBank.findById(req.params.id);

    if (!bank) {
      return res.status(404).json({
        success: false,
        message: 'Mortgage bank not found'
      });
    }

    // Check if user owns this bank
    if (bank.userAccount?.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update products for this bank'
      });
    }

    const product = bank.mortgageProducts.id(req.params.productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Mortgage product not found'
      });
    }

    // Update product fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined && key !== '_id') {
        if (key === 'eligibilityCriteria' && typeof req.body[key] === 'object') {
          product.eligibilityCriteria = { ...product.eligibilityCriteria, ...req.body[key] };
        } else {
          product[key] = req.body[key];
        }
      }
    });

    await bank.save();

    res.json({
      success: true,
      message: 'Mortgage product updated successfully',
      data: product
    });
  } catch (error) {
    console.error('Error updating mortgage product:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating mortgage product',
      error: error.message
    });
  }
});

// @desc    Delete mortgage product
// @route   DELETE /api/mortgage-banks/:id/products/:productId
// @access  Private (bank owner only)
router.delete('/:id/products/:productId', protect, authorize('mortgage_bank'), async (req, res) => {
  try {
    const bank = await MortgageBank.findById(req.params.id);

    if (!bank) {
      return res.status(404).json({
        success: false,
        message: 'Mortgage bank not found'
      });
    }

    // Check if user owns this bank
    if (bank.userAccount?.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete products for this bank'
      });
    }

    const product = bank.mortgageProducts.id(req.params.productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Mortgage product not found'
      });
    }

    // Soft delete by setting isActive to false instead of removing
    product.isActive = false;
    await bank.save();

    res.json({
      success: true,
      message: 'Mortgage product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting mortgage product:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting mortgage product',
      error: error.message
    });
  }
});

module.exports = router;


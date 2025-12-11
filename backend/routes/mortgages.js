const express = require('express');
const { body, validationResult } = require('express-validator');
const MortgageApplication = require('../models/MortgageApplication');
const Mortgage = require('../models/Mortgage');
const MortgageBank = require('../models/MortgageBank');
const Property = require('../models/Property');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const emailService = require('../services/emailService');
const { errorLogger, infoLogger } = require('../config/logger');

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

      // Populate application for email
      const populatedApplication = await MortgageApplication.findById(application._id)
        .populate('property', 'title location price city state')
        .populate('buyer', 'firstName lastName email');

      // Send email notification to bank (Fix 9)
      try {
        if (bank.userAccount) {
          const bankUser = await User.findById(bank.userAccount).select('firstName lastName email');
          if (bankUser && bankUser.email) {
            // Send email asynchronously (don't block response)
            emailService.sendNewMortgageApplicationEmail(
              populatedApplication,
              bankUser,
              populatedApplication.property,
              populatedApplication.buyer
            ).catch(err => {
              errorLogger(err, null, { context: 'Mortgage application email to bank', applicationId: application._id });
            });
            
            infoLogger('Mortgage application email sent to bank', {
              applicationId: application._id,
              bankId: bank._id,
              bankEmail: bankUser.email
            });
          }
        } else {
          // Fallback: send to bank's contact email if no user account
          const bankEmailUser = {
            firstName: bank.contactPerson?.firstName || bank.name || 'Bank',
            lastName: bank.contactPerson?.lastName || 'Representative',
            email: bank.contactPerson?.email || bank.email
          };
          
          if (bankEmailUser.email) {
            emailService.sendNewMortgageApplicationEmail(
              populatedApplication,
              bankEmailUser,
              populatedApplication.property,
              populatedApplication.buyer
            ).catch(err => {
              errorLogger(err, null, { context: 'Mortgage application email to bank (fallback)', applicationId: application._id });
            });
          }
        }
      } catch (emailError) {
        // Log error but don't fail the request
        errorLogger(emailError, null, { context: 'Mortgage application email notification', applicationId: application._id });
      }

      // Update bank statistics
      try {
        await MortgageBank.findByIdAndUpdate(bank._id, {
          $inc: { 'statistics.totalApplications': 1 }
        });
      } catch (statsError) {
        // Log but don't fail
        console.error('Error updating bank statistics:', statsError);
      }

      return res.status(201).json({
        success: true,
        data: application
      });
    } catch (error) {
      errorLogger(error, req, { context: 'Mortgage application creation' });
      return res.status(500).json({
        success: false,
        message: 'Server error while creating mortgage application',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
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

      const {
        mortgageBankId,
        employmentDetails,
        documents
      } = req.body;

      // Validate bank exists
      const bank = await MortgageBank.findById(mortgageBankId);
      if (!bank || !bank.isActive || bank.verificationStatus !== 'approved') {
        return res.status(400).json({ success: false, message: 'Selected mortgage bank is not available' });
      }

      // Store prequalification request (we can create a separate model or use MortgageApplication with a flag)
      // For now, we'll create a MortgageApplication without a property
      const monthlyIncome = employmentDetails.monthlyIncome || employmentDetails.businessMonthlyIncome || 0;
      
      // Estimate pre-qualification amount (typically 3-5x annual income)
      const annualIncome = monthlyIncome * 12;
      const estimatedMaxLoan = Math.round(annualIncome * 4); // 4x annual income as a conservative estimate
      const estimatedDownPayment = Math.round(estimatedMaxLoan * 0.2); // 20% down payment
      const estimatedPropertyValue = estimatedMaxLoan + estimatedDownPayment;

      // Create a prequalification record (we'll use MortgageApplication with a special status)
      const prequalification = await MortgageApplication.create({
        buyer: req.user.id,
        mortgageBank: bank._id,
        status: 'prequalification_requested',
        requestedAmount: estimatedMaxLoan,
        downPayment: estimatedDownPayment,
        loanTermYears: 25, // Default term
        interestRate: 18.5, // Default rate, will be adjusted by bank
        estimatedMonthlyPayment: Math.round((estimatedMaxLoan * 0.185) / 12), // Rough estimate
        employmentDetails,
        documents: documents || [],
        notes: 'Pre-qualification request - no property selected yet'
      });

      // Populate for email
      const populatedPrequal = await MortgageApplication.findById(prequalification._id)
        .populate('buyer', 'firstName lastName email');

      // Send email notification to bank
      try {
        if (bank.userAccount) {
          const bankUser = await User.findById(bank.userAccount).select('firstName lastName email');
          if (bankUser && bankUser.email) {
            // Send prequalification notification email
            await emailService.sendEmail(
              bankUser.email,
              'New Mortgage Pre-qualification Request',
              `
                <h2>New Pre-qualification Request</h2>
                <p>A new mortgage pre-qualification request has been submitted.</p>
                <h3>Buyer Information:</h3>
                <p><strong>Name:</strong> ${populatedPrequal.buyer.firstName} ${populatedPrequal.buyer.lastName}</p>
                <p><strong>Email:</strong> ${populatedPrequal.buyer.email}</p>
                <h3>Employment Details:</h3>
                <p><strong>Type:</strong> ${employmentDetails.type}</p>
                ${employmentDetails.type === 'employed' ? `
                  <p><strong>Employer:</strong> ${employmentDetails.employerName || 'N/A'}</p>
                  <p><strong>Job Title:</strong> ${employmentDetails.jobTitle || 'N/A'}</p>
                  <p><strong>Years of Employment:</strong> ${employmentDetails.yearsOfEmployment || 'N/A'}</p>
                ` : `
                  <p><strong>Business Name:</strong> ${employmentDetails.businessName || 'N/A'}</p>
                  <p><strong>Business Type:</strong> ${employmentDetails.businessType || 'N/A'}</p>
                `}
                <p><strong>Monthly Income:</strong> ₦${monthlyIncome.toLocaleString()}</p>
                <h3>Estimated Qualification:</h3>
                <p><strong>Estimated Max Loan:</strong> ₦${estimatedMaxLoan.toLocaleString()}</p>
                <p><strong>Estimated Property Value:</strong> ₦${estimatedPropertyValue.toLocaleString()}</p>
                <p>Please review this pre-qualification request and contact the buyer within 24 hours.</p>
              `,
              `New Pre-qualification Request from ${populatedPrequal.buyer.firstName} ${populatedPrequal.buyer.lastName}`
            ).catch(err => {
              errorLogger(err, null, { context: 'Prequalification email to bank', prequalId: prequalification._id });
            });
          }
        }
      } catch (emailError) {
        errorLogger(emailError, null, { context: 'Prequalification email notification', prequalId: prequalification._id });
      }

      return res.status(201).json({
        success: true,
        message: 'Pre-qualification request submitted successfully. You will be contacted within 24 hours.',
        data: {
          prequalificationId: prequalification._id,
          estimatedMaxLoan,
          estimatedPropertyValue,
          estimatedDownPayment
        }
      });
    } catch (error) {
      errorLogger(error, req, { context: 'Mortgage prequalification creation' });
      return res.status(500).json({
        success: false,
        message: 'Server error while creating pre-qualification request',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
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

      const app = await MortgageApplication.findById(req.params.id)
        .populate('property', 'title location price city state')
        .populate('buyer', 'firstName lastName email')
        .populate('mortgageBank', 'name');
      
      if (!app) {
        return res.status(404).json({ success: false, message: 'Mortgage application not found' });
      }

      // Check authorization for mortgage bank
      if (req.user.role === 'mortgage_bank') {
        if (
          !req.user.mortgageBankProfile ||
          app.mortgageBank._id.toString() !== req.user.mortgageBankProfile.toString()
        ) {
          return res.status(403).json({
            success: false,
            message: 'Not authorized to review this application'
          });
        }
      }

      const { decision, notes, conditions, loanTerms } = req.body;
      const oldStatus = app.status;

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

      // Send email notification to buyer if status changed (Fix 10)
      if (oldStatus !== app.status && app.buyer && app.buyer.email) {
        try {
          emailService.sendMortgageApplicationStatusEmail(
            app,
            app.buyer,
            app.property,
            decision,
            notes || ''
          ).catch(err => {
            errorLogger(err, null, { 
              context: 'Mortgage application status email to buyer', 
              applicationId: app._id 
            });
          });

          infoLogger('Mortgage status email sent to buyer', {
            applicationId: app._id,
            buyerId: app.buyer._id,
            buyerEmail: app.buyer.email,
            newStatus: app.status
          });
        } catch (emailError) {
          // Log error but don't fail the request
          errorLogger(emailError, null, { 
            context: 'Mortgage application status email notification', 
            applicationId: app._id 
          });
        }
      }

      // Update bank statistics based on status change
      try {
        const bank = await MortgageBank.findById(app.mortgageBank._id);
        if (bank && oldStatus !== app.status) {
          const incOps = {};
          
          // Decrease old status count
          if (oldStatus === 'approved') {
            incOps['statistics.approvedApplications'] = -1;
          } else if (oldStatus === 'rejected') {
            incOps['statistics.rejectedApplications'] = -1;
          }
          
          // Increase new status count
          if (app.status === 'approved') {
            incOps['statistics.approvedApplications'] = (incOps['statistics.approvedApplications'] || 0) + 1;
          } else if (app.status === 'rejected') {
            incOps['statistics.rejectedApplications'] = (incOps['statistics.rejectedApplications'] || 0) + 1;
          }

          if (Object.keys(incOps).length > 0) {
            await MortgageBank.findByIdAndUpdate(bank._id, { $inc: incOps });
          }
        }
      } catch (statsError) {
        console.error('Error updating bank statistics:', statsError);
      }

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

// @desc    Activate approved mortgage application (convert to active mortgage)
// @route   POST /api/mortgages/:id/activate
// @access  Private (buyer, mortgage_bank, admin)
router.post(
  '/:id/activate',
  protect,
  async (req, res) => {
    try {
      const application = await MortgageApplication.findById(req.params.id)
        .populate('property', 'title price location')
        .populate('buyer', 'firstName lastName email')
        .populate('mortgageBank', 'name');

      if (!application) {
        return res.status(404).json({
          success: false,
          message: 'Mortgage application not found'
        });
      }

      // Check if application is approved
      if (application.status !== 'approved') {
        return res.status(400).json({
          success: false,
          message: 'Only approved applications can be activated'
        });
      }

      // Check if mortgage already exists for this application
      const existingMortgage = await Mortgage.findOne({ application: application._id });
      if (existingMortgage) {
        return res.status(400).json({
          success: false,
          message: 'Mortgage already activated for this application',
          data: existingMortgage
        });
      }

      // Check authorization
      const isBuyer = application.buyer._id.toString() === req.user.id;
      const isAdmin = req.user.role === 'admin';
      const isBank =
        req.user.role === 'mortgage_bank' &&
        req.user.mortgageBankProfile &&
        application.mortgageBank._id.toString() === req.user.mortgageBankProfile.toString();

      if (!isBuyer && !isAdmin && !isBank) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to activate this mortgage'
        });
      }

      // Use approved loan terms from bank review if available, otherwise use application values
      const loanTerms = application.bankReview?.loanTerms || {};
      const loanAmount = loanTerms.approvedAmount || application.requestedAmount;
      const interestRate = loanTerms.interestRate || application.interestRate;
      const loanTermYears = loanTerms.loanTermYears || application.loanTermYears;
      const monthlyPayment = loanTerms.monthlyPayment || application.estimatedMonthlyPayment;
      const downPayment = application.downPayment;

      // Calculate payment schedule details
      const totalPayments = loanTermYears * 12;
      
      // Calculate next payment date (one month from activation date)
      const startDate = new Date();
      const nextPaymentDate = new Date(startDate);
      nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
      // Set to same day of month, or last day if that day doesn't exist
      const dayOfMonth = startDate.getDate();
      const lastDayOfNextMonth = new Date(nextPaymentDate.getFullYear(), nextPaymentDate.getMonth() + 1, 0).getDate();
      nextPaymentDate.setDate(Math.min(dayOfMonth, lastDayOfNextMonth));

      // Create active mortgage
      const mortgage = await Mortgage.create({
        application: application._id,
        property: application.property._id,
        buyer: application.buyer._id,
        mortgageBank: application.mortgageBank._id,
        productId: application.productId,
        loanAmount: loanAmount,
        downPayment: downPayment,
        loanTermYears: loanTermYears,
        interestRate: interestRate,
        monthlyPayment: Math.round(monthlyPayment),
        startDate: startDate,
        nextPaymentDate: nextPaymentDate,
        totalPayments: totalPayments,
        paymentsMade: 0,
        paymentsRemaining: totalPayments,
        remainingBalance: loanAmount,
        totalPaid: 0,
        documents: application.documents || [],
        status: 'active'
      });

      // Update bank statistics
      await MortgageBank.findByIdAndUpdate(application.mortgageBank._id, {
        $inc: { 
          'statistics.activeMortgages': 1,
          'statistics.approvedApplications': -1
        }
      });

      // Return created mortgage with populated fields
      const populatedMortgage = await Mortgage.findById(mortgage._id)
        .populate('property', 'title price location')
        .populate('buyer', 'firstName lastName email')
        .populate('mortgageBank', 'name');

      return res.status(201).json({
        success: true,
        message: 'Mortgage activated successfully',
        data: populatedMortgage
      });
    } catch (error) {
      console.error('Error activating mortgage:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error activating mortgage',
        ...(process.env.NODE_ENV === 'development' && { error: error.message })
      });
    }
  }
);

// @desc    Get active mortgages (buyer sees own, bank sees assigned, admin sees all)
// @route   GET /api/mortgages/active
// @access  Private
router.get('/active', protect, async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};

    // Filter by status if provided (default to 'active')
    query.status = status || 'active';

    if (req.user.role === 'admin') {
      // Admins see all mortgages
    } else if (req.user.role === 'mortgage_bank') {
      if (!req.user.mortgageBankProfile) {
        return res.status(400).json({
          success: false,
          message: 'Mortgage bank profile not linked to this user'
        });
      }
      query.mortgageBank = req.user.mortgageBankProfile;
    } else {
      // Buyers see their own mortgages
      query.buyer = req.user.id;
    }

    const mortgages = await Mortgage.find(query)
      .populate('property', 'title price location images city state')
      .populate('buyer', 'firstName lastName email')
      .populate('mortgageBank', 'name')
      .populate('application', 'status bankReview')
      .sort({ createdAt: -1 }); // Most recent first

    return res.json({
      success: true,
      count: mortgages.length,
      data: mortgages
    });
  } catch (error) {
    console.error('Error fetching active mortgages:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching active mortgages',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
});

// @desc    Get single active mortgage
// @route   GET /api/mortgages/active/:id
// @access  Private (buyer owns, bank owns, or admin)
router.get('/active/:id', protect, async (req, res) => {
  try {
    const mortgage = await Mortgage.findById(req.params.id)
      .populate('property', 'title price location images city state')
      .populate('buyer', 'firstName lastName email phone')
      .populate('mortgageBank', 'name email phone address')
      .populate('application', 'status bankReview documents employmentDetails');

    if (!mortgage) {
      return res.status(404).json({
        success: false,
        message: 'Mortgage not found'
      });
    }

    const isBuyer = mortgage.buyer._id.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    const isBank =
      req.user.role === 'mortgage_bank' &&
      req.user.mortgageBankProfile &&
      mortgage.mortgageBank._id.toString() === req.user.mortgageBankProfile.toString();

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
    console.error('Error fetching active mortgage:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching mortgage',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
});

module.exports = router;



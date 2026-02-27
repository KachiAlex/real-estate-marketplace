const express = require('express');
const { body, validationResult } = require('express-validator');
const { User } = require('../config/sequelizeDb');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Create or update buyer profile
router.post('/profile', authenticateToken, [
  body('preferences.propertyTypes').isArray().withMessage('Property types must be an array'),
  body('preferences.budgetRange').optional().isString().withMessage('Budget range must be a string'),
  body('preferences.locations').isArray().withMessage('Locations must be an array'),
  body('preferences.investmentInterest').isBoolean().withMessage('Investment interest must be boolean'),
  body('preferences.notifications').isBoolean().withMessage('Notifications must be boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { preferences, buyerSince, source } = req.body;
    const userId = req.user.id;

    // Find the user
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user with buyer role if not already present
    const currentRoles = Array.isArray(user.roles) ? user.roles : [];
    if (!currentRoles.includes('buyer')) {
      await user.update({
        roles: [...currentRoles, 'buyer'],
        updatedAt: new Date()
      });
    }

    // Store buyer profile data (you might want to create a separate BuyerProfile model)
    // For now, we'll store it in the user's vendorData or create a new field
    const buyerData = {
      preferences,
      buyerSince: buyerSince || new Date().toISOString(),
      source: source || 'manual',
      updatedAt: new Date()
    };

    // Update user with buyer data
    await user.update({
      buyerData: {
        ...(user.buyerData || {}),
        ...buyerData
      },
      updatedAt: new Date()
    });

    res.json({
      success: true,
      message: 'Buyer profile created successfully',
      data: {
        userId: user.id,
        roles: user.roles,
        buyerData: user.buyerData
      }
    });

  } catch (error) {
    console.error('Buyer profile creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get buyer profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has buyer role
    const currentRoles = Array.isArray(user.roles) ? user.roles : [];
    if (!currentRoles.includes('buyer')) {
      return res.status(403).json({
        success: false,
        message: 'User is not a buyer'
      });
    }

    res.json({
      success: true,
      data: {
        userId: user.id,
        roles: user.roles,
        buyerData: user.buyerData || {}
      }
    });

  } catch (error) {
    console.error('Get buyer profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Update buyer preferences
router.put('/preferences', authenticateToken, [
  body('preferences.propertyTypes').isArray().withMessage('Property types must be an array'),
  body('preferences.budgetRange').optional().isString().withMessage('Budget range must be a string'),
  body('preferences.locations').isArray().withMessage('Locations must be an array'),
  body('preferences.investmentInterest').isBoolean().withMessage('Investment interest must be boolean'),
  body('preferences.notifications').isBoolean().withMessage('Notifications must be boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { preferences } = req.body;
    const userId = req.user.id;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has buyer role
    const currentRoles = Array.isArray(user.roles) ? user.roles : [];
    if (!currentRoles.includes('buyer')) {
      return res.status(403).json({
        success: false,
        message: 'User is not a buyer'
      });
    }

    // Update buyer preferences
    await user.update({
      buyerData: {
        ...(user.buyerData || {}),
        preferences: {
          ...(user.buyerData?.preferences || {}),
          ...preferences
        },
        updatedAt: new Date()
      },
      updatedAt: new Date()
    });

    res.json({
      success: true,
      message: 'Buyer preferences updated successfully',
      data: {
        buyerData: user.buyerData
      }
    });

  } catch (error) {
    console.error('Update buyer preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router;

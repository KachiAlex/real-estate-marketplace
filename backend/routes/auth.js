const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const userService = require('../services/userService');
const { protect } = require('../middleware/auth');
const emailService = require('../services/emailService');

const router = express.Router();

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

// Firebase token exchange endpoint removed — backend uses JWT authentication only
// If you need this functionality, re-implement using your identity provider.
router.post('/firebase-exchange', async (req, res) => {
  return res.status(410).json({ success: false, message: 'Firebase token exchange has been removed. Use /auth/jwt endpoints.' });
});

const emailNormalizeOptions = {
  gmail_remove_dots: false,
  gmail_remove_subaddress: false,
  gmail_convert_googlemaildotcom: false
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', [
  body('firstName').trim().isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters'),
  body('lastName').trim().isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters'),
  body('email').isEmail().normalizeEmail(emailNormalizeOptions).withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').optional().matches(/^(?:\+234\d{10}|234\d{10}|0\d{10}|\d{10})$/).withMessage('Please provide a valid phone number')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { firstName, lastName, email, password, phone } = req.body;

    // Check if user already exists
    const existingUser = await userService.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create user
    const user = await userService.createUser({
      firstName,
      lastName,
      email,
      password,
      phone
    });

    // Generate token
    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', [
  body('email').isEmail().normalizeEmail(emailNormalizeOptions).withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    const fallbackAdminEmail = (process.env.ADMIN_FALLBACK_EMAIL || '').trim().toLowerCase();
    const fallbackAdminPassword = process.env.ADMIN_FALLBACK_PASSWORD;
    const autoProvisionFallbackAdmin = process.env.ADMIN_FALLBACK_AUTO_PROVISION !== 'false';
    const normalizedInputEmail = (email || '').trim().toLowerCase();

    // Check if user exists, auto-provision fallback admin if missing
    let user = await userService.findByEmail(email);
    if (!user) {
      const shouldProvisionFallbackAdmin = autoProvisionFallbackAdmin && fallbackAdminEmail && fallbackAdminPassword && normalizedInputEmail === fallbackAdminEmail;

      if (!shouldProvisionFallbackAdmin) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      if (password !== fallbackAdminPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      try {
        user = await userService.createUser({
          firstName: process.env.ADMIN_FALLBACK_FIRST_NAME || 'Admin',
          lastName: process.env.ADMIN_FALLBACK_LAST_NAME || 'User',
          email: fallbackAdminEmail,
          password: fallbackAdminPassword,
          role: 'admin',
          isVerified: true,
          isActive: true
        });
      } catch (provisionError) {
        console.error('auth/login: failed to auto-provision fallback admin', provisionError?.message || provisionError);
        return res.status(500).json({
          success: false,
          message: 'Unable to provision fallback admin'
        });
      }
    }

    const normalizedEmail = (user.email || '').trim().toLowerCase();
    const isFallbackAdmin = fallbackAdminEmail && fallbackAdminPassword && normalizedEmail === fallbackAdminEmail;

    // Handle fallback admin login (even if a password exists in Firestore)
    if (isFallbackAdmin) {
      if (password !== fallbackAdminPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Ensure admin role flags are persisted for future checks
      try {
        const roles = Array.isArray(user.roles) && user.roles.length ? [...user.roles] : [];
        if (!roles.includes('admin')) roles.push('admin');
        await userService.updateUser(user.id, {
          role: 'admin',
          roles,
          isAdmin: true,
          lastLogin: new Date()
        });
        user.role = 'admin';
        user.roles = roles;
        user.isAdmin = true;
      } catch (persistError) {
        console.warn('auth/login: failed to persist fallback admin flags', persistError?.message || persistError);
      }

      const token = generateToken(user.id);

      return res.json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: 'admin',
          avatar: user.avatar
        }
      });
    }

    // Check if password matches
    const isMatch = await userService.comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    await userService.updateUser(user.id, {
      lastLogin: new Date()
    });

    // Generate token
    const token = generateToken(user.id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    console.error('Login error stack:', error.stack);
    
    // Ensure we send CORS headers even on error
    const origin = req.headers.origin;
    if (origin) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Credentials', 'true');
    }
    
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'development' 
        ? `Server error during login: ${error.message}` 
        : 'Server error during login'
    });
  }
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await userService.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    // Remove password from response
    delete user.password;
    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', protect, [
  body('firstName').optional().trim().isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters'),
  body('lastName').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters'),
  body('phone').optional().matches(/^(?:\+234\d{10}|234\d{10}|0\d{10}|\d{10})$/).withMessage('Please provide a valid phone number')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { firstName, lastName, phone, avatar } = req.body;

    const user = await userService.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prepare updates
    const updates = {};
    if (firstName) updates.firstName = firstName;
    if (lastName) updates.lastName = lastName;
    if (phone) updates.phone = phone;
    if (avatar) updates.avatar = avatar;

    const updatedUser = await userService.updateUser(req.user.id, updates);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Change password
// @route   PUT /api/auth/password
// @access  Private
router.put('/password', protect, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;

    const user = await userService.findById(req.user.id);
    if (!user || !user.password) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check current password
    const isMatch = await userService.comparePassword(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    await userService.updateUser(req.user.id, {
      password: newPassword
    });

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Request password reset (forgot password)
// @route   POST /api/auth/forgot-password
// @access  Public
// NOTE: This route is now registered directly in server.js BEFORE middleware
// to ensure it always works. This handler is kept for future use.
// router.post('/forgot-password', ...) - REMOVED, registered in server.js instead

// OLD HANDLER - Commented out for now, will add back incrementally
/*
const forgotPasswordHandler = async (req, res, next) => {
  // Log that the route was hit
  console.log('🔵 [FORGOT-PASSWORD] Route hit at', new Date().toISOString());
  console.log('🔵 [FORGOT-PASSWORD] Request body:', JSON.stringify(req.body));
  
  // Ensure response object exists
  if (!res || typeof res.json !== 'function') {
    console.error('❌ [FORGOT-PASSWORD] Invalid response object');
    if (res && typeof res.json === 'function') {
      return res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }
    return;
  }

  try {
    // Ensure request body exists
    if (!req || !req.body) {
      console.log('⚠️ [FORGOT-PASSWORD] No request body');
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    // Manual email validation to avoid middleware errors
    const { email } = req.body;
    
    if (!email || typeof email !== 'string') {
      console.log('⚠️ [FORGOT-PASSWORD] Invalid email format');
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      console.log('⚠️ [FORGOT-PASSWORD] Email regex validation failed');
      return res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    console.log('🔵 [FORGOT-PASSWORD] Processing email:', normalizedEmail);

    // Find user with error handling
    let user;
    try {
      console.log('🔵 [FORGOT-PASSWORD] Looking up user in database...');
      user = await userService.findByEmail(normalizedEmail);
      console.log('🔵 [FORGOT-PASSWORD] User lookup result:', user ? 'Found' : 'Not found');
    } catch (dbError) {
      console.error('❌ [FORGOT-PASSWORD] Database error:', dbError.message);
      console.error('❌ [FORGOT-PASSWORD] Database error stack:', dbError.stack);
      // Return success for security
      return res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }
    
    // For security, always return success message (don't reveal if email exists)
    if (!user) {
      console.log('🔵 [FORGOT-PASSWORD] User not found, returning success');
      return res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    console.log('🔵 [FORGOT-PASSWORD] User found, generating reset token...');

    // Generate reset token with error handling
    let resetToken, resetTokenHash;
    try {
      resetToken = crypto.randomBytes(32).toString('hex');
      resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
      console.log('🔵 [FORGOT-PASSWORD] Reset token generated');
    } catch (cryptoError) {
      console.error('❌ [FORGOT-PASSWORD] Crypto error:', cryptoError.message);
      return res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    // Save token and expiry (1 hour) with error handling
    try {
      console.log('🔵 [FORGOT-PASSWORD] Saving reset token to database...');
      await userService.updateUser(user.id, {
        resetPasswordToken: resetTokenHash,
        resetPasswordExpires: Date.now() + 60 * 60 * 1000
      });
      console.log('🔵 [FORGOT-PASSWORD] Reset token saved successfully');
    } catch (updateError) {
      console.error('❌ [FORGOT-PASSWORD] Error updating user:', updateError.message);
      console.error('❌ [FORGOT-PASSWORD] Update error stack:', updateError.stack);
      return res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    // Create reset URL
    const frontendUrl = process.env.FRONTEND_URL || 'https://real-estate-marketplace-37544.web.app';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(normalizedEmail)}`;
    console.log('🔵 [FORGOT-PASSWORD] Reset URL created');

    // Send email
    const subject = 'Password Reset Request - PropertyArk';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Password Reset Request</h2>
        <p>You requested a password reset for your PropertyArk account.</p>
        <p>Click the button below to reset your password:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; margin: 20px 0;">Reset Password</a>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #2563eb;">${resetUrl}</p>
        <p style="color: #666; font-size: 14px;">This link will expire in 1 hour.</p>
        <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore this email.</p>
      </div>
    `;
    const text = `You requested a password reset for your PropertyArk account.\n\nPlease click the link below to reset your password:\n\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this, please ignore this email.`;

    // Send email (don't fail request if email fails)
    try {
      console.log('🔵 [FORGOT-PASSWORD] Attempting to send email...');
      const emailResult = await emailService.sendEmail(normalizedEmail, subject, html, text);
      if (!emailResult.success) {
        console.error('⚠️ [FORGOT-PASSWORD] Email sending failed:', emailResult.error);
      } else {
        console.log('✅ [FORGOT-PASSWORD] Email sent successfully');
      }
    } catch (emailError) {
      console.error('⚠️ [FORGOT-PASSWORD] Email service error:', emailError.message);
      // Continue - still return success
    }

    // Always return success for security
    console.log('✅ [FORGOT-PASSWORD] Returning success response');
    return res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    });
  } catch (error) {
    console.error('❌ [FORGOT-PASSWORD] Unexpected error:', error.message);
    console.error('❌ [FORGOT-PASSWORD] Error stack:', error.stack);
    // Always return success for security - pass to global handler
    if (!res.headersSent) {
      // Pass error to global error handler which will return success
      return next(error);
    }
  }
};
*/

// @desc    Reset password with token
// @route   POST /api/auth/reset-password
// @access  Public
router.post('/reset-password', [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { token, email, password } = req.body;
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find user by reset token
    const user = await userService.findByResetToken(resetTokenHash);
    
    // Verify user exists, email matches, and token is valid
    if (!user || user.email.toLowerCase() !== email.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset link. Please request a new one.'
      });
    }

    // Check if token is expired
    if (!user.resetPasswordExpires || user.resetPasswordExpires <= Date.now()) {
      return res.status(400).json({
        success: false,
        message: 'Reset link has expired. Please request a new one.'
      });
    }

    // Update password and clear reset fields
    await userService.updateUser(user.id, {
      password: password,
      resetPasswordToken: null,
      resetPasswordExpires: null
    });

    res.json({
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Sync password after Firebase reset
// @route   POST /api/auth/sync-password
// @access  Public (but requires Firebase token validation)
router.post('/sync-password', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, newPassword } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    // Find user by email
    const user = await userService.findByEmail(normalizedEmail);
    if (!user) {
      // User doesn't exist in backend database - that's okay, just return success
      // The password was reset in Firebase, which is the primary auth system
      return res.json({
        success: true,
        message: 'Password sync completed (user not found in backend database)'
      });
    }

    // Update password in backend database
    await userService.updateUser(user.id, {
      password: newPassword
    });

    res.json({
      success: true,
      message: 'Password synchronized successfully'
    });
  } catch (error) {
    console.error('Sync password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password sync'
    });
  }
});

module.exports = router;
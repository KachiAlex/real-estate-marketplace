const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const db = require('../config/sequelizeDb');
const { generateTokens, refreshAccessToken } = require('../utils/jwt');
const { authenticateJWT } = require('../middleware/auth');

/**
 * JWT Authentication Routes
 * Replaces Firebase authentication routes
 */

/**
 * POST /auth/register
 * Register new user with email and password
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, role = 'user' } = req.body;

    // Validation
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: email, password, firstName, lastName'
      });
    }

    // Check if user already exists
    const existingUser = await db.User.findOne({ where: { email: email.toLowerCase() } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'Email already registered'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await db.User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName,
      lastName,
      role,
      roles: [role],
      activeRole: role,
      provider: 'email',
      isVerified: false
    });

    // Generate tokens
    const tokens = generateTokens(user);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      ...tokens
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      error: 'Registration failed',
      message: error.message
    });
  }
});

/**
 * POST /auth/login
 * Login with email and password
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Find user
    const user = await db.User.findOne({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Generate tokens
    const tokens = generateTokens(user);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        roles: user.roles
      },
      ...tokens
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Login failed',
      message: error.message
    });
  }
});

/**
 * POST /auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required'
      });
    }

    // Refresh the token
    const newTokens = await refreshAccessToken(refreshToken, db);

    if (!newTokens) {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      ...newTokens
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(500).json({
      success: false,
      error: 'Token refresh failed',
      message: error.message
    });
  }
});

/**
 * POST /auth/change-password
 * Change user password (requires authentication)
 */
router.post('/change-password', authenticateJWT, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Old password and new password are required'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 8 characters long'
      });
    }

    // Find user
    const user = await db.User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Verify old password
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await user.update({ password: hashedPassword });

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({
      success: false,
      error: 'Password change failed',
      message: error.message
    });
  }
});

/**
 * POST /auth/forgot-password
 * Request password reset (placeholder - integrate with email service)
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    const user = await db.User.findOne({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      // Don't reveal if email exists
      return res.status(200).json({
        success: true,
        message: 'If the email exists, a password reset link has been sent'
      });
    }

    // TODO: Generate reset token and send email
    // For now, just return success message

    return res.status(200).json({
      success: true,
      message: 'Password reset link sent to email'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({
      success: false,
      error: 'Password reset failed',
      message: error.message
    });
  }
});

/**
 * GET /auth/me
 * Get current authenticated user
 */
router.get('/me', authenticateJWT, async (req, res) => {
  try {
    const user = await db.User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch user',
      message: error.message
    });
  }
});

/**
 * POST /auth/logout
 * Logout user (token invalidation handled on client)
 */
router.post('/logout', authenticateJWT, (req, res) => {
  try {
    // Token invalidation is typically handled client-side by removing the token
    // You can implement token blacklisting if needed
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
});

module.exports = router;

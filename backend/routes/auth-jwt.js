const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { User } = require('../config/sequelizeDb');
const { verifyToken } = require('../middleware/authJwt');

const router = express.Router();

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'your-secret-key-change-in-production', {
    expiresIn: '30d'
  });
};

// Generate Refresh Token
const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production', {
    expiresIn: '90d'
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim()
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

    const { email, password, firstName, lastName, phone, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email: email.toLowerCase() } });
    if (existingUser) {
      return res.status(409).json({ 
        success: false, 
        message: 'Email already registered' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName,
      lastName,
      phone: phone || null,
      role: role || 'user',
      roles: [role || 'user'],
      provider: 'email',
      isVerified: false,
      isActive: true
    });

    // Generate tokens
    const accessToken = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        roles: user.roles,
        avatar: user.avatar,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    const errMsg = error && error.message ? error.message : String(error);
    const payload = { success: false, message: 'Registration failed', error: errMsg };
    if (process.env.NODE_ENV !== 'production') {
      payload.stack = error.stack || null;
    }
    res.status(500).json(payload);
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
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

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ 
      where: { email: email.toLowerCase() },
      attributes: {
        include: ['password'] // Include password for comparison
      }
    });

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password || '');
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Generate tokens
    const accessToken = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Update last login
    await user.update({ lastLogin: new Date() });

    res.json({
      success: true,
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        roles: user.roles,
        avatar: user.avatar,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Login failed',
      error: error.message 
    });
  }
});

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public (requires valid refresh token)
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ 
        success: false, 
        message: 'Refresh token is required' 
      });
    }

    // Verify refresh token
    try {
      const decoded = jwt.verify(
        refreshToken, 
        process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production'
      );

      // Find user
      const user = await User.findByPk(decoded.userId);
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      // Generate new access token
      const newAccessToken = generateToken(user.id);

      res.json({
        success: true,
        accessToken: newAccessToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          roles: user.roles,
          avatar: user.avatar,
          isVerified: user.isVerified
        }
      });
    } catch (tokenError) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid or expired refresh token' 
      });
    }
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Token refresh failed',
      error: error.message 
    });
  }
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private (requires valid JWT)
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.userId);

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        roles: user.roles,
        avatar: user.avatar,
        isVerified: user.isVerified,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch user profile',
      error: error.message 
    });
  }
});

// @desc    Exchange Google OAuth token for JWT
// @route   POST /api/auth/jwt/google
// @access  Public
// @desc    Get Google OAuth client config
// @route   GET /api/auth/jwt/google-config
// @access  Public
router.get('/google-config', async (req, res) => {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.REACT_APP_GOOGLE_CLIENT_ID || null;
    const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI || `${req.protocol}://${req.get('host')}/auth/google-popup-callback`;

    res.json({
      success: true,
      clientId,
      redirectUri
    });
  } catch (error) {
    console.error('google-config error:', error);
    res.status(500).json({ success: false, message: 'Failed to read Google config' });
  }
});
router.post('/google', async (req, res) => {
  try {
    const { googleToken } = req.body;

    if (!googleToken) {
      return res.status(400).json({
        success: false,
        message: 'Google token is required'
      });
    }

    // Verify Google token with Google's token endpoint
    const axios = require('axios');
    const { OAuth2Client } = require('google-auth-library');

    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    let ticket;
    try {
      ticket = await client.verifyIdToken({
        idToken: googleToken,
        audience: process.env.GOOGLE_CLIENT_ID
      });
    } catch (tokenError) {
      console.error('Google token verification failed:', tokenError.message);
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired Google token'
      });
    }

    const payload = ticket.getPayload();
    const googleId = payload['sub'];
    const email = payload['email'];
    const firstName = payload['given_name'] || '';
    const lastName = payload['family_name'] || '';
    const picture = payload['picture'] || null;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Google account must have an email'
      });
    }

    // Find or create user
    let user = await User.findOne({ where: { email: email.toLowerCase() } });

    if (!user) {
      // Create new user from Google data
      user = await User.create({
        email: email.toLowerCase(),
        firstName: firstName || 'User',
        lastName: lastName || 'Account',
        avatar: picture,
        provider: 'google',
        isVerified: payload['email_verified'] || false,
        isActive: true,
        role: 'user',
        roles: ['user']
      });

      console.log(`[Google Auth] New user created: ${email}`);
    } else {
      // Update existing user with Google info
      const updates = {};
      if (!user.avatar && picture) updates.avatar = picture;
      if (user.provider === 'email') updates.provider = 'google'; // Switch to Google provider
      if (updates) {
        await user.update(updates);
      }
    }

    // Generate JWT tokens
    const accessToken = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Update last login
    await user.update({ lastLogin: new Date() });

    res.json({
      success: true,
      message: 'Google authentication successful',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        role: user.role,
        roles: user.roles,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Google authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Google authentication failed',
      error: error.message
    });
  }
});

// @desc    Logout (client-side: delete tokens from localStorage)
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', verifyToken, (req, res) => {
  // Token invalidation happens client-side by deleting from localStorage
  // Server-side can log logout event if needed
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});



module.exports = router;
/**
 * @desc    Update user profile and avatar
 * @route   POST /api/auth/jwt/update-profile
 * @access  Private (requires valid JWT)
 */
const multer = require('multer');
const path = require('path');
const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(__dirname, '../uploads/avatars'));
    },
    filename: function (req, file, cb) {
      cb(null, `${req.userId}_${Date.now()}${path.extname(file.originalname)}`);
    }
  }),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: function (req, file, cb) {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed!'));
    }
    cb(null, true);
  }
});

router.post('/jwt/update-profile', verifyToken, upload.single('avatar'), async (req, res) => {
router.post('/jwt/update-profile', upload.single('avatar'), async (req, res) => {
// Also support PUT for update-profile
router.put('/jwt/update-profile', upload.single('avatar'), async (req, res) => {
  try {
    const user = await User.findByPk(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    // Update fields
    const { firstName, lastName, phone } = req.body;
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;
    // Avatar upload
    if (req.file) {
      user.avatar = `/uploads/avatars/${req.file.filename}`;
    }
    await user.save();
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role,
        isVerified: user.isVerified,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile', error: error.message });
  }
});
  try {
    const user = await User.findByPk(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    // Update fields
    const { firstName, lastName, phone } = req.body;
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;
    // Avatar upload
    if (req.file) {
      user.avatar = `/uploads/avatars/${req.file.filename}`;
    }
    await user.save();
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role,
        isVerified: user.isVerified,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile', error: error.message });
  }
});

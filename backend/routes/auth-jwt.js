const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { User } = require('../config/sequelizeDb');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const { verifyToken } = require('../middleware/authJwt');

const router = express.Router();

// determine whether SSL was expected (mimics sequelizeDb resolvedRequireSSL)
const LOCAL_DB_REQUIRE_SSL = (process.env.DB_REQUIRE_SSL === 'true') || process.env.NODE_ENV === 'production';

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
  body('lastName').notEmpty().trim(),
  // Accept optional leading + then digits for phone (optional)
  body('phone').optional().matches(/^\+?\d+$/).withMessage('Please provide a valid phone number')
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

    // TEMP LOGGING: capture incoming register requests for debugging
    let { email, password, firstName, lastName, phone, role, roles, vendorKycDocs, countryCode, phoneNumber } = req.body;
    // If countryCode and phoneNumber are provided, normalize into a single phone string
    if (countryCode && phoneNumber) {
      const cc = String(countryCode).trim();
      const pn = String(phoneNumber).trim();
      const normalizedCC = cc.startsWith('+') ? cc : `+${cc}`;
      phone = `${normalizedCC}${pn}`;
    }

    // Check if user already exists. Use safe fallback raw query if model references missing columns
    let existingUser = null;
    try {
      existingUser = await User.findOne({ where: { email: email.toLowerCase() } });
    } catch (dbErr) {
      try {
        const rawSql = 'SELECT id FROM "users" WHERE lower(email) = lower(:email) LIMIT 1';
        const rows = await User.sequelize.query(rawSql, { replacements: { email: email.toLowerCase() }, type: User.sequelize.QueryTypes.SELECT });
        existingUser = (rows && rows.length) ? rows[0] : null;
      } catch (rawErr) {
        console.error('Existing user check failed:', dbErr, rawErr);
        const dbMsg = (dbErr && dbErr.message) ? dbErr.message : String(dbErr);
        if (dbMsg.toLowerCase().includes('does not support ssl') || dbMsg.toLowerCase().includes('server does not support ssl') || (dbMsg.toLowerCase().includes('ssl') && dbMsg.toLowerCase().includes('connection')) ) {
          return res.status(503).json({ success: false, message: 'Database SSL configuration mismatch: backend requires SSL but DB does not support it. For local development the variable defaults to false; set DB_REQUIRE_SSL=false or enable SSL on the DB.', error: dbMsg });
        }
        // If DB auth/connection errors occur, fall back to local JSON user store for development
        const dbMsgLower = (dbErr && dbErr.message) ? dbErr.message.toLowerCase() : String(dbErr).toLowerCase();
        const connErrorPattern = /password authentication failed|could not connect|sequeli?zeconnectionerror/i;
        if (connErrorPattern.test(dbMsgLower)) {
          try {
            const usersPath = path.resolve(__dirname, '..', 'data', 'local_users.json');
            let users = [];
            if (fs.existsSync(usersPath)) {
              try { users = JSON.parse(fs.readFileSync(usersPath, 'utf8') || '[]'); } catch (e) { users = []; }
            }
            const newId = uuidv4();
            const pwd = (req.body && req.body.password) ? req.body.password : 'changeme123';
            const hashed = await bcrypt.hash(pwd, 10);
            const newUser = {
              id: newId,
              email: (req.body && req.body.email) ? req.body.email.toLowerCase() : `local+${newId}@example.com`,
              password: hashed,
              firstName: req.body?.firstName || 'Local',
              lastName: req.body?.lastName || 'User',
              role: 'user',
              roles: ['user'],
              avatar: null,
              isVerified: false,
              createdAt: new Date(),
              updatedAt: new Date()
            };
            users.push(newUser);
            fs.mkdirSync(path.dirname(usersPath), { recursive: true });
            fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));

            const accessToken = generateToken(newId);
            const refreshToken = generateRefreshToken(newId);
            return res.status(201).json({
              success: true,
              message: 'User registered (local fallback)',
              accessToken,
              refreshToken,
              user: {
                id: newUser.id,
                email: newUser.email,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                role: newUser.role,
                roles: newUser.roles,
                avatar: newUser.avatar,
                isVerified: newUser.isVerified
              }
            });
          } catch (localErr) {
            console.error('Local fallback registration failed:', localErr);
          }
        }
        console.error('Existing user check failed:', dbErr, rawErr);
        return res.status(500).json({ success: false, message: 'Registration failed', error: dbErr.message });
      }
    }
    if (existingUser) {
      return res.status(409).json({ 
        success: false, 
        message: 'Email already registered' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Server-side enforcement: require KYC at registration if configured
    const REQUIRE_KYC_ON_REGISTER = (process.env.REQUIRE_KYC_ON_REGISTER || 'false') === 'true';

    // Resolve roles array and primary role
    let resolvedRoles = [];
    if (Array.isArray(roles) && roles.length) {
      resolvedRoles = roles.map(r => String(r).trim()).filter(Boolean);
    } else if (role) {
      resolvedRoles = [String(role).trim()];
    } else {
      resolvedRoles = ['user'];
    }
    // Always include the base 'user' role so vendors remain buyers as well
    if (!resolvedRoles.includes('user')) resolvedRoles.push('user');
    const primaryRole = resolvedRoles.includes('vendor') ? 'vendor' : (resolvedRoles[0] || 'user');

    // Build initial vendorData if user selected vendor at registration and provided KYC docs
    let initialVendorData = null;
    if (resolvedRoles.includes('vendor')) {
      // If KYC is required at register and no docs provided, reject
      if (REQUIRE_KYC_ON_REGISTER && (!Array.isArray(vendorKycDocs) || vendorKycDocs.length === 0)) {
        return res.status(400).json({ success: false, message: 'Vendor registration requires KYC documents at signup' });
      }

      initialVendorData = {
        contactInfo: { email: email.toLowerCase() },
        kycDocs: Array.isArray(vendorKycDocs) ? vendorKycDocs : [],
        kycStatus: (Array.isArray(vendorKycDocs) && vendorKycDocs.length) ? 'pending' : 'required',
        onboardingComplete: Array.isArray(vendorKycDocs) && vendorKycDocs.length ? true : false,
        updatedAt: new Date()
      };
    }

    // Create user (attempt via Sequelize; fall back to raw INSERT if model expects missing columns)
    let user = null;
    try {
      user = await User.create({
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
        phone: phone || null,
        role: primaryRole,
        roles: resolvedRoles,
        activeRole: primaryRole,
        provider: 'email',
        isVerified: false,
        isActive: true,
        vendorData: initialVendorData
      });
    } catch (createErr) {
      // If Sequelize model references columns not present in DB, create via raw SQL with minimal columns
      try {
        const now = new Date();
        const newId = uuidv4();
        const insertSql = `INSERT INTO "users" (id, email, password, "firstName", "lastName", phone, role, roles, "activeRole", provider, "isVerified", "isActive", "vendorData", "createdAt", "updatedAt") VALUES (:id, :email, :password, :firstName, :lastName, :phone, :role, :roles::json, :activeRole, :provider, :isVerified, :isActive, :vendorData::json, :createdAt, :updatedAt) RETURNING *`;
        const replacements = {
          id: newId,
          email: email.toLowerCase(),
          password: hashedPassword,
          firstName,
          lastName,
          phone: phone || null,
          role: primaryRole,
          roles: JSON.stringify(resolvedRoles),
          activeRole: primaryRole,
          provider: 'email',
          isVerified: false,
          isActive: true,
          vendorData: JSON.stringify(initialVendorData),
          createdAt: now,
          updatedAt: now
        };
        const rows = await User.sequelize.query(insertSql, { replacements, type: User.sequelize.QueryTypes.INSERT });
        // Sequelize's query with INSERT returns driver-specific results; fetch by email to get user
        const [fetched] = await User.sequelize.query('SELECT * FROM "users" WHERE lower(email) = lower(:email) LIMIT 1', { replacements: { email: email.toLowerCase() }, type: User.sequelize.QueryTypes.SELECT });
        user = fetched;
      } catch (rawInsertErr) {
        console.error('Raw user insert failed:', createErr, rawInsertErr);
        const msg = (rawInsertErr && rawInsertErr.message) ? rawInsertErr.message : (createErr && createErr.message ? createErr.message : String(rawInsertErr || createErr));
        // same as above: only flag mismatch when SSL was expected
        if (LOCAL_DB_REQUIRE_SSL && (msg.toLowerCase().includes('does not support ssl') || msg.toLowerCase().includes('server does not support ssl') || (msg.toLowerCase().includes('ssl') && msg.toLowerCase().includes('connection')) )) {
          return res.status(503).json({ success: false, message: 'Database SSL configuration mismatch: backend requires SSL but DB does not support it. For local development the variable defaults to false; set DB_REQUIRE_SSL=false or enable SSL on DB.', error: msg });
        }
        // If DB auth/connection errors occur during raw insert attempts, fall back to local JSON store
        const connErrorPattern = /password authentication failed|could not connect|sequeli?zeconnectionerror/i;
        if (connErrorPattern.test(msg)) {
          try {
            const usersPath = path.resolve(__dirname, '..', 'data', 'local_users.json');
            let users = [];
            if (fs.existsSync(usersPath)) {
              try { users = JSON.parse(fs.readFileSync(usersPath, 'utf8') || '[]'); } catch (e) { users = []; }
            }
            const newId = uuidv4();
            const pwd = (req.body && req.body.password) ? req.body.password : 'changeme123';
            const hashed = await bcrypt.hash(pwd, 10);
            const newUser = {
              id: newId,
              email: (req.body && req.body.email) ? req.body.email.toLowerCase() : `local+${newId}@example.com`,
              password: hashed,
              firstName: req.body?.firstName || 'Local',
              lastName: req.body?.lastName || 'User',
              role: 'user',
              roles: ['user'],
              avatar: null,
              isVerified: false,
              createdAt: new Date(),
              updatedAt: new Date()
            };
            users.push(newUser);
            fs.mkdirSync(path.dirname(usersPath), { recursive: true });
            fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));

            const accessToken = generateToken(newId);
            const refreshToken = generateRefreshToken(newId);
            return res.status(201).json({
              success: true,
              message: 'User registered (local fallback)',
              accessToken,
              refreshToken,
              user: {
                id: newUser.id,
                email: newUser.email,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                role: newUser.role,
                roles: newUser.roles,
                avatar: newUser.avatar,
                isVerified: newUser.isVerified
              }
            });
          } catch (localErr) {
            console.error('Local fallback registration failed:', localErr);
          }
        }
        console.error('Raw user insert failed:', createErr, rawInsertErr);
        return res.status(500).json({ success: false, message: 'Registration failed', error: msg });
      }
    }

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
    // Detect common Postgres SSL mismatch error and return clearer status
    // translate SSL errors to user-friendly mismatch only when SSL really is required
    if (LOCAL_DB_REQUIRE_SSL && (errMsg.toLowerCase().includes('server does not support ssl') || errMsg.toLowerCase().includes('does not support ssl'))) {
      const message = 'Database SSL configuration mismatch: backend is configured to use SSL but the database does not support SSL. The DB_REQUIRE_SSL variable defaults to false when missing; set it explicitly to false or enable SSL on the DB.';
      const payload = { success: false, message };
      if (process.env.NODE_ENV !== 'production') payload.debug = errMsg;
      return res.status(503).json(payload);
    }

    // If the error is a DB connection/auth error, fall back to a local JSON user store for development
    const connErrorPattern = /password authentication failed|could not connect|sequeli?zeconnectionerror/i;
    if (connErrorPattern.test(errMsg)) {
      try {
        const usersPath = path.resolve(__dirname, '..', 'data', 'local_users.json');
        let users = [];
        if (fs.existsSync(usersPath)) {
          try { users = JSON.parse(fs.readFileSync(usersPath, 'utf8') || '[]'); } catch (e) { users = []; }
        }
        const newId = uuidv4();
        const pwd = (req.body && req.body.password) ? req.body.password : 'changeme123';
        const hashed = await bcrypt.hash(pwd, 10);
        const newUser = {
          id: newId,
          email: (req.body && req.body.email) ? req.body.email.toLowerCase() : `local+${newId}@example.com`,
          password: hashed,
          firstName: req.body?.firstName || 'Local',
          lastName: req.body?.lastName || 'User',
          role: 'user',
          roles: ['user'],
          avatar: null,
          isVerified: false,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        users.push(newUser);
        fs.mkdirSync(path.dirname(usersPath), { recursive: true });
        fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));

        const accessToken = generateToken(newId);
        const refreshToken = generateRefreshToken(newId);
        return res.status(201).json({
          success: true,
          message: 'User registered (local fallback)',
          accessToken,
          refreshToken,
          user: {
            id: newUser.id,
            email: newUser.email,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            role: newUser.role,
            roles: newUser.roles,
            avatar: newUser.avatar,
            isVerified: newUser.isVerified
          }
        });
      } catch (localErr) {
        console.error('Local fallback registration failed:', localErr);
      }
    }

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

    // Find user by email (robust: handle databases missing optional columns like `suspendedAt`)
    let user = null;
    try {
      user = await User.findOne({
        where: { email: email.toLowerCase() },
        attributes: { include: ['password'] }
      });
    } catch (dbErr) {
      console.warn('User.findOne failed — attempting fallback SELECT (possible missing column):', dbErr.message);
      // Fallback: do a minimal raw SELECT that only references commonly present columns
      try {
        const fallbackSql = 'SELECT id, email, password, "firstName", "lastName", phone, role, roles, avatar, "isVerified" FROM "users" WHERE email = :email LIMIT 1';
        const [rows] = await User.sequelize.query(fallbackSql, { replacements: { email: email.toLowerCase() } });
        user = (rows && rows[0]) ? rows[0] : null; // plain object
      } catch (fallbackErr) {
        console.error('Fallback SELECT failed:', fallbackErr);
        throw dbErr; // rethrow original DB error to surface it
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Compare passwords (user may be a Sequelize instance or plain object from fallback)
    const hashed = (user.password || '');
    const isPasswordValid = await bcrypt.compare(password, hashed);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate tokens
    const accessToken = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Update last login: prefer Sequelize instance update; otherwise fetch instance to update
    try {
      if (typeof user.update === 'function') {
        await user.update({ lastLogin: new Date() });
      } else {
        const userInst = await User.findByPk(user.id);
        if (userInst) await userInst.update({ lastLogin: new Date() });
      }
    } catch (updateErr) {
      console.warn('Failed to update lastLogin (non-fatal):', updateErr.message);
    }

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
        isActive: user.isActive,
        kycStatus: user.kycStatus || (user.vendorData && user.vendorData.kycStatus) || null,
        vendorData: user.vendorData || null
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

// @desc    Update user profile (JWT endpoints)
// @route   PUT /api/auth/jwt/update-profile
// @access  Private (requires valid JWT)
router.put('/update-profile', verifyToken, [
  // same validation as /api/auth/profile
  body('firstName').optional().trim().isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters'),
  body('lastName').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters'),
  body('phone').optional().matches(/^([+]?\d{1,4}[-.\s]?)?(\(?\d{2,4}\)?[-.\s]?){1,4}\d{3,4}$/).withMessage('Please provide a valid phone number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { firstName, lastName, phone, avatar } = req.body;
    const user = await User.findByPk(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const updates = {};
    if (firstName) updates.firstName = firstName;
    if (lastName) updates.lastName = lastName;
    if (phone) updates.phone = phone;
    if (avatar !== undefined) updates.avatar = avatar;

    await user.update(updates);

    // Return updated user (same shape as /me)
    const updated = await User.findByPk(req.userId);
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updated.id,
        email: updated.email,
        firstName: updated.firstName,
        lastName: updated.lastName,
        phone: updated.phone,
        role: updated.role,
        roles: updated.roles,
        avatar: updated.avatar,
        isVerified: updated.isVerified,
        isActive: updated.isActive
      }
    });
  } catch (error) {
    console.error('Update profile (jwt) error:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile', error: error.message });
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

// @desc    Switch user role
// @route   POST /api/auth/jwt/switch-role
// @access  Private (requires valid JWT)
router.post('/switch-role', verifyToken, async (req, res) => {
  try {
    const { role } = req.body;
    if (!role || !['buyer', 'vendor', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }
    const user = await User.findByPk(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    // Add role to roles array if not present
    let roles = Array.isArray(user.roles) ? user.roles : [user.role];
    if (!roles.includes(role)) roles.push(role);
    // Update user role and roles
    await user.update({ role, roles });
    // Generate new tokens
    const accessToken = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);
    res.json({
      success: true,
      message: 'Role switched successfully',
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
        isVerified: user.isVerified,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Switch role error:', error);
    res.status(500).json({ success: false, message: 'Role switch failed', error: error.message });
  }
});

module.exports = router;

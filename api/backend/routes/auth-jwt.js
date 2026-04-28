const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { OAuth2Client } = require('google-auth-library');
const { User } = require('../config/sequelizeDb');
// const { v4: uuidv4 } = require('uuid'); // Using crypto.randomUUID instead
const fs = require('fs');
const path = require('path');
const { verifyToken } = require('../middleware/authJwt');
const { normalizeRoles, chooseActiveRole } = require('../utils/roleUtils');

const router = express.Router();
const util = require('util');
const debugLogPath = path.resolve(__dirname, '..', 'tmp', 'login-debug.log');
try { fs.mkdirSync(path.dirname(debugLogPath), { recursive: true }); } catch(e) {}
const appendDebug = (msg) => {
  try { fs.appendFileSync(debugLogPath, `${new Date().toISOString()} ${msg}\n`); } catch(e) { /* ignore */ }
};

/**
 * Validate password strength
 * Requirements:
 * - Minimum 12 characters
 * - At least one uppercase letter (A-Z)
 * - At least one lowercase letter (a-z)
 * - At least one number (0-9)
 * - At least one special character (!@#$%^&*)
 * @param {string} password - Password to validate
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
const validatePasswordStrength = (password) => {
  const errors = [];

  // Check minimum length
  if (!password || password.length < 12) {
    errors.push('Password must be at least 12 characters long');
  }

  // Check for uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter (A-Z)');
  }

  // Check for lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter (a-z)');
  }

  // Check for number
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number (0-9)');
  }

  // Check for special character
  if (!/[!@#$%^&*()_\-+=\[\]{};:'",.<>?/\\|`~]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*()_-+=[]{};\':\",.<?>/\\|`~)');
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
};

// determine whether SSL was expected (mimics sequelizeDb resolvedRequireSSL)
const LOCAL_DB_REQUIRE_SSL = (process.env.DB_REQUIRE_SSL === 'true') || process.env.NODE_ENV === 'production';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_OAUTH_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '363622331516-csuhmvdqv5cff2js8pe9oatd6259v6tb.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_OAUTH_CLIENT_SECRET || '';
const googleOAuthClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET) : null;

const deriveNamesFromGooglePayload = (payload = {}) => {
  let firstName = payload.given_name;
  let lastName = payload.family_name;
  if ((!firstName || !lastName) && payload.name) {
    const parts = String(payload.name).trim().split(/\s+/).filter(Boolean);
    if (!firstName && parts.length) firstName = parts.shift();
    if (!lastName && parts.length) lastName = parts.join(' ');
  }
  return {
    firstName: firstName || 'Google',
    lastName: lastName || 'User'
  };
};

const ensureRoleArray = (roles, fallbackRole = 'user') => {
  let resolved = [];

  if (Array.isArray(roles) && roles.length) {
    resolved = roles.slice();
  } else if (roles && typeof roles === 'string') {
    const trimmed = roles.trim();
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          resolved = parsed;
        }
      } catch (e) {
        resolved = [trimmed];
      }
    }
    if (!resolved.length) {
      resolved = [trimmed];
    }
  } else if (roles && typeof roles === 'object') {
    resolved = Array.isArray(roles) ? roles.slice() : Object.values(roles).filter(Boolean);
  }

  if ((!resolved || !resolved.length) && fallbackRole) {
    resolved = [fallbackRole];
  }

  const normalized = resolved
    .map(r => String(r).trim().toLowerCase())
    .filter(Boolean);

  const fallback = fallbackRole ? String(fallbackRole).trim().toLowerCase() : null;
  if (fallback && !normalized.includes(fallback)) {
    normalized.push(fallback);
  }

  return Array.from(new Set(normalized));
};

const parseJsonField = (value) => {
  if (!value) return null;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (e) {
      return value;
    }
  }
  return value;
};

const buildUserResponse = (user) => {
  try {
    const safeUser = user && typeof user.toJSON === 'function' ? user.toJSON() : user;
    // CRITICAL FIX: Ensure roles is always an array
    let roles = ensureRoleArray(safeUser.roles, safeUser.role || 'user');
    let activeRole = safeUser.activeRole ? String(safeUser.activeRole).trim().toLowerCase() : null;
    if (!activeRole && roles.length) {
      activeRole = roles[0];
    }
    
    // 🔒 LOCK ADMIN: If user has 'admin' in roles, ensure role and activeRole are 'admin'
    if (roles.includes('admin')) {
      activeRole = 'admin';
      safeUser.role = 'admin';
    }

    let vendorData = null;
    let buyerData = null;
    let kycStatus = null;
    
    try {
      vendorData = parseJsonField(safeUser.vendorData);
    } catch (e) {
      console.warn('Error parsing vendorData:', e.message);
      vendorData = null;
    }
    
    try {
      buyerData = parseJsonField(safeUser.buyerData);
    } catch (e) {
      console.warn('Error parsing buyerData:', e.message);
      buyerData = null;
    }
    
    try {
      kycStatus = safeUser.kycStatus || vendorData?.kycStatus || null;
    } catch (e) {
      console.warn('Error getting kycStatus:', e.message);
      kycStatus = null;
    }

    return {
      id: safeUser.id,
      email: safeUser.email,
      firstName: safeUser.firstName,
      lastName: safeUser.lastName,
      phone: safeUser.phone,
      role: safeUser.role,
      roles: roles,  // CRITICAL: Always return as array
      activeRole: activeRole || safeUser.role || 'user',
      avatar: safeUser.avatar,
      isVerified: safeUser.isVerified,
      isActive: safeUser.isActive,
      vendorData,
      buyerData,
      kycStatus
    };
  } catch (err) {
    console.error('buildUserResponse error:', err);
    throw new Error('Failed to build user response: ' + (err.message || String(err)));
  }
};

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
  body('password').custom((value) => {
    const validation = validatePasswordStrength(value);
    if (!validation.isValid) {
      throw new Error(validation.errors.join('. '));
    }
    return true;
  }),
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
    let { email, password, firstName, lastName, phone, role, roles, vendorKycDocs, countryCode, phoneNumber, buyer, vendor } = req.body;
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
            const newId = require('crypto').randomUUID();
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
    const { normalizeRoles, chooseActiveRole } = require('../utils/roleUtils');
    // Determine if registration UI explicitly marked both buyer and vendor.
    const buyerFlag = buyer === true || String(buyer).toLowerCase() === 'true';
    const vendorFlag = vendor === true || String(vendor).toLowerCase() === 'true';

    // If both buyer and vendor were selected in the register modal, enforce roles ['user','vendor']
    let resolvedRoles;
    if (buyerFlag && vendorFlag) {
      resolvedRoles = normalizeRoles(['user', 'vendor']);
    } else {
      resolvedRoles = normalizeRoles(Array.isArray(roles) && roles.length ? roles : role ? [role] : ['user']);
    }
    // If a user requested the vendor role at signup, keep their primary role as 'user'
    // until KYC verification completes. We still persist 'vendor' in `roles` so UI
    // and flows can reflect pending vendor status, but do not make vendor the
    // active/primary role automatically to avoid exposing vendor-only features.
    let primaryRole;
    if (resolvedRoles.includes('vendor')) {
      primaryRole = chooseActiveRole(null, 'user', resolvedRoles);
    } else {
      primaryRole = chooseActiveRole(null, resolvedRoles[0], resolvedRoles);
    }

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
        // Mark vendor KYC as 'pending' when role is requested; onboardingComplete is true only
        // when KYC documents were provided at signup.
        kycStatus: 'pending',
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
            const newId = require('crypto').randomUUID();
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

    // Phase 2.4: Generate email verification token (24-hour expiry)
    const crypto = require('crypto');
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenHash = crypto.createHash('sha256').update(verificationToken).digest('hex');
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    // Update user with verification token
    try {
      await User.update(
        {
          verificationToken: verificationTokenHash,
          verificationExpires: verificationTokenExpiry
        },
        { where: { id: user.id } }
      );
    } catch (updateErr) {
      console.warn('⚠️ Failed to update verification token:', updateErr.message);
      // Continue with registration even if token update fails
    }

    // Send verification email (Phase 2.4)
    const emailService = require('../services/emailService');
    const verificationUrl = `${process.env.FRONTEND_URL || 'https://yourapp.com'}/verify-email?token=${verificationToken}&email=${encodeURIComponent(user.email)}`;
    try {
      await emailService.sendEmail(
        user.email,
        'Email Verification Required - PropertyArk',
        `
          <h2>Welcome to PropertyArk, ${user.firstName}!</h2>
          <p>Please verify your email address by clicking the link below:</p>
          <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
            Verify Email
          </a>
          <p>Or paste this link in your browser:</p>
          <p><code>${verificationUrl}</code></p>
          <p>This verification link will expire in 24 hours.</p>
          <p>If you did not create this account, please ignore this email.</p>
        `,
        `Welcome to PropertyArk, ${user.firstName}!\n\nPlease verify your email by visiting: ${verificationUrl}\n\nThis link expires in 24 hours.`
      );
    } catch (emailError) {
      console.warn('⚠️ Failed to send verification email:', emailError.message);
      // Don't fail registration if email fails, but log the issue
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please check your email to verify your account.',
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
        isVerified: false
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

// @desc    Google OAuth login/signup
// @route   POST /api/auth/google
// @access  Public
router.post('/google', async (req, res) => {
  try {
    if (!googleOAuthClient || !GOOGLE_CLIENT_ID) {
      return res.status(503).json({ success: false, message: 'Google OAuth is not configured on the server' });
    }

    const { code, idToken } = req.body || {};

    // Handle authorization code flow (preferred)
    if (code) {
      try {
        // Exchange authorization code for tokens
        const { tokens } = await googleOAuthClient.getToken(code);
        const idTokenFromCode = tokens.id_token;

        if (!idTokenFromCode) {
          return res.status(400).json({ success: false, message: 'Failed to obtain ID token from authorization code' });
        }

        const ticket = await googleOAuthClient.verifyIdToken({ idToken: idTokenFromCode, audience: GOOGLE_CLIENT_ID });
        const payload = ticket.getPayload();

        const email = payload && payload.email ? payload.email.toLowerCase() : null;
        if (!email) {
          return res.status(400).json({ success: false, message: 'Google account lacks a verified email' });
        }

        const { firstName, lastName } = deriveNamesFromGooglePayload(payload);
        const avatar = payload && payload.picture ? payload.picture : null;
        const emailVerified = payload && payload.email_verified !== false;

        let user;
        try {
          user = await User.findOne({ where: { email } });
        } catch (lookupErr) {
          console.error('Google sign-in lookup failed:', lookupErr);
          return res.status(500).json({ success: false, message: 'Failed to check user record', error: lookupErr.message });
        }

        if (!user) {
          try {
            user = await User.create({
              email,
              firstName,
              lastName,
              password: null,
              avatar,
              isVerified: emailVerified,
              role: 'user',
              roles: ['user']
            });
          } catch (createErr) {
            console.error('Google sign-in user creation failed:', createErr);
            return res.status(500).json({ success: false, message: 'Failed to create user record', error: createErr.message });
          }
        }

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        return res.json({
          success: true,
          message: 'Google sign-in successful',
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
      } catch (codeErr) {
        console.error('Google authorization code exchange failed:', codeErr);
        return res.status(401).json({ success: false, message: 'Invalid authorization code' });
      }
    }

    // Handle implicit flow (legacy, for backward compatibility)
    if (idToken) {
      let payload;
      try {
        const ticket = await googleOAuthClient.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
        payload = ticket.getPayload();
      } catch (verifyErr) {
        console.error('Google token verification failed:', verifyErr && verifyErr.message ? verifyErr.message : verifyErr);
        return res.status(401).json({ success: false, message: 'Invalid Google token' });
      }

      const email = payload && payload.email ? payload.email.toLowerCase() : null;
      if (!email) {
        return res.status(400).json({ success: false, message: 'Google account lacks a verified email' });
      }

      const { firstName, lastName } = deriveNamesFromGooglePayload(payload);
      const avatar = payload && payload.picture ? payload.picture : null;
      const emailVerified = payload && payload.email_verified !== false;
      const now = new Date();

      let user;
      try {
        user = await User.findOne({ where: { email } });
      } catch (lookupErr) {
        console.error('Google sign-in lookup failed:', lookupErr);
        return res.status(500).json({ success: false, message: 'Failed to check user record', error: lookupErr.message });
      }

      if (!user) {
        try {
          user = await User.create({
            email,
            firstName,
            lastName,
            password: null,
            role: 'user',
            roles: ['user'],
            activeRole: 'user',
            provider: 'google',
            avatar,
            isVerified: emailVerified,
            isActive: true,
            lastLogin: now
          });
        } catch (createErr) {
          console.error('Google user creation failed:', createErr);
          return res.status(500).json({ success: false, message: 'Unable to create account from Google profile', error: createErr.message });
        }
      } else {
        const updates = {};
        if ((!user.firstName || user.firstName === 'Google') && firstName) updates.firstName = firstName;
        if ((!user.lastName || user.lastName === 'User') && lastName) updates.lastName = lastName;
        if (avatar && avatar !== user.avatar) updates.avatar = avatar;
        if (!user.provider || user.provider === 'email') updates.provider = 'google';
        if (!Array.isArray(user.roles) || !user.roles.length) updates.roles = ['user'];
        if (!user.activeRole) updates.activeRole = 'user';
        if (!user.isVerified && emailVerified) updates.isVerified = true;
        updates.lastLogin = now;
        try {
          await user.update(updates);
          if (typeof user.reload === 'function') {
            await user.reload();
          } else {
            user = await User.findByPk(user.id) || user;
          }
        } catch (updateErr) {
          console.warn('Google sign-in update failed:', updateErr && updateErr.message ? updateErr.message : updateErr);
        }
      }

      const accessToken = generateToken(user.id);
      const refreshToken = generateRefreshToken(user.id);

      return res.json({
        success: true,
        message: 'Google sign-in successful',
        accessToken,
        refreshToken,
        user: buildUserResponse(user)
      });
    }

    return res.status(400).json({ success: false, message: 'Missing authorization code or ID token' });
  } catch (error) {
    console.error('Google sign-in error:', error);
    return res.status(500).json({ success: false, message: 'Google sign-in failed', error: error.message });
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
    const requestId = req.get('x-debug-request-id') || req.get('x-request-id') || `login-${Date.now()}`;
    res.setHeader('X-Debug-Request-Id', requestId);
    appendDebug(`login:start requestId=${requestId} ip=${req.ip || 'unknown'} ua=${req.get('user-agent') || 'unknown'}`);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      appendDebug(`validation:failed requestId=${requestId} ${JSON.stringify(errors.array())}`);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
        requestId
      });
    }

    const { email, password } = req.body;
    appendDebug(`received body requestId=${requestId} ${JSON.stringify({ email: email ? String(email).toLowerCase() : null })}`);

    // Find user by email (robust: handle databases missing optional columns like `suspendedAt`)
    let user = null;
    try {
      user = await User.findOne({
        where: { email: email.toLowerCase() },
        attributes: { include: ['password'] }
      });
    } catch (dbErr) {
      appendDebug(`user.findOne:error requestId=${requestId} ${dbErr && dbErr.message ? dbErr.message : String(dbErr)}`);
      console.warn('User.findOne failed — attempting fallback SELECT (possible missing column):', dbErr.message);
      // Fallback: do a minimal raw SELECT that only references commonly present columns
      try {
        const fallbackSql = 'SELECT id, email, password, "firstName", "lastName", phone, role, roles, "activeRole", avatar, "isVerified", "isActive" FROM "users" WHERE email = :email LIMIT 1';
        const [rows] = await User.sequelize.query(fallbackSql, { replacements: { email: email.toLowerCase() } });
        user = (rows && rows[0]) ? rows[0] : null; // plain object
        // CRITICAL FIX: Parse roles from JSON string if needed
        if (user && typeof user.roles === 'string') {
          try {
            user.roles = JSON.parse(user.roles);
          } catch (e) {
            user.roles = [user.role || 'user'];
          }
        } else if (user && !Array.isArray(user.roles)) {
          user.roles = [user.role || 'user'];
        }
      } catch (fallbackErr) {
        console.error('Fallback SELECT failed:', fallbackErr);
        // If DB connection/auth errors occur, attempt local JSON user fallback (development)
        const connErrorPattern = /password authentication failed|could not connect|sequeli?zeconnectionerror|connection refused/i;
        const errPayload = `${dbErr && dbErr.message ? dbErr.message : ''} ${dbErr && dbErr.name ? dbErr.name : ''} ${JSON.stringify(dbErr && (dbErr.parent || dbErr.original) ? (dbErr.parent || dbErr.original) : {})}`;
        const isConnErr = connErrorPattern.test(String(errPayload).toLowerCase()) || (dbErr && dbErr.name && String(dbErr.name).toLowerCase().includes('connectionrefused')) || (dbErr && dbErr.parent && String(dbErr.parent.code || '').toLowerCase().includes('econnrefused'));
        if (isConnErr) {
          try {
            const usersPath = path.resolve(__dirname, '..', 'data', 'local_users.json');
            let users = [];
            if (fs.existsSync(usersPath)) {
              try { users = JSON.parse(fs.readFileSync(usersPath, 'utf8') || '[]'); } catch (e) { users = []; }
            }
            const found = users.find(u => (u.email || '').toLowerCase() === (email || '').toLowerCase());
            if (found) {
              user = found;
            }
          } catch (localErr) {
            console.warn('Local user fallback during findOne failed', localErr && localErr.message);
          }
          // continue — if user remains null, outer code will handle 401
        } else {
          throw dbErr; // rethrow original DB error to surface it
        }
      }
    }

    if (!user) {
      appendDebug('user:not-found-in-db, checking local json');
      // Try local JSON fallback (development): backend may be running without Postgres
      try {
        const usersPath = path.resolve(__dirname, '..', 'data', 'local_users.json');
        if (fs.existsSync(usersPath)) {
          const list = JSON.parse(fs.readFileSync(usersPath, 'utf8') || '[]');
          const found = list.find(u => (u.email || '').toLowerCase() === (email || '').toLowerCase());
          if (found) {
            // Ensure roles is an array for local users too
            if (typeof found.roles === 'string') {
              try { found.roles = JSON.parse(found.roles); } catch (e) { found.roles = [found.role || 'user']; }
            } else if (!Array.isArray(found.roles)) {
              found.roles = [found.role || 'user'];
            }
            user = found;
          }
        }
      } catch (localErr) {
        console.warn('Local user lookup failed', localErr && localErr.message);
      }
    }

    if (!user) {
      appendDebug(`user:still-not-found requestId=${requestId} -> returning 401`);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        requestId
      });
    }

    // Compare passwords (user may be a Sequelize instance or plain object from fallback)
    const hashed = (user.password || '');
    appendDebug(`user:found requestId=${requestId} id=` + (user.id || user.email) + ' hashedLength=' + (hashed ? hashed.length : 0));
    const isPasswordValid = await bcrypt.compare(password, hashed);
    appendDebug(`password:compare requestId=${requestId} result=` + isPasswordValid);
    if (!isPasswordValid) {
      appendDebug(`password:invalid requestId=${requestId} -> returning 401`);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        requestId
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

    let userResponse;
    try {
      userResponse = buildUserResponse(user);
      appendDebug('buildUserResponse:success');
    } catch (buildErr) {
      appendDebug('buildUserResponse:error ' + (buildErr && buildErr.message ? buildErr.message : JSON.stringify(buildErr || {})));
      console.error('Error building user response:', buildErr);
      throw buildErr;
    }

    res.json({
      success: true,
      message: 'Login successful',
      requestId,
      accessToken,
      refreshToken,
      user: userResponse
    });
  } catch (error) {
    appendDebug(`login:error requestId=${requestId} ` + (error && error.message ? error.message : JSON.stringify(error || {})));
    console.error('Login error:', error);
    try {
      console.error('Login error (detailed):', util.inspect(error, { depth: 5 }));
    } catch (inspectErr) {
      console.error('Failed to inspect error object:', inspectErr);
    }

    const errMsg = (error && error.message) ? error.message : (typeof error === 'string' ? error : JSON.stringify(error || {}));
    const payload = { success: false, message: 'Server error during login. ' + errMsg, error: errMsg, requestId };
    if (process.env.NODE_ENV !== 'production' && error && error.stack) payload.stack = error.stack;
    res.status(500).json(payload);
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
        user: buildUserResponse(user)
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

// Phase 2.4: Email Verification Endpoint  
// @desc    Verify email with token
// @route   POST /api/auth/verify-email
// @access  Public
router.post('/verify-email', [
  body('token').isLength({ min: 64, max: 64 }).withMessage('Invalid verification token'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email')
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

    const { token, email } = req.body;
    const crypto = require('crypto');

    // Find user by email
    let user = null;
    try {
      user = await User.findOne({ where: { email: email.toLowerCase() } });
    } catch (dbErr) {
      try {
        const rows = await User.sequelize.query('SELECT * FROM "users" WHERE lower(email) = lower(:email) LIMIT 1', { replacements: { email: email.toLowerCase() }, type: User.sequelize.QueryTypes.SELECT });
        user = rows && rows.length ? rows[0] : null;
      } catch (rawErr) {
        console.error('Email verification: user lookup failed:', dbErr, rawErr);
        return res.status(500).json({
          success: false,
          message: 'Email verification failed'
        });
      }
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is already verified
    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    // Validate verification token
    if (!user.verificationToken || !user.verificationExpires) {
      return res.status(400).json({
        success: false,
        message: 'Verification token not found or expired. Please register again.'
      });
    }

    // Check if token has expired
    if (new Date() > new Date(user.verificationExpires)) {
      return res.status(400).json({
        success: false,
        message: 'Verification token has expired. Please register again.'
      });
    }

    // Hash provided token and compare with stored hash
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    if (tokenHash !== user.verificationToken) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification token'
      });
    }

    // Mark user as verified and clear verification token
    try {
      await User.update(
        {
          isVerified: true,
          verificationToken: null,
          verificationExpires: null
        },
        { where: { id: user.id } }
      );
    } catch (updateErr) {
      console.error('Failed to update user verification status:', updateErr);
      return res.status(500).json({
        success: false,
        message: 'Failed to verify email'
      });
    }

    // Fetch updated user
    const updatedUser = await User.findByPk(user.id);

    res.json({
      success: true,
      message: 'Email verified successfully. Your account is now active.',
      user: {
        id: updatedUser.id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        role: updatedUser.role,
        isVerified: updatedUser.isVerified
      }
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during email verification'
    });
  }
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private (requires valid JWT)
router.get('/me', verifyToken, async (req, res) => {
  try {
    let user = null;
    // Try DB lookup first; handle invalid UUIDs or DB errors by falling back to local JSON
    try {
      user = await User.findByPk(req.userId);
    } catch (dbErr) {
      const msg = dbErr && dbErr.message ? dbErr.message : String(dbErr || '');
      console.warn('/me: DB lookup failed, attempting local fallback:', msg);
      // fall through to local JSON below
      user = null;
    }

    // If DB lookup returned null or userId looks like a local fallback id, try local_users.json
    if (!user) {
      try {
        const usersPath = path.resolve(__dirname, '..', 'data', 'local_users.json');
        if (fs.existsSync(usersPath)) {
          const list = JSON.parse(fs.readFileSync(usersPath, 'utf8') || '[]');
          const found = list.find(u => (u.id || '') === String(req.userId) || ((u.email || '').toLowerCase() === (req.userEmail || '').toLowerCase()));
          if (found) {
            user = found;
          }
        }
      } catch (localErr) {
        console.warn('/me: local_users.json lookup failed', localErr && localErr.message);
      }
    }

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({
      success: true,
      user: buildUserResponse(user)
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
    // Handle local fallback users (development/test) whose ids are like 'local-...'
    if (typeof req.userId === 'string' && req.userId.startsWith('local-')) {
      const fs = require('fs');
      const path = require('path');
      const localPath = path.join(__dirname, '..', 'data', 'local_users.json');
      let locals = [];
      try {
        locals = JSON.parse(fs.readFileSync(localPath, 'utf8')) || [];
      } catch (e) {
        locals = [];
      }
      const idx = locals.findIndex(u => u.id === req.userId);
      if (idx >= 0) {
        const lu = locals[idx];
        let localRoles = Array.isArray(lu.roles) ? lu.roles.map(r => String(r).toLowerCase()) : [String(lu.role || 'user').toLowerCase()];
        if (!localRoles.includes(role)) localRoles.push(role);
        localRoles = Array.from(new Set(localRoles));
        lu.role = role;
        lu.roles = localRoles;
        lu.activeRole = role;
        try {
          fs.writeFileSync(localPath, JSON.stringify(locals, null, 2));
        } catch (e) {
          // ignore write errors in dev
        }

        // Generate tokens using the same helpers and return updated user payload
        const accessToken = generateToken(lu.id);
        const refreshToken = generateRefreshToken(lu.id);
        return res.json({
          success: true,
          message: 'Role switched successfully',
          accessToken,
          refreshToken,
          user: {
            id: lu.id,
            email: lu.email,
            firstName: lu.firstName,
            lastName: lu.lastName,
            phone: lu.phone,
            role: lu.role,
            roles: lu.roles,
            activeRole: lu.activeRole || role,
            avatar: lu.avatar,
            isVerified: lu.isVerified,
            isActive: lu.isActive
          }
        });
      }
    }

    // Handle local fallback users (development/test) whose ids are like 'local-...'
    if (typeof req.userId === 'string' && req.userId.startsWith('local-')) {
      const fs = require('fs');
      const path = require('path');
      const localPath = path.join(__dirname, '..', 'data', 'local_users.json');
      let locals = [];
      try {
        locals = JSON.parse(fs.readFileSync(localPath, 'utf8')) || [];
      } catch (e) {
        locals = [];
      }
      const idx = locals.findIndex(u => u.id === req.userId);
      if (idx >= 0) {
        const lu = locals[idx];
        let localRoles = Array.isArray(lu.roles) ? lu.roles.map(r => String(r).toLowerCase()) : [String(lu.role || 'user').toLowerCase()];
        if (!localRoles.includes(role)) localRoles.push(role);
        localRoles = Array.from(new Set(localRoles));
        lu.role = role;
        lu.roles = localRoles;
        lu.activeRole = role;
        try {
          fs.writeFileSync(localPath, JSON.stringify(locals, null, 2));
        } catch (e) {
          // ignore write errors in dev
        }

        // Generate tokens using the same helpers and return updated user payload
        const accessToken = generateToken(lu.id);
        const refreshToken = generateRefreshToken(lu.id);
        return res.json({
          success: true,
          message: 'Role switched successfully',
          accessToken,
          refreshToken,
          user: {
            id: lu.id,
            email: lu.email,
            firstName: lu.firstName,
            lastName: lu.lastName,
            phone: lu.phone,
            role: lu.role,
            roles: lu.roles,
            activeRole: lu.activeRole || role,
            avatar: lu.avatar,
            isVerified: lu.isVerified,
            isActive: lu.isActive
          }
        });
      }
    }

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
    let { role } = req.body;
    if (typeof role === 'string') {
      role = role.trim().toLowerCase();
    }
    const allowed = ['user', 'buyer', 'vendor', 'admin', 'mortgage_bank', 'investor', 'agent'];
    if (!role || !allowed.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    // Handle local fallback users (development/test) whose ids are like 'local-...'
    if (typeof req.userId === 'string' && req.userId.startsWith('local-')) {
      try {
        const fs = require('fs');
        const path = require('path');
        const localPath = path.join(__dirname, '..', 'data', 'local_users.json');
        let locals = [];
        try { locals = JSON.parse(fs.readFileSync(localPath, 'utf8') || '[]'); } catch (e) { locals = []; }
        const idx = locals.findIndex(u => u.id === req.userId);
        if (idx >= 0) {
          const lu = locals[idx];
          const normalizedLocalRoles = normalizeRoles(lu.roles || lu.role || []);
          const mergedLocalRoles = normalizeRoles([...normalizedLocalRoles, role]);
          const nextLocalActive = chooseActiveRole(lu.activeRole, role, mergedLocalRoles);
          lu.role = nextLocalActive;
          lu.roles = mergedLocalRoles;
          lu.activeRole = nextLocalActive;
          try { fs.writeFileSync(localPath, JSON.stringify(locals, null, 2)); } catch (e) { /* ignore dev write errors */ }

          const accessToken = generateToken(lu.id);
          const refreshToken = generateRefreshToken(lu.id);
          return res.json({
            success: true,
            message: 'Role switched successfully',
            accessToken,
            refreshToken,
            user: buildUserResponse(lu)
          });
        }
      } catch (err) {
        console.warn('switch-role: local fallback handling failed', err && err.message);
      }
    }

    const user = await User.findByPk(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // 🔒 LOCK ADMIN: Prevent admins from switching roles
    const currentRoles = normalizeRoles(user.roles || user.role || []);
    if (currentRoles.includes('admin')) {
      return res.status(403).json({ 
        success: false, 
        message: 'Admin accounts cannot switch roles. Please contact support for role changes.' 
      });
    }

    // Ensure roles is an array and normalized
    const existingRoles = normalizeRoles(user.roles || user.role || []);
    const mergedRoles = normalizeRoles([...existingRoles, role]);
    const nextActiveRole = chooseActiveRole(user.activeRole, role, mergedRoles);

    // Update user role, roles and persist activeRole
    await user.update({ role: nextActiveRole, roles: mergedRoles, activeRole: nextActiveRole });

    // Reload user to reflect DB changes
    const updated = await User.findByPk(req.userId);

    // Generate new tokens
    const accessToken = generateToken(updated.id);
    const refreshToken = generateRefreshToken(updated.id);

    res.json({
      success: true,
      message: 'Role switched successfully',
      accessToken,
      refreshToken,
      user: buildUserResponse(updated)
    });
  } catch (error) {
    console.error('Switch role error:', error);
    res.status(500).json({ success: false, message: 'Role switch failed', error: error.message });
  }
});

module.exports = router;

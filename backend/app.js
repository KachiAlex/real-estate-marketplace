const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

// Import configurations
const { securityConfig } = require('./config/security');
const { createMorganLogger } = require('./config/logger');
const { initializeDatabase } = require('./config/postgresqlSetup');

// Import Sequelize models
const db = require('./config/sequelizeDb');

// Import middleware
const sanitizeMiddleware = require('./middleware/sanitize');
const { attachRBAC } = require('./middleware/rbac');
const cookieParser = require('cookie-parser');
const { csrfProtectionConditional, csrfTokenEndpoint, csrfErrorHandler } = require('./middleware/csrf');
const { createRequestLogger } = require('./middleware/requestLogger');

// Import services
const notificationService = require('./services/notificationService');
const emailService = require('./services/emailService');
const SocketMessagingService = require('./services/socketMessagingService');

const app = express();

// CORS configuration — uses securityConfig.cors which has the full allowed origins list
app.use(cors(securityConfig.cors));
app.options('*', cors(securityConfig.cors));
app.use(securityConfig.httpsRedirect);

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Security middleware
app.use(securityConfig.helmet);
app.use(createMorganLogger());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(sanitizeMiddleware);
app.use(createRequestLogger());
app.use(cookieParser());
// CSRF disabled in serverless (Vercel) - cookies not reliably available
if (!process.env.VERCEL) {
  app.use(csrfProtectionConditional);
}
app.use(attachRBAC);

// Serve uploaded files
const uploadsStatic = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsStatic));

// Config routes
const configRoutes = require('./routes/config');
app.use('/api/config', configRoutes);

// Database readiness middleware (for serverless, we'll init DB on first request)
let dbInitialized = false;
const initializeDbOnce = async () => {
  if (dbInitialized) return;
  try {
    const dbInit = await initializeDatabase();
    if (dbInit.isConnected) {
      console.log('✅ PostgreSQL initialized');
      dbInitialized = true;
    } else {
      console.log('ℹ️ PostgreSQL not available:', dbInit.error);
      dbInitialized = true; // Mark as initialized even if failed to avoid retry loops
    }
  } catch (error) {
    console.error('❌ Database initialization error:', error.message);
    dbInitialized = true; // Mark as initialized even if failed
  }
};

app.use(/^\/api\/(auth|users|properties|admin|escrow|payments|subscription|vendor|investments|notifications|chat|chats|reviews|dashboard|blog|search|disputes|buyer|inquiries|support|verification|tfa|rbac|upload)/, async (req, res, next) => {
  await initializeDbOnce();
  next();
});

// Load all routes
const routeLoaders = [
  ['auth', () => require('./routes/auth')],
  ['auth/jwt', () => require('./routes/auth-jwt')],
  ['auth-jwt', () => require('./routes/auth-jwt')],
  ['auth-2fa', () => require('./routes/auth-2fa')],
  ['users', () => require('./routes/users')],
  ['properties', () => require('./routes/properties')],
  ['investments', () => require('./routes/investments')],
  ['payments', () => require('./routes/payments')],
  ['escrow', () => require('./routes/escrow')],
  ['verification', () => require('./routes/verification')],
  ['disputes', () => require('./routes/disputes')],
  ['admin', () => require('./routes/admin')],
  ['assistant', () => require('./routes/assistant')],
  ['upload', () => require('./routes/upload')],
  ['vendor', () => require('./routes/vendor')],
  ['notifications', () => require('./routes/notifications')],
  ['alerts-preferences', () => require('./routes/alertsPreferences')],
  ['blog', () => require('./routes/blog')],
  ['subscription', () => require('./routes/subscription')],
  ['admin/subscription', () => require('./routes/adminSubscription')],
  ['admin/analytics', () => require('./routes/analytics')],
  ['search', () => require('./routes/search')],
  ['chat', () => require('./routes/chatEnhanced')],
  ['reviews', () => require('./routes/reviews')],
  ['dashboard', () => require('./routes/dashboard')],
  ['buyer', () => require('./routes/buyer')],
  ['chats', () => require('./routes/chats')],
  ['inquiries', () => require('./routes/inquiries')],
  ['support', () => require('./routes/support')],
  ['rbac', () => require('./routes/rbac')],
  ['tfa', () => require('./routes/tfa')],
  ['chatbot', () => require('./routes/chatbot')]
];

routeLoaders.forEach(([routePath, loader]) => {
  try {
    app.use(`/api/${routePath}`, loader());
  } catch (error) {
    console.error(`Failed to load ${routePath} routes:`, error.message);
  }
});

// Also register /api/chat as alias for /api/chats
try {
  const chatsRouter = require('./routes/chats');
  app.use('/api/chat', chatsRouter);
} catch (error) {
  console.error('Failed to load chat alias:', error.message);
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Real Estate API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// DB health check
app.get('/api/health/db', (req, res) => {
  try {
    const dbStatus = {
      connected: !!(db && db.isConnected),
      timestamp: new Date().toISOString()
    };
    return res.json({ success: true, db: dbStatus });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to read DB health', error: err.message });
  }
});

// CSRF token endpoint
app.get('/api/csrf-token', (req, res) => {
  if (process.env.VERCEL) {
    return res.json({ token: 'csrf-disabled-serverless' });
  }
  return csrfTokenEndpoint(req, res);
});

// Mock agents endpoint
const mockUsers = require('./data/mockUsers');
app.get('/api/agents', (req, res) => {
  try {
    const { location } = req.query;
    let filteredAgents = mockUsers.filter(user => 
      user.role === 'vendor-agent' && user.status === 'active'
    );
    
    if (location && location !== 'all') {
      filteredAgents = filteredAgents.filter(agent => 
        agent.vendorProfile?.location?.includes(location)
      );
    }
    
    const agents = filteredAgents.map(agent => ({
      id: agent.id,
      name: agent.name,
      email: agent.email,
      phone: agent.phone,
      avatar: agent.avatar,
      location: agent.vendorProfile?.location,
      specialties: agent.vendorProfile?.specialties || [],
      rating: agent.vendorProfile?.rating || 0,
      propertiesSold: agent.vendorProfile?.propertiesSold || 0,
      yearsExperience: agent.vendorProfile?.yearsExperience || 0,
      bio: agent.vendorProfile?.bio || '',
      verified: agent.verified || false
    }));
  
    res.json({
      success: true,
      data: agents,
      total: agents.length
    });
  } catch (error) {
    console.error('Error fetching agents:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch agents',
      error: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  // Ensure CORS headers
  const origin = req.headers.origin;
  if (origin) {
    const isFirebaseHosting = origin.includes('.web.app') || origin.includes('.firebaseapp.com');
    if (allowedOrigins.includes(origin) || isFirebaseHosting || process.env.NODE_ENV === 'development') {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin, X-Requested-With');
    }
  }
  
  // Forgot password special handling
  const pathStr = String(req.path || '').toLowerCase();
  const method = String(req.method || '').toUpperCase();
  const isForgotPassword = pathStr.includes('forgot-password') || pathStr.includes('forgotpassword');
  const isPostWithPassword = method === 'POST' && pathStr.includes('password');
  
  if (isForgotPassword || isPostWithPassword) {
    if (!res.headersSent) {
      return res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }
    return;
  }
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      success: false,
      message: 'Validation Error',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({ 
      success: false,
      message: 'Invalid ID format'
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    });
  }
  
  res.status(err.statusCode || 500).json({ 
    success: false,
    message: process.env.NODE_ENV === 'development' ? err.message : 'Server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    path: req.path,
    method: req.method
  });
});

// CSRF error handler
app.use(csrfErrorHandler);

module.exports = app;

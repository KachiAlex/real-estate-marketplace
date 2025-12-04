const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

// Import configurations
const connectDB = require('./config/database');
const { initializeFirestore } = require('./config/firestore');
const { securityConfig } = require('./config/security');
const { createLogger, infoLogger, warnLogger, errorLogger } = require('./config/logger');
const rateLimit = require('express-rate-limit');

const app = express();
// Trust Cloud Run/Proxies so rate limiter and IP-based logic work correctly
app.set('trust proxy', 1);
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});
const PORT = process.env.PORT || 5000;

console.log('🚀 Starting server...');
console.log(`📌 Port: ${PORT}`);
console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);

// Initialize Firestore (Firebase)
try {
  initializeFirestore();
  console.log('✅ Firestore initialized');
} catch (error) {
  console.warn('⚠️ Firestore initialization failed:', error.message);
  console.warn('⚠️ Blog routes will use Firestore, but connection may fail');
  console.warn('📝 To fix: Set FIREBASE_SERVICE_ACCOUNT_KEY or GOOGLE_APPLICATION_CREDENTIALS');
  console.warn('📚 See backend/FIRESTORE_SETUP.md for setup instructions');
}

// Database connection (MongoDB - for other models that still use it)
// Make MongoDB connection optional - server can run with Firestore only
// Run this asynchronously - don't block server startup
setImmediate(() => {
  connectDB().then(async (conn) => {
    if (conn) {
      // Initialize admin settings only if MongoDB is connected
      await initializeAdminSettings();
      // Initialize notification templates
      try {
        const initializeNotificationTemplates = require('./scripts/initializeNotificationTemplates');
        await initializeNotificationTemplates();
      } catch (templateError) {
        console.warn('⚠️ Notification templates initialization failed (non-fatal):', templateError.message);
      }
    } else {
      console.warn('⚠️ MongoDB not connected - skipping MongoDB-dependent initializations');
    }
    // Initialize notification service with Socket.IO (works without MongoDB)
    try {
      notificationService.initializeSocketIO(io);
    } catch (ioError) {
      console.warn('⚠️ Socket.IO initialization failed:', ioError.message);
    }
    // Verify email service connection
    try {
      const emailStatus = await emailService.verifyConnection();
      infoLogger('Email service status', { status: emailStatus.success ? 'Ready' : 'Failed' });
    } catch (emailError) {
      console.warn('⚠️ Email service verification failed:', emailError.message);
    }
  }).catch((error) => {
    console.warn('⚠️ Database initialization error (non-fatal):', error.message);
    // Initialize notification service even if MongoDB fails
    try {
      notificationService.initializeSocketIO(io);
    } catch (ioError) {
      console.warn('⚠️ Socket.IO initialization failed:', ioError.message);
    }
  });
});

// Import models
const User = require('./models/User');
const Property = require('./models/Property');
const AdminSettings = require('./models/AdminSettings');
const EscrowTransaction = require('./models/EscrowTransaction');
const AuditLog = require('./models/AuditLog');
const Notification = require('./models/Notification');
const Blog = require('./models/Blog');
const NotificationTemplate = require('./models/NotificationTemplate');

// Import middleware
const { protect, authorize } = require('./middleware/auth');
const { validate, sanitizeInput, adminValidation } = require('./middleware/validation');
const { logAdminAction } = require('./middleware/audit');
const sanitizeMiddleware = require('./middleware/sanitize');
const { requireRole, requireAnyRole, checkOwnership } = require('./middleware/roleValidation');

// Import services
const notificationService = require('./services/notificationService');
const emailService = require('./services/emailService');

// Middleware
app.use(securityConfig.helmet);
app.use(cors(securityConfig.cors));
app.use(createLogger());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply input sanitization to all routes
app.use(sanitizeMiddleware);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join user-specific room for notifications
  socket.on('join_user_room', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined their notification room`);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Rate limiting - temporarily disabled to fix Cloud Run proxy issue
// TODO: Re-enable after fixing express-rate-limit trust proxy validation
// const limiter = rateLimit({
//   windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
//   max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
//   message: 'Too many requests from this IP, please try again later.',
//   standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
//   legacyHeaders: false, // Disable the `X-RateLimit-*` headers
//   skip: (req) => {
//     // Skip rate limiting for health checks
//     return req.path === '/api/health';
//   }
// });
// app.use(limiter);

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0 && process.env.NODE_ENV === 'production') {
  console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
  console.error('⚠️ Server will not start in production without these variables');
  process.exit(1);
}

// Warn if MongoDB URI is missing (but don't fail - Firestore is used for auth)
if (!process.env.MONGODB_URI && process.env.NODE_ENV === 'production') {
  console.warn('⚠️ MONGODB_URI not set - some features may not work (Firestore is used for auth)');
}

// Warn about missing payment keys
if (!process.env.FLUTTERWAVE_SECRET_KEY && process.env.NODE_ENV === 'production') {
  warnLogger('FLUTTERWAVE_SECRET_KEY not set - payment features will not work');
}

// Warn about missing Cloudinary keys
if (!process.env.CLOUDINARY_CLOUD_NAME && process.env.NODE_ENV === 'production') {
  warnLogger('Cloudinary not configured - file upload features will not work');
}

// Import mock data
const mockUsers = require('./data/mockUsers');
const mockProperties = require('./data/mockProperties');

// Initialize admin settings if they don't exist
async function initializeAdminSettings() {
  try {
    // Check if MongoDB is connected
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      console.warn('⚠️ MongoDB not connected - skipping admin settings initialization');
      return;
    }

    const existingSettings = await AdminSettings.findOne();
    if (!existingSettings) {
      const defaultSettings = new AdminSettings({
        verificationFee: 50000,
        vendorListingFee: 100000,
        escrowTimeoutDays: 7,
        platformFee: 0.025,
        maxFileSize: 10485760,
        allowedFileTypes: [
          'image/jpeg', 'image/png', 'image/webp', 
          'application/pdf', 'application/msword', 
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ],
        maintenanceMode: false,
        emailNotifications: true,
        smsNotifications: false,
        autoApproveProperties: false,
        autoApproveUsers: false
      });
      await defaultSettings.save();
      console.log('✅ Admin settings initialized');
    }
  } catch (error) {
    console.warn('⚠️ Failed to initialize admin settings (non-fatal):', error.message);
    // Don't throw - allow server to continue
  }
}

// Vendor verification requests (mock)
const mockVerificationRequests = [];

// Mock escrow transactions
const mockEscrowTransactions = [
  {
    id: 'escrow_1',
    propertyId: 'prop_1',
    buyerId: 'user_1',
    sellerId: 'vendor_1',
    amount: 50000000,
    status: 'pending',
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  }
];

// Routes - wrap in try-catch to prevent crashes if a route file has errors
try {
  app.use('/api/auth', require('./routes/auth'));
} catch (error) {
  console.error('Failed to load auth routes:', error.message);
}

try {
  app.use('/api/users', require('./routes/users'));
} catch (error) {
  console.error('Failed to load users routes:', error.message);
}

try {
  app.use('/api/properties', require('./routes/properties'));
} catch (error) {
  console.error('Failed to load properties routes:', error.message);
}

try {
  app.use('/api/investments', require('./routes/investments'));
} catch (error) {
  console.error('Failed to load investments routes:', error.message);
}

try {
  app.use('/api/mortgages', require('./routes/mortgages'));
} catch (error) {
  console.error('Failed to load mortgages routes:', error.message);
}

try {
  app.use('/api/payments', require('./routes/payments'));
} catch (error) {
  console.error('Failed to load payments routes:', error.message);
}

try {
  app.use('/api/escrow', require('./routes/escrow'));
} catch (error) {
  console.error('Failed to load escrow routes:', error.message);
}

try {
  app.use('/api/admin', require('./routes/admin'));
} catch (error) {
  console.error('Failed to load admin routes:', error.message);
}

try {
  app.use('/api/mortgage-banks', require('./routes/mortgageBanks'));
} catch (error) {
  console.error('Failed to load mortgage-banks routes:', error.message);
}

try {
  app.use('/api/upload', require('./routes/upload'));
} catch (error) {
  console.error('Failed to load upload routes:', error.message);
}

try {
  app.use('/api/notifications', require('./routes/notifications'));
} catch (error) {
  console.error('Failed to load notifications routes:', error.message);
}

try {
  app.use('/api/blog', require('./routes/blog'));
} catch (error) {
  console.error('Failed to load blog routes:', error.message);
}

try {
  app.use('/api/dashboard', require('./routes/dashboard'));
} catch (error) {
  console.error('Failed to load dashboard routes:', error.message);
}

// API Routes
// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Real Estate API is running',
    timestamp: new Date().toISOString()
  });
});

// Mock blog data
const mockBlogs = [
  {
    id: '1',
    title: 'Real Estate Market Trends in 2024',
    slug: 'real-estate-market-trends-2024',
    content: 'The real estate market is showing strong growth in 2024...',
    excerpt: 'Discover the latest trends shaping the real estate market this year.',
    category: 'market-news',
    featured: true,
    status: 'published',
    author: { name: 'John Doe', email: 'john@example.com' },
    views: 1250,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: '2',
    title: 'First Time Home Buyer Guide',
    slug: 'first-time-home-buyer-guide',
    content: 'Buying your first home can be overwhelming...',
    excerpt: 'Complete guide for first-time home buyers in Nigeria.',
    category: 'buyer-guides',
    featured: false,
    status: 'published',
    author: { name: 'Jane Smith', email: 'jane@example.com' },
    views: 890,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10')
  },
  {
    id: '3',
    title: 'Investment Opportunities in Lagos',
    slug: 'investment-opportunities-lagos',
    content: 'Lagos offers numerous investment opportunities...',
    excerpt: 'Explore profitable real estate investments in Lagos.',
    category: 'investment-guides',
    featured: true,
    status: 'published',
    author: { name: 'Mike Johnson', email: 'mike@example.com' },
    views: 2100,
    createdAt: new Date('2024-01-08'),
    updatedAt: new Date('2024-01-08')
  }
];

// Blog API Routes are handled by ./routes/blog.js (registered above)
// Mock routes removed to avoid conflicts - proper routes with MongoDB support are available

// Agents API Route
app.get('/api/agents', (req, res) => {
  try {
    const { location } = req.query;
    
    // Filter agents by location if specified
    let filteredAgents = mockUsers.filter(user => 
      user.role === 'vendor-agent' && user.status === 'active'
    );
    
    if (location && location !== 'all') {
      filteredAgents = filteredAgents.filter(agent => 
        agent.vendorProfile?.location?.includes(location)
      );
    }
    
    // Format agent data for response
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
  // Special handling for forgot-password route - always return success for security
  if (req.path === '/api/auth/forgot-password' || req.originalUrl === '/api/auth/forgot-password') {
    console.error('Forgot password error (caught by global handler):', err.message);
    if (!res.headersSent) {
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }
    return;
  }
  
  errorLogger(err, req);
  
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

// 404 handler for unmatched routes (must be after all route registrations)
app.use('*', (req, res) => {
  console.log('❌ Route not found:', req.method, req.originalUrl, req.query);
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    path: req.path,
    method: req.method
  });
});

// Global error handlers to prevent crashes
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  try {
    errorLogger(err, null, { context: 'Unhandled Promise Rejection' });
  } catch (logError) {
    console.error('Failed to log error:', logError);
  }
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  try {
    errorLogger(err, null, { context: 'Uncaught Exception' });
  } catch (logError) {
    console.error('Failed to log error:', logError);
  }
  // Don't exit in production - let the process manager handle it
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});

// Start server - ensure it always starts even if some initializations fail
console.log('📡 Setting up server listener...');
try {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server listening on port ${PORT}`);
    try {
      infoLogger(`Server running on port ${PORT}`, { 
        environment: process.env.NODE_ENV,
        port: PORT 
      });
    } catch (logError) {
      console.log(`Server running on port ${PORT} (logger unavailable)`);
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🏠 Properties: http://localhost:${PORT}/api/properties`);
      console.log(`👤 Auth: http://localhost:${PORT}/api/auth/login`);
      console.log(`💰 Escrow: http://localhost:${PORT}/api/escrow`);
      console.log(`💼 Investments: http://localhost:${PORT}/api/investments`);
      console.log(`📁 Upload: http://localhost:${PORT}/api/upload`);
      console.log(`🔔 Notifications: http://localhost:${PORT}/api/notifications`);
      console.log(`📝 Blog: http://localhost:${PORT}/api/blog`);
    }
  });
  
  server.on('error', (error) => {
    console.error('❌ Server error:', error);
  });
} catch (error) {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
}

// Note: 404 handler is already defined above (line 347)
// This duplicate handler is unreachable code and has been removed

module.exports = app; 

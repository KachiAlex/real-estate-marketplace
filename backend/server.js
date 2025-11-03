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
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});
const PORT = process.env.PORT || 5000;

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
connectDB().then(async () => {
  // Initialize admin settings
  await initializeAdminSettings();
  // Initialize notification templates
  const initializeNotificationTemplates = require('./scripts/initializeNotificationTemplates');
  await initializeNotificationTemplates();
  // Initialize notification service with Socket.IO
  notificationService.initializeSocketIO(io);
  // Verify email service connection
  const emailStatus = await emailService.verifyConnection();
  infoLogger('Email service status', { status: emailStatus.success ? 'Ready' : 'Failed' });
}).catch((error) => {
  errorLogger(error, null, { context: 'Database initialization' });
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

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use(limiter);

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET', 'MONGODB_URI'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0 && process.env.NODE_ENV === 'production') {
  console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
  console.error('⚠️ Server will not start in production without these variables');
  process.exit(1);
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
    const existingSettings = await AdminSettings.findOne();
    if (!existingSettings) {
      const defaultSettings = new AdminSettings({
        verificationFee: 50000,
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
    console.error('❌ Failed to initialize admin settings:', error);
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

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/properties', require('./routes/properties'));
app.use('/api/investments', require('./routes/investments'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/escrow', require('./routes/escrow'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/blog', require('./routes/blog'));

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
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

server.listen(PORT, () => {
  infoLogger(`Server running on port ${PORT}`, { 
    environment: process.env.NODE_ENV,
    port: PORT 
  });
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🏠 Properties: http://localhost:${PORT}/api/properties`);
    console.log(`👤 Auth: http://localhost:${PORT}/api/auth/login`);
    console.log(`💰 Escrow: http://localhost:${PORT}/api/escrow`);
    console.log(`💼 Investments: http://localhost:${PORT}/api/investments`);
    console.log(`📁 Upload: http://localhost:${PORT}/api/upload`);
    console.log(`🔔 Notifications: http://localhost:${PORT}/api/notifications`);
  }
});

module.exports = app; 

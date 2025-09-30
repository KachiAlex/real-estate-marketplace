const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});
const PORT = process.env.PORT || 5000;

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/realestate', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('✅ Connected to MongoDB');
  // Initialize admin settings
  await initializeAdminSettings();
  // Initialize notification templates
  const initializeNotificationTemplates = require('./scripts/initializeNotificationTemplates');
  await initializeNotificationTemplates();
  // Initialize notification service with Socket.IO
  notificationService.initializeSocketIO(io);
  // Verify email service connection
  const emailStatus = await emailService.verifyConnection();
  console.log('📧 Email service status:', emailStatus.success ? 'Ready' : 'Failed');
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error);
  process.exit(1);
});

// Import models
const User = require('./models/User');
const Property = require('./models/Property');
const AdminSettings = require('./models/AdminSettings');
const EscrowTransaction = require('./models/EscrowTransaction');
const AuditLog = require('./models/AuditLog');
const Notification = require('./models/Notification');
const NotificationTemplate = require('./models/NotificationTemplate');

// Import middleware
const { protect, authorize } = require('./middleware/auth');
const { validate, sanitizeInput, adminValidation } = require('./middleware/validation');
const { logAdminAction } = require('./middleware/audit');

// Import services
const notificationService = require('./services/notificationService');
const emailService = require('./services/emailService');

// Middleware
app.use(helmet());
app.use(cors({
  origin: true, // Allow all origins for now
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With']
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Flutterwave configuration
const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY || 'FLWSECK_TEST-1234567890abcdef';
const FLUTTERWAVE_PUBLIC_KEY = process.env.FLUTTERWAVE_PUBLIC_KEY || 'FLWPUBK_TEST-1234567890abcdef';

// Mock data for testing
const mockUsers = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '+234-801-234-5678',
    password: 'password123', // Add password for testing
    role: 'user',
    avatar: 'https://picsum.photos/150/150',
    isVerified: true,
    isActive: true,
    createdAt: new Date('2024-01-15').toISOString(),
    lastLogin: new Date('2024-01-20').toISOString()
  },
  {
    id: '2',
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@example.com',
    phone: '+234-802-345-6789',
    password: 'admin123', // Add password for testing
    role: 'admin',
    avatar: 'https://picsum.photos/150/150',
    isVerified: true,
    isActive: true,
    createdAt: new Date('2024-01-10').toISOString(),
    lastLogin: new Date('2024-01-20').toISOString()
  },
  {
    id: '3',
    firstName: 'Onyedikachi',
    lastName: 'Akoma',
    email: 'onyedika.akoma@gmail.com',
    phone: '+234-803-456-7890',
    password: 'dikaoliver2660',
    role: 'user',
    avatar: 'https://picsum.photos/150/150',
    isVerified: true,
    isActive: true,
    createdAt: new Date('2024-01-18').toISOString(),
    lastLogin: new Date('2024-01-20').toISOString()
  }
];

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
const mockVerificationRequests = [
  // { id, vendorId, propertyId, amount, status: 'initiated'|'paid'|'cancelled', createdAt }
];

const mockProperties = [
  {
    id: '1',
    title: 'Beautiful Family Home',
    description: 'Spacious 3-bedroom home with modern amenities and stunning views',
    price: 450000,
    type: 'house',
    status: 'for-sale', // for-sale, for-rent, for-lease
    location: {
      address: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      coordinates: {
        latitude: 40.7128,
        longitude: -74.0060
      },
      nearestBusStop: {
        name: 'Main St & 5th Ave',
        distance: '0.2 miles',
        coordinates: {
          latitude: 40.7130,
          longitude: -74.0058
        }
      }
    },
    details: {
      bedrooms: 3,
      bathrooms: 2,
      sqft: 1800,
      yearBuilt: 2015,
      lotSize: '0.25 acres',
      parking: '2-car garage',
      heating: 'Central',
      cooling: 'Central AC'
    },
    amenities: [
      'Hardwood Floors',
      'Fireplace',
      'Walk-in Closet',
      'Garden',
      'Patio',
      'Security System',
      'High-Speed Internet'
    ],
    images: [
      {
        url: 'https://picsum.photos/400/300',
        isPrimary: true,
        caption: 'Front View'
      },
      {
        url: 'https://picsum.photos/400/300',
        isPrimary: false,
        caption: 'Living Room'
      },
      {
        url: 'https://picsum.photos/400/300',
        isPrimary: false,
        caption: 'Kitchen'
      }
    ],
    videos: [
      {
        url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
        thumbnail: 'https://picsum.photos/400/300',
        caption: 'Property Tour'
      }
    ],
    documentation: [
      {
        type: 'title-deed',
        name: 'Property Title Deed',
        url: 'https://example.com/documents/title-deed.pdf',
        verified: true
      },
      {
        type: 'survey-plan',
        name: 'Survey Plan',
        url: 'https://example.com/documents/survey-plan.pdf',
        verified: true
      },
      {
        type: 'building-permit',
        name: 'Building Permit',
        url: 'https://example.com/documents/building-permit.pdf',
        verified: false
      }
    ],
    owner: mockUsers[0],
    views: 45,
    favorites: [],
    isVerified: false,
    verificationStatus: 'pending', // pending, approved, rejected
    verificationNotes: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    title: 'Modern Downtown Apartment',
    description: 'Luxury 2-bedroom apartment in the heart of downtown',
    price: 2500,
    type: 'apartment',
    status: 'for-rent',
    location: {
      address: '456 Downtown Ave',
      city: 'New York',
      state: 'NY',
      zipCode: '10002',
      coordinates: {
        latitude: 40.7589,
        longitude: -73.9851
      },
      nearestBusStop: {
        name: 'Downtown Ave & Broadway',
        distance: '0.1 miles',
        coordinates: {
          latitude: 40.7590,
          longitude: -73.9850
        }
      }
    },
    details: {
      bedrooms: 2,
      bathrooms: 1,
      sqft: 1200,
      yearBuilt: 2020,
      floor: 15,
      totalFloors: 25,
      parking: '1 assigned space',
      heating: 'Central',
      cooling: 'Central AC'
    },
    amenities: [
      'Balcony',
      'Gym Access',
      'Pool',
      'Doorman',
      'Elevator',
      'In-Unit Laundry',
      'High-Speed Internet'
    ],
    images: [
      {
        url: 'https://picsum.photos/400/300',
        isPrimary: true,
        caption: 'Living Area'
      }
    ],
    videos: [],
    documentation: [
      {
        type: 'rental-agreement',
        name: 'Rental Agreement',
        url: 'https://example.com/documents/rental-agreement.pdf',
        verified: true
      }
    ],
    owner: mockUsers[0],
    views: 32,
    favorites: [],
    isVerified: true,
    verificationStatus: 'approved',
    verificationNotes: 'All documents verified successfully',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    title: 'Luxury Penthouse Suite',
    description: 'Stunning penthouse with panoramic city views and premium finishes',
    price: 1250000,
    type: 'apartment',
    status: 'for-sale',
    location: {
      address: '789 Park Avenue',
      city: 'New York',
      state: 'NY',
      zipCode: '10021',
      coordinates: {
        latitude: 40.7614,
        longitude: -73.9776
      },
      nearestBusStop: {
        name: 'Park Ave & 72nd St',
        distance: '0.1 miles',
        coordinates: {
          latitude: 40.7615,
          longitude: -73.9775
        }
      }
    },
    details: {
      bedrooms: 4,
      bathrooms: 3,
      sqft: 2800,
      yearBuilt: 2018,
      floor: 25,
      totalFloors: 25,
      parking: '2 assigned spaces',
      heating: 'Central',
      cooling: 'Central AC'
    },
    amenities: [
      'Private Terrace',
      'Concierge Service',
      'Gym Access',
      'Pool',
      'Wine Storage',
      'Smart Home System',
      'High-Speed Internet'
    ],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop',
        isPrimary: true,
        caption: 'Living Room'
      }
    ],
    videos: [],
    documentation: [
      {
        type: 'title-deed',
        name: 'Property Title Deed',
        url: 'https://example.com/documents/title-deed-3.pdf',
        verified: true
      }
    ],
    owner: mockUsers[1],
    views: 89,
    favorites: [],
    isVerified: true,
    verificationStatus: 'approved',
    verificationNotes: 'Premium property verified',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '4',
    title: 'Cozy Studio Apartment',
    description: 'Perfect starter home in a vibrant neighborhood',
    price: 1800,
    type: 'apartment',
    status: 'for-rent',
    location: {
      address: '321 Brooklyn Heights',
      city: 'Brooklyn',
      state: 'NY',
      zipCode: '11201',
      coordinates: {
        latitude: 40.6962,
        longitude: -73.9942
      },
      nearestBusStop: {
        name: 'Brooklyn Heights Promenade',
        distance: '0.3 miles',
        coordinates: {
          latitude: 40.6960,
          longitude: -73.9940
        }
      }
    },
    details: {
      bedrooms: 1,
      bathrooms: 1,
      sqft: 650,
      yearBuilt: 2010,
      floor: 8,
      totalFloors: 15,
      parking: 'Street parking',
      heating: 'Central',
      cooling: 'Window AC'
    },
    amenities: [
      'Hardwood Floors',
      'Large Windows',
      'Modern Kitchen',
      'Laundry in Building',
      'Pet Friendly',
      'High-Speed Internet'
    ],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop',
        isPrimary: true,
        caption: 'Studio Layout'
      }
    ],
    videos: [],
    documentation: [
      {
        type: 'rental-agreement',
        name: 'Rental Agreement',
        url: 'https://example.com/documents/rental-agreement-4.pdf',
        verified: true
      }
    ],
    owner: mockUsers[0],
    views: 24,
    favorites: [],
    isVerified: true,
    verificationStatus: 'approved',
    verificationNotes: 'Standard rental verified',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '5',
    title: 'Suburban Villa with Pool',
    description: 'Spacious family villa with private pool and garden',
    price: 750000,
    type: 'house',
    status: 'for-sale',
    location: {
      address: '456 Maple Drive',
      city: 'Westchester',
      state: 'NY',
      zipCode: '10601',
      coordinates: {
        latitude: 41.1220,
        longitude: -73.7949
      },
      nearestBusStop: {
        name: 'Maple Dr & Oak St',
        distance: '0.4 miles',
        coordinates: {
          latitude: 41.1225,
          longitude: -73.7950
        }
      }
    },
    details: {
      bedrooms: 5,
      bathrooms: 4,
      sqft: 3200,
      yearBuilt: 2012,
      lotSize: '0.5 acres',
      parking: '3-car garage',
      heating: 'Central',
      cooling: 'Central AC'
    },
    amenities: [
      'Swimming Pool',
      'Large Garden',
      'Home Office',
      'Walk-in Closets',
      'Fireplace',
      'Security System',
      'High-Speed Internet'
    ],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400&h=300&fit=crop',
        isPrimary: true,
        caption: 'Front Exterior'
      }
    ],
    videos: [],
    documentation: [
      {
        type: 'title-deed',
        name: 'Property Title Deed',
        url: 'https://example.com/documents/title-deed-5.pdf',
        verified: true
      }
    ],
    owner: mockUsers[1],
    views: 67,
    favorites: [],
    isVerified: false,
    verificationStatus: 'pending',
    verificationNotes: 'Pending final inspection',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '6',
    title: 'Commercial Office Space',
    description: 'Prime commercial space perfect for business operations',
    price: 8500,
    type: 'commercial',
    status: 'for-lease',
    location: {
      address: '123 Business Plaza',
      city: 'Manhattan',
      state: 'NY',
      zipCode: '10016',
      coordinates: {
        latitude: 40.7505,
        longitude: -73.9934
      },
      nearestBusStop: {
        name: 'Business Plaza Station',
        distance: '0.1 miles',
        coordinates: {
          latitude: 40.7506,
          longitude: -73.9935
        }
      }
    },
    details: {
      bedrooms: 0,
      bathrooms: 2,
      sqft: 1500,
      yearBuilt: 2015,
      floor: 12,
      totalFloors: 20,
      parking: '5 assigned spaces',
      heating: 'Central',
      cooling: 'Central AC'
    },
    amenities: [
      'Conference Room',
      'Reception Area',
      'High-Speed Internet',
      'Security System',
      '24/7 Access',
      'Elevator',
      'Modern Finishes'
    ],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop',
        isPrimary: true,
        caption: 'Office Interior'
      }
    ],
    videos: [],
    documentation: [
      {
        type: 'lease-agreement',
        name: 'Commercial Lease Agreement',
        url: 'https://example.com/documents/lease-agreement-6.pdf',
        verified: true
      }
    ],
    owner: mockUsers[2],
    views: 43,
    favorites: [],
    isVerified: true,
    verificationStatus: 'approved',
    verificationNotes: 'Commercial property verified',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Mock escrow transactions
const mockEscrowTransactions = [
  {
    id: '1',
    propertyId: '1',
    propertyTitle: 'Modern Downtown Apartment',
    buyerId: '1',
    buyerName: 'John Doe',
    buyerEmail: 'john@example.com',
    sellerId: '2',
    sellerName: 'John Smith',
    sellerEmail: 'john.smith@example.com',
    amount: 450000,
    currency: 'NGN',
    status: 'pending', // pending, funded, completed, cancelled, disputed
    type: 'sale', // sale, rent, lease
    paymentMethod: 'card', // card, bank_transfer, ussd, etc.
    flutterwaveTransactionId: null,
    flutterwaveReference: null,
    createdAt: '2024-01-20T10:00:00Z',
    expectedCompletion: '2024-02-20T10:00:00Z',
    documents: [
      { name: 'Purchase Agreement', status: 'uploaded' },
      { name: 'Property Inspection Report', status: 'pending' },
      { name: 'Title Search', status: 'completed' }
    ],
    milestones: [
      { name: 'Initial Payment', status: 'pending', date: null, amount: 45000 },
      { name: 'Property Inspection', status: 'pending', date: null, amount: 0 },
      { name: 'Final Payment', status: 'pending', date: null, amount: 405000 }
    ],
    escrowFee: 2250, // 0.5% of transaction amount
    totalAmount: 452250
  }
];

// Mock investment opportunities data
const mockInvestmentOpportunities = [
  {
    id: '1',
    title: 'Downtown Commercial Complex',
    description: 'Prime downtown commercial property with high rental yield potential. Located in the heart of the business district.',
    type: 'commercial', // commercial, residential, land, reit
    totalAmount: 5000000,
    minimumInvestment: 50000,
    raisedAmount: 3200000,
    investors: 64,
    expectedReturn: 12.5,
    dividendRate: 8.5, // Annual dividend rate
    duration: 36, // months
    location: {
      address: '123 Business District',
      city: 'New York',
      state: 'NY',
      coordinates: { latitude: 40.7128, longitude: -74.0060 }
    },
    images: [
      'https://picsum.photos/600/400?random=1',
      'https://picsum.photos/600/400?random=2'
    ],
    documents: [
      { name: 'Property Appraisal', status: 'available' },
      { name: 'Financial Projections', status: 'available' },
      { name: 'Legal Documents', status: 'available' }
    ],
    status: 'fundraising', // fundraising, funded, active, completed
    createdAt: '2024-01-15T10:00:00Z',
    expectedCompletion: '2027-01-15T10:00:00Z',
    sponsor: {
      id: '1',
      name: 'Real Estate Development Corp',
      experience: '15+ years',
      completedProjects: 25,
      rating: 4.8
    },
    monthlyDividends: [],
    propertyDetails: {
      sqft: 25000,
      units: 15,
      occupancyRate: 85,
      averageRent: 8500
    }
  },
  {
    id: '2',
    title: 'Suburban Residential Portfolio',
    description: 'Diversified portfolio of suburban residential properties with stable rental income.',
    type: 'residential',
    totalAmount: 2000000,
    minimumInvestment: 25000,
    raisedAmount: 1800000,
    investors: 72,
    expectedReturn: 8.2,
    dividendRate: 6.5,
    duration: 60,
    location: {
      address: 'Multiple Suburban Locations',
      city: 'Los Angeles',
      state: 'CA',
      coordinates: { latitude: 34.0522, longitude: -118.2437 }
    },
    images: [
      'https://picsum.photos/600/400?random=3',
      'https://picsum.photos/600/400?random=4'
    ],
    documents: [
      { name: 'Property Portfolio', status: 'available' },
      { name: 'Financial Statements', status: 'available' },
      { name: 'Management Agreement', status: 'available' }
    ],
    status: 'active',
    createdAt: '2024-01-10T14:30:00Z',
    expectedCompletion: '2029-01-10T14:30:00Z',
    sponsor: {
      id: '2',
      name: 'Suburban Properties LLC',
      experience: '20+ years',
      completedProjects: 40,
      rating: 4.9
    },
    monthlyDividends: [
      { month: '2024-01', amount: 6500, paid: true },
      { month: '2024-02', amount: 6800, paid: true },
      { month: '2024-03', amount: 7200, paid: true }
    ],
    propertyDetails: {
      sqft: 15000,
      units: 12,
      occupancyRate: 92,
      averageRent: 3200
    }
  }
];

// Mock user investments data
const mockUserInvestments = [
  {
    id: '1',
    userId: '3', // onyedika.akoma@gmail.com
    investmentId: '1',
    investmentTitle: 'Downtown Commercial Complex',
    amount: 100000,
    shares: 2, // Number of investment units
    investmentDate: '2024-01-20T10:00:00Z',
    status: 'active',
    totalDividendsEarned: 8500,
    lastDividendDate: '2024-03-01T00:00:00Z',
    expectedMonthlyDividend: 708, // 100000 * 0.085 / 12
    totalReturn: 12.5
  },
  {
    id: '2',
    userId: '3',
    investmentId: '2',
    investmentTitle: 'Suburban Residential Portfolio',
    amount: 75000,
    shares: 3,
    investmentDate: '2024-01-15T14:30:00Z',
    status: 'active',
    totalDividendsEarned: 4875,
    lastDividendDate: '2024-03-01T00:00:00Z',
    expectedMonthlyDividend: 406, // 75000 * 0.065 / 12
    totalReturn: 8.2
  }
];

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Real Estate API is running',
    timestamp: new Date().toISOString()
  });
});

// Test endpoint for frontend
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Backend is reachable from frontend',
    timestamp: new Date().toISOString()
  });
});

// Proxy for cloud TTS (Functions) to avoid CORS issues on local
app.post('/tts', async (req, res) => {
  try {
    const fetch = (await import('node-fetch')).default;
    const url = process.env.FIREBASE_TTS_URL || `${process.env.FIREBASE_FUNCTIONS_URL || 'https://us-central1-real-estate-marketplace-37544.cloudfunctions.net'}/tts`;
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(req.body || {}) });
    const data = await r.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ success: false, message: 'tts proxy failed' });
  }
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Real Estate Marketplace API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      properties: '/api/properties',
      auth: {
        register: '/api/auth/register',
        login: '/api/auth/login'
      },
      users: {
        profile: '/api/users/profile',
        favorites: '/api/users/favorites'
      },
      escrow: {
        create: '/api/escrow',
        payment: '/api/escrow/payment',
        verify: '/api/escrow/verify'
      }
    },
    status: 'running'
  });
});

// Mock authentication routes
app.options('/api/auth/register', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.status(200).end();
});

app.post('/api/auth/register', (req, res) => {
  console.log('Registration request received:', req.body);
  const { firstName, lastName, email, password } = req.body;
  
  if (!firstName || !lastName || !email || !password) {
    console.log('Missing required fields:', { firstName, lastName, email, password: password ? 'provided' : 'missing' });
    return res.status(400).json({
      success: false,
      message: 'All fields are required'
    });
  }

  // Check if user already exists
  const existingUser = mockUsers.find(u => u.email === email);
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User with this email already exists'
    });
  }

  const newUser = {
    id: Date.now().toString(),
    firstName,
    lastName,
    email,
    phone: req.body.phone || '', // Add phone number
    password, // Store password
    role: 'user',
    avatar: 'https://picsum.photos/150/150',
    isActive: true,
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString()
  };

  mockUsers.push(newUser);
  console.log('User registered successfully:', newUser);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    token: 'mock-jwt-token-' + Date.now(),
    user: {
      id: newUser.id,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      email: newUser.email,
      role: newUser.role,
      avatar: newUser.avatar
    }
  });
});

app.options('/api/auth/login', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.status(200).end();
});

app.post('/api/auth/login', (req, res) => {
  console.log('Login request received:', req.body);
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required'
    });
  }

  const user = mockUsers.find(u => u.email === email);
  
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Simple password validation
  if (user.password !== password) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  console.log('User logged in successfully:', user);

  res.json({
    success: true,
    message: 'Login successful',
    token: 'mock-jwt-token-' + Date.now(),
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      avatar: user.avatar
    }
  });
});

// Properties routes with enhanced filtering
app.get('/api/properties', (req, res) => {
  const { 
    search, 
    type, 
    status, 
    minPrice, 
    maxPrice, 
    bedrooms, 
    bathrooms, 
    verified,
    page = 1, 
    limit = 10 
  } = req.query;

  let filteredProperties = [...mockProperties];

  // Search functionality
  if (search) {
    const searchLower = search.toLowerCase();
    filteredProperties = filteredProperties.filter(p => 
      p.title.toLowerCase().includes(searchLower) ||
      p.description.toLowerCase().includes(searchLower) ||
      p.location.address.toLowerCase().includes(searchLower) ||
      p.location.city.toLowerCase().includes(searchLower)
    );
  }

  // Filter by type
  if (type) {
    filteredProperties = filteredProperties.filter(p => p.type === type);
  }

  // Filter by status
  if (status) {
    filteredProperties = filteredProperties.filter(p => p.status === status);
  }

  // Filter by price range
  if (minPrice) {
    filteredProperties = filteredProperties.filter(p => p.price >= parseInt(minPrice));
  }
  if (maxPrice) {
    filteredProperties = filteredProperties.filter(p => p.price <= parseInt(maxPrice));
  }

  // Filter by bedrooms
  if (bedrooms) {
    filteredProperties = filteredProperties.filter(p => p.details.bedrooms >= parseInt(bedrooms));
  }

  // Filter by bathrooms
  if (bathrooms) {
    filteredProperties = filteredProperties.filter(p => p.details.bathrooms >= parseInt(bathrooms));
  }

  // Filter by verification status
  if (verified === 'true') {
    filteredProperties = filteredProperties.filter(p => p.isVerified === true);
  } else if (verified === 'false') {
    filteredProperties = filteredProperties.filter(p => p.isVerified === false);
  }

  // Pagination
  const startIndex = (parseInt(page) - 1) * parseInt(limit);
  const endIndex = startIndex + parseInt(limit);
  const paginatedProperties = filteredProperties.slice(startIndex, endIndex);

  res.json({
    success: true,
    data: paginatedProperties,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(filteredProperties.length / parseInt(limit)),
      totalItems: filteredProperties.length,
      itemsPerPage: parseInt(limit)
    },
    filters: {
      availableTypes: ['house', 'apartment', 'condo', 'townhouse', 'land', 'commercial'],
      availableStatuses: ['for-sale', 'for-rent', 'for-lease']
    }
  });
});

app.get('/api/properties/:id', (req, res) => {
  const property = mockProperties.find(p => p.id === req.params.id);
  
  if (!property) {
    return res.status(404).json({
      success: false,
      message: 'Property not found'
    });
  }

  res.json({
    success: true,
    data: property
  });
});

// Admin routes for property verification
app.get('/api/admin/properties', protect, authorize('admin'), async (req, res) => {
  try {
    const { 
      status, 
      verificationStatus, 
      page = 1, 
      limit = 20, 
      search, 
      sort = 'createdAt', 
      order = 'desc' 
    } = req.query;
    
    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (verificationStatus) filter.verificationStatus = verificationStatus;
    
    // Text search
    if (search) {
      filter.$text = { $search: search };
    }
    
    // Build sort
    const sortObj = {};
    sortObj[sort] = order === 'desc' ? -1 : 1;
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const properties = await Property.find(filter)
      .populate('owner', 'firstName lastName email avatar')
      .populate('agent', 'firstName lastName email avatar')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Property.countDocuments(filter);
    const totalPages = Math.ceil(total / parseInt(limit));
    
    // Get statistics
    const stats = {
      total: await Property.countDocuments(),
      pending: await Property.countDocuments({ verificationStatus: 'pending' }),
      approved: await Property.countDocuments({ verificationStatus: 'approved' }),
      rejected: await Property.countDocuments({ verificationStatus: 'rejected' })
    };
    
    res.json({
      success: true,
      data: properties,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit)
      },
      stats
    });
  } catch (error) {
    console.error('Error fetching admin properties:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.put('/api/admin/properties/:id/verify', 
  protect, 
  authorize('admin'), 
  sanitizeInput,
  validate([
    body('verificationStatus').isIn(['approved', 'rejected']).withMessage('Verification status must be approved or rejected'),
    body('verificationNotes').optional().trim().isLength({ max: 500 }).withMessage('Verification notes cannot exceed 500 characters')
  ]),
  logAdminAction('property_verified', 'property', { description: 'Property verification status updated by admin' }),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { verificationStatus, verificationNotes } = req.body;
      
      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'Invalid property ID' });
      }
      
      const property = await Property.findById(id);
      if (!property) {
        return res.status(404).json({ success: false, message: 'Property not found' });
      }
      
      // Update property verification
      property.verificationStatus = verificationStatus;
      property.verificationNotes = verificationNotes || '';
      property.verifiedBy = req.user._id;
      property.verifiedAt = new Date();
      
      await property.save();
      
      const populatedProperty = await Property.findById(property._id)
        .populate('owner', 'firstName lastName email avatar');
      
      // Send notification to property owner
      await notificationService.createPropertyVerificationNotification(
        populatedProperty,
        populatedProperty.owner,
        verificationStatus === 'approved',
        req.user,
        verificationNotes
      );
      
      res.json({
        success: true,
        message: `Property ${verificationStatus} successfully`,
        data: populatedProperty
      });
    } catch (error) {
      console.error('Error verifying property:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

// Admin settings: get current settings
app.get('/api/admin/settings', protect, authorize('admin'), async (req, res) => {
  try {
    const settings = await AdminSettings.findOne();
    if (!settings) {
      // Initialize settings if they don't exist
      await initializeAdminSettings();
      const newSettings = await AdminSettings.findOne();
      return res.json({ success: true, data: newSettings });
    }
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Error fetching admin settings:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Admin settings: update settings
app.put('/api/admin/settings', 
  protect, 
  authorize('admin'), 
  sanitizeInput,
  validate(adminValidation.settings),
  logAdminAction('settings_updated', 'settings', { description: 'Admin settings updated' }),
  async (req, res) => {
  try {
    const allowedFields = [
      'verificationFee', 'escrowTimeoutDays', 'platformFee', 'maxFileSize',
      'allowedFileTypes', 'maintenanceMode', 'maintenanceMessage',
      'emailNotifications', 'smsNotifications', 'autoApproveProperties', 'autoApproveUsers'
    ];
    
    const updateData = {};
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updateData[key] = req.body[key];
      }
    });
    
    // Validation
    if (updateData.verificationFee !== undefined) {
      const feeNum = parseInt(updateData.verificationFee);
      if (Number.isNaN(feeNum) || feeNum < 0) {
        return res.status(400).json({ success: false, message: 'Invalid verification fee' });
      }
      updateData.verificationFee = feeNum;
    }
    
    if (updateData.escrowTimeoutDays !== undefined) {
      const timeoutNum = parseInt(updateData.escrowTimeoutDays);
      if (Number.isNaN(timeoutNum) || timeoutNum < 1) {
        return res.status(400).json({ success: false, message: 'Invalid escrow timeout days' });
      }
      updateData.escrowTimeoutDays = timeoutNum;
    }
    
    if (updateData.platformFee !== undefined) {
      const fee = parseFloat(updateData.platformFee);
      if (Number.isNaN(fee) || fee < 0 || fee > 1) {
        return res.status(400).json({ success: false, message: 'Platform fee must be between 0 and 1' });
      }
      updateData.platformFee = fee;
    }
    
    updateData.updatedAt = new Date();
    
    const settings = await AdminSettings.findOneAndUpdate(
      {},
      updateData,
      { new: true, upsert: true }
    );
    
    res.json({ success: true, data: settings, message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Error updating admin settings:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Vendor initiates property verification (mock payment)
app.post('/api/vendor/verification/initiate', (req, res) => {
  const { vendorId, propertyId } = req.body;
  if (!vendorId || !propertyId) {
    return res.status(400).json({ success: false, message: 'vendorId and propertyId are required' });
  }
  const vendor = mockUsers.find(u => u.id === vendorId);
  const property = mockProperties.find(p => p.id === propertyId);
  if (!vendor) {
    return res.status(404).json({ success: false, message: 'Vendor not found' });
  }
  if (!property) {
    return res.status(404).json({ success: false, message: 'Property not found' });
  }
  const request = {
    id: Date.now().toString(),
    vendorId,
    propertyId,
    amount: adminSettings.verificationFee,
    status: 'initiated',
    createdAt: new Date().toISOString()
  };
  mockVerificationRequests.push(request);
  // Mock a payment link
  const paymentUrl = `https://checkout.flutterwave.com/v3/hosted/pay/VERIFY_${request.id}`;
  res.json({ success: true, message: 'Verification payment initiated', data: { request, payment_url: paymentUrl } });
});

// Admin can mark verification request as paid (mock webhook)
app.post('/api/admin/verification/:id/mark-paid', (req, res) => {
  const { id } = req.params;
  const reqIndex = mockVerificationRequests.findIndex(r => r.id === id);
  if (reqIndex === -1) {
    return res.status(404).json({ success: false, message: 'Verification request not found' });
  }
  mockVerificationRequests[reqIndex].status = 'paid';
  res.json({ success: true, data: mockVerificationRequests[reqIndex] });
});

// Admin list escrow transactions
app.get('/api/admin/escrow', protect, authorize('admin'), async (req, res) => {
  try {
    const { status, page = 1, limit = 20, sort = 'createdAt', order = 'desc' } = req.query;
    
    // Build filter
    const filter = {};
    if (status) filter.status = status;
    
    // Build sort
    const sortObj = {};
    sortObj[sort] = order === 'desc' ? -1 : 1;
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const escrowTransactions = await EscrowTransaction.find(filter)
      .populate('propertyId', 'title price location')
      .populate('buyerId', 'firstName lastName email')
      .populate('sellerId', 'firstName lastName email')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await EscrowTransaction.countDocuments(filter);
    const totalPages = Math.ceil(total / parseInt(limit));
    
    res.json({
      success: true,
      data: escrowTransactions,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching escrow transactions:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Admin mediation on escrow
app.put('/api/admin/escrow/:id/resolve', 
  protect, 
  authorize('admin'), 
  sanitizeInput,
  validate([
    body('decision').isIn(['approve', 'reject']).withMessage('Decision must be approve or reject'),
    body('reason').optional().trim().isLength({ max: 500 }).withMessage('Reason cannot exceed 500 characters')
  ]),
  logAdminAction('escrow_resolved', 'escrow', { description: 'Escrow dispute resolved by admin' }),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { decision, reason } = req.body;
      
      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'Invalid escrow transaction ID' });
      }
      
      const escrowTransaction = await EscrowTransaction.findById(id)
        .populate('propertyId', 'title price location')
        .populate('buyerId', 'firstName lastName email')
        .populate('sellerId', 'firstName lastName email');
      
      if (!escrowTransaction) {
        return res.status(404).json({ success: false, message: 'Escrow transaction not found' });
      }
      
      // Update escrow status and mediation info
      escrowTransaction.status = decision === 'approve' ? 'completed' : 'cancelled';
      escrowTransaction.mediation = {
        required: true,
        initiatedBy: escrowTransaction.buyerId._id,
        initiatedAt: new Date(),
        resolvedBy: req.user._id,
        resolvedAt: new Date(),
        decision: decision === 'approve' ? 'buyer_favor' : 'seller_favor',
        reason: reason || 'Admin mediation decision'
      };
      
      if (decision === 'approve') {
        escrowTransaction.actualCompletion = new Date();
      }
      
      // Add timeline entry
      escrowTransaction.timeline.push({
        action: 'admin_mediation',
        description: `Admin ${decision}d the escrow transaction`,
        performedBy: req.user._id,
        metadata: { decision, reason }
      });
      
      await escrowTransaction.save();
      
      // Send notifications to buyer and seller
      await notificationService.createEscrowNotification(
        escrowTransaction,
        escrowTransaction.buyerId,
        'escrow_resolved',
        req.user
      );

      await notificationService.createEscrowNotification(
        escrowTransaction,
        escrowTransaction.sellerId,
        'escrow_resolved',
        req.user
      );
      
      res.json({ 
        success: true, 
        message: `Escrow transaction ${decision}d successfully`, 
        data: escrowTransaction 
      });
    } catch (error) {
      console.error('Error resolving escrow transaction:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

// Admin list users (buyers/vendors/admins)
app.get('/api/admin/users', protect, authorize('admin'), async (req, res) => {
  try {
    const { role, page = 1, limit = 20, search, sort = 'createdAt', order = 'desc' } = req.query;
    
    // Build filter
    const filter = {};
    if (role) filter.role = role;
    
    // Text search
    if (search) {
      filter.$text = { $search: search };
    }
    
    // Build sort
    const sortObj = {};
    sortObj[sort] = order === 'desc' ? -1 : 1;
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const users = await User.find(filter)
      .select('-password -verificationToken -resetPasswordToken')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await User.countDocuments(filter);
    const totalPages = Math.ceil(total / parseInt(limit));
    
    res.json({
      success: true,
      data: users,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Admin list vendors (mock: users with roles containing 'vendor' or vendorData present)
app.get('/api/admin/vendors', (req, res) => {
  const vendors = mockUsers.filter(u => u.roles?.includes?.('vendor') || u.vendorData);
  res.json({ success: true, data: vendors });
});

// Admin list buyers (mock: users with role 'user' and not admin)
app.get('/api/admin/buyers', (req, res) => {
  const buyers = mockUsers.filter(u => u.role === 'user');
  res.json({ success: true, data: buyers });
});

// Admin disputes endpoint (disputed or expired escrow)
app.get('/api/admin/disputes', protect, authorize('admin'), async (req, res) => {
  try {
    const now = new Date();
    
    // Find disputed transactions or expired transactions
    const disputes = await EscrowTransaction.find({
      $or: [
        { status: 'disputed' },
        {
          status: { $nin: ['completed', 'cancelled'] },
          expectedCompletion: { $lt: now }
        }
      ]
    })
    .populate('propertyId', 'title price location')
    .populate('buyerId', 'firstName lastName email')
    .populate('sellerId', 'firstName lastName email')
    .sort({ createdAt: -1 });
    
    res.json({ success: true, data: disputes });
  } catch (error) {
    console.error('Error fetching disputes:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Admin user management endpoints
app.get('/api/admin/users/:id', (req, res) => {
  const { id } = req.params;
  const user = mockUsers.find(u => u.id === id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  res.json({ success: true, data: user });
});

app.put('/api/admin/users/:id/suspend', 
  protect, 
  authorize('admin'), 
  sanitizeInput,
  logAdminAction('user_suspended', 'user', { description: 'User account suspended' }),
  async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Don't allow suspending other admins
    if (user.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot suspend admin users' });
    }
    
    user.isActive = false;
    user.suspendedAt = new Date();
    user.suspendedBy = req.user?._id || null; // From auth middleware
    
    await user.save();
    
    res.json({ success: true, message: 'User suspended successfully', data: user });
  } catch (error) {
    console.error('Error suspending user:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.put('/api/admin/users/:id/activate', 
  protect, 
  authorize('admin'), 
  sanitizeInput,
  logAdminAction('user_activated', 'user', { description: 'User account activated' }),
  async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    user.isActive = true;
    user.activatedAt = new Date();
    user.activatedBy = req.user?._id || null; // From auth middleware
    user.suspendedAt = undefined;
    user.suspendedBy = undefined;
    
    await user.save();
    
    res.json({ success: true, message: 'User activated successfully', data: user });
  } catch (error) {
    console.error('Error activating user:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.delete('/api/admin/users/:id', 
  protect, 
  authorize('admin'), 
  sanitizeInput,
  logAdminAction('user_deleted', 'user', { description: 'User account deleted', severity: 'high' }),
  async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Don't allow deleting admin users
    if (user.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot delete admin users' });
    }
    
    // Don't allow users to delete themselves
    if (req.user && req.user._id.toString() === id) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    }
    
    // Delete user's properties first
    await Property.deleteMany({ owner: id });
    
    // Delete user
    await User.findByIdAndDelete(id);
    
    res.json({ success: true, message: 'User and associated data deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Escrow timeout and dispute resolution
app.post('/api/admin/escrow/:id/timeout', 
  protect, 
  authorize('admin'), 
  sanitizeInput,
  logAdminAction('escrow_timeout', 'escrow', { description: 'Escrow transaction marked as disputed due to timeout' }),
  async (req, res) => {
    try {
      const { id } = req.params;
      
      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'Invalid escrow transaction ID' });
      }
      
      const escrowTransaction = await EscrowTransaction.findById(id);
      if (!escrowTransaction) {
        return res.status(404).json({ success: false, message: 'Escrow transaction not found' });
      }
      
      // Mark as disputed due to timeout
      escrowTransaction.status = 'disputed';
      escrowTransaction.dispute = {
        reason: 'payment_timeout',
        description: 'Payment timeout - buyer did not confirm within time limit',
        filedBy: req.user._id,
        filedAt: new Date()
      };
      
      // Add timeline entry
      escrowTransaction.timeline.push({
        action: 'timeout_dispute',
        description: 'Escrow transaction disputed due to timeout',
        performedBy: req.user._id,
        metadata: { reason: 'timeout' }
      });
      
      await escrowTransaction.save();
      
      res.json({ 
        success: true, 
        message: 'Escrow transaction marked as disputed due to timeout', 
        data: escrowTransaction 
      });
    } catch (error) {
      console.error('Error marking escrow as disputed:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

app.post('/api/admin/escrow/:id/resolve-payment', 
  protect, 
  authorize('admin'), 
  sanitizeInput,
  validate([
    body('decision').isIn(['approve', 'reject']).withMessage('Decision must be approve or reject'),
    body('recipient').isIn(['buyer', 'vendor']).withMessage('Recipient must be buyer or vendor'),
    body('reason').optional().trim().isLength({ max: 500 }).withMessage('Reason cannot exceed 500 characters')
  ]),
  logAdminAction('escrow_payment_resolved', 'escrow', { description: 'Escrow payment resolution processed by admin' }),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { decision, recipient, reason } = req.body;
      
      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'Invalid escrow transaction ID' });
      }
      
      const escrowTransaction = await EscrowTransaction.findById(id);
      if (!escrowTransaction) {
        return res.status(404).json({ success: false, message: 'Escrow transaction not found' });
      }
      
      if (decision === 'approve') {
        escrowTransaction.status = 'completed';
        escrowTransaction.actualCompletion = new Date();
        escrowTransaction.mediation = {
          required: true,
          resolvedBy: req.user._id,
          resolvedAt: new Date(),
          decision: recipient === 'buyer' ? 'buyer_favor' : 'seller_favor',
          reason: reason || 'Payment approved by admin'
        };
      } else {
        escrowTransaction.status = 'cancelled';
        escrowTransaction.mediation = {
          required: true,
          resolvedBy: req.user._id,
          resolvedAt: new Date(),
          decision: 'buyer_favor', // Refund to buyer
          reason: reason || 'Payment rejected by admin'
        };
      }
      
      // Add timeline entry
      escrowTransaction.timeline.push({
        action: 'payment_resolution',
        description: `Admin ${decision}d payment - ${recipient} receives funds`,
        performedBy: req.user._id,
        metadata: { decision, recipient, reason }
      });
      
      await escrowTransaction.save();
      
      res.json({ 
        success: true, 
        message: 'Payment resolution processed successfully', 
        data: escrowTransaction 
      });
    } catch (error) {
      console.error('Error resolving payment:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);


// Admin dashboard statistics
app.get('/api/admin/stats', protect, authorize('admin'), async (req, res) => {
  try {
    // Get property statistics
    const totalProperties = await Property.countDocuments();
    const pendingProperties = await Property.countDocuments({ verificationStatus: 'pending' });
    const approvedProperties = await Property.countDocuments({ verificationStatus: 'approved' });
    const rejectedProperties = await Property.countDocuments({ verificationStatus: 'rejected' });
    
    // Get user statistics
    const totalUsers = await User.countDocuments();
    const totalAgents = await User.countDocuments({ role: 'agent' });
    const verifiedUsers = await User.countDocuments({ isVerified: true });
    const activeUsers = await User.countDocuments({ isActive: true });
    
    // Get escrow statistics
    const totalEscrows = await EscrowTransaction.countDocuments();
    const activeEscrows = await EscrowTransaction.countDocuments({ status: 'active' });
    const disputedEscrows = await EscrowTransaction.countDocuments({ status: 'disputed' });
    const completedEscrows = await EscrowTransaction.countDocuments({ status: 'completed' });
    
    // Get recent activity
    const recentProperties = await Property.find()
      .populate('owner', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(5);
    
    const recentUsers = await User.find()
      .select('firstName lastName email role createdAt')
      .sort({ createdAt: -1 })
      .limit(5);
    
    const recentEscrows = await EscrowTransaction.find()
      .populate('buyerId', 'firstName lastName')
      .populate('sellerId', 'firstName lastName')
      .populate('propertyId', 'title')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        properties: {
          total: totalProperties,
          pending: pendingProperties,
          approved: approvedProperties,
          rejected: rejectedProperties
        },
        users: {
          total: totalUsers,
          agents: totalAgents,
          verified: verifiedUsers,
          active: activeUsers
        },
        escrows: {
          total: totalEscrows,
          active: activeEscrows,
          disputed: disputedEscrows,
          completed: completedEscrows
        },
        recentActivity: {
          properties: recentProperties,
          users: recentUsers,
          escrows: recentEscrows
        }
      }
    });
  } catch (error) {
    console.error('Error fetching admin statistics:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Enhanced property creation with more fields
app.post('/api/properties', (req, res) => {
  const { 
    title, 
    description, 
    price, 
    type, 
    status,
    location, 
    details,
    amenities,
    images,
    videos,
    documentation
  } = req.body;
  
  if (!title || !description || !price || !type || !status || !location || !details) {
    return res.status(400).json({
      success: false,
      message: 'All required fields must be provided'
    });
  }
  
  const newProperty = {
    id: Date.now().toString(),
    title,
    description,
    price: parseInt(price),
    type,
    status,
    location: {
      ...location,
      coordinates: location.coordinates || { latitude: 0, longitude: 0 },
      nearestBusStop: location.nearestBusStop || null
    },
    details: {
      ...details,
      yearBuilt: details.yearBuilt || null,
      lotSize: details.lotSize || null,
      parking: details.parking || null,
      heating: details.heating || null,
      cooling: details.cooling || null
    },
    amenities: amenities || [],
    images: images || [
      {
        url: 'https://picsum.photos/400/300',
        isPrimary: true,
        caption: 'Property Image'
      }
    ],
    videos: videos || [],
    documentation: documentation || [],
    owner: mockUsers[0],
    views: 0,
    favorites: [],
    isVerified: false,
    verificationStatus: 'pending',
    verificationNotes: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  mockProperties.push(newProperty);
  
  res.status(201).json({
    success: true,
    message: 'Property created successfully',
    data: newProperty
  });
});

// Update property endpoint
app.put('/api/properties/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  const propertyIndex = mockProperties.findIndex(p => p.id === id);
  
  if (propertyIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Property not found'
    });
  }
  
  // Update the property with new data
  mockProperties[propertyIndex] = {
    ...mockProperties[propertyIndex],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  res.json({
    success: true,
    message: 'Property updated successfully',
    data: mockProperties[propertyIndex]
  });
});

// Flutterwave Escrow Routes
app.post('/api/escrow', 
  protect,
  sanitizeInput,
  validate([
    body('propertyId').isMongoId().withMessage('Valid property ID is required'),
    body('amount').isNumeric().withMessage('Amount must be a valid number'),
    body('paymentMethod').optional().isIn(['flutterwave', 'paystack', 'bank_transfer']).withMessage('Invalid payment method')
  ]),
  async (req, res) => {
    try {
      const { 
        propertyId, 
        amount, 
        paymentMethod = 'flutterwave',
        currency = 'NGN'
      } = req.body;

      const buyerId = req.user._id;

      // Verify property exists and is available
      const property = await Property.findById(propertyId);
      if (!property) {
        return res.status(404).json({
          success: false,
          message: 'Property not found'
        });
      }

      // Check if property is available for purchase
      if (property.status !== 'for-sale' && property.status !== 'for-rent') {
        return res.status(400).json({
          success: false,
          message: 'Property is not available for purchase'
        });
      }

      // Don't allow users to buy their own property
      if (property.owner.toString() === buyerId.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Cannot create escrow for your own property'
        });
      }

      // Calculate fees
      const settings = await AdminSettings.findOne();
      const platformFee = amount * (settings?.platformFee || 0.025);
      const processingFee = amount * 0.015; // 1.5% processing fee
      const totalFees = platformFee + processingFee;
      const totalAmount = amount + totalFees;

      // Calculate expected completion date
      const expectedCompletion = new Date();
      expectedCompletion.setDate(expectedCompletion.getDate() + (settings?.escrowTimeoutDays || 7));

      const newEscrowTransaction = new EscrowTransaction({
        propertyId,
        buyerId,
        sellerId: property.owner,
        amount,
        currency,
        status: 'initiated',
        paymentMethod,
        expectedCompletion,
        fees: {
          platformFee,
          processingFee,
          totalFees
        },
        timeline: [
          {
            action: 'created',
            description: 'Escrow transaction created',
            performedBy: buyerId
          }
        ]
      });

      await newEscrowTransaction.save();

              // Populate the response
              const populatedTransaction = await EscrowTransaction.findById(newEscrowTransaction._id)
                .populate('propertyId', 'title price location')
                .populate('buyerId', 'firstName lastName email')
                .populate('sellerId', 'firstName lastName email');

              // Send notifications to buyer and seller
              await notificationService.createEscrowNotification(
                populatedTransaction,
                populatedTransaction.sellerId,
                'escrow_created',
                populatedTransaction.buyerId
              );

              res.status(201).json({
                success: true,
                message: 'Escrow transaction created successfully',
                data: populatedTransaction
              });
    } catch (error) {
      console.error('Error creating escrow transaction:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

// Flutterwave payment initialization
app.post('/api/escrow/payment', (req, res) => {
  const { escrowId, paymentMethod = 'card' } = req.body;

  const escrowTransaction = mockEscrowTransactions.find(e => e.id === escrowId);
  if (!escrowTransaction) {
    return res.status(404).json({
      success: false,
      message: 'Escrow transaction not found'
    });
  }

  // Generate Flutterwave payment data
  const paymentData = {
    tx_ref: `ESCROW_${escrowId}_${Date.now()}`,
    amount: escrowTransaction.totalAmount,
    currency: escrowTransaction.currency,
    redirect_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/escrow/verify`,
    customer: {
      email: escrowTransaction.buyerEmail,
      name: escrowTransaction.buyerName,
      phone_number: 'N/A'
    },
    customizations: {
      title: 'Property Escrow Payment',
      description: `Payment for ${escrowTransaction.propertyTitle}`,
      logo: 'https://example.com/logo.png'
    },
    meta: {
      escrow_id: escrowId,
      property_id: escrowTransaction.propertyId,
      buyer_id: escrowTransaction.buyerId,
      seller_id: escrowTransaction.sellerId
    }
  };

  // In production, this would make a real API call to Flutterwave
  const mockFlutterwaveResponse = {
    status: 'success',
    message: 'Payment initiated',
    data: {
      link: `https://checkout.flutterwave.com/v3/hosted/pay/${paymentData.tx_ref}`,
      reference: paymentData.tx_ref,
      amount: paymentData.amount,
      currency: paymentData.currency
    }
  };

  // Update escrow transaction with Flutterwave reference
  escrowTransaction.flutterwaveReference = paymentData.tx_ref;

  res.json({
    success: true,
    message: 'Payment initiated successfully',
    data: {
      payment_url: mockFlutterwaveResponse.data.link,
      reference: mockFlutterwaveResponse.data.reference,
      amount: mockFlutterwaveResponse.data.amount,
      currency: mockFlutterwaveResponse.data.currency,
      escrow_id: escrowId
    }
  });
});

// Flutterwave payment verification
app.post('/api/escrow/verify', (req, res) => {
  const { transaction_id, tx_ref, status } = req.body;

  if (!transaction_id || !tx_ref || !status) {
    return res.status(400).json({
      success: false,
      message: 'Missing required verification parameters'
    });
  }

  // Find escrow transaction by Flutterwave reference
  const escrowTransaction = mockEscrowTransactions.find(e => e.flutterwaveReference === tx_ref);
  if (!escrowTransaction) {
    return res.status(404).json({
      success: false,
      message: 'Escrow transaction not found'
    });
  }

  if (status === 'successful') {
    // Update escrow transaction status
    escrowTransaction.status = 'funded';
    escrowTransaction.flutterwaveTransactionId = transaction_id;
    escrowTransaction.milestones[0].status = 'completed';
    escrowTransaction.milestones[0].date = new Date().toISOString();

    res.json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        escrow_id: escrowTransaction.id,
        status: 'funded',
        transaction_id,
        amount: escrowTransaction.amount,
        currency: escrowTransaction.currency
      }
    });
  } else {
    escrowTransaction.status = 'cancelled';
    
    res.json({
      success: false,
      message: 'Payment failed or was cancelled',
      data: {
        escrow_id: escrowTransaction.id,
        status: 'cancelled',
        transaction_id
      }
    });
  }
});

// Get escrow transactions
app.get('/api/escrow', (req, res) => {
  const { userId, status } = req.query;
  
  let filteredTransactions = [...mockEscrowTransactions];
  
  if (userId) {
    filteredTransactions = filteredTransactions.filter(t => 
      t.buyerId === userId || t.sellerId === userId
    );
  }
  
  if (status) {
    filteredTransactions = filteredTransactions.filter(t => t.status === status);
  }
  
  res.json({
    success: true,
    data: filteredTransactions
  });
});

// Get specific escrow transaction
app.get('/api/escrow/:id', (req, res) => {
  const escrowTransaction = mockEscrowTransactions.find(e => e.id === req.params.id);
  
  if (!escrowTransaction) {
    return res.status(404).json({
      success: false,
      message: 'Escrow transaction not found'
    });
  }
  
  res.json({
    success: true,
    data: escrowTransaction
  });
});

// Update escrow status (admin only)
app.put('/api/escrow/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;
  
  const escrowTransaction = mockEscrowTransactions.find(e => e.id === id);
  if (!escrowTransaction) {
    return res.status(404).json({
      success: false,
      message: 'Escrow transaction not found'
    });
  }
  
  escrowTransaction.status = status;
  if (notes) {
    escrowTransaction.notes = notes;
  }
  
  res.json({
    success: true,
    message: 'Escrow status updated successfully',
    data: escrowTransaction
  });
});

// Investment opportunities routes
app.get('/api/investments', (req, res) => {
  const { type, status, minAmount, maxAmount } = req.query;
  
  let filteredInvestments = [...mockInvestmentOpportunities];
  
  // Filter by type
  if (type) {
    filteredInvestments = filteredInvestments.filter(inv => inv.type === type);
  }
  
  // Filter by status
  if (status) {
    filteredInvestments = filteredInvestments.filter(inv => inv.status === status);
  }
  
  // Filter by amount range
  if (minAmount) {
    filteredInvestments = filteredInvestments.filter(inv => inv.minimumInvestment >= parseInt(minAmount));
  }
  if (maxAmount) {
    filteredInvestments = filteredInvestments.filter(inv => inv.minimumInvestment <= parseInt(maxAmount));
  }
  
  res.json({
    success: true,
    data: filteredInvestments,
    total: filteredInvestments.length
  });
});

app.get('/api/investments/:id', (req, res) => {
  const { id } = req.params;
  const investment = mockInvestmentOpportunities.find(inv => inv.id === id);
  
  if (!investment) {
    return res.status(404).json({
      success: false,
      message: 'Investment opportunity not found'
    });
  }
  
  res.json({
    success: true,
    data: investment
  });
});

// User investments routes
app.get('/api/user/investments', (req, res) => {
  const { userId } = req.query;
  
  if (!userId) {
    return res.status(400).json({
      success: false,
      message: 'User ID is required'
    });
  }
  
  const userInvestments = mockUserInvestments.filter(inv => inv.userId === userId);
  
  // Calculate portfolio summary
  const portfolioSummary = {
    totalInvested: userInvestments.reduce((sum, inv) => sum + inv.amount, 0),
    totalDividendsEarned: userInvestments.reduce((sum, inv) => sum + inv.totalDividendsEarned, 0),
    totalReturn: userInvestments.reduce((sum, inv) => sum + (inv.totalDividendsEarned / inv.amount * 100), 0) / userInvestments.length || 0,
    activeInvestments: userInvestments.filter(inv => inv.status === 'active').length,
    totalInvestments: userInvestments.length
  };
  
  res.json({
    success: true,
    data: userInvestments,
    summary: portfolioSummary
  });
});

app.post('/api/investments/:id/invest', (req, res) => {
  const { id } = req.params;
  const { userId, amount } = req.body;
  
  if (!userId || !amount) {
    return res.status(400).json({
      success: false,
      message: 'User ID and investment amount are required'
    });
  }
  
  const investment = mockInvestmentOpportunities.find(inv => inv.id === id);
  
  if (!investment) {
    return res.status(404).json({
      success: false,
      message: 'Investment opportunity not found'
    });
  }
  
  if (amount < investment.minimumInvestment) {
    return res.status(400).json({
      success: false,
      message: `Minimum investment amount is $${investment.minimumInvestment.toLocaleString()}`
    });
  }
  
  if (investment.raisedAmount + amount > investment.totalAmount) {
    return res.status(400).json({
      success: false,
      message: 'Investment amount exceeds remaining available amount'
    });
  }
  
  // Create new user investment
  const newUserInvestment = {
    id: Date.now().toString(),
    userId,
    investmentId: id,
    investmentTitle: investment.title,
    amount: parseInt(amount),
    shares: Math.floor(amount / investment.minimumInvestment),
    investmentDate: new Date().toISOString(),
    status: 'active',
    totalDividendsEarned: 0,
    lastDividendDate: null,
    expectedMonthlyDividend: (amount * investment.dividendRate / 100) / 12,
    totalReturn: 0
  };
  
  mockUserInvestments.push(newUserInvestment);
  
  // Update investment opportunity
  investment.raisedAmount += parseInt(amount);
  investment.investors += 1;
  
  if (investment.raisedAmount >= investment.totalAmount) {
    investment.status = 'funded';
  }
  
  res.json({
    success: true,
    message: 'Investment successful!',
    data: newUserInvestment
  });
});

// Dividend routes
app.get('/api/investments/:id/dividends', (req, res) => {
  const { id } = req.params;
  const investment = mockInvestmentOpportunities.find(inv => inv.id === id);
  
  if (!investment) {
    return res.status(404).json({
      success: false,
      message: 'Investment opportunity not found'
    });
  }
  
  res.json({
    success: true,
    data: investment.monthlyDividends || []
  });
});

app.post('/api/investments/:id/dividends', (req, res) => {
  const { id } = req.params;
  const { month, amount } = req.body;
  
  const investment = mockInvestmentOpportunities.find(inv => inv.id === id);
  
  if (!investment) {
    return res.status(404).json({
      success: false,
      message: 'Investment opportunity not found'
    });
  }
  
  // Add dividend payment
  if (!investment.monthlyDividends) {
    investment.monthlyDividends = [];
  }
  
  investment.monthlyDividends.push({
    month,
    amount: parseInt(amount),
    paid: true,
    paidDate: new Date().toISOString()
  });
  
  // Update user investments with dividend earnings
  const userInvestments = mockUserInvestments.filter(inv => inv.investmentId === id);
  userInvestments.forEach(userInv => {
    const dividendShare = (userInv.amount / investment.raisedAmount) * amount;
    userInv.totalDividendsEarned += dividendShare;
    userInv.lastDividendDate = new Date().toISOString();
  });
  
  res.json({
    success: true,
    message: 'Dividend payment processed successfully',
    data: {
      month,
      amount,
      totalInvestors: userInvestments.length
    }
  });
});

// Mock users routes
app.get('/api/users/profile', (req, res) => {
  res.json({
    success: true,
    data: mockUsers[0]
  });
});

app.get('/api/users/favorites', (req, res) => {
  res.json({
    success: true,
    data: mockProperties.filter(p => p.favorites.includes(mockUsers[0].id))
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error occurred:', err);
  console.error('Request URL:', req.url);
  console.error('Request method:', req.method);
  console.error('Request body:', req.body);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      success: false,
      message: 'Validation error: ' + err.message 
    });
  }
  
  if (err.name === 'SyntaxError') {
    return res.status(400).json({ 
      success: false,
      message: 'Invalid JSON format' 
    });
  }
  
  res.status(500).json({ 
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Routes
app.use('/api/upload', require('./routes/upload'));
app.use('/api/notifications', require('./routes/notifications'));

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🏠 Properties: http://localhost:${PORT}/api/properties`);
  console.log(`👤 Auth: http://localhost:${PORT}/api/auth/login`);
  console.log(`💰 Escrow: http://localhost:${PORT}/api/escrow`);
  console.log(`💼 Investments: http://localhost:${PORT}/api/investments`);
  console.log(`📁 Upload: http://localhost:${PORT}/api/upload`);
  console.log(`🔔 Notifications: http://localhost:${PORT}/api/notifications`);
});

module.exports = app; 
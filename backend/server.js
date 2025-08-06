const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

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
    password: 'password123', // Add password for testing
    role: 'user',
    avatar: 'https://picsum.photos/150/150'
  },
  {
    id: '2',
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@example.com',
    password: 'admin123', // Add password for testing
    role: 'admin',
    avatar: 'https://picsum.photos/150/150'
  },
  {
    id: '3',
    firstName: 'Onyedikachi',
    lastName: 'Akoma',
    email: 'onyedika.akoma@gmail.com',
    password: 'dikaoliver2660',
    role: 'user',
    avatar: 'https://picsum.photos/150/150'
  }
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
    password, // Store password
    role: 'user',
    avatar: 'https://picsum.photos/150/150'
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
app.get('/api/admin/properties', (req, res) => {
  const { status, verificationStatus } = req.query;
  
  let filteredProperties = [...mockProperties];
  
  if (status) {
    filteredProperties = filteredProperties.filter(p => p.status === status);
  }
  
  if (verificationStatus) {
    filteredProperties = filteredProperties.filter(p => p.verificationStatus === verificationStatus);
  }
  
  res.json({
    success: true,
    data: filteredProperties,
    stats: {
      total: mockProperties.length,
      pending: mockProperties.filter(p => p.verificationStatus === 'pending').length,
      approved: mockProperties.filter(p => p.verificationStatus === 'approved').length,
      rejected: mockProperties.filter(p => p.verificationStatus === 'rejected').length
    }
  });
});

app.put('/api/admin/properties/:id/verify', (req, res) => {
  const { id } = req.params;
  const { verificationStatus, verificationNotes } = req.body;
  
  const property = mockProperties.find(p => p.id === id);
  
  if (!property) {
    return res.status(404).json({
      success: false,
      message: 'Property not found'
    });
  }
  
  property.verificationStatus = verificationStatus;
  property.verificationNotes = verificationNotes || '';
  property.isVerified = verificationStatus === 'approved';
  property.updatedAt = new Date().toISOString();
  
  res.json({
    success: true,
    message: `Property ${verificationStatus} successfully`,
    data: property
  });
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

// Flutterwave Escrow Routes
app.post('/api/escrow', (req, res) => {
  const { 
    propertyId, 
    buyerId, 
    buyerName, 
    buyerEmail,
    sellerId, 
    sellerName, 
    sellerEmail,
    amount, 
    type = 'sale',
    paymentMethod = 'card'
  } = req.body;

  if (!propertyId || !buyerId || !buyerName || !buyerEmail || !sellerId || !sellerName || !sellerEmail || !amount) {
    return res.status(400).json({
      success: false,
      message: 'All required fields must be provided'
    });
  }

  const property = mockProperties.find(p => p.id === propertyId);
  if (!property) {
    return res.status(404).json({
      success: false,
      message: 'Property not found'
    });
  }

  const escrowFee = Math.round(amount * 0.005); // 0.5% escrow fee
  const totalAmount = amount + escrowFee;

  const newEscrowTransaction = {
    id: Date.now().toString(),
    propertyId,
    propertyTitle: property.title,
    buyerId,
    buyerName,
    buyerEmail,
    sellerId,
    sellerName,
    sellerEmail,
    amount: parseInt(amount),
    currency: 'NGN',
    status: 'pending',
    type,
    paymentMethod,
    flutterwaveTransactionId: null,
    flutterwaveReference: null,
    createdAt: new Date().toISOString(),
    expectedCompletion: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    documents: [
      { name: 'Purchase Agreement', status: 'pending' },
      { name: 'Property Inspection Report', status: 'pending' },
      { name: 'Title Search', status: 'pending' }
    ],
    milestones: [
      { name: 'Initial Payment', status: 'pending', date: null, amount: Math.round(amount * 0.1) },
      { name: 'Property Inspection', status: 'pending', date: null, amount: 0 },
      { name: 'Final Payment', status: 'pending', date: null, amount: Math.round(amount * 0.9) }
    ],
    escrowFee,
    totalAmount
  };

  mockEscrowTransactions.push(newEscrowTransaction);

  res.status(201).json({
    success: true,
    message: 'Escrow transaction created successfully',
    data: newEscrowTransaction
  });
});

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

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🏠 Properties: http://localhost:${PORT}/api/properties`);
  console.log(`👤 Auth: http://localhost:${PORT}/api/auth/login`);
  console.log(`💰 Escrow: http://localhost:${PORT}/api/escrow`);
  console.log(`💼 Investments: http://localhost:${PORT}/api/investments`);
});

module.exports = app; 
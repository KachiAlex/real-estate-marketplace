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

// Mock data for testing
const mockUsers = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    role: 'user',
    avatar: 'https://picsum.photos/150/150'
  },
  {
    id: '2',
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@example.com',
    role: 'admin',
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

  const newUser = {
    id: Date.now().toString(),
    firstName,
    lastName,
    email,
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
    console.log('Missing required fields:', { email, password: password ? 'provided' : 'missing' });
    return res.status(400).json({
      success: false,
      message: 'Email and password are required'
    });
  }

  const user = mockUsers.find(u => u.email === email);
  console.log('User lookup result:', user ? 'found' : 'not found');
  
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  console.log('Login successful for user:', user.email);

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

// Mock properties routes
app.get('/api/properties', (req, res) => {
  const { 
    page = 1, 
    limit = 12, 
    search, 
    type, 
    status,
    minPrice, 
    maxPrice,
    bedrooms,
    bathrooms,
    verified
  } = req.query;
  
  let filteredProperties = [...mockProperties];
  
  // Apply filters
  if (search) {
    filteredProperties = filteredProperties.filter(p => 
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()) ||
      p.location.address.toLowerCase().includes(search.toLowerCase()) ||
      p.location.city.toLowerCase().includes(search.toLowerCase())
    );
  }
  
  if (type) {
    filteredProperties = filteredProperties.filter(p => p.type === type);
  }

  if (status) {
    filteredProperties = filteredProperties.filter(p => p.status === status);
  }
  
  if (minPrice) {
    filteredProperties = filteredProperties.filter(p => p.price >= parseInt(minPrice));
  }
  
  if (maxPrice) {
    filteredProperties = filteredProperties.filter(p => p.price <= parseInt(maxPrice));
  }

  if (bedrooms) {
    filteredProperties = filteredProperties.filter(p => p.details.bedrooms >= parseInt(bedrooms));
  }

  if (bathrooms) {
    filteredProperties = filteredProperties.filter(p => p.details.bathrooms >= parseInt(bathrooms));
  }

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
});

module.exports = app; 
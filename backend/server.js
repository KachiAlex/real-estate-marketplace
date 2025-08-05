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
    avatar: 'https://via.placeholder.com/150'
  }
];

const mockProperties = [
  {
    id: '1',
    title: 'Beautiful Family Home',
    description: 'Spacious 3-bedroom home with modern amenities',
    price: 450000,
    type: 'house',
    status: 'for-sale',
    location: {
      address: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001'
    },
    details: {
      bedrooms: 3,
      bathrooms: 2,
      sqft: 1800
    },
    images: [
      {
        url: 'https://via.placeholder.com/400x300',
        isPrimary: true
      }
    ],
    owner: mockUsers[0],
    views: 45,
    favorites: []
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
    avatar: 'https://via.placeholder.com/150'
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
  const { page = 1, limit = 12, search, type, minPrice, maxPrice } = req.query;
  
  let filteredProperties = [...mockProperties];
  
  // Apply filters
  if (search) {
    filteredProperties = filteredProperties.filter(p => 
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase())
    );
  }
  
  if (type) {
    filteredProperties = filteredProperties.filter(p => p.type === type);
  }
  
  if (minPrice) {
    filteredProperties = filteredProperties.filter(p => p.price >= parseInt(minPrice));
  }
  
  if (maxPrice) {
    filteredProperties = filteredProperties.filter(p => p.price <= parseInt(maxPrice));
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

app.post('/api/properties', (req, res) => {
  const { title, description, price, type, location, details } = req.body;
  
  if (!title || !description || !price || !type || !location || !details) {
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
    status: 'for-sale',
    location,
    details,
    images: [
      {
        url: 'https://via.placeholder.com/400x300',
        isPrimary: true
      }
    ],
    owner: mockUsers[0],
    views: 0,
    favorites: [],
    createdAt: new Date().toISOString()
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
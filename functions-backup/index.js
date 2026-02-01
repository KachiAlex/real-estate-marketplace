const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');

if (!admin.apps.length) {
  admin.initializeApp();
}

// Create a minimal app for Cloud Functions
const app = express();

// Basic middleware  
app.use(cors({ origin: true }));
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Firebase Functions API is live',
    timestamp: new Date().toISOString()
  });
});

// Simple test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API is working',
    data: {
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'production'
    }
  });
});

// Mock verification requests endpoint for VendorDashboard
app.get('/api/verification/applications/mine', (req, res) => {
  res.json({
    success: true,
    data: [],
    message: 'No verification requests found'
  });
});

// Mock vendor analytics endpoint for VendorDashboard
app.get('/api/dashboard/vendor', (req, res) => {
  res.json({
    success: true,
    data: {
      totalProperties: 0,
      activeListings: 0,
      pendingListings: 0,
      soldProperties: 0,
      totalViews: 0,
      totalInquiries: 0,
      totalRevenue: 0,
      conversionRate: 0
    }
  });
});

// Property verification config endpoint
app.get('/api/verification/config', (req, res) => {
  res.json({
    success: true,
    data: {
      verificationFee: 50000,
      verificationBadgeColor: '#10B981',
      supportedDocuments: ['title_deed', 'survey_plan', 'building_approval', 'tax_clearance'],
      processingTime: '3-5 business days'
    }
  });
});

// Payment initialization endpoint with correct structure
app.post('/api/payments/initialize', (req, res) => {
  const paymentId = 'pay_' + Date.now();
  const txRef = 'tx_' + Date.now();
  const amount = req.body.amount || 50000;
  
  // Use our mock payment page for development
  const mockPaymentUrl = `https://real-estate-marketplace-37544.web.app/mock-payment.html?amount=${amount}&tx_ref=${txRef}`;
  
  res.json({
    success: true,
    data: {
      payment: {
        id: paymentId,
        amount: amount,
        currency: 'NGN',
        status: 'pending',
        txRef: txRef
      },
      providerData: {
        authorizationUrl: mockPaymentUrl,
        link: mockPaymentUrl,
        txRef: txRef,
        tx_ref: txRef
      }
    }
  });
});

// Payment verification endpoint
app.post('/api/payments/:id/verify', (req, res) => {
  res.json({
    success: true,
    data: {
      paymentId: req.params.id,
      status: 'successful',
      transactionId: 'txn_' + Date.now(),
      verified: true
    }
  });
});

// Blog posts endpoint
app.get('/api/blog', (req, res) => {
  const { limit = 10, sort = 'newest' } = req.query;
  
  // Mock blog posts data
  const mockPosts = [
    {
      id: '1',
      title: '5 Tips for First-Time Home Buyers',
      slug: '5-tips-first-time-home-buyers',
      excerpt: 'Essential guidance for navigating your first home purchase with confidence.',
      content: 'Buying your first home can be overwhelming...',
      author: {
        name: 'PropertyArk Team',
        avatar: '/images/team/avatar.jpg'
      },
      coverImage: '/images/blog/home-buying-tips.jpg',
      publishedAt: '2024-01-15T10:00:00Z',
      readingTime: '5 min read',
      tags: ['home-buying', 'tips', 'first-time'],
      featured: true
    },
    {
      id: '2',
      title: 'Understanding Property Valuation',
      slug: 'understanding-property-valuation',
      excerpt: 'Learn how property values are determined and what factors affect them.',
      content: 'Property valuation is both an art and a science...',
      author: {
        name: 'PropertyArk Team',
        avatar: '/images/team/avatar.jpg'
      },
      coverImage: '/images/blog/property-valuation.jpg',
      publishedAt: '2024-01-10T14:30:00Z',
      readingTime: '7 min read',
      tags: ['valuation', 'property', 'investment'],
      featured: false
    },
    {
      id: '3',
      title: 'Real Estate Market Trends 2024',
      slug: 'real-estate-market-trends-2024',
      excerpt: 'Key trends shaping the real estate market this year and what to expect.',
      content: 'The real estate market in 2024 shows interesting patterns...',
      author: {
        name: 'PropertyArk Team',
        avatar: '/images/team/avatar.jpg'
      },
      coverImage: '/images/blog/market-trends.jpg',
      publishedAt: '2024-01-05T09:15:00Z',
      readingTime: '6 min read',
      tags: ['market-trends', '2024', 'forecast'],
      featured: true
    },
    {
      id: '4',
      title: 'Home Security Essentials',
      slug: 'home-security-essentials',
      excerpt: 'Protect your investment with these essential home security measures.',
      content: 'Securing your home goes beyond just locks and alarms...',
      author: {
        name: 'PropertyArk Team',
        avatar: '/images/team/avatar.jpg'
      },
      coverImage: '/images/blog/home-security.jpg',
      publishedAt: '2024-01-01T11:45:00Z',
      readingTime: '4 min read',
      tags: ['security', 'home', 'safety'],
      featured: false
    }
  ];
  
  // Sort posts
  let sortedPosts = [...mockPosts];
  if (sort === 'newest') {
    sortedPosts.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  } else if (sort === 'oldest') {
    sortedPosts.sort((a, b) => new Date(a.publishedAt) - new Date(b.publishedAt));
  }
  
  // Apply limit
  const limitedPosts = sortedPosts.slice(0, parseInt(limit));
  
  res.json({
    success: true,
    data: {
      posts: limitedPosts,
      total: mockPosts.length,
      limit: parseInt(limit),
      sort
    }
  });
});

// Admin chat stats endpoint
app.get('/api/admin/chat/stats', (req, res) => {
  res.json({
    success: true,
    data: {
      unread: 0,
      urgent: 0,
      total: 0
    }
  });
});

// Admin settings endpoint
app.get('/api/admin/settings', (req, res) => {
  res.json({
    success: true,
    data: {
      siteName: 'PropertyArk',
      maintenance: false,
      features: {
        chat: true,
        verification: true,
        blog: true
      }
    }
  });
});

// Admin properties endpoint
app.get('/api/admin/properties', (req, res) => {
  res.json({
    success: true,
    data: {
      properties: [],
      total: 0
    }
  });
});

// Verification config endpoint
app.get('/api/verification/config', (req, res) => {
  res.json({
    success: true,
    data: {
      verificationFee: 50000,
      currency: 'NGN',
      supportedDocuments: ['title_deed', 'survey_plan', 'building_approval', 'tax_clearance'],
      processingTime: '3-5 business days'
    }
  });
});

// Admin verification applications endpoint
app.get('/api/admin/verification-applications', (req, res) => {
  // Return real applications if they exist, otherwise return mock data
  let applications = [];
  
  if (global.verificationApplications && global.verificationApplications.length > 0) {
    // Transform stored applications to match expected format
    applications = global.verificationApplications.map(app => ({
      id: app.id,
      applicant: { 
        name: 'Vendor User', // In real implementation, this would come from user data
        email: 'vendor@example.com'
      },
      propertyName: app.propertyName,
      propertyLocation: app.propertyLocation,
      propertyUrl: app.propertyUrl,
      verificationFee: app.paymentAmount || 50000,
      status: app.status,
      requestedBadgeColor: app.preferredBadgeColor,
      paymentReference: app.paymentReference,
      paymentMethod: app.paymentMethod || 'card',
      message: app.message,
      createdAt: app.submittedAt,
      updatedAt: app.updatedAt
    }));
  } else {
    // Fallback to mock data if no real applications
    applications = [
      {
        id: 'app_1',
        applicant: { 
          name: 'John Doe', 
          email: 'john@example.com' 
        },
        propertyName: 'Modern Apartment in Lekki',
        propertyLocation: 'Lekki Phase 1, Lagos',
        propertyUrl: 'https://real-estate-marketplace-37544.web.app/property/123/modern-apartment',
        verificationFee: 50000,
        status: 'pending',
        requestedBadgeColor: '#10B981',
        paymentReference: 'CARD_1706809200000',
        paymentMethod: 'card',
        message: 'Please verify this property for listing',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'app_2',
        applicant: { 
          name: 'Jane Smith', 
          email: 'jane@example.com' 
        },
        propertyName: 'Luxury Villa in Ikoyi',
        propertyLocation: 'Ikoyi, Lagos',
        propertyUrl: 'https://real-estate-marketplace-37544.web.app/property/456/luxury-villa',
        verificationFee: 50000,
        status: 'approved',
        requestedBadgeColor: '#6366F1',
        badgeColor: '#6366F1',
        paymentReference: 'TRANSFER_1706809100000',
        paymentMethod: 'transfer',
        message: 'High-end property requiring verification',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 43200000).toISOString()
      }
    ];
  }
  
  res.json({
    success: true,
    data: {
      applications: applications,
      total: applications.length
    }
  });
});

// Admin approve/reject verification application
app.post('/api/admin/verification-applications/:id/:action', (req, res) => {
  const { id, action } = req.params;
  const { badgeColor } = req.body;
  
  if (!['approve', 'reject'].includes(action)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid action'
    });
  }
  
  // Find and update the application in memory
  let updatedApplication = null;
  if (global.verificationApplications) {
    const appIndex = global.verificationApplications.findIndex(app => app.id === id);
    if (appIndex !== -1) {
      global.verificationApplications[appIndex].status = action === 'approve' ? 'approved' : 'rejected';
      global.verificationApplications[appIndex].badgeColor = action === 'approve' ? badgeColor : null;
      global.verificationApplications[appIndex].updatedAt = new Date().toISOString();
      updatedApplication = global.verificationApplications[appIndex];
    }
  }
  
  // If not found in memory, try to find in mock data
  if (!updatedApplication) {
    // This is a fallback for mock data
    updatedApplication = {
      id: id,
      status: action === 'approve' ? 'approved' : 'rejected',
      badgeColor: action === 'approve' ? badgeColor : null,
      updatedAt: new Date().toISOString()
    };
  }
  
  console.log(`Application ${id} ${action}d:`, updatedApplication);
  
  res.json({
    success: true,
    data: updatedApplication,
    message: `Application ${action}d successfully`
  });
});

// Verification applications endpoint
app.post('/api/verification/applications', (req, res) => {
  const applicationData = {
    id: 'app_' + Date.now(),
    ...req.body,
    status: 'pending',
    submittedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // In a real implementation, this would be stored in a database
  // For now, we'll store it in memory (this will reset on function restart)
  if (!global.verificationApplications) {
    global.verificationApplications = [];
  }
  global.verificationApplications.push(applicationData);

  console.log('Verification application submitted:', applicationData);

  res.json({
    success: true,
    data: {
      applicationId: applicationData.id,
      status: 'pending',
      propertyId: req.body.propertyId,
      submittedAt: applicationData.submittedAt
    },
    message: 'Verification application submitted successfully'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// Export as Cloud Function
exports.api = functions.https.onRequest(app);

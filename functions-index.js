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
    timestamp: new Date().toISOString()
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

// In-memory storage for verification applications (resets on function restart)
let verificationApplications = [];

// Admin verification applications endpoint
app.get('/api/admin/verification-applications', (req, res) => {
  // Return real applications if they exist, otherwise return mock data
  let applications = [];
  
  if (verificationApplications && verificationApplications.length > 0) {
    // Transform stored applications to match expected format
    applications = verificationApplications.map(app => ({
      id: app.id,
      applicant: { 
        name: 'Vendor User',
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
  if (verificationApplications) {
    const appIndex = verificationApplications.findIndex(app => app.id === id);
    if (appIndex !== -1) {
      verificationApplications[appIndex].status = action === 'approve' ? 'approved' : 'rejected';
      verificationApplications[appIndex].badgeColor = action === 'approve' ? badgeColor : null;
      verificationApplications[appIndex].updatedAt = new Date().toISOString();
      updatedApplication = verificationApplications[appIndex];
    }
  }
  
  // If not found in memory, create a mock response
  if (!updatedApplication) {
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

  // Store in memory
  verificationApplications.push(applicationData);

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

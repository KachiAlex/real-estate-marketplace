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
  
  res.json({
    success: true,
    data: {
      payment: {
        id: paymentId,
        amount: req.body.amount || 50000,
        currency: 'NGN',
        status: 'pending',
        txRef: txRef
      },
      providerData: {
        authorizationUrl: 'https://flutterwave.com/pay/mock-payment',
        link: 'https://flutterwave.com/pay/mock-payment',
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

// Verification applications endpoint
app.post('/api/verification/applications', (req, res) => {
  res.json({
    success: true,
    data: {
      applicationId: 'app_' + Date.now(),
      status: 'pending',
      propertyId: req.body.propertyId,
      submittedAt: new Date().toISOString()
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

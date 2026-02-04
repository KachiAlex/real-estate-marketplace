const functions = require('firebase-functions');

// Simple health check function
exports.health = functions.https.onRequest((req, res) => {
  res.json({
    success: true,
    message: 'Firebase Functions API is live',
    timestamp: new Date().toISOString()
  });
});

// Simple test function
exports.test = functions.https.onRequest((req, res) => {
  res.json({
    success: true,
    message: 'API is working',
    timestamp: new Date().toISOString()
  });
});

// Verification config function
exports.verificationConfig = functions.https.onRequest((req, res) => {
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

// In-memory storage for verification applications
let verificationApplications = [];

// Verification applications submission endpoint
exports.verificationApplications = functions.https.onRequest((req, res) => {
  if (req.method === 'POST') {
    const applicationData = {
      id: 'app_' + Date.now(),
      ...req.body,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

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
  } else {
    res.status(405).json({ success: false, message: 'Method not allowed' });
  }
});

// Admin verification applications function
exports.adminVerificationApplications = functions.https.onRequest((req, res) => {
  if (req.method === 'GET') {
    let applications = [];
    
    if (verificationApplications && verificationApplications.length > 0) {
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
  } else {
    res.status(405).json({ success: false, message: 'Method not allowed' });
  }
});

// Verification application submission function
exports.verificationApplication = functions.https.onRequest((req, res) => {
  if (req.method === 'POST') {
    const applicationData = {
      id: 'app_' + Date.now(),
      ...req.body,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

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
  } else {
    res.status(405).json({ success: false, message: 'Method not allowed' });
  }
});

const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { sanitizeInput, validate, verificationValidation } = require('../middleware/validation');
const verificationService = require('../services/verificationService');
const adminSettingsService = require('../services/adminSettingsService');

const router = require('express').Router();

router.get('/config', async (req, res) => {
  try {
    const settings = await adminSettingsService.getSettings();

    const payload = {
      success: true,
      data: {
        verificationFee: settings.verificationFee || 50000,
        verificationBadgeColor: settings.verificationBadgeColor || '#10B981'
      }
    };

    // Temporary debug: if caller adds ?debug_headers=1, include received headers
    if (req.query && String(req.query.debug_headers) === '1') {
      payload.debug = {
        headers: req.headers,
        authorization: req.headers.authorization || null
      };
    }

    return res.json(payload);
  } catch (error) {
    console.error('Verification config error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load verification settings' });
  }
});

router.post(
  '/applications',
  protect,
  sanitizeInput,
  validate(verificationValidation.application),
  async (req, res) => {
    try {
      const application = await verificationService.submitApplication({
        applicant: req.user,
        propertyName: req.body.propertyName,
        propertyId: req.body.propertyId,
        propertyUrl: req.body.propertyUrl,
        propertyLocation: req.body.propertyLocation,
        message: req.body.message,
        attachments: req.body.attachments,
        preferredBadgeColor: req.body.preferredBadgeColor,
        verificationPaymentId: req.body.verificationPaymentId
      });

      return res.status(201).json({
        success: true,
        message: 'Verification request submitted successfully',
        data: application
      });
    } catch (error) {
      console.error('Submit verification application error:', error);
      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({ success: false, message: error.message || 'Failed to submit application' });
    }
  }
);

const buildMockApplications = () => ([
  {
    id: 'mock-verification-1',
    status: 'pending',
    applicationType: 'property_verification',
    propertyId: null,
    propertyName: 'Lekki Pearl Residence',
    propertyLocation: 'Lekki Phase 1, Lagos',
    propertyUrl: 'https://propertyark.com/properties/lekki-pearl',
    notes: 'Premium listing verification request (mocked)',
    documents: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    applicant: {
      id: 'mock-vendor-1',
      name: 'Jane Smith',
      email: 'jane@example.com'
    },
    badgeColor: '#6366F1',
    paymentStatus: 'pending',
    paymentReference: null
  }
]);

router.get('/applications', protect, authorize('admin'), async (req, res) => {
  try {
    const { status = 'all' } = req.query;
    const applications = await verificationService.listApplications({ status });
    return res.json({ success: true, data: applications });
  } catch (error) {
    console.error('List verification applications error:', error);
    console.warn('Serving mock verification applications due to upstream failure');
    return res.status(200).json({ success: true, data: buildMockApplications(), fallback: true });
  }
});

router.get('/applications/mine', protect, async (req, res) => {
  try {
    const applications = await verificationService.listApplications({ applicantId: req.user.id });
    return res.json({ success: true, data: applications });
  } catch (error) {
    console.error('List my verification applications error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load your verification applications' });
  }
});

router.patch(
  '/applications/:id/status',
  protect,
  authorize('admin'),
  sanitizeInput,
  validate(verificationValidation.decision),
  async (req, res) => {
    try {
      const updated = await verificationService.updateApplicationStatus({
        id: req.params.id,
        status: req.body.status,
        adminNotes: req.body.adminNotes,
        badgeColor: req.body.badgeColor,
        adminUser: req.user
      });

      return res.json({
        success: true,
        message: 'Verification application updated successfully',
        data: updated
      });
    } catch (error) {
      console.error('Update verification status error:', error);
      const status = error.statusCode || 500;
      return res.status(status).json({ success: false, message: error.message || 'Failed to update application' });
    }
  }
);

module.exports = router;

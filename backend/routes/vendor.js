const express = require('express');
const { protect } = require('../middleware/auth');
const { body } = require('express-validator');
const db = require('../config/sequelizeDb');
const { cloudinary, isConfigured } = require('../config/cloudinary');
const router = express.Router();

// PUT /api/vendor/profile - Update or create vendor profile
router.put('/profile', protect, [
  body('businessName').notEmpty(),
  body('businessType').notEmpty(),
  body('contactInfo.email').isEmail(),
  body('contactInfo.phone').notEmpty(),
], async (req, res) => {
  try {
    const userId = req.user.id;
    const vendorData = {
      businessName: req.body.businessName,
      businessType: req.body.businessType,
      contactInfo: req.body.contactInfo,
      kycDocs: req.body.kycDocs || [],
      kycStatus: req.body.kycStatus || 'pending',
      onboardingComplete: true,
      updatedAt: new Date()
    };

    const user = await db.User.findByPk(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Preserve any existing roles (so a buyer can also become a vendor)
    let existingRoles = user.roles;
    try { existingRoles = Array.isArray(existingRoles) ? existingRoles : (existingRoles ? JSON.parse(existingRoles) : []); } catch (e) { existingRoles = Array.isArray(user.roles) ? user.roles : []; }
    existingRoles = Array.from(new Set([...(existingRoles || []), 'vendor']));

    await user.update({ role: 'vendor', roles: existingRoles, activeRole: 'vendor', vendorData });
    res.json({ success: true, vendor: vendorData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

// POST /api/vendor/kyc/verify - Verify Cloudinary public IDs and attach to vendorData
router.post('/kyc/verify', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const { publicIds } = req.body;

    if (!publicIds || !Array.isArray(publicIds) || publicIds.length === 0) {
      return res.status(400).json({ success: false, message: 'publicIds array is required' });
    }

    if (!isConfigured || !isConfigured()) {
      return res.status(503).json({ success: false, message: 'Cloudinary is not configured on the server' });
    }

    const verified = [];
    for (const pid of publicIds) {
      try {
        const resource = await cloudinary.api.resource(pid);
        verified.push({
          publicId: resource.public_id,
          url: resource.secure_url,
          resourceType: resource.resource_type,
          format: resource.format,
          bytes: resource.bytes,
          width: resource.width,
          height: resource.height,
          createdAt: resource.created_at
        });
      } catch (err) {
        // skip missing resources but continue verifying others
        console.warn('Cloudinary resource not found or error for', pid, err && err.message);
      }
    }

    if (verified.length === 0) {
      return res.status(404).json({ success: false, message: 'No valid Cloudinary resources found for provided publicIds' });
    }

    const user = await db.User.findByPk(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Merge into existing vendorData.kycDocs
    let vendorData = user.vendorData || {};
    try { vendorData = typeof vendorData === 'string' ? JSON.parse(vendorData) : vendorData; } catch (e) { vendorData = vendorData || {}; }
    vendorData.kycDocs = Array.isArray(vendorData.kycDocs) ? vendorData.kycDocs.concat(verified) : verified;
    vendorData.kycStatus = 'submitted';
    vendorData.updatedAt = new Date();

    // Preserve existing roles and set vendor flags as necessary
    let existingRoles = user.roles;
    try { existingRoles = Array.isArray(existingRoles) ? existingRoles : (existingRoles ? JSON.parse(existingRoles) : []); } catch (e) { existingRoles = Array.isArray(user.roles) ? user.roles : []; }
    existingRoles = Array.from(new Set([...(existingRoles || []), 'vendor']));

    await user.update({ role: 'vendor', roles: existingRoles, activeRole: 'vendor', vendorData });

    res.json({ success: true, data: { verified, vendorData } });
  } catch (error) {
    console.error('Error verifying KYC publicIds', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to verify KYC documents' });
  }
});

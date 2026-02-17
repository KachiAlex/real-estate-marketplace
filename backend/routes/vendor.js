const express = require('express');
const { protect } = require('../middleware/auth');
const { body } = require('express-validator');
const { getFirestore } = require('../config/firebase');

const router = express.Router();

// PUT /api/vendor/profile - Update or create vendor profile
router.put('/profile', protect, [
  body('businessName').notEmpty(),
  body('businessType').notEmpty(),
  body('contactInfo.email').isEmail(),
  body('contactInfo.phone').notEmpty(),
], async (req, res) => {
  try {
    const db = getFirestore();
    const userId = req.user.id;
    const vendorData = {
      businessName: req.body.businessName,
      businessType: req.body.businessType,
      contactInfo: req.body.contactInfo,
      kycDocs: req.body.kycDocs || [],
      kycStatus: req.body.kycStatus || 'pending',
      onboardingComplete: true,
      updatedAt: new Date().toISOString(),
    };
    await db.collection('vendors').doc(userId).set(vendorData, { merge: true });
    // Optionally update user role
    await db.collection('users').doc(userId).set({ role: 'vendor', vendorData }, { merge: true });
    res.json({ success: true, vendor: vendorData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

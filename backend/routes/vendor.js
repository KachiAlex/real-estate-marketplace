const express = require('express');
const { protect } = require('../middleware/auth');
const { body } = require('express-validator');
const db = require('../config/sequelizeDb');
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

    await user.update({ role: 'vendor', vendorData });
    res.json({ success: true, vendor: vendorData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

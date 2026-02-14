const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// Mock DB update for onboarding and subscription
const updateVendorStatus = async (userId, updates) => {
  // TODO: Replace with real DB logic
  return { success: true, ...updates };
};

// POST /api/vendor/onboard - Mark user as onboarded as vendor
router.post('/onboard', protect, async (req, res) => {
  try {
    // In real implementation, update user.vendorData.onboardingComplete = true
    const result = await updateVendorStatus(req.userId, { onboardingComplete: true });
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to onboard as vendor', error: error.message });
  }
});

// POST /api/vendor/subscribe - Mark vendor subscription as active (mock payment)
router.post('/subscribe', protect, async (req, res) => {
  try {
    // In real implementation, update user.vendorData.subscriptionActive = true
    const result = await updateVendorStatus(req.userId, { subscriptionActive: true });
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to activate subscription', error: error.message });
  }
});

// GET /api/vendor/status - Get vendor onboarding/subscription status
router.get('/status', protect, async (req, res) => {
  try {
    // In real implementation, fetch from DB
    // For now, return mock data
    res.json({
      success: true,
      onboardingComplete: true, // mock
      subscriptionActive: true // mock
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch vendor status', error: error.message });
  }
});

module.exports = router;

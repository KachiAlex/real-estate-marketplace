const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const AdminSettings = require('../models/AdminSettings');

// POST /api/vendor/register - Register as vendor (add vendor role)
router.post('/register', async (req, res) => {
  try {
    let user = null;
    // If authenticated, req.userId will be set
    if (req.userId) {
      user = await User.findById(req.userId);
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });
      // Add vendor role if not already present
      if (!user.roles.includes('vendor')) {
        user.roles.push('vendor');
        user.vendorProfile = {
          ...user.vendorProfile,
          joinedDate: new Date(),
          kycStatus: 'pending',
          subscription: {
            isActive: false,
            amount: 50000,
            planType: 'monthly'
          }
        };
        await user.save();
      }
      return res.json({
        success: true,
        message: 'Successfully registered as vendor',
        user: {
          id: user._id,
          roles: user.roles,
          vendorProfile: user.vendorProfile
        }
      });
    }

    // Unauthenticated: create new vendor user
    const { businessName, businessType, email, phone } = req.body;
    if (!businessName || !businessType || !email) {
      return res.status(400).json({ success: false, message: 'Missing required fields (businessName, businessType, email)' });
    }
    // Check if user already exists
    let existing = await User.findOne({ email });
    if (existing) {
      // If user exists, add vendor role if not present
      if (!existing.roles.includes('vendor')) {
        existing.roles.push('vendor');
        existing.vendorProfile = {
          ...existing.vendorProfile,
          businessName,
          businessType,
          phone,
          joinedDate: new Date(),
          kycStatus: 'pending',
          subscription: {
            isActive: false,
            amount: 50000,
            planType: 'monthly'
          }
        };
        await existing.save();
      }
      return res.json({
        success: true,
        message: 'Vendor role added to existing user',
        user: {
          id: existing._id,
          roles: existing.roles,
          vendorProfile: existing.vendorProfile
        }
      });
    }
    // Create new user
    const password = Math.random().toString(36).slice(-8); // Generate random password
    user = new User({
      email,
      password,
      roles: ['vendor'],
      vendorProfile: {
        businessName,
        businessType,
        phone,
        joinedDate: new Date(),
        kycStatus: 'pending',
        subscription: {
          isActive: false,
          amount: 50000,
          planType: 'monthly'
        }
      }
    });
    await user.save();
    // Return credentials (email, password)
    return res.json({
      success: true,
      message: 'Vendor user created',
      user: {
        id: user._id,
        roles: user.roles,
        vendorProfile: user.vendorProfile
      },
      credentials: { email, password }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to register as vendor', error: error.message });
  }
});

// POST /api/vendor/profile/update - Update vendor profile
router.put('/profile/update', protect, async (req, res) => {
  try {
    const { businessName, businessType, phone, address, experience, licenseNumber } = req.body;
    const user = await User.findById(req.userId);

    if (!user || !user.roles.includes('vendor')) {
      return res.status(403).json({ success: false, message: 'User is not registered as vendor' });
    }

    // Update vendor profile
    if (!user.vendorProfile) {
      user.vendorProfile = {};
    }

    if (businessName) user.vendorProfile.businessName = businessName;
    if (businessType) user.vendorProfile.businessType = businessType;
    if (phone) user.vendorProfile.phone = phone;
    if (address) user.vendorProfile.address = address;
    if (experience) user.vendorProfile.experience = experience;
    if (licenseNumber) user.vendorProfile.licenseNumber = licenseNumber;

    await user.save();

    res.json({
      success: true,
      message: 'Vendor profile updated successfully',
      vendorProfile: user.vendorProfile
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update vendor profile', error: error.message });
  }
});
router.post('/kyc/submit', async (req, res) => {
  try {
    const { documents, businessInfo, email } = req.body;
    let user = null;
    // Try to find user by ID if authenticated, else by email
    if (req.userId) {
      user = await User.findById(req.userId);
    } else if (email) {
      user = await User.findOne({ email });
    }
    if (!user || !user.roles.includes('vendor')) {
      return res.status(403).json({ success: false, message: 'User is not registered as vendor' });
    }
    // Update business info
    if (businessInfo) {
      user.vendorProfile = {
        ...user.vendorProfile,
        ...businessInfo,
        kycStatus: 'under_review'
      };
    }
    // Add KYC documents
    if (documents && Array.isArray(documents)) {
      user.vendorProfile.kycDocuments = documents.map(doc => ({
        ...doc,
        uploadedAt: new Date(),
        status: 'pending'
      }));
      user.vendorProfile.kycStatus = 'under_review';
    }
    await user.save();
    res.json({
      success: true,
      message: 'KYC documents submitted successfully',
      kycStatus: user.vendorProfile.kycStatus
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to submit KYC documents', error: error.message });
  }
});

// GET /api/vendor/kyc/status - Check KYC verification status
router.get('/kyc/status', protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || !user.roles.includes('vendor')) {
      return res.status(403).json({ success: false, message: 'User is not registered as vendor' });
    }

    res.json({
      success: true,
      kycStatus: user.vendorProfile?.kycStatus || 'pending',
      documents: user.vendorProfile?.kycDocuments || [],
      rejectionReasons: user.vendorProfile?.kycDocuments
        ?.filter(doc => doc.status === 'rejected')
        ?.map(doc => ({ type: doc.type, reason: doc.rejectionReason })) || []
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch KYC status', error: error.message });
  }
});

// POST /api/vendor/subscribe - Process subscription payment
router.post('/subscribe', protect, async (req, res) => {
  try {
    const { paymentReference, paymentMethod = 'paystack' } = req.body;
    const user = await User.findById(req.userId);
    const adminSettings = await AdminSettings.findOne() || new AdminSettings();

    if (!user || !user.roles.includes('vendor')) {
      return res.status(403).json({ success: false, message: 'User is not registered as vendor' });
    }

    if (user.vendorProfile?.kycStatus !== 'approved') {
      return res.status(400).json({ success: false, message: 'KYC must be approved before subscribing' });
    }

    const subscriptionAmount = adminSettings.vendorSubscriptionFee || 50000;
    const now = new Date();
    const nextDue = new Date(now);
    nextDue.setMonth(nextDue.getMonth() + 1);

    // Record payment
    const paymentRecord = {
      amount: subscriptionAmount,
      paidAt: now,
      reference: paymentReference,
      status: 'completed',
      paymentMethod
    };

    user.vendorProfile.subscription = {
      ...user.vendorProfile.subscription,
      isActive: true,
      amount: subscriptionAmount,
      lastPaid: now,
      nextDue: nextDue,
      paymentHistory: [
        ...(user.vendorProfile.subscription?.paymentHistory || []),
        paymentRecord
      ]
    };

    user.vendorProfile.onboardingComplete = true;
    await user.save();

    res.json({
      success: true,
      message: 'Subscription activated successfully',
      subscription: user.vendorProfile.subscription
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to process subscription', error: error.message });
  }
});

// POST /api/vendor/renew - Renew subscription
router.post('/renew', protect, async (req, res) => {
  try {
    const { paymentReference, paymentMethod = 'paystack' } = req.body;
    const user = await User.findById(req.userId);
    const adminSettings = await AdminSettings.findOne() || new AdminSettings();

    if (!user || !user.roles.includes('vendor')) {
      return res.status(403).json({ success: false, message: 'User is not registered as vendor' });
    }

    const subscriptionAmount = adminSettings.vendorSubscriptionFee || 50000;
    const now = new Date();
    const nextDue = new Date(now);
    nextDue.setMonth(nextDue.getMonth() + 1);

    // Check if payment is late and add late fee
    const currentDue = user.vendorProfile?.subscription?.nextDue;
    let totalAmount = subscriptionAmount;

    if (currentDue && now > new Date(currentDue)) {
      const lateFee = adminSettings.vendorLateFee || 10000;
      totalAmount += lateFee;
    }

    // Record payment
    const paymentRecord = {
      amount: totalAmount,
      paidAt: now,
      reference: paymentReference,
      status: 'completed',
      paymentMethod
    };

    user.vendorProfile.subscription = {
      ...user.vendorProfile.subscription,
      isActive: true,
      lastPaid: now,
      nextDue: nextDue,
      suspensionDate: null,
      suspensionReason: null,
      paymentHistory: [
        ...(user.vendorProfile.subscription?.paymentHistory || []),
        paymentRecord
      ]
    };

    await user.save();

    res.json({
      success: true,
      message: 'Subscription renewed successfully',
      subscription: user.vendorProfile.subscription
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to renew subscription', error: error.message });
  }
});

// GET /api/vendor/status - Get vendor onboarding/subscription status
router.get('/status', protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || !user.roles.includes('vendor')) {
      return res.status(403).json({ success: false, message: 'User is not registered as vendor' });
    }

    const vendorProfile = user.vendorProfile || {};
    const subscription = vendorProfile.subscription || {};

    // Check if subscription is expired
    const now = new Date();
    const nextDue = subscription.nextDue ? new Date(subscription.nextDue) : null;
    const isExpired = nextDue && now > nextDue && !subscription.isActive;

    res.json({
      success: true,
      onboardingComplete: vendorProfile.onboardingComplete || false,
      kycStatus: vendorProfile.kycStatus || 'pending',
      subscription: {
        ...subscription,
        isExpired,
        daysUntilExpiry: nextDue ? Math.max(0, Math.ceil((nextDue - now) / (1000 * 60 * 60 * 24))) : null
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch vendor status', error: error.message });
  }
});

module.exports = router;

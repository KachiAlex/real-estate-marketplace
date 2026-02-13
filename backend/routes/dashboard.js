const express = require('express');
const { protect } = require('../middleware/auth');
const vendorOnboarding = require('../middleware/vendorOnboarding');
const { sanitizeInput } = require('../middleware/validation');
const { getFirestore } = require('../config/firestore');
const { ensureSeedProperties } = require('../services/propertyService');

const router = express.Router();

const buildZeroUserSummary = () => ({
  totalProperties: 0,
  savedProperties: 0,
  escrow: { count: 0, totalAmount: 0, pendingPayments: 0, completed: 0 },
  investments: { totalInvested: 0, totalDividends: 0, activeInvestments: 0, totalInvestments: 0, averageReturn: 0 }
});

const buildZeroVendorSummary = () => ({
  totalProperties: 0,
  activeListings: 0,
  pendingListings: 0,
  soldProperties: 0,
  totalViews: 0,
  totalInquiries: 0,
  totalRevenue: 0,
  conversionRate: 0
});

const normalizeValue = (value) => {
  if (value === undefined || value === null) return null;
  return String(value).trim().toLowerCase();
};

const buildIdentifierSet = (user = {}) => {
  const possibleValues = [
    user.id,
    user._id,
    user.uid,
    user.userId,
    user.userCode,
    user.vendorCode,
    user.email
  ];

  return new Set(
    possibleValues
      .map(normalizeValue)
      .filter(Boolean)
  );
};

const propertyMatchesUser = (property = {}, identifiers) => {
  if (!property || identifiers.size === 0) return false;

  const candidates = [
    property.owner?.id,
    property.owner?.email,
    property.owner?.userCode,
    property.owner?.vendorCode,
    property.ownerId,
    property.vendorCode,
    property.ownerEmail,
    property.agentId,
    property.agent?.id,
    property.agent?.email
  ];

  return candidates
    .map(normalizeValue)
    .filter(Boolean)
    .some((value) => identifiers.has(value));
};

const aggregateVendorStats = (properties = []) => {
  if (!properties.length) {
    return buildZeroVendorSummary();
  }

  const stats = properties.reduce((acc, property) => {
    acc.totalProperties += 1;

    const verificationStatus = normalizeValue(property.verificationStatus);
    const status = normalizeValue(property.status);

    if (verificationStatus === 'pending') {
      acc.pendingListings += 1;
    }

    if (verificationStatus === 'approved' && (status === 'for-sale' || status === 'for-rent')) {
      acc.activeListings += 1;
    }

    if (status === 'sold' || status === 'rented') {
      acc.soldProperties += 1;
    }

    acc.totalViews += Number(property.views) || 0;

    if (Array.isArray(property.inquiries)) {
      acc.totalInquiries += property.inquiries.length;
    }

    if (Array.isArray(property.escrowTransactions)) {
      property.escrowTransactions.forEach((tx) => {
        if (normalizeValue(tx?.status) === 'completed') {
          acc.totalRevenue += Number(tx.amount) || 0;
        }
      });
    }

    return acc;
  }, buildZeroVendorSummary());

  stats.conversionRate = stats.totalViews > 0 ? (stats.totalInquiries / stats.totalViews) * 100 : 0;
  return stats;
};

// @desc    Get authenticated user's dashboard summary (buyer)
// @route   GET /api/dashboard/user
// @access  Private
router.get('/user', protect, sanitizeInput, async (req, res) => {
  try {
    const db = getFirestore();
    if (!db) {
      return res.json({ success: true, data: buildZeroUserSummary() });
    }

    await ensureSeedProperties();
    const snapshot = await db.collection('properties').get();

    const summary = buildZeroUserSummary();
    summary.totalProperties = snapshot.size;
    summary.savedProperties = Array.isArray(req.user?.favorites) ? req.user.favorites.length : 0;

    res.json({ success: true, data: summary });
  } catch (error) {
    console.error('User dashboard summary error:', error);
    res.status(200).json({ success: true, data: buildZeroUserSummary() });
  }
});

// @desc    Get authenticated vendor's dashboard summary
// @route   GET /api/dashboard/vendor
// @access  Private
router.get('/vendor', protect, vendorOnboarding, sanitizeInput, async (req, res) => {
  try {
    const db = getFirestore();
    if (!db) {
      return res.json({ success: true, data: buildZeroVendorSummary() });
    }

    await ensureSeedProperties();
    const snapshot = await db.collection('properties').get();
    const allProperties = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    const identifiers = buildIdentifierSet(req.user || {});
    const vendorProperties = allProperties.filter((property) => propertyMatchesUser(property, identifiers));

    const stats = aggregateVendorStats(vendorProperties);
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Vendor dashboard summary error:', error);
    res.status(200).json({ success: true, data: buildZeroVendorSummary() });
  }
});

module.exports = router;


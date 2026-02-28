const express = require('express');
const { protect } = require('../middleware/auth');
const vendorOnboarding = require('../middleware/vendorOnboarding');
const { requireAnyRole } = require('../middleware/roleValidation');
const { sanitizeInput } = require('../middleware/validation');
const db = require('../config/sequelizeDb');
const mockUsers = require('../data/mockUsers');
const { ensureSeedProperties } = require('../services/propertyService');

const router = require('express').Router();

const TREND_BUCKETS = 6;
const TREND_WEIGHTS = [12, 15, 18, 20, 18, 17];
const TREND_LABEL_PREFIX = 'Week';

const createTrendBuckets = () => Array.from({ length: TREND_BUCKETS }, () => 0);

const distributeToTrend = (target = [], total = 0, offset = 0) => {
  if (!Array.isArray(target) || !target.length) return;
  const amount = Number(total) || 0;
  if (amount <= 0) return;

  const sumWeights = TREND_WEIGHTS.reduce((sum, weight) => sum + weight, 0);
  TREND_WEIGHTS.forEach((weight, idx) => {
    const bucketIdx = (idx + offset) % target.length;
    target[bucketIdx] += Math.round((amount * weight) / sumWeights);
  });
};

const finalizeTrend = (values = []) => {
  if (!Array.isArray(values) || !values.length) return [];
  const total = values.reduce((sum, val) => sum + val, 0);
  if (total === 0) return [];
  return values.map((value, idx) => ({
    label: `${TREND_LABEL_PREFIX} ${idx + 1}`,
    value
  }));
};

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
  conversionRate: 0,
  viewsTrend: [],
  inquiriesTrend: [],
  revenueTrend: []
});

const createVendorStatsAccumulator = () => ({
  totalProperties: 0,
  activeListings: 0,
  pendingListings: 0,
  soldProperties: 0,
  totalViews: 0,
  totalInquiries: 0,
  totalRevenue: 0,
  conversionRate: 0,
  viewsTrend: createTrendBuckets(),
  inquiriesTrend: createTrendBuckets(),
  revenueTrend: createTrendBuckets()
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

  const stats = properties.reduce((acc, property, idx) => {
    acc.totalProperties += 1;

    const verificationStatus = normalizeValue(property.verificationStatus);
    const status = normalizeValue(property.status);

    if (verificationStatus === 'pending') {
      acc.pendingListings += 1;
    }

    if (verificationStatus === 'verified' && (status === 'for-sale' || status === 'for-rent')) {
      acc.activeListings += 1;
    }

    if (status === 'sold' || status === 'rented') {
      acc.soldProperties += 1;
    }

    const propertyViews = Number(property.views) || 0;
    acc.totalViews += propertyViews;
    distributeToTrend(acc.viewsTrend, propertyViews, idx);

    let propertyInquiries = 0;
    if (Array.isArray(property.inquiries)) {
      propertyInquiries = property.inquiries.length;
    } else if (Number(property.inquiriesCount)) {
      propertyInquiries = Number(property.inquiriesCount);
    }
    acc.totalInquiries += propertyInquiries;
    distributeToTrend(acc.inquiriesTrend, propertyInquiries, idx);

    let propertyRevenue = 0;
    if (Array.isArray(property.escrowTransactions)) {
      property.escrowTransactions.forEach((tx) => {
        if (normalizeValue(tx?.status) === 'completed') {
          const amount = Number(tx.amount) || 0;
          acc.totalRevenue += amount;
          propertyRevenue += amount;
        }
      });
    } else if (Number(property.totalRevenue)) {
      const amount = Number(property.totalRevenue);
      acc.totalRevenue += amount;
      propertyRevenue += amount;
    }
    distributeToTrend(acc.revenueTrend, propertyRevenue, idx);

    return acc;
  }, createVendorStatsAccumulator());

  const conversionRate = stats.totalViews > 0 ? (stats.totalInquiries / stats.totalViews) * 100 : 0;

  return {
    ...stats,
    conversionRate,
    viewsTrend: finalizeTrend(stats.viewsTrend),
    inquiriesTrend: finalizeTrend(stats.inquiriesTrend),
    revenueTrend: finalizeTrend(stats.revenueTrend)
  };
};

// @desc    Get authenticated user's dashboard summary (buyer)
// @route   GET /api/dashboard/user
// @access  Private
router.get('/user', protect, requireAnyRole(['user', 'buyer']), sanitizeInput, async (req, res) => {
  try {
    await ensureSeedProperties();
    const total = await db.Property.count();
    const summary = buildZeroUserSummary();
    summary.totalProperties = total;
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
router.get('/vendor', protect, requireAnyRole(['vendor']), vendorOnboarding, sanitizeInput, async (req, res) => {
  try {
    await ensureSeedProperties();
    let props = [];
    try {
      props = await db.Property.findAll();
    } catch (e) {
      // If DB unavailable, fall back to mock data
      props = [];
    }
    let allProperties = props.map(p => p.toJSON());

    // If no DB properties, attempt to use mock user's vendorData.properties
    if ((!allProperties || allProperties.length === 0) && req.user && req.user.email) {
      const mu = mockUsers.find(u => String(u.email || '').toLowerCase() === String(req.user.email || '').toLowerCase());
      if (mu && mu.vendorData && Array.isArray(mu.vendorData.properties)) {
        allProperties = mu.vendorData.properties;
      }
    }

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


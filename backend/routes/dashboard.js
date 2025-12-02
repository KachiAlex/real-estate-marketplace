const express = require('express');
const { protect } = require('../middleware/auth');
const { sanitizeInput } = require('../middleware/validation');
const Property = require('../models/Property');
const EscrowTransaction = require('../models/EscrowTransaction');
const UserInvestment = require('../models/UserInvestment');

const router = express.Router();

// @desc    Get authenticated user's dashboard summary (buyer)
// @route   GET /api/dashboard/user
// @access  Private
router.get('/user', protect, sanitizeInput, async (req, res) => {
  try {
    const userId = req.user._id;

    const [
      totalProperties,
      escrowTransactions,
      investmentSummaryAgg
    ] = await Promise.all([
      Property.countDocuments({}), // total properties in the system
      EscrowTransaction.find({ buyerId: userId }).lean(),
      UserInvestment.getUserInvestmentSummary(userId)
    ]);

    const investmentSummary = investmentSummaryAgg[0] || {
      totalInvested: 0,
      totalDividends: 0,
      activeInvestments: 0,
      totalInvestments: 0,
      averageReturn: 0
    };

    const totalEscrowAmount = escrowTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    const pendingPayments = escrowTransactions.filter(t => ['pending', 'in-progress', 'initiated', 'active'].includes(t.status)).length;
    const completedEscrows = escrowTransactions.filter(t => t.status === 'completed').length;

    res.json({
      success: true,
      data: {
        totalProperties,
        savedProperties: Array.isArray(req.user.favorites) ? req.user.favorites.length : 0,
        escrow: {
          count: escrowTransactions.length,
          totalAmount: totalEscrowAmount,
          pendingPayments,
          completed: completedEscrows
        },
        investments: {
          totalInvested: investmentSummary.totalInvested || 0,
          totalDividends: investmentSummary.totalDividends || 0,
          activeInvestments: investmentSummary.activeInvestments || 0,
          totalInvestments: investmentSummary.totalInvestments || 0,
          averageReturn: investmentSummary.averageReturn || 0
        }
      }
    });
  } catch (error) {
    console.error('User dashboard summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard summary'
    });
  }
});

// @desc    Get authenticated vendor's dashboard summary
// @route   GET /api/dashboard/vendor
// @access  Private
router.get('/vendor', protect, sanitizeInput, async (req, res) => {
  try {
    const userId = req.user._id;

    // Vendor owns properties via `owner` or is set as `agent`
    const properties = await Property.find({
      $or: [
        { owner: userId },
        { agent: userId }
      ]
    }).lean();

    const totalProperties = properties.length;

    const activeListings = properties.filter(p => p.verificationStatus === 'approved' && (p.status === 'for-sale' || p.status === 'for-rent')).length;
    const pendingListings = properties.filter(p => p.verificationStatus === 'pending').length;
    const soldProperties = properties.filter(p => p.status === 'sold' || p.status === 'rented').length;

    const totalViews = properties.reduce((sum, p) => sum + (p.views || 0), 0);
    const totalInquiries = properties.reduce((sum, p) => sum + (Array.isArray(p.inquiries) ? p.inquiries.length : 0), 0);

    // Escrow transactions where this user is the seller
    const escrows = await EscrowTransaction.find({ sellerId: userId }).lean();
    const totalRevenue = escrows
      .filter(e => e.status === 'completed')
      .reduce((sum, e) => sum + (e.amount || 0), 0);

    res.json({
      success: true,
      data: {
        totalProperties,
        activeListings,
        pendingListings,
        soldProperties,
        totalViews,
        totalInquiries,
        totalRevenue,
        conversionRate: totalViews > 0 ? (totalInquiries / totalViews) * 100 : 0
      }
    });
  } catch (error) {
    console.error('Vendor dashboard summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vendor dashboard summary'
    });
  }
});

module.exports = router;


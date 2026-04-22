/**
 * Phase 4.1: Analytics Routes
 * Admin dashboard analytics endpoints
 */

const express = require('express');
const { protect } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/rbac');
const AnalyticsService = require('../services/analyticsService');
const { errorLogger, infoLogger } = require('../config/logger');

const router = express.Router();

/**
 * @desc    Get dashboard overview metrics
 * @route   GET /api/admin/analytics/overview
 * @access  Private (Admin)
 */
router.get('/overview', protect, requireAdmin, async (req, res) => {
  try {
    // In production, inject actual models
    const mockModels = {
      User: { count: async () => 420 },
      Property: { count: async () => 1250 },
      Transaction: { count: async () => 3500, sum: async () => 5000000 },
      Dispute: { count: async () => 45 }
    };

    const metrics = await AnalyticsService.getDashboardMetrics(mockModels);

    infoLogger(`Dashboard metrics retrieved for admin ${req.user.id}`);

    res.json({
      success: true,
      data: {
        overview: metrics,
        lastUpdated: new Date(),
        period: 'current'
      }
    });
  } catch (error) {
    errorLogger(`Overview analytics error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard metrics'
    });
  }
});

/**
 * @desc    Get transaction analytics
 * @route   GET /api/admin/analytics/transactions
 * @access  Private (Admin)
 * @query   period - 'day', 'week', 'month', 'year'
 * @query   status - transaction status filter
 */
router.get('/transactions', protect, requireAdmin, async (req, res) => {
  try {
    const { period = 'month', status } = req.query;

    if (!['day', 'week', 'month', 'year'].includes(period)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid period. Use: day, week, month, year'
      });
    }

    const mockModels = {
      Transaction: {
        findAll: async () => [
          { amount: 10000, status: 'completed', paymentMethod: 'card', createdAt: new Date() },
          { amount: 15000, status: 'completed', paymentMethod: 'bank', createdAt: new Date() },
          { amount: 8500, status: 'pending', paymentMethod: 'card', createdAt: new Date() }
        ]
      }
    };

    const analytics = await AnalyticsService.getTransactionAnalytics({
      models: mockModels,
      period,
      status
    });

    infoLogger(`Transaction analytics retrieved (${period}) for admin ${req.user.id}`);

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    errorLogger(`Transaction analytics error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction analytics'
    });
  }
});

/**
 * @desc    Get user analytics and growth
 * @route   GET /api/admin/analytics/users
 * @access  Private (Admin)
 * @query   period - 'day', 'week', 'month', 'year'
 */
router.get('/users', protect, requireAdmin, async (req, res) => {
  try {
    const { period = 'month' } = req.query;

    if (!['day', 'week', 'month', 'year'].includes(period)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid period. Use: day, week, month, year'
      });
    }

    const mockModels = {
      User: {
        count: async () => 420,
        findAll: async () => [
          { role: 'vendor', createdAt: new Date(), lastLogin: new Date() },
          { role: 'buyer', createdAt: new Date(), lastLogin: new Date() }
        ]
      }
    };

    const analytics = await AnalyticsService.getUserAnalytics({
      models: mockModels,
      period
    });

    infoLogger(`User analytics retrieved (${period}) for admin ${req.user.id}`);

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    errorLogger(`User analytics error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user analytics'
    });
  }
});

/**
 * @desc    Get property market analytics
 * @route   GET /api/admin/analytics/properties
 * @access  Private (Admin)
 * @query   period - 'day', 'week', 'month', 'year'
 */
router.get('/properties', protect, requireAdmin, async (req, res) => {
  try {
    const { period = 'month' } = req.query;

    if (!['day', 'week', 'month', 'year'].includes(period)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid period. Use: day, week, month, year'
      });
    }

    const mockModels = {
      Property: {
        findAll: async () => [
          { type: 'apartment', price: 350000, status: 'active', location: 'NYC', createdAt: new Date() },
          { type: 'house', price: 500000, status: 'sold', location: 'LA', createdAt: new Date() },
          { type: 'condo', price: 400000, status: 'active', location: 'Chicago', createdAt: new Date() }
        ],
        count: async () => 1250
      }
    };

    const analytics = await AnalyticsService.getPropertyAnalytics({
      models: mockModels,
      period
    });

    infoLogger(`Property analytics retrieved (${period}) for admin ${req.user.id}`);

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    errorLogger(`Property analytics error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch property analytics'
    });
  }
});

/**
 * @desc    Get revenue and financial metrics
 * @route   GET /api/admin/analytics/revenue
 * @access  Private (Admin)
 * @query   period - 'day', 'week', 'month', 'year'
 */
router.get('/revenue', protect, requireAdmin, async (req, res) => {
  try {
    const { period = 'month' } = req.query;

    if (!['day', 'week', 'month', 'year'].includes(period)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid period. Use: day, week, month, year'
      });
    }

    const mockModels = {
      Transaction: {
        findAll: async () => [
          {
            amount: 10000,
            status: 'completed',
            paymentMethod: 'card',
            completedAt: new Date(),
            createdAt: new Date(),
          },
          {
            amount: 15000,
            status: 'completed',
            paymentMethod: 'bank',
            completedAt: new Date(),
            createdAt: new Date(),
          }
        ]
      }
    };

    const analytics = await AnalyticsService.getRevenueAnalytics({
      models: mockModels,
      period
    });

    infoLogger(`Revenue analytics retrieved (${period}) for admin ${req.user.id}`);

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    errorLogger(`Revenue analytics error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch revenue analytics'
    });
  }
});

/**
 * @desc    Get dispute and resolution analytics
 * @route   GET /api/admin/analytics/disputes
 * @access  Private (Admin)
 */
router.get('/disputes', protect, requireAdmin, async (req, res) => {
  try {
    const mockModels = {
      Dispute: {
        findAll: async () => [
          { status: 'resolved', reason: 'payment_issue', createdAt: new Date() },
          { status: 'opened', reason: 'quality_issue', createdAt: new Date() },
          { status: 'pending', reason: 'delivery_issue', createdAt: new Date() }
        ],
        count: async () => 45
      }
    };

    const analytics = await AnalyticsService.getDisputeAnalytics({
      models: mockModels
    });

    infoLogger(`Dispute analytics retrieved for admin ${req.user.id}`);

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    errorLogger(`Dispute analytics error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dispute analytics'
    });
  }
});

/**
 * @desc    Get user engagement metrics
 * @route   GET /api/admin/analytics/engagement
 * @access  Private (Admin)
 */
router.get('/engagement', protect, requireAdmin, async (req, res) => {
  try {
    const mockModels = {
      User: { count: async () => 250 },
      Chat: { count: async () => 500 },
      Message: { count: async () => 3500 },
      Inquiry: { count: async () => 150 }
    };

    const metrics = await AnalyticsService.getEngagementMetrics({
      models: mockModels
    });

    infoLogger(`Engagement metrics retrieved for admin ${req.user.id}`);

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    errorLogger(`Engagement metrics error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch engagement metrics'
    });
  }
});

/**
 * @desc    Export analytics data
 * @route   GET /api/admin/analytics/export
 * @access  Private (Admin)
 * @query   format - 'json', 'csv', 'excel'
 * @query   dataType - 'transactions', 'users', 'properties', 'revenue'
 * @query   period - 'day', 'week', 'month', 'year'
 */
router.get('/export', protect, requireAdmin, async (req, res) => {
  try {
    const { format = 'json', dataType = 'transactions', period = 'month' } = req.query;

    // Validate parameters
    if (!['json', 'csv', 'excel'].includes(format)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid format. Use: json, csv, excel'
      });
    }

    if (!['transactions', 'users', 'properties', 'revenue'].includes(dataType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid dataType. Use: transactions, users, properties, revenue'
      });
    }

    // Mock data export
    const mockData = {
      transactions: [
        { id: 't1', amount: 10000, status: 'completed' },
        { id: 't2', amount: 15000, status: 'completed' }
      ],
      users: [
        { id: 'u1', role: 'vendor', email: 'vendor@example.com' },
        { id: 'u2', role: 'buyer', email: 'buyer@example.com' }
      ],
      properties: [
        { id: 'p1', type: 'apartment', price: 350000 },
        { id: 'p2', type: 'house', price: 500000 }
      ],
      revenue: [
        { date: '2026-03-01', amount: 50000 },
        { date: '2026-03-02', amount: 55000 }
      ]
    };

    const data = mockData[dataType] || [];
    const exported = await AnalyticsService.exportAnalytics({
      format,
      dataType,
      data
    });

    infoLogger(`Analytics export (${dataType}, ${format}) for admin ${req.user.id}`);

    // Set appropriate headers for download
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="analytics-${dataType}.csv"`);
    } else if (format === 'excel') {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="analytics-${dataType}.xlsx"`);
    }

    res.json({
      success: true,
      data: {
        format,
        dataType,
        period,
        records: exported,
        exportedAt: new Date(),
        recordCount: Array.isArray(exported) ? exported.length : 0
      }
    });
  } catch (error) {
    errorLogger(`Export analytics error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to export analytics'
    });
  }
});

/**
 * @desc    Get custom date range analytics
 * @route   POST /api/admin/analytics/custom-range
 * @access  Private (Admin)
 */
router.post('/custom-range', protect, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate, metricsToInclude = [] } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate are required'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: 'startDate must be before endDate'
      });
    }

    // Mock custom range analytics
    const customAnalytics = {
      dateRange: { start, end },
      metrics: metricsToInclude.length > 0
        ? metricsToInclude
        : ['transactions', 'revenue', 'users'],
      data: {
        transactions: 234,
        revenue: 125000,
        users: 45,
        disputes: 3
      }
    };

    infoLogger(`Custom range analytics (${startDate} to ${endDate}) for admin ${req.user.id}`);

    res.json({
      success: true,
      data: customAnalytics
    });
  } catch (error) {
    errorLogger(`Custom range analytics error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to generate custom analytics'
    });
  }
});

module.exports = router;

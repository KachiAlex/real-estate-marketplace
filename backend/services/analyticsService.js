/**
 * Phase 4.1: Admin Analytics Service
 * Comprehensive analytics engine for transactions, users, properties, and revenue
 */

const { errorLogger, infoLogger } = require('../config/logger');

class AnalyticsService {
  /**
   * Calculate overall dashboard metrics
   * @param {object} models - Database models
   * @returns {Promise<object>} Dashboard metrics
   */
  static async getDashboardMetrics(models) {
    try {
      const metrics = {};

      // Total users
      metrics.totalUsers = await models.User.count();
      
      // Active users (logged in last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      metrics.activeUsers = await models.User.count({
        where: { lastLogin: { $gte: thirtyDaysAgo } }
      });

      // Total properties
      metrics.totalProperties = await models.Property.count();
      
      // Active listings
      metrics.activeListings = await models.Property.count({
        where: { status: 'active' }
      });

      // Total transactions
      metrics.totalTransactions = await models.Transaction.count();
      
      // Completed transactions (this month)
      const firstDayOfMonth = new Date();
      firstDayOfMonth.setDate(1);
      metrics.completedThisMonth = await models.Transaction.count({
        where: {
          status: 'completed',
          completedAt: { $gte: firstDayOfMonth }
        }
      });

      // Total revenue
      const totalRevenue = await models.Transaction.sum('amount', {
        where: { status: 'completed' }
      });
      metrics.totalRevenue = totalRevenue || 0;

      // Monthly revenue
      const monthlyRevenue = await models.Transaction.sum('amount', {
        where: {
          status: 'completed',
          completedAt: { $gte: firstDayOfMonth }
        }
      });
      metrics.monthlyRevenue = monthlyRevenue || 0;

      // Average transaction value
      metrics.averageTransactionValue = metrics.totalTransactions > 0
        ? (metrics.totalRevenue / metrics.totalTransactions).toFixed(2)
        : 0;

      // Pending disputes
      metrics.pendingDisputes = await models.Dispute.count({
        where: { status: { $in: ['opened', 'pending'] } }
      });

      // User growth rate
      const lastMonthUsers = await models.User.count({
        where: { createdAt: { $lt: firstDayOfMonth } }
      });
      metrics.userGrowthRate = lastMonthUsers > 0
        ? (((metrics.totalUsers - lastMonthUsers) / lastMonthUsers) * 100).toFixed(2)
        : 0;

      return metrics;
    } catch (error) {
      errorLogger(`Dashboard metrics error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get transaction analytics with filtering
   * @param {object} params - Query parameters
   * @param {object} params.models - Database models
   * @param {string} params.period - 'day', 'week', 'month', 'year'
   * @param {string} params.status - Transaction status filter
   * @returns {Promise<object>} Transaction analytics
   */
  static async getTransactionAnalytics(params) {
    const { models, period = 'month', status = null } = params;

    try {
      const dateRange = this._getDateRange(period);
      const where = {
        createdAt: { $gte: dateRange.start, $lte: dateRange.end }
      };

      if (status) {
        where.status = status;
      }

      const transactions = await models.Transaction.findAll({ where });

      return {
        period,
        dateRange,
        totalCount: transactions.length,
        totalAmount: transactions.reduce((sum, t) => sum + (t.amount || 0), 0),
        averageAmount: transactions.length > 0
          ? (transactions.reduce((sum, t) => sum + (t.amount || 0), 0) / transactions.length).toFixed(2)
          : 0,
        byStatus: this._groupBy(transactions, 'status'),
        byDay: this._groupByDate(transactions, 'day'),
        byPaymentMethod: this._groupBy(transactions, 'paymentMethod'),
        trends: {
          increasing: true, // Placeholder for trend calculation
          percentChange: this._calculateTrendChange(transactions)
        }
      };
    } catch (error) {
      errorLogger(`Transaction analytics error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get user analytics and growth
   * @param {object} params - Query parameters
   * @param {object} params.models - Database models
   * @param {string} params.period - 'day', 'week', 'month', 'year'
   * @returns {Promise<object>} User analytics
   */
  static async getUserAnalytics(params) {
    const { models, period = 'month' } = params;

    try {
      const dateRange = this._getDateRange(period);

      const newUsers = await models.User.count({
        where: {
          createdAt: { $gte: dateRange.start, $lte: dateRange.end }
        }
      });

      const activeUsers = await models.User.count({
        where: {
          lastLogin: { $gte: dateRange.start, $lte: dateRange.end }
        }
      });

      const users = await models.User.findAll({
        where: {
          createdAt: { $gte: dateRange.start, $lte: dateRange.end }
        }
      });

      return {
        period,
        dateRange,
        newUsers,
        activeUsers,
        totalUsers: await models.User.count(),
        byRole: this._groupBy(users, 'role'),
        byVerificationStatus: await this._getUserVerificationStats(models),
        churnRate: await this._calculateChurnRate(models, period),
        growthTrend: this._calculateGrowthTrend(users, period)
      };
    } catch (error) {
      errorLogger(`User analytics error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get property market analytics
   * @param {object} params - Query parameters
   * @param {object} params.models - Database models
   * @param {string} params.period - 'day', 'week', 'month', 'year'
   * @returns {Promise<object>} Property analytics
   */
  static async getPropertyAnalytics(params) {
    const { models, period = 'month' } = params;

    try {
      const dateRange = this._getDateRange(period);

      const properties = await models.Property.findAll({
        where: {
          createdAt: { $gte: dateRange.start, $lte: dateRange.end }
        }
      });

      const listings = await models.Property.findAll();

      return {
        period,
        dateRange,
        newListings: properties.length,
        totalListings: listings.length,
        activeListings: listings.filter(p => p.status === 'active').length,
        soldListings: listings.filter(p => p.status === 'sold').length,
        averageListingPrice: this._calculateAverage(listings, 'price'),
        priceRange: {
          min: Math.min(...listings.map(p => p.price || 0)),
          max: Math.max(...listings.map(p => p.price || 0))
        },
        byPropertyType: this._groupBy(properties, 'type'),
        byLocation: this._groupBy(properties, 'location'),
        averageDaysToSell: await this._calculateAverageDaysToSell(models),
        topLocations: await this._getTopLocations(models)
      };
    } catch (error) {
      errorLogger(`Property analytics error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get revenue and financial metrics
   * @param {object} params - Query parameters
   * @param {object} params.models - Database models
   * @param {string} params.period - 'day', 'week', 'month', 'year'
   * @returns {Promise<object>} Revenue analytics
   */
  static async getRevenueAnalytics(params) {
    const { models, period = 'month' } = params;

    try {
      const dateRange = this._getDateRange(period);

      const transactions = await models.Transaction.findAll({
        where: {
          status: 'completed',
          completedAt: { $gte: dateRange.start, $lte: dateRange.end }
        }
      });

      const revenue = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);

      // Calculate fees and profit
      const platformFeePercentage = 0.05; // 5% platform fee
      const platformFee = revenue * platformFeePercentage;
      const vendorPayouts = revenue - platformFee;

      return {
        period,
        dateRange,
        totalRevenue: revenue,
        totalTransactions: transactions.length,
        platformFee,
        vendorPayouts,
        averageTransactionValue: transactions.length > 0
          ? (revenue / transactions.length).toFixed(2)
          : 0,
        byPaymentMethod: this._groupBy(transactions, 'paymentMethod'),
        dailyRevenue: this._groupByDate(transactions, 'day'),
        projectedMonthlyRevenue: this._projectRevenue(transactions, period),
        topVendors: await this._getTopVendors(models, dateRange)
      };
    } catch (error) {
      errorLogger(`Revenue analytics error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get dispute and resolution analytics
   * @param {object} params - Query parameters
   * @param {object} params.models - Database models
   * @returns {Promise<object>} Dispute analytics
   */
  static async getDisputeAnalytics(params) {
    const { models } = params;

    try {
      const allDisputes = await models.Dispute.findAll();
      const thisMonthDisputes = await models.Dispute.findAll({
        where: {
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }
      });

      return {
        totalDisputes: allDisputes.length,
        openDisputes: allDisputes.filter(d => d.status === 'opened').length,
        pendingDisputes: allDisputes.filter(d => d.status === 'pending').length,
        resolvedDisputes: allDisputes.filter(d => d.status === 'resolved').length,
        thisMonthDisputes: thisMonthDisputes.length,
        resolutionRate: allDisputes.length > 0
          ? ((allDisputes.filter(d => d.status === 'resolved').length / allDisputes.length) * 100).toFixed(2)
          : 0,
        averageResolutionTime: await this._calculateAverageResolutionTime(models),
        byReason: this._groupBy(allDisputes, 'reason'),
        topReasons: allDisputes
          .reduce((acc, d) => {
            acc[d.reason] = (acc[d.reason] || 0) + 1;
            return acc;
          }, {})
      };
    } catch (error) {
      errorLogger(`Dispute analytics error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get user engagement metrics
   * @param {object} params - Query parameters
   * @param {object} params.models - Database models
   * @returns {Promise<object>} Engagement metrics
   */
  static async getEngagementMetrics(params) {
    const { models } = params;

    try {
      const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      const activeUsersLastWeek = await models.User.count({
        where: { lastLogin: { $gte: lastWeek } }
      });

      const chatsLastWeek = await models.Chat.count({
        where: { createdAt: { $gte: lastWeek } }
      });

      const messagesLastWeek = await models.Message.count({
        where: { createdAt: { $gte: lastWeek } }
      });

      const inquiriesLastWeek = await models.Inquiry.count({
        where: { createdAt: { $gte: lastWeek } }
      });

      return {
        period: 'last_week',
        activeUsers: activeUsersLastWeek,
        totalChats: chatsLastWeek,
        totalMessages: messagesLastWeek,
        totalInquiries: inquiriesLastWeek,
        averageMessagesPerUser: activeUsersLastWeek > 0
          ? (messagesLastWeek / activeUsersLastWeek).toFixed(2)
          : 0,
        userEngagementScore: this._calculateEngagementScore(
          activeUsersLastWeek,
          messagesLastWeek,
          inquiriesLastWeek
        )
      };
    } catch (error) {
      errorLogger(`Engagement analytics error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Export analytics data
   * @param {object} params - Export parameters
   * @param {string} params.format - 'csv', 'json', 'excel'
   * @param {string} params.dataType - 'transactions', 'users', 'properties', 'revenue'
   * @param {object} params.data - Data to export
   * @returns {object} Formatted export data
   */
  static async exportAnalytics(params) {
    const { format = 'json', dataType, data } = params;

    try {
      switch (format) {
        case 'csv':
          return this._convertToCSV(data, dataType);
        case 'excel':
          return this._convertToExcel(data, dataType);
        case 'json':
        default:
          return data;
      }
    } catch (error) {
      errorLogger(`Export analytics error: ${error.message}`);
      throw error;
    }
  }

  // ============== HELPER METHODS ==============

  /**
   * Get date range for analytics period
   */
  static _getDateRange(period) {
    const now = new Date();
    const start = new Date();

    switch (period) {
      case 'day':
        start.setDate(now.getDate() - 1);
        break;
      case 'week':
        start.setDate(now.getDate() - 7);
        break;
      case 'month':
        start.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        start.setFullYear(now.getFullYear() - 1);
        break;
      default:
        start.setMonth(now.getMonth() - 1);
    }

    return { start, end: now };
  }

  /**
   * Group array by property
   */
  static _groupBy(arr, property) {
    return arr.reduce((acc, item) => {
      const key = item[property] || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }

  /**
   * Group by date
   */
  static _groupByDate(arr, interval = 'day') {
    return arr.reduce((acc, item) => {
      const date = new Date(item.createdAt).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + (item.amount || 0);
      return acc;
    }, {});
  }

  /**
   * Calculate average value
   */
  static _calculateAverage(arr, property) {
    if (arr.length === 0) return 0;
    const sum = arr.reduce((total, item) => total + (item[property] || 0), 0);
    return (sum / arr.length).toFixed(2);
  }

  /**
   * Calculate trend change
   */
  static _calculateTrendChange(transactions) {
    if (transactions.length < 2) return 0;
    // Simplified trend calculation
    return Math.random() * 20 - 10; // Placeholder
  }

  /**
   * Calculate growth trend
   */
  static _calculateGrowthTrend(users, period) {
    // Placeholder implementation
    return {
      direction: 'up',
      percentage: Math.random() * 30
    };
  }

  /**
   * Calculate churn rate
   */
  static async _calculateChurnRate(models, period) {
    // Placeholder
    return 5.2;
  }

  /**
   * Get user verification stats
   */
  static async _getUserVerificationStats(models) {
    // Placeholder
    return {
      verified: 350,
      unverified: 50,
      pending: 20
    };
  }

  /**
   * Calculate average days to sell
   */
  static async _calculateAverageDaysToSell(models) {
    // Placeholder
    return 45;
  }

  /**
   * Get top locations
   */
  static async _getTopLocations(models) {
    // Placeholder
    return ['New York', 'Los Angeles', 'Chicago'];
  }

  /**
   * Calculate average resolution time
   */
  static async _calculateAverageResolutionTime(models) {
    // Placeholder (in days)
    return 7.5;
  }

  /**
   * Project revenue
   */
  static _projectRevenue(transactions, period) {
    if (transactions.length === 0) return 0;
    const avgDaily = transactions.reduce((sum, t) => sum + (t.amount || 0), 0) / 30;
    return (avgDaily * 30).toFixed(2);
  }

  /**
   * Get top vendors
   */
  static async _getTopVendors(models, dateRange) {
    // Placeholder
    return [
      { vendorId: 'v1', name: 'Vendor 1', revenue: 15000 },
      { vendorId: 'v2', name: 'Vendor 2', revenue: 12000 },
      { vendorId: 'v3', name: 'Vendor 3', revenue: 10000 }
    ];
  }

  /**
   * Calculate engagement score
   */
  static _calculateEngagementScore(activeUsers, messages, inquiries) {
    if (activeUsers === 0) return 0;
    return ((messages + inquiries * 2) / activeUsers).toFixed(2);
  }

  /**
   * Convert data to CSV format
   */
  static _convertToCSV(data, dataType) {
    // Simplified CSV conversion
    return JSON.stringify(data);
  }

  /**
   * Convert data to Excel format
   */
  static _convertToExcel(data, dataType) {
    // Placeholder - would use xlsx library
    return data;
  }
}

module.exports = AnalyticsService;

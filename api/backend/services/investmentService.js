// Sequelize-based investmentService.js
const { Investment, UserInvestment, User } = require('../models/sequelize');
const notificationService = require('./notificationService');

module.exports = {
  async listInvestments({ page = 1, limit = 20, ...filters }) {
    const offset = (page - 1) * limit;
    const where = {};
    if (filters.status) where.status = filters.status;
    if (filters.type) where.type = filters.type;
    // Add more filters as needed
    const { rows, count } = await Investment.findAndCountAll({
      where,
      offset,
      limit,
      order: [['createdAt', 'DESC']]
    });
    return { data: rows, total: count };
  },

  async getInvestmentById(id) {
    return Investment.findByPk(id);
  },

  async createInvestment(data) {
    return Investment.create(data);
  },

  async updateInvestment(id, data) {
    return Investment.update(data, { where: { id } });
  },

  async deleteInvestment(id) {
    return Investment.destroy({ where: { id } });
  },

  async listUserInvestments(userId, { page = 1, limit = 20 }) {
    const offset = (page - 1) * limit;
    const { rows, count } = await UserInvestment.findAndCountAll({
      where: { userId },
      offset,
      limit,
      order: [['createdAt', 'DESC']]
    });
    return { data: rows, total: count };
  },


  // Check if user can invest in an opportunity
  async canInvest(investment, amount) {
    if (!investment) return false;
    if (investment.status !== 'active') return false;
    if (Number(amount) < Number(investment.minInvestment)) return false;
    if (Number(investment.raisedAmount) + Number(amount) > Number(investment.targetAmount)) return false;
    return true;
  },

  // Calculate shares and expected monthly dividend
  calculateSharesAndDividends(amount, minInvestment, dividendRate) {
    const shares = Number(amount) / Number(minInvestment);
    const expectedMonthlyDividend = (Number(amount) * Number(dividendRate || 0) / 100) / 12;
    return { shares, expectedMonthlyDividend };
  },

  // Create a user investment with all business logic and notifications
  async createUserInvestment({ userId, investmentId, amount, paymentMethod = 'bank_transfer', user }) {
    const investment = await Investment.findByPk(investmentId);
    if (!investment) throw new Error('Investment not found');
    if (!(await this.canInvest(investment, amount))) throw new Error('Investment amount is invalid or investment is not available');

    // Check for duplicate investment
    const existing = await UserInvestment.findOne({ where: { userId, investmentId } });
    if (existing) throw new Error('You have already invested in this opportunity');

    const { shares, expectedMonthlyDividend } = this.calculateSharesAndDividends(amount, investment.minInvestment, investment.expectedReturn);

    const userInvestment = await UserInvestment.create({
      userId,
      investmentId,
      amount,
      shares,
      expectedMonthlyDividend,
      sponsorId: investment.sponsorId,
      paymentMethod,
      status: 'pending'
    });

    // Update raised amount
    await this.updateRaisedAmount(investment, amount);

    // Send notification to sponsor
    if (notificationService && investment.sponsorId) {
      await notificationService.createNotification({
        recipient: investment.sponsorId,
        sender: userId,
        type: 'investment_opportunity',
        title: 'New Investment Received',
        message: user ? `${user.firstName} ${user.lastName} invested ₦${Number(amount).toLocaleString()} in ${investment.title}` : 'New investment received',
        data: { investmentId, userInvestmentId: userInvestment.id, amount }
      });
    }

    return userInvestment;
  },

  // Approve a user investment
  async approveUserInvestment(userInvestmentId, approverId) {
    const userInvestment = await UserInvestment.findByPk(userInvestmentId);
    if (!userInvestment) throw new Error('User investment not found');
    userInvestment.status = 'approved';
    await userInvestment.save();
    // Optionally notify investor
    if (notificationService) {
      await notificationService.createNotification({
        recipient: userInvestment.userId,
        sender: approverId,
        type: 'investment_approved',
        title: 'Investment Approved',
        message: 'Your investment has been approved.',
        data: { userInvestmentId }
      });
    }
    return userInvestment;
  },

  // Cancel a user investment
  async cancelUserInvestment(userInvestmentId, cancellerId, reason) {
    const userInvestment = await UserInvestment.findByPk(userInvestmentId);
    if (!userInvestment) throw new Error('User investment not found');
    userInvestment.status = 'cancelled';
    await userInvestment.save();
    // Optionally notify investor
    if (notificationService) {
      await notificationService.createNotification({
        recipient: userInvestment.userId,
        sender: cancellerId,
        type: 'investment_cancelled',
        title: 'Investment Cancelled',
        message: reason || 'Your investment has been cancelled.',
        data: { userInvestmentId }
      });
    }
    return userInvestment;
  },

  // Update raised amount for an investment
  async updateRaisedAmount(investment, amount) {
    investment.raisedAmount = Number(investment.raisedAmount) + Number(amount);
    await investment.save();
    return investment;
  },

  // Get user investments with optional status filter
  async getUserInvestments(userId, options = {}) {
    const where = { userId };
    if (options.status) where.status = options.status;
    return UserInvestment.findAll({ where, order: [['createdAt', 'DESC']] });
  },

  // Get user investment summary (count, total invested, etc.)
  async getUserInvestmentSummary(userId) {
    const investments = await UserInvestment.findAll({ where: { userId } });
    const totalInvested = investments.reduce((sum, inv) => sum + Number(inv.amount), 0);
    return {
      count: investments.length,
      totalInvested
    };
  },

  async updateUserInvestment(id, data) {
    return UserInvestment.update(data, { where: { id } });
  },

  async getUserInvestment(id) {
    return UserInvestment.findByPk(id);
  }
};

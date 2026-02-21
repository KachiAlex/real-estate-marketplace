const { Op } = require('sequelize');
const db = require('../config/sequelizeDb');
const EscrowModel = db.EscrowTransaction;
const propertyService = require('./propertyService');
const notificationService = require('./notificationService');

class EscrowService {
  async listTransactions({ user, status, type, page = 1, limit = 20 } = {}) {
    const where = {};
    const userId = user?.id || user;

    if (status) where.status = status;
    if (type === 'buyer' && userId) where.buyerId = userId;
    else if (type === 'seller' && userId) where.sellerId = userId;
    else if (!user || user.role !== 'admin') {
      if (userId) where[Op.or] = [{ buyerId: userId }, { sellerId: userId }];
    }

    const offset = (Math.max(Number(page), 1) - 1) * Number(limit);
    const { rows, count } = await EscrowModel.findAndCountAll({ where, order: [['createdAt', 'DESC']], offset, limit: Number(limit) });

    return {
      transactions: rows.map(r => r.toJSON()),
      pagination: {
        currentPage: Number(page),
        itemsPerPage: Number(limit),
        totalItems: count,
        totalPages: Math.max(Math.ceil(count / Number(limit)), 1)
      }
    };
  }

  async getTransactionById(id) {
    const tx = await EscrowModel.findByPk(id);
    return tx ? tx.toJSON() : null;
  }

  async createTransaction({ propertyId, amount, paymentMethod, expectedCompletion, currency = 'NGN', buyer }) {
    const buyerId = buyer?.id || buyer;
    if (!buyerId) throw new Error('Buyer information is required');

    const property = await propertyService.getPropertyById(propertyId);
    if (!property) {
      const error = new Error('Property not found');
      error.statusCode = 404;
      throw error;
    }

    const sellerId = property.ownerId || property.owner?.id;
    if (!sellerId) throw new Error('Property owner information is missing');
    if (sellerId === buyerId) {
      const error = new Error('You cannot create an escrow transaction for your own property');
      error.statusCode = 400;
      throw error;
    }

    if (property.status && !['available','for-sale','active'].includes(property.status)) {
      const error = new Error('Property is not available for purchase');
      error.statusCode = 400;
      throw error;
    }

    const existing = await EscrowModel.findOne({ where: { propertyId, status: { [Op.notIn]: ['completed', 'cancelled'] } } });
    if (existing) {
      const error = new Error('An active escrow transaction already exists for this property');
      error.statusCode = 400;
      throw error;
    }

    const transaction = await EscrowModel.create({ propertyId, buyerId, sellerId, amount, currency, paymentMethod, status: 'pending' });

    try {
      await notificationService.createNotification({ recipient: sellerId, type: 'escrow_payment_received', title: 'Escrow created', message: `An escrow transaction was created for property ${property.title || property.id}`, data: { escrowId: transaction.id } });
    } catch (e) {
      console.warn('Failed to send escrow notification:', e.message);
    }

    return transaction.toJSON();
  }

  async updateStatus({ transactionId, status, user, notes }) {
    const tx = await EscrowModel.findByPk(transactionId);
    if (!tx) {
      const error = new Error('Escrow transaction not found');
      error.statusCode = 404;
      throw error;
    }

    await tx.update({ status });
    const updated = await EscrowModel.findByPk(transactionId);

    try {
      await notificationService.createNotification({ recipient: updated.buyerId, type: 'escrow_status_changed', title: `Escrow ${status}`, message: `Escrow ${updated.id} status changed to ${status}` });
      await notificationService.createNotification({ recipient: updated.sellerId, type: 'escrow_status_changed', title: `Escrow ${status}`, message: `Escrow ${updated.id} status changed to ${status}` });
    } catch (e) {
      console.warn('Notification send failed:', e.message);
    }

    return updated.toJSON();
  }

  async getEscrowVolumesByDate() {
    const rows = await EscrowModel.findAll({ attributes: ['createdAt', 'amount'] });
    const map = {};
    rows.forEach((r) => {
      const createdAt = r.createdAt ? new Date(r.createdAt) : new Date();
      const key = createdAt.toISOString().split('T')[0];
      map[key] = (map[key] || 0) + (Number(r.amount) || 0);
    });
    return Object.entries(map).map(([date, total]) => ({ date, total }));
  }

  // Additional Sequelize-backed helpers (fileDispute, resolveDispute, addDocument, getStatistics) can be added here when needed.
}

module.exports = new EscrowService();
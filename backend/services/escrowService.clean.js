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

  async fileDispute({ transactionId, reason, description, evidence = [], user }) {
    // Validate inputs
    if (!['property_condition', 'title_issues', 'seller_non_compliance', 'buyer_non_compliance', 'payment_issues', 'other'].includes(reason)) {
      const error = new Error('Invalid dispute reason');
      error.statusCode = 400;
      throw error;
    }

    if (!description || description.trim().length < 10) {
      const error = new Error('Description must be at least 10 characters');
      error.statusCode = 400;
      throw error;
    }

    const userId = user?.id || user;
    if (!userId) {
      const error = new Error('User information is required');
      error.statusCode = 400;
      throw error;
    }

    // Get escrow transaction
    const tx = await EscrowModel.findByPk(transactionId);
    if (!tx) {
      const error = new Error('Escrow transaction not found');
      error.statusCode = 404;
      throw error;
    }

    // Verify user is participant (buyer or seller)
    if (userId !== tx.buyerId && userId !== tx.sellerId) {
      const error = new Error('You are not a participant in this escrow transaction');
      error.statusCode = 403;
      throw error;
    }

    // Check if dispute already exists and is open
    const existingDispute = await db.DisputeResolution.findOne({
      where: { 
        escrowId: transactionId, 
        status: { [Op.notIn]: ['closed', 'resolved'] }
      }
    });

    if (existingDispute) {
      const error = new Error('An active dispute already exists for this transaction');
      error.statusCode = 400;
      throw error;
    }

    // Calculate SLA deadlines
    const now = new Date();
    const firstResponseDeadline = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
    const resolutionDeadline = new Date(now.getTime() + 72 * 60 * 60 * 1000); // 72 hours

    // Create timeline entry
    const timelineEntry = {
      type: 'dispute_filed',
      timestamp: now.toISOString(),
      initiatedBy: userId,
      reason,
      description
    };

    // Create dispute record
    const dispute = await db.DisputeResolution.create({
      escrowId: transactionId,
      initiatedBy: userId,
      reason,
      description,
      documents: evidence || [],
      status: 'open',
      firstResponseDeadline,
      resolutionDeadline,
      timeline: [timelineEntry]
    });

    // Update escrow status to disputed
    await tx.update({ status: 'disputed' });

    // Determine who filed (buyer or seller)
    const filedByBuyer = userId === tx.buyerId;
    const filedBySeller = userId === tx.sellerId;

    // Notify the other party
    const recipientId = filedByBuyer ? tx.sellerId : tx.buyerId;
    const recipientRole = filedByBuyer ? 'seller' : 'buyer';
    const filerRole = filedByBuyer ? 'buyer' : 'seller';

    try {
      await notificationService.createNotification({
        recipient: recipientId,
        type: 'escrow_disputed',
        title: `Property Dispute Filed by ${filerRole.charAt(0).toUpperCase() + filerRole.slice(1)}`,
        message: `A dispute has been filed on your escrow transaction. Reason: ${reason}. You have 24 hours to provide your response and evidence.`,
        data: {
          escrowId: transactionId,
          disputeId: dispute.id,
          reason
        },
        priority: 'high'
      });
    } catch (e) {
      console.warn('Failed to send dispute notification:', e.message);
    }

    // Notify admins
    try {
      await notificationService.createNotification({
        recipient: 'admin_group',
        type: 'escrow_dispute_alert',
        title: 'New Escrow Dispute Filed',
        message: `Dispute filed on escrow transaction ${transactionId}. Reason: ${reason}. Response deadline: ${firstResponseDeadline.toISOString().split('T')[0]}`,
        data: {
          escrowId: transactionId,
          disputeId: dispute.id,
          reason,
          priority: 'high'
        }
      });
    } catch (e) {
      console.warn('Failed to send admin dispute alert:', e.message);
    }

    return dispute.toJSON();
  }

  async resolveDispute({ transactionId, resolution, adminNotes, user }) {
    // Validate admin access
    if (user?.role !== 'admin') {
      const error = new Error('Only admins can resolve disputes');
      error.statusCode = 403;
      throw error;
    }

    // Validate inputs
    if (!['buyer_favor', 'seller_favor', 'partial_refund', 'full_refund'].includes(resolution)) {
      const error = new Error('Invalid resolution type');
      error.statusCode = 400;
      throw error;
    }

    if (!adminNotes || adminNotes.trim().length < 10) {
      const error = new Error('Admin notes must be at least 10 characters');
      error.statusCode = 400;
      throw error;
    }

    const userId = user?.id || user;

    // Find the dispute
    const dispute = await db.DisputeResolution.findOne({
      where: { escrowId: transactionId }
    });

    if (!dispute) {
      const error = new Error('Dispute not found for this transaction');
      error.statusCode = 404;
      throw error;
    }

    if (dispute.status === 'resolved' || dispute.status === 'closed') {
      const error = new Error('Dispute is already resolved or closed');
      error.statusCode = 400;
      throw error;
    }

    // Get escrow transaction to notify parties
    const tx = await EscrowModel.findByPk(transactionId);
    if (!tx) {
      const error = new Error('Escrow transaction not found');
      error.statusCode = 404;
      throw error;
    }

    // Update dispute with resolution
    const now = new Date();
    const timelineEntry = {
      type: 'dispute_resolved',
      timestamp: now.toISOString(),
      resolvedBy: userId,
      resolution,
      adminNotes
    };

    const updatedTimeline = Array.isArray(dispute.timeline) ? [...dispute.timeline, timelineEntry] : [timelineEntry];

    await dispute.update({
      status: 'resolved',
      resolution,
      adminNotes,
      resolvedAt: now,
      resolvedBy: userId,
      timeline: updatedTimeline
    });

    // Update escrow status based on resolution
    let newEscrowStatus = 'completed';
    if (resolution === 'full_refund' || resolution === 'partial_refund') {
      newEscrowStatus = 'refunded';
    }

    await tx.update({ status: newEscrowStatus });

    // Notify both parties
    const notificationPromises = [];
    const buyerMessage = `Dispute resolved: ${resolution.replace(/_/g, ' ')}. ${adminNotes}`;
    const sellerMessage = `Dispute resolved: ${resolution.replace(/_/g, ' ')}. ${adminNotes}`;

    notificationPromises.push(
      notificationService.createNotification({
        recipient: tx.buyerId,
        type: 'dispute_resolved',
        title: 'Dispute Resolution',
        message: buyerMessage,
        data: {
          escrowId: transactionId,
          disputeId: dispute.id,
          resolution
        },
        priority: 'high'
      })
    );

    notificationPromises.push(
      notificationService.createNotification({
        recipient: tx.sellerId,
        type: 'dispute_resolved',
        title: 'Dispute Resolution',
        message: sellerMessage,
        data: {
          escrowId: transactionId,
          disputeId: dispute.id,
          resolution
        },
        priority: 'high'
      })
    );

    try {
      await Promise.all(notificationPromises);
    } catch (e) {
      console.warn('Failed to send resolution notifications:', e.message);
    }

    return dispute.toJSON();
  }

  async getDisputeById(disputeId, user) {
    const dispute = await db.DisputeResolution.findByPk(disputeId);
    
    if (!dispute) {
      const error = new Error('Dispute not found');
      error.statusCode = 404;
      throw error;
    }

    // Check access permissions
    if (user?.role !== 'admin') {
      const tx = await EscrowModel.findByPk(dispute.escrowId);
      const userId = user?.id || user;
      
      if (!tx || (userId !== tx.buyerId && userId !== tx.sellerId)) {
        const error = new Error('Not authorized to view this dispute');
        error.statusCode = 403;
        throw error;
      }
    }

    return dispute.toJSON();
  }

  async listDisputes({ user, status, page = 1, limit = 20 } = {}) {
    const where = {};
    const userId = user?.id || user;

    // Admins see all disputes
    if (user?.role !== 'admin') {
      if (!userId) {
        const error = new Error('User authentication required');
        error.statusCode = 401;
        throw error;
      }

      // Non-admins only see disputes they're involved in
      const userEscrows = await EscrowModel.findAll({
        where: {
          [Op.or]: [
            { buyerId: userId },
            { sellerId: userId }
          ]
        },
        attributes: ['id']
      });

      where.escrowId = {
        [Op.in]: userEscrows.map(e => e.id)
      };
    }

    if (status) {
      where.status = status;
    }

    const offset = (Math.max(Number(page), 1) - 1) * Number(limit);
    const { rows, count } = await db.DisputeResolution.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      offset,
      limit: Number(limit)
    });

    return {
      rows: rows.map(r => r.toJSON()),
      count,
      pagination: {
        currentPage: Number(page),
        itemsPerPage: Number(limit),
        totalItems: count,
        totalPages: Math.max(Math.ceil(count / Number(limit)), 1)
      }
    };
  }

  async submitSellerResponse({ transactionId, sellerResponse, sellerEvidence = [], user }) {
    // Validate inputs
    const userId = user?.id || user;
    if (!userId) {
      const error = new Error('User information is required');
      error.statusCode = 400;
      throw error;
    }

    if (!sellerResponse || sellerResponse.trim().length < 10 || sellerResponse.trim().length > 1000) {
      const error = new Error('Response must be between 10 and 1000 characters');
      error.statusCode = 400;
      throw error;
    }

    // Get escrow transaction
    const tx = await EscrowModel.findByPk(transactionId);
    if (!tx) {
      const error = new Error('Escrow transaction not found');
      error.statusCode = 404;
      throw error;
    }

    // Verify user is the seller
    if (userId !== tx.sellerId) {
      const error = new Error('Only the seller can submit a response to this dispute');
      error.statusCode = 403;
      throw error;
    }

    // Find the dispute
    const dispute = await db.DisputeResolution.findOne({
      where: { escrowId: transactionId }
    });

    if (!dispute) {
      const error = new Error('Dispute not found for this transaction');
      error.statusCode = 404;
      throw error;
    }

    if (dispute.status !== 'open') {
      const error = new Error('Dispute is no longer open for responses');
      error.statusCode = 400;
      throw error;
    }

    // Check if within response deadline
    const now = new Date();
    if (now > new Date(dispute.firstResponseDeadline)) {
      const error = new Error('Response deadline has passed');
      error.statusCode = 400;
      throw error;
    }

    // Check if seller has already responded
    if (dispute.sellerResponse) {
      const error = new Error('You have already submitted a response to this dispute');
      error.statusCode = 400;
      throw error;
    }

    // Create timeline entry
    const timelineEntry = {
      type: 'seller_responded',
      timestamp: now.toISOString(),
      respondedBy: userId,
      response: sellerResponse
    };

    const updatedTimeline = Array.isArray(dispute.timeline) ? [...dispute.timeline, timelineEntry] : [timelineEntry];

    // Update dispute with seller response
    await dispute.update({
      sellerResponse,
      sellerEvidence: sellerEvidence || [],
      status: 'in_review',
      timeline: updatedTimeline
    });

    // Notify admin and buyer about the response
    try {
      // Notify buyer
      await notificationService.createNotification({
        recipient: tx.buyerId,
        type: 'seller_responded_to_dispute',
        title: 'Seller Response to Dispute',
        message: `The seller has submitted their response to the dispute. The dispute is now under admin review.`,
        data: {
          escrowId: transactionId,
          disputeId: dispute.id
        },
        priority: 'normal'
      });

      // Notify admins
      await notificationService.createNotification({
        recipient: 'admin_group',
        type: 'dispute_review_needed',
        title: 'Dispute Ready for Resolution',
        message: `Both parties have provided information for transaction ${transactionId}. Dispute is ready for admin review. Resolution deadline: ${dispute.resolutionDeadline}`,
        data: {
          escrowId: transactionId,
          disputeId: dispute.id,
          priority: 'high'
        }
      });
    } catch (e) {
      console.warn('Failed to send response notifications:', e.message);
    }

    return dispute.toJSON();
  }

  async escalateDispute({ transactionId, escalationReason, user }) {
    // Validate admin access
    if (user?.role !== 'admin') {
      const error = new Error('Only admins can escalate disputes');
      error.statusCode = 403;
      throw error;
    }

    const userId = user?.id || user;
    if (!escalationReason || escalationReason.trim().length < 10) {
      const error = new Error('Escalation reason must be at least 10 characters');
      error.statusCode = 400;
      throw error;
    }

    // Find the dispute
    const dispute = await db.DisputeResolution.findOne({
      where: { escrowId: transactionId }
    });

    if (!dispute) {
      const error = new Error('Dispute not found for this transaction');
      error.statusCode = 404;
      throw error;
    }

    if (dispute.status === 'resolved' || dispute.status === 'closed') {
      const error = new Error('Dispute is already resolved or closed');
      error.statusCode = 400;
      throw error;
    }

    // Create timeline entry
    const now = new Date();
    const timelineEntry = {
      type: 'dispute_escalated',
      timestamp: now.toISOString(),
      escalatedBy: userId,
      reason: escalationReason
    };

    const updatedTimeline = Array.isArray(dispute.timeline) ? [...dispute.timeline, timelineEntry] : [timelineEntry];

    // Update dispute with escalation
    await dispute.update({
      status: 'escalated',
      escalatedAt: now,
      escalatedBy: userId,
      timeline: updatedTimeline
    });

    // Notify both parties and admins
    const tx = await EscrowModel.findByPk(transactionId);
    if (tx) {
      try {
        await notificationService.createNotification({
          recipient: 'admin_group',
          type: 'dispute_escalated',
          title: 'Dispute Escalated',
          message: `Dispute for transaction ${transactionId} has been escalated. Reason: ${escalationReason}`,
          data: {
            escrowId: transactionId,
            disputeId: dispute.id,
            priority: 'critical'
          }
        });
      } catch (e) {
        console.warn('Failed to send escalation notification:', e.message);
      }
    }

    return dispute.toJSON();
  }
}

module.exports = new EscrowService();
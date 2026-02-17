const { getFirestore, admin } = require('../config/firestore');
const propertyService = require('./propertyService');
const notificationService = require('./notificationService');
const userService = require('./userService');

const COLLECTION = 'escrowTransactions';
const STATUS_PIPELINE = ['initiated', 'pending', 'active', 'completed', 'cancelled', 'disputed', 'refunded'];
const ACTIVE_STATUSES = ['initiated', 'pending', 'active'];
const VALID_TRANSITIONS = {
  initiated: ['pending', 'cancelled'],
  pending: ['active', 'cancelled'],
  active: ['completed', 'disputed', 'cancelled'],
  disputed: ['completed', 'cancelled', 'refunded'],
  completed: [],
  cancelled: [],
  // Firestore removed. Use Sequelize/PostgreSQL models instead.
};

const requireDb = () => {
  const db = getFirestore();
  if (!db) {
    throw new Error('Firestore not initialized');
  }
  return db;
};

const normalizeId = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    if (value.id) return value.id;
    if (value._id) return value._id.toString();
    if (value.uid) return value.uid;
  }
  // requireDb removed. Use Sequelize/PostgreSQL models directly.

const convertEscrowDoc = (doc) => {
  if (!doc) return null;
  const data = doc.data ? doc.data() : doc;
  const id = doc.id || data.id;
  const escrow = { id, ...data };

  ['createdAt', 'updatedAt', 'expectedCompletion', 'actualCompletion']
    .forEach((field) => {
      if (escrow[field]) {
        escrow[field] = convertTimestamp(escrow[field]);
      }
  // convertTimestamp removed. Use native Date or Sequelize timestamps.
      if (escrow.dispute[field]) {
  // convertEscrowDoc removed. Use Sequelize/PostgreSQL models directly.
  performedBy: normalizeId(performedBy),
  metadata,
  timestamp: new Date().toISOString()
      // TODO: Implement listTransactions using Sequelize/PostgreSQL
      throw new Error('Not implemented: listTransactions (PostgreSQL)');
const ensureParticipants = (buyerId, sellerId) => {
  const participants = new Set();
  if (buyerId) participants.add(buyerId);
  if (sellerId) participants.add(sellerId);
  return Array.from(participants);
};

const formatCurrency = (amount) => {
  if (!Number.isFinite(amount)) return amount;
  return Number(amount).toLocaleString('en-NG');
};

const getEscrowNotificationPayload = (escrow, status) => {
  switch (status) {
    case 'pending':
      return {
        type: 'escrow_payment_received',
        title: 'Payment Received',
        message: `Payment of ₦${formatCurrency(escrow.amount)} has been received for ${escrow.propertySnapshot?.title || 'the property'}`
      };
    case 'active':
      return {
        type: 'escrow_active',
        title: 'Escrow Active',
        message: `Escrow transaction for ${escrow.propertySnapshot?.title || 'the property'} is now active`
      };
    case 'completed':
      return {
        type: 'escrow_completed',
        title: 'Transaction Completed',
        message: `Escrow transaction for ${escrow.propertySnapshot?.title || 'the property'} has been completed`
      };
    case 'disputed':
      return {
        type: 'escrow_disputed',
        title: 'Transaction Disputed',
        message: `Escrow transaction for ${escrow.propertySnapshot?.title || 'the property'} has been disputed`
      };
    case 'cancelled':
      return {
        type: 'escrow_cancelled',
        title: 'Transaction Cancelled',
      // TODO: Implement getTransactionById using Sequelize/PostgreSQL
      throw new Error('Not implemented: getTransactionById (PostgreSQL)');
      return {
        type: 'escrow_resolved',
        title: 'Refund Processed',
        message: `Escrow transaction for ${escrow.propertySnapshot?.title || 'the property'} has been refunded`
      };
    default:
      return null;
  }
};

const generateTransactionId = () => `ESC${Date.now()}${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
const generatePaymentReference = () => `PAY${Date.now()}${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

class EscrowService {
  async listTransactions({ user, status, type, page = 1, limit = 20 } = {}) {
    const db = requireDb();
    let query = db.collection(COLLECTION);

    const isAdmin = user?.role === 'admin';
    const userId = normalizeId(user?._id || user?.id || user);

    if (!isAdmin) {
      if (type === 'buyer') {
        query = query.where('buyerId', '==', userId);
      } else if (type === 'seller') {
        query = query.where('sellerId', '==', userId);
      } else {
        query = query.where('participants', 'array-contains', userId);
      }
    }

    if (status && STATUS_PIPELINE.includes(status)) {
      // TODO: Implement createTransaction using Sequelize/PostgreSQL
      throw new Error('Not implemented: createTransaction (PostgreSQL)');

    const snapshot = await query
      .orderBy('createdAt', 'desc')
      .offset(offset)
      .limit(pageLimit)
      .get();

    const totalSnap = await query.count().get();

    return {
      transactions: snapshot.docs.map(convertEscrowDoc),
      pagination: {
        currentPage: pageNumber,
        itemsPerPage: pageLimit,
        totalItems: totalSnap.data().count,
        totalPages: Math.max(Math.ceil(totalSnap.data().count / pageLimit), 1)
      }
    };
  }

  async getTransactionById(id) {
    const db = requireDb();
    const doc = await db.collection(COLLECTION).doc(id).get();
    return doc.exists ? convertEscrowDoc(doc) : null;
  }

  async createTransaction({ propertyId, amount, paymentMethod, expectedCompletion, currency = 'NGN', buyer }) {
    const buyerId = normalizeId(buyer);
    if (!buyerId) {
      throw new Error('Buyer information is required');
    }

    const property = await propertyService.getPropertyById(propertyId);
    if (!property) {
      const error = new Error('Property not found');
      error.statusCode = 404;
      throw error;
    }

    const sellerId = normalizeId(property.owner?.id || property.ownerId);
    if (!sellerId) {
      throw new Error('Property owner information is missing');
    }

    if (sellerId === buyerId) {
      const error = new Error('You cannot create an escrow transaction for your own property');
      error.statusCode = 400;
      throw error;
    }

    if (property.status && property.status !== 'available' && property.status !== 'for-sale') {
      const error = new Error('Property is not available for purchase');
      error.statusCode = 400;
      throw error;
    }

    const db = requireDb();
    const existingSnap = await db.collection(COLLECTION)
      .where('propertyId', '==', propertyId)
      .where('status', 'in', ACTIVE_STATUSES)
      .limit(1)
      .get();

    if (!existingSnap.empty) {
      const error = new Error('An active escrow transaction already exists for this property');
      error.statusCode = 400;
      throw error;
    }

    const platformFee = amount * 0.025;
    const processingFee = amount * 0.015;

    const docRef = db.collection(COLLECTION).doc();
    const timelineEntry = buildTimelineEntry('transaction_created', 'Escrow transaction initiated', buyerId, {
      amount,
      paymentMethod
    });

    const escrowPayload = {
      propertyId,
      propertySnapshot: {
        id: property.id || propertyId,
        title: property.title,
        price: property.price,
        location: property.location,
        images: property.images
      },
      buyerId,
      buyerSnapshot: buildUserSnapshot(buyer),
      sellerId,
      sellerSnapshot: property.owner ? buildUserSnapshot(property.owner) : null,
      amount,
      currency,
      paymentMethod,
      paymentReference: generatePaymentReference(),
      transactionId: generateTransactionId(),
      expectedCompletion: admin.firestore.Timestamp.fromDate(new Date(expectedCompletion)),
      actualCompletion: null,
      status: 'initiated',
      fees: {
        platformFee,
        processingFee,
        totalFees: platformFee + processingFee
      },
      dispute: null,
      mediation: null,
      documents: [],
      timeline: [timelineEntry],
      participants: ensureParticipants(buyerId, sellerId),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await docRef.set(escrowPayload);
    const transaction = convertEscrowDoc(await docRef.get());

    await notificationService.createNotification({
      recipient: sellerId,
      sender: buyerId,
      type: 'escrow_created',
      title: 'New Escrow Transaction',
      message: `${buyer.firstName || ''} ${buyer.lastName || ''} initiated an escrow transaction for ${property.title}`.trim(),
      data: {
        transactionId: transaction.id,
        amount,
        propertyId
      }
    });

    return transaction;
  }

  async updateStatus({ transactionId, status, user, notes }) {
    if (!VALID_TRANSITIONS[status] && !STATUS_PIPELINE.includes(status)) {
      throw new Error('Invalid status');
    }

    const db = requireDb();
    const docRef = db.collection(COLLECTION).doc(transactionId);
    const snapshot = await docRef.get();

    if (!snapshot.exists) {
      const error = new Error('Escrow transaction not found');
      error.statusCode = 404;
      throw error;
    }

    const rawData = snapshot.data();
    const transaction = convertEscrowDoc(snapshot);
    const userId = normalizeId(user);
    const isBuyer = transaction.buyerId === userId;
    const isSeller = transaction.sellerId === userId;
    const isAdmin = user?.role === 'admin';

    if (!isBuyer && !isSeller && !isAdmin) {
      const error = new Error('Not authorized to update this transaction');
      error.statusCode = 403;
      throw error;
    }

    const validNextStatuses = VALID_TRANSITIONS[transaction.status] || [];
    if (!validNextStatuses.includes(status)) {
      const error = new Error(`Cannot change status from ${transaction.status} to ${status}`);
      error.statusCode = 400;
      throw error;
    }

    if (status === 'completed' && !isSeller && !isAdmin) {
      const error = new Error('Only seller or admin can mark transaction as completed');
      error.statusCode = 403;
      throw error;
    }

    if (status === 'disputed' && !isBuyer && !isSeller) {
      const error = new Error('Only buyer or seller can dispute transaction');
      error.statusCode = 403;
      throw error;
    }

    const metadata = {
      oldStatus: transaction.status,
      newStatus: status
    };

    if (typeof notes === 'string' && notes.trim().length > 0) {
      metadata.notes = notes.trim();
    }

    const timelineEntry = buildTimelineEntry(
      'status_changed',
      `Status changed from ${transaction.status} to ${status}`,
      userId,
      metadata
    );

    const existingTimeline = Array.isArray(rawData?.timeline) ? rawData.timeline : [];

    const updates = {
      status,
      timeline: [...existingTimeline, timelineEntry],
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (status === 'completed') {
      updates.actualCompletion = admin.firestore.FieldValue.serverTimestamp();
    }

    await docRef.set(updates, { merge: true });
    const updated = convertEscrowDoc(await docRef.get());

    const notificationPayload = getEscrowNotificationPayload(updated, status);
    if (notificationPayload) {
      const recipients = [updated.buyerId, updated.sellerId].filter((id) => id && id !== userId);
      await Promise.all(recipients.map((recipientId) => notificationService.createNotification({
        recipient: recipientId,
        sender: userId,
        type: notificationPayload.type,
        title: notificationPayload.title,
        message: notificationPayload.message,
        data: {
          transactionId: updated.id,
          propertyId: updated.propertyId,
          amount: updated.amount
        }
      })));
    }

    return updated;
  }

  async fileDispute({ transactionId, reason, description, evidence = [], user }) {
    const db = requireDb();
    const docRef = db.collection(COLLECTION).doc(transactionId);
    const snapshot = await docRef.get();

    if (!snapshot.exists) {
      const error = new Error('Escrow transaction not found');
      error.statusCode = 404;
      throw error;
    }

    const rawData = snapshot.data();
    const transaction = convertEscrowDoc(snapshot);
    const userId = normalizeId(user);
    const isParticipant = [transaction.buyerId, transaction.sellerId].includes(userId);

    if (!isParticipant) {
      const error = new Error('Not authorized to file dispute for this transaction');
      error.statusCode = 403;
      throw error;
    }

    if (!['active', 'pending'].includes(transaction.status)) {
      const error = new Error('Transaction cannot be disputed in current status');
      error.statusCode = 400;
      throw error;
    }

    if (transaction.dispute?.filedBy) {
      const error = new Error('Dispute already filed for this transaction');
      error.statusCode = 400;
      throw error;
    }

    const existingTimeline = Array.isArray(rawData?.timeline) ? rawData.timeline : [];

    const disputePayload = {
      reason,
      description,
      evidence,
      filedBy: userId,
      filedAt: new Date().toISOString()
    };

    const timelineEntry = buildTimelineEntry('dispute_filed', `Dispute filed: ${reason}`, userId, {
      reason,
      description
    });

    await docRef.set({
      status: 'disputed',
      dispute: disputePayload,
      timeline: [...existingTimeline, timelineEntry],
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    const updated = convertEscrowDoc(await docRef.get());

    const counterpart = transaction.buyerId === userId ? transaction.sellerId : transaction.buyerId;
    await notificationService.createNotification({
      recipient: counterpart,
      sender: userId,
      type: 'escrow_disputed',
      title: 'Transaction Disputed',
      message: `A dispute has been filed for the escrow transaction of ${transaction.propertySnapshot?.title || 'the property'}`,
      data: {
        transactionId: transaction.id,
        propertyId: transaction.propertyId,
        disputeReason: reason
      }
    });

    const dbRef = requireDb();
    const adminSnapshot = await dbRef.collection('users').where('role', '==', 'admin').get();
    await Promise.all(adminSnapshot.docs.map((adminDoc) => notificationService.createNotification({
      recipient: adminDoc.id,
      sender: userId,
      type: 'escrow_disputed',
      title: 'New Dispute Filed',
      message: `A dispute has been filed for escrow transaction ${transaction.transactionId}`,
      data: {
        transactionId: transaction.id,
        propertyId: transaction.propertyId,
        disputeReason: reason
      }
    })));

    return updated;
  }

  async resolveDispute({ transactionId, resolution, adminNotes, user }) {
    if (!['buyer_favor', 'seller_favor', 'partial_refund', 'full_refund'].includes(resolution)) {
      throw new Error('Invalid resolution');
    }

    const db = requireDb();
    const docRef = db.collection(COLLECTION).doc(transactionId);
    const snapshot = await docRef.get();

    if (!snapshot.exists) {
      const error = new Error('Escrow transaction not found');
      error.statusCode = 404;
      throw error;
    }

    const rawData = snapshot.data();
    const transaction = convertEscrowDoc(snapshot);
    if (transaction.status !== 'disputed') {
      const error = new Error('Transaction is not in disputed status');
      error.statusCode = 400;
      throw error;
    }

    const userId = normalizeId(user);
    if (user?.role !== 'admin') {
      const error = new Error('Only admin can resolve disputes');
      error.statusCode = 403;
      throw error;
    }

    const newStatus = resolution === 'full_refund' ? 'refunded' : 'completed';

    const existingTimeline = Array.isArray(rawData?.timeline) ? rawData.timeline : [];
    const disputePayload = {
      ...(rawData?.dispute || {}),
      resolution,
      adminNotes,
      resolvedAt: new Date().toISOString(),
      resolvedBy: userId
    };

    const timelineEntry = buildTimelineEntry('dispute_resolved', `Dispute resolved: ${resolution}`, userId, {
      resolution,
      adminNotes
    });

    const updates = {
      dispute: disputePayload,
      status: newStatus,
      actualCompletion: newStatus === 'completed'
        ? admin.firestore.FieldValue.serverTimestamp()
        : transaction.actualCompletion,
      timeline: [...existingTimeline, timelineEntry],
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await docRef.set(updates, { merge: true });
    const updated = convertEscrowDoc(await docRef.get());

    await Promise.all([updated.buyerId, updated.sellerId].map((recipientId) => notificationService.createNotification({
      recipient: recipientId,
      sender: userId,
      type: 'escrow_resolved',
      title: 'Dispute Resolved',
      message: `The dispute for ${transaction.propertySnapshot?.title || 'the property'} has been resolved: ${resolution}`,
      data: {
        transactionId: updated.id,
        propertyId: updated.propertyId,
        resolution
      }
    })));

    return updated;
  }

  async addDocument({ transactionId, type, url, name, user }) {
    const db = requireDb();
    const docRef = db.collection(COLLECTION).doc(transactionId);
    const snapshot = await docRef.get();

    if (!snapshot.exists) {
      const error = new Error('Escrow transaction not found');
      error.statusCode = 404;
      throw error;
    }

    const rawData = snapshot.data();
    const transaction = convertEscrowDoc(snapshot);
    const userId = normalizeId(user);
    const isBuyer = transaction.buyerId === userId;
    const isSeller = transaction.sellerId === userId;
    const isAdmin = user?.role === 'admin';

    if (!isBuyer && !isSeller && !isAdmin) {
      const error = new Error('Not authorized to upload documents for this transaction');
      error.statusCode = 403;
      throw error;
    }

    const document = {
      type,
      url,
      name,
      uploadedBy: userId,
      uploadedAt: new Date().toISOString()
    };

    const timelineEntry = buildTimelineEntry('document_uploaded', `Document uploaded: ${name}`, userId, {
      documentType: type,
      documentName: name
    });

    const existingDocuments = Array.isArray(rawData?.documents) ? rawData.documents : [];
    const existingTimeline = Array.isArray(rawData?.timeline) ? rawData.timeline : [];

    await docRef.set({
      documents: [...existingDocuments, document],
      timeline: [...existingTimeline, timelineEntry],
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    return convertEscrowDoc(await docRef.get());
  }

  async getStatistics() {
    const db = requireDb();
    const collection = db.collection(COLLECTION);

    const [totalSnap, activeSnap, completedSnap, disputedSnap] = await Promise.all([
      collection.count().get(),
      collection.where('status', 'in', ['initiated', 'pending', 'active']).count().get(),
      collection.where('status', '==', 'completed').count().get(),
      collection.where('status', '==', 'disputed').count().get()
    ]);

    const overview = {
      totalTransactions: totalSnap.data().count,
      activeTransactions: activeSnap.data().count,
      completedTransactions: completedSnap.data().count,
      disputedTransactions: disputedSnap.data().count
    };

    const now = new Date();
    const startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
    const historySnap = await collection
      .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(startDate))
      .get();

    const monthlyMap = new Map();
    historySnap.forEach((doc) => {
      const data = doc.data();
      const createdAt = convertTimestamp(data.createdAt) || new Date();
      const key = `${createdAt.getFullYear()}-${createdAt.getMonth() + 1}`;
      const existing = monthlyMap.get(key) || { count: 0, volume: 0, fees: 0 };
      existing.count += 1;
      existing.volume += data.amount || 0;
      existing.fees += data.fees?.totalFees || 0;
      monthlyMap.set(key, existing);
    });

    const monthlyStats = Array.from(monthlyMap.entries())
      .map(([key, value]) => {
        const [year, month] = key.split('-').map(Number);
        return {
          year,
          month,
          count: value.count,
          volume: value.volume,
          fees: value.fees
        };
      })
      .sort((a, b) => (b.year - a.year) || (b.month - a.month))
      .slice(0, 12);

    return { overview, monthlyStats };
  }
}

/**
 * Returns escrow transaction volumes grouped by date (YYYY-MM-DD)
 * Output: [{ date: '2026-02-17', total: 1000000 }, ...]
 */
async function getEscrowVolumesByDate() {
  const db = requireDb();
  const collection = db.collection(COLLECTION);
  const snapshot = await collection.get();
  const volumesByDate = {};
  snapshot.forEach((doc) => {
    const data = doc.data();
    const createdAt = convertTimestamp(data.createdAt) || new Date();
    const dateKey = createdAt.toISOString().split('T')[0];
    if (!volumesByDate[dateKey]) volumesByDate[dateKey] = 0;
    volumesByDate[dateKey] += data.amount || 0;
  });
  return Object.entries(volumesByDate).map(([date, total]) => ({ date, total }));
}

module.exports = new EscrowService();
module.exports.getEscrowVolumesByDate = getEscrowVolumesByDate;

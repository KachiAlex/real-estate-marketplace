// Firestore removed. Use Sequelize/PostgreSQL models instead.
const propertyService = require('./propertyService');
const notificationService = require('./notificationService');

const COLLECTION = 'disputes';
const VALID_REASONS = [
  'property_condition',
  'title_issues',
  'seller_non_compliance',
  'buyer_non_compliance',
  'payment_issues',
  'other'
];
const STATUS_FLOW = ['open', 'awaiting_response', 'under_review', 'resolved', 'closed'];

const requireDb = () => {
  // Use Sequelize/PostgreSQL only
};

const normalizeId = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    if (value.id) return value.id;
    if (value._id) return value._id.toString();
    if (value.uid) return value.uid;
  }
  return null;
};

const buildTimelineEntry = (type, message, user, metadata = {}) => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  type,
  message,
  metadata,
  authorId: normalizeId(user),
  authorRole: typeof user === 'object' ? user.role : undefined,
  createdAt: new Date().toISOString()
});

const convertTimestamp = (value) => {
  if (!value) return value;
  if (typeof value.toDate === 'function') {
    return value.toDate();
  }
  return value;
};

const convertDisputeDoc = (doc) => {
  if (!doc) return null;
  const data = doc.data ? doc.data() : doc;
  const dispute = { id: doc.id || data.id, ...data };

  ['createdAt', 'updatedAt', 'resolvedAt'].forEach((key) => {
    if (dispute[key]) {
      dispute[key] = convertTimestamp(dispute[key]);
    }
  });

  if (Array.isArray(dispute.timeline)) {
    dispute.timeline = dispute.timeline.map((entry) => ({
      ...entry,
      createdAt: convertTimestamp(entry.createdAt)
    }));
  }

  return dispute;
};

const buildUserSnapshot = (user) => {
  if (!user) return null;
  if (typeof user === 'string') {
    return { id: user };
  }
  return {
    id: normalizeId(user),
    role: user.role || undefined,
    name: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.name || undefined,
    email: user.email || undefined
  };
};

class DisputeService {
  async createDispute({ user, propertyId, escrowId, counterpartyId, reason, description, attachments = [] }) {
    if (!VALID_REASONS.includes(reason)) {
      const error = new Error('Invalid dispute reason');
      error.statusCode = 400;
      throw error;
    }

    // const db = requireDb(); // Use Sequelize/PostgreSQL only
    const userId = normalizeId(user);
    if (!userId) {
      const error = new Error('Unable to determine user ID');
      error.statusCode = 400;
      throw error;
    }

    let propertySnapshot = null;
    let propertyOwnerId = null;

    if (propertyId) {
      propertySnapshot = await propertyService.getPropertyById(propertyId);
      if (!propertySnapshot) {
        const error = new Error('Property not found');
        error.statusCode = 404;
        throw error;
      }
      propertyOwnerId = normalizeId(propertySnapshot.owner || propertySnapshot.ownerId);
    }

    let escrowSnapshot = null;
    if (escrowId) {
      const escrowRef = await db.collection('escrowTransactions').doc(escrowId).get();
      if (!escrowRef.exists) {
        const error = new Error('Escrow transaction not found');
        error.statusCode = 404;
        throw error;
      }
      escrowSnapshot = convertDisputeDoc(escrowRef);
    }

    const participants = new Set([userId]);
    let respondentId = null;
    let respondentSnapshot = null;
    let propertyTitle = propertySnapshot?.title;

    if (escrowSnapshot) {
      const buyerId = escrowSnapshot.buyerId;
      const sellerId = escrowSnapshot.sellerId;
      if (![buyerId, sellerId].includes(userId)) {
        const error = new Error('You are not a participant in this escrow transaction');
        error.statusCode = 403;
        throw error;
      }
      respondentId = userId === buyerId ? sellerId : buyerId;
      respondentSnapshot = userId === buyerId ? escrowSnapshot.sellerSnapshot : escrowSnapshot.buyerSnapshot;
      propertyId = propertyId || escrowSnapshot.propertyId;
      propertyTitle = propertyTitle || escrowSnapshot.propertySnapshot?.title;
      participants.add(buyerId);
      participants.add(sellerId);
    } else {
      if (!propertySnapshot) {
        const error = new Error('Property information is required when escrowId is not provided');
        error.statusCode = 400;
        throw error;
      }

      if (userId === propertyOwnerId) {
        respondentId = normalizeId(counterpartyId);
        if (!respondentId) {
          const error = new Error('Vendor disputes require a counterparty or escrow reference');
          error.statusCode = 400;
          throw error;
        }
      } else {
        respondentId = propertyOwnerId;
        respondentSnapshot = buildUserSnapshot(propertySnapshot.owner);
      }

      if (respondentId) {
        participants.add(respondentId);
      }
    }

    if (!respondentId) {
      const error = new Error('Unable to determine respondent for this dispute');
      error.statusCode = 400;
      throw error;
    }

    const disputePayload = {
      propertyId,
      propertyTitle,
      escrowId: escrowSnapshot?.id || null,
      reason,
      description,
      attachments,
      status: 'open',
      priority: 'medium',
      raisedBy: buildUserSnapshot(user),
      respondent: respondentSnapshot || buildUserSnapshot(respondentId),
      participants: Array.from(participants),
      timeline: [
        buildTimelineEntry('dispute_created', `Dispute filed: ${reason}`, user, {
          description
        })
      ],
      // createdAt and updatedAt: use Sequelize timestamps or Date.now()
    };

    const docRef = await requireDb().collection(COLLECTION).add(disputePayload);
    const created = await docRef.get();
    const dispute = convertDisputeDoc(created);

    await notificationService.createNotification({
      recipient: respondentId,
      sender: userId,
      type: 'dispute_created',
      title: 'New Dispute Filed',
      message: description.slice(0, 140),
      data: {
        disputeId: dispute.id,
        propertyId: dispute.propertyId,
        reason: dispute.reason
      },
      priority: 'high'
    });

    return dispute;
  }

  async listDisputes({ user, status }) {
    const db = requireDb();
    let query = db.collection(COLLECTION);

    if (status && STATUS_FLOW.includes(status)) {
      query = query.where('status', '==', status);
    }

    if (!user || user.role !== 'admin') {
      const userId = normalizeId(user);
      if (!userId) {
        const error = new Error('Not authorized to list disputes');
        error.statusCode = 403;
        throw error;
      }
      query = query.where('participants', 'array-contains', userId);
    }

    const snapshot = await query.orderBy('createdAt', 'desc').limit(100).get();
    return snapshot.docs.map(convertDisputeDoc);
  }

  async getDisputeById(id, user) {
    const db = requireDb();
    const doc = await db.collection(COLLECTION).doc(id).get();

    if (!doc.exists) {
      const error = new Error('Dispute not found');
      error.statusCode = 404;
      throw error;
    }

    const dispute = convertDisputeDoc(doc);
    const userId = normalizeId(user);
    if (user?.role !== 'admin' && !dispute.participants.includes(userId)) {
      const error = new Error('Not authorized to view this dispute');
      error.statusCode = 403;
      throw error;
    }

    return dispute;
  }

  async addMessage({ disputeId, message, attachments = [], user }) {
    const db = requireDb();
    const docRef = db.collection(COLLECTION).doc(disputeId);
    const doc = await docRef.get();

    if (!doc.exists) {
      const error = new Error('Dispute not found');
      error.statusCode = 404;
      throw error;
    }

    const dispute = convertDisputeDoc(doc);
    const userId = normalizeId(user);
    if (user?.role !== 'admin' && !dispute.participants.includes(userId)) {
      const error = new Error('Not authorized to comment on this dispute');
      error.statusCode = 403;
      throw error;
    }

    const entry = buildTimelineEntry('message', message, user, { attachments });

    await docRef.update({
      // timeline: use array push, updatedAt: use Sequelize timestamps or Date.now()
    });

    await notificationService.createNotification({
      recipient: dispute.participants.find((id) => id !== userId) || dispute.participants[0],
      sender: userId,
      type: 'dispute_updated',
      title: 'New Dispute Message',
      message: message.slice(0, 140),
      data: {
        disputeId,
        propertyId: dispute.propertyId
      }
    });

    const updated = await docRef.get();
    return convertDisputeDoc(updated);
  }

  async updateStatus({ disputeId, status, resolutionNotes, user, resolution }) {
    if (!STATUS_FLOW.includes(status)) {
      const error = new Error('Invalid dispute status');
      error.statusCode = 400;
      throw error;
    }

    if (!user || user.role !== 'admin') {
      const error = new Error('Only admin can update dispute status');
      error.statusCode = 403;
      throw error;
    }

    // const db = requireDb(); // Use Sequelize/PostgreSQL only
    // const docRef = await sequelize.models.Dispute.findByPk(disputeId); // Example for Sequelize
    const doc = await docRef.get();

    if (!doc.exists) {
      const error = new Error('Dispute not found');
      error.statusCode = 404;
      throw error;
    }

    const entry = buildTimelineEntry('status_change', `Status updated to ${status}`, user, {
      resolutionNotes,
      resolution
    });

    const updates = {
      status,
      resolutionNotes: resolutionNotes || null,
      resolution: resolution || null,
      // timeline: use array push for Sequelize,
      // updatedAt: use Sequelize timestamps or Date.now()
    };

    if (status === 'resolved') {
      // updates.resolvedAt: use Date or Sequelize
      updates.resolvedBy = normalizeId(user);
    }

    await docRef.update(updates);

    const updated = convertDisputeDoc(await docRef.get());

    await Promise.all(
      updated.participants.map((participantId) => notificationService.createNotification({
        recipient: participantId,
        sender: normalizeId(user),
        type: 'dispute_updated',
        title: 'Dispute Status Updated',
        message: `Dispute status changed to ${status}`,
        data: {
          disputeId: updated.id,
          status
        }
      }))
    );

    return updated;
  }
}

const disputeService = new DisputeService();

// Admin helpers (not implemented for Sequelize yet)
async function getAllDisputes() {
  // Return empty array until PostgreSQL-backed implementation exists
  return [];
}

disputeService.getAllDisputes = getAllDisputes;

async function updateDisputeStatus(disputeId, status, resolutionNotes, adminId) {
  const error = new Error('updateDisputeStatus not implemented for PostgreSQL');
  error.statusCode = 501;
  throw error;
}

disputeService.updateDisputeStatus = updateDisputeStatus;

disputeService.VALID_REASONS = VALID_REASONS;
disputeService.STATUS_FLOW = STATUS_FLOW;

module.exports = disputeService;

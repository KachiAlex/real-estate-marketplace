const { getFirestore, admin } = require('../config/firestore');
const adminSettingsService = require('./adminSettingsService');
const paymentService = require('./paymentService');

const COLLECTION = 'verificationApplications';

const requireDb = () => {
  const db = getFirestore();
  if (!db) {
    throw new Error('Firestore not initialized');
  }
  return db;
};

const convertTimestamp = (value) => {
  if (!value) return null;
  if (typeof value.toDate === 'function') {
    return value.toDate();
  }
  if (value instanceof Date) return value;
  if (typeof value === 'number') return new Date(value);
  return value;
};

const convertDoc = (doc) => {
  if (!doc) return null;
  const data = doc.data ? doc.data() : doc;
  const application = { id: doc.id || data.id, ...data };
  ['createdAt', 'updatedAt', 'decisionAt'].forEach((key) => {
    if (application[key]) {
      application[key] = convertTimestamp(application[key]);
    }
  });
  return application;
};

const buildApplicantSnapshot = (user = {}) => {
  if (!user) return null;
  return {
    id: user.id || user._id || user.uid || null,
    name: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.name || user.companyName || 'Unknown Applicant',
    email: user.email || 'unknown@example.com',
    role: user.role || 'user',
    phone: user.phone || user.contactPhone || null
  };
};

const buildError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const ensureVerificationPayment = async ({ paymentId, applicantId, requiredAmount }) => {
  if (!paymentId) {
    throw buildError('Verification payment reference is required');
  }

  const payment = await paymentService.getPaymentById(paymentId);

  if (!payment) {
    throw buildError('Verification payment record could not be found', 404);
  }

  if (!applicantId || payment.userId !== applicantId) {
    throw buildError('Verification payment does not belong to this applicant', 403);
  }

  if (payment.paymentType !== 'property_verification') {
    throw buildError('Payment is not designated for property verification');
  }

  if (payment.status !== 'completed') {
    throw buildError('Verification payment has not been completed yet');
  }

  if (Number(payment.amount || 0) < Number(requiredAmount || 0)) {
    throw buildError('Verification payment amount is less than the required fee');
  }

  return payment;
};

const ensurePaymentNotReused = async ({ db, paymentId }) => {
  const existing = await db
    .collection(COLLECTION)
    .where('verificationPaymentId', '==', paymentId)
    .limit(1)
    .get();

  if (!existing.empty) {
    throw buildError('Verification payment reference has already been used');
  }
};

const submitApplication = async ({
  applicant,
  propertyName,
  propertyId,
  propertyUrl,
  propertyLocation,
  message,
  attachments = [],
  preferredBadgeColor,
  verificationPaymentId
}) => {
  const db = requireDb();
  const docRef = db.collection(COLLECTION).doc();
  const applicantSnapshot = buildApplicantSnapshot(applicant);
  const settings = await adminSettingsService.getSettings();
  const verificationFee = settings.verificationFee || 50000;

  const payment = await ensureVerificationPayment({
    paymentId: verificationPaymentId,
    applicantId: applicantSnapshot?.id,
    requiredAmount: verificationFee
  });

  await ensurePaymentNotReused({ db, paymentId: verificationPaymentId });

  const payload = {
    applicant: applicantSnapshot,
    propertyName,
    propertyId: propertyId || null,
    propertyUrl: propertyUrl || null,
    propertyLocation: propertyLocation || null,
    message: message || '',
    attachments,
    status: 'pending',
    badgeColor: null,
    requestedBadgeColor: preferredBadgeColor || settings.verificationBadgeColor || '#10B981',
    verificationFee,
    verificationPaymentId,
    verificationPaymentReference: payment.reference,
    verificationPaymentMethod: payment.paymentMethod,
    verificationPaymentAmount: payment.amount,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  await docRef.set(payload);
  const created = await docRef.get();
  return convertDoc(created);
};

const listApplications = async ({ status, applicantId } = {}) => {
  const db = requireDb();
  let queryRef = db.collection(COLLECTION);

  if (status && status !== 'all') {
    queryRef = queryRef.where('status', '==', status);
  }

  if (applicantId) {
    queryRef = queryRef.where('applicant.id', '==', applicantId);
  }

  const snapshot = await queryRef.get();
  return snapshot.docs
    .map(convertDoc)
    .sort((a, b) => {
      const aTime = a?.createdAt instanceof Date ? a.createdAt.getTime() : 0;
      const bTime = b?.createdAt instanceof Date ? b.createdAt.getTime() : 0;
      return bTime - aTime;
    });
};

const updateApplicationStatus = async ({ id, status, adminNotes, badgeColor, adminUser }) => {
  const db = requireDb();
  const docRef = db.collection(COLLECTION).doc(id);
  const snapshot = await docRef.get();

  if (!snapshot.exists) {
    const error = new Error('Verification application not found');
    error.statusCode = 404;
    throw error;
  }

  const settings = await adminSettingsService.getSettings();
  const resolvedBadgeColor = badgeColor || settings.verificationBadgeColor || '#10B981';

  const updates = {
    status,
    adminNotes: adminNotes || null,
    decisionBy: buildApplicantSnapshot(adminUser),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  if (status === 'approved') {
    updates.badgeColor = resolvedBadgeColor;
    updates.decisionAt = admin.firestore.FieldValue.serverTimestamp();
  }

  if (status === 'rejected') {
    updates.decisionAt = admin.firestore.FieldValue.serverTimestamp();
  }

  await docRef.set(updates, { merge: true });
  const updated = await docRef.get();
  return convertDoc(updated);
};

module.exports = {
  submitApplication,
  listApplications,
  updateApplicationStatus
};

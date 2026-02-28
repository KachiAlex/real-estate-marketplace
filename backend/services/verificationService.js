// Firestore removed. Use Sequelize/PostgreSQL models instead.
const adminSettingsService = require('./adminSettingsService');
const paymentService = require('./paymentService');
const propertyService = require('./propertyService');
const notificationService = require('./notificationService');
const db = require('../config/sequelizeDb');

const getModels = () => ({
  VerificationApplication: db?.VerificationApplication,
  User: db?.User,
  Property: db?.Property
});

const buildMockApplications = () => ([
  {
    id: 'mock-verification-1',
    status: 'pending',
    applicationType: 'property_verification',
    propertyId: null,
    propertyName: 'Lekki Pearl Residence',
    propertyLocation: 'Lekki Phase 1, Lagos',
    propertyUrl: 'https://propertyark.com/properties/lekki-pearl',
    notes: 'Premium listing verification request (mocked)',
    documents: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    applicant: {
      id: 'mock-vendor-1',
      name: 'Jane Smith',
      email: 'jane@example.com'
    },
    badgeColor: '#6366F1',
    paymentStatus: 'pending',
    paymentReference: null
  }
]);

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

// ensurePaymentNotReused: implement with Sequelize/PostgreSQL

const normalizeApplication = (row) => {
  if (!row) return null;
  const json = typeof row.toJSON === 'function' ? row.toJSON() : row;
  return {
    id: json.id,
    status: json.status,
    applicationType: json.applicationType,
    propertyId: json.propertyId,
    propertyName: json.property?.title || json.propertyName,
    propertyLocation: json.property?.location || json.propertyLocation,
    propertyUrl: json.propertyUrl,
    notes: json.notes,
    documents: json.documents || [],
    createdAt: json.createdAt,
    updatedAt: json.updatedAt,
    applicant: json.vendor ? {
      id: json.vendor.id,
      name: [json.vendor.firstName, json.vendor.lastName].filter(Boolean).join(' ') || json.vendor.email,
      email: json.vendor.email
    } : null,
    badgeColor: json.preferredBadgeColor || null,
    paymentStatus: json.paymentStatus || null,
    paymentReference: json.paymentReference || null
  };
};

const submitApplication = async (args = {}) => {
  const {
    applicant,
    propertyId,
    propertyName,
    propertyUrl,
    propertyLocation,
    message,
    attachments = [],
    preferredBadgeColor,
    verificationPaymentId
  } = args;

  if (!applicant || !applicant.id) throw buildError('Applicant information is required', 400);

  const { VerificationApplication, Property } = getModels();

  if (!VerificationApplication) {
    throw buildError('Verification service unavailable. Please try again shortly.', 503);
  }

  // Ensure property exists when propertyId provided
  let property = null;
  if (propertyId) {
    property = await Property.findByPk(propertyId);
    if (!property) throw buildError('Property not found', 404);
  }

  // Validate payment if provided
  let paymentValidated = false;
  if (verificationPaymentId) {
    const settings = await adminSettingsService.getSettings();
    const requiredAmount = settings?.verificationFee || 50000;
    await ensureVerificationPayment({ paymentId: verificationPaymentId, applicantId: applicant.id, requiredAmount });
    paymentValidated = true;
  }

  const created = await VerificationApplication.create({
    propertyId: propertyId || null,
    vendorId: applicant.id,
    applicationType: 'property_verification',
    paymentStatus: paymentValidated ? 'completed' : 'pending',
    status: 'pending',
    documents: attachments || [],
    notes: message || '',
    propertyName: property?.title || propertyName || null,
    propertyUrl: property?.url || propertyUrl || null,
    propertyLocation: property?.location || propertyLocation || null,
    preferredBadgeColor: preferredBadgeColor || null
  });

  // Notify vendor
  try {
    await notificationService.createNotification({
      recipient: applicant.id,
      type: 'verification_submitted',
      title: 'Verification Submitted',
      message: `Your verification request for ${property?.title || propertyName || 'property'} has been received.`,
      data: { verificationId: created.id }
    });
  } catch (e) {
    console.warn('Failed to send verification submitted notification', e.message || e);
  }

  return normalizeApplication(created);
};

const listApplications = async ({ status = 'all', applicantId } = {}) => {
  const { VerificationApplication, User, Property } = getModels();

  if (!VerificationApplication) {
    console.warn('VerificationApplication model unavailable — returning mocked applications');
    return buildMockApplications();
  }

  const where = {};
  if (status && status !== 'all') {
    // map frontend statuses to DB values if necessary
    where.status = status;
  }
  if (applicantId) where.vendorId = applicantId;

  const rows = await VerificationApplication.findAll({
    where,
    include: [
      { model: User, as: 'vendor', attributes: ['id', 'firstName', 'lastName', 'email'] },
      { model: Property, as: 'property', attributes: ['id', 'title', 'location'] }
    ],
    order: [['createdAt', 'DESC']]
  });

  return rows.map(normalizeApplication);
};

const updateApplicationStatus = async ({ id, status, adminNotes = '', badgeColor = null, adminUser } = {}) => {
  const { VerificationApplication, User, Property } = getModels();

  if (!VerificationApplication) {
    throw buildError('Verification service unavailable. Please try again shortly.', 503);
  }

  if (!id) throw buildError('Application id is required', 400);
  const app = await VerificationApplication.findByPk(id);
  if (!app) throw buildError('Verification application not found', 404);

  await app.update({ status, notes: adminNotes || app.notes, preferredBadgeColor: badgeColor || app.preferredBadgeColor || null });

  // If approved, update related property verification status
  if (status === 'approved') {
    try {
      await propertyService.updatePropertyVerification(app.propertyId, { status: 'verified', notes: adminNotes, adminId: adminUser?.id });
    } catch (e) {
      console.warn('Failed to update property verification after application approval', e.message || e);
    }
  }

  // Notify vendor about the decision
  try {
    await notificationService.createNotification({
      recipient: app.vendorId,
      type: 'verification_updated',
      title: 'Verification Updated',
      message: `Your verification application has been ${status}. ${adminNotes || ''}`.trim(),
      data: { verificationId: app.id, status }
    });
  } catch (e) {
    console.warn('Failed to send verification decision notification', e.message || e);
  }

  const updated = await VerificationApplication.findByPk(id, {
    include: [
      { model: User, as: 'vendor', attributes: ['id', 'firstName', 'lastName', 'email'] },
      { model: Property, as: 'property', attributes: ['id', 'title', 'location'] }
    ]
  });

  return normalizeApplication(updated);
};

module.exports = {
  submitApplication,
  listApplications,
  updateApplicationStatus,
  buildMockApplications
};

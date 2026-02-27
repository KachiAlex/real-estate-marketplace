// Firestore removed. Use Sequelize/PostgreSQL models instead.
const adminSettingsService = require('./adminSettingsService');
const paymentService = require('./paymentService');

const COLLECTION = 'verificationApplications';

// requireDb removed. Use Sequelize/PostgreSQL models directly.

// convertTimestamp removed. Use native Date or Sequelize timestamps.

// convertDoc removed. Use Sequelize/PostgreSQL models directly.

const buildApplicantSnapshot = (user = {}) => {
  if (!user) return null;
  return {
    id: user.id || user._id || user.uid || null,
    name: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.name || user.companyName || 'Unknown Applicant',
    email: user.email || 'unknown@example.com',
    role: user.role || user.activeRole || 'user',
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

// ensurePaymentNotReused: implement with Sequelize/PostgreSQL

const submitApplication = async (args) => {
  const db = require('../config/sequelizeDb');
  const propertyService = require('./propertyService');
  const notificationService = require('./notificationService');

  const { VerificationApplication, Payment, Property } = db;

  const submitApplication = async (args) => {
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
    } = args || {};

    if (!applicant || !applicant.id) throw buildError('Applicant information is required', 400);

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
      badgeType: 'property_verification',
      paymentStatus: paymentValidated ? 'completed' : 'pending',
      verificationStatus: 'pending',
      documents: attachments || [],
      notes: message || ''
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

    return created.toJSON();
  };
};

const listApplications = async ({ status = 'all', applicantId } = {}) => {
  const where = {};
  if (status && status !== 'all') {
    // map frontend statuses to DB values if necessary
    where.verificationStatus = status;
  }
  if (applicantId) where.vendorId = applicantId;

  const rows = await VerificationApplication.findAll({
    where,
    include: [
      { model: db.User, as: 'vendor', attributes: ['id', 'firstName', 'lastName', 'email'] },
      { model: db.Property, as: 'property', attributes: ['id', 'title', 'location'] }
    ],
    order: [['createdAt', 'DESC']]
  });

  return rows.map(r => r.toJSON());
};

const updateApplicationStatus = async ({ id, status, adminNotes = '', badgeColor = null, adminUser } = {}) => {
  if (!id) throw buildError('Application id is required', 400);
  const app = await VerificationApplication.findByPk(id);
  if (!app) throw buildError('Verification application not found', 404);

  await app.update({ verificationStatus: status, notes: adminNotes || app.notes });

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
      { model: db.User, as: 'vendor', attributes: ['id', 'firstName', 'lastName', 'email'] },
      { model: db.Property, as: 'property', attributes: ['id', 'title', 'location'] }
    ]
  });

  return updated ? updated.toJSON() : null;
};

module.exports = {
  submitApplication,
  listApplications,
  updateApplicationStatus
};

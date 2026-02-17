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
  // TODO: Implement submitApplication using Sequelize/PostgreSQL
  throw new Error('Not implemented: submitApplication (PostgreSQL)');
};

const listApplications = async (args = {}) => {
  // TODO: Implement listApplications using Sequelize/PostgreSQL
  throw new Error('Not implemented: listApplications (PostgreSQL)');
};

const updateApplicationStatus = async (args) => {
  // TODO: Implement updateApplicationStatus using Sequelize/PostgreSQL
  throw new Error('Not implemented: updateApplicationStatus (PostgreSQL)');
};

module.exports = {
  submitApplication,
  listApplications,
  updateApplicationStatus
};

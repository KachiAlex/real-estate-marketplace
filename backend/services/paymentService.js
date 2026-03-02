// Sequelize-only paymentService (clean, single source)
const db = require('../config/sequelizeDb');
const { Payment } = db;
const { Subscription } = db;
const paystackService = require('./paystackService');
const flutterwaveService = require('./flutterwaveService');

async function listUserPayments({ userId, status, paymentType, page = 1, limit = 20 }) {
  const where = { userId };
  if (status) where.status = status;
  if (paymentType) where.paymentType = paymentType;
  const offset = (page - 1) * limit;
  const { rows, count } = await Payment.findAndCountAll({ where, offset, limit, order: [['createdAt', 'DESC']] });
  return { data: rows, total: count };
}

async function getPaymentById(id) {
  return Payment.findByPk(id);
}

async function initializePayment({ user, amount, paymentMethod, paymentType, relatedEntity, description, currency = 'NGN' }) {
  const reference = `PAY${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  const payment = await Payment.create({ userId: user.id, amount, currency, paymentType, provider: paymentMethod, reference, status: 'pending', metadata: { relatedEntity, description } });
  
  // Initialize with payment provider to get authorization URL
  let providerData = {};
  
  try {
    if (paymentMethod === 'paystack') {
      const paystackPayload = {
        email: user.email,
        amount: Math.round(amount * 100), // Paystack expects amount in kobo
        reference,
        metadata: {
          userId: user.id,
          paymentId: payment.id,
          relatedEntity,
          description
        }
      };
      
      const paystackResult = await paystackService.initializePayment(paystackPayload);
      if (paystackResult && paystackResult.data) {
        providerData = {
          txRef: reference,
          authorizationUrl: paystackResult.data.authorization_url,
          accessCode: paystackResult.data.access_code
        };
      }
    } else if (paymentMethod === 'flutterwave') {
      const flutterwavePayload = {
        tx_ref: reference,
        amount,
        currency,
        customer: {
          email: user.email,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim()
        },
        customizations: {
          title: description,
          description
        },
        meta: {
          userId: user.id,
          paymentId: payment.id,
          relatedEntity
        }
      };
      
      const flutterwaveResult = await flutterwaveService.initializePayment(flutterwavePayload);
      if (flutterwaveResult && flutterwaveResult.data) {
        providerData = {
          txRef: reference,
          link: flutterwaveResult.data.link
        };
      }
    }
  } catch (providerError) {
    console.warn('Provider initialization error:', providerError.message);
    // Continue without provider data - frontend can handle fallback
  }
  
  return {
    payment,
    providerData
  };
}

async function verifyPayment({ paymentId, userId, providerReference }) {
  const payment = await Payment.findByPk(paymentId);
  if (!payment) throw Object.assign(new Error('Payment not found'), { statusCode: 404 });
  if (payment.userId !== userId) throw Object.assign(new Error('Not authorized'), { statusCode: 403 });
  payment.status = 'completed';
  payment.metadata = { ...payment.metadata, providerReference };
  await payment.save();
  return payment;
}

async function cancelPayment({ paymentId, userId, reason }) {
  const payment = await Payment.findByPk(paymentId);
  if (!payment) throw Object.assign(new Error('Payment not found'), { statusCode: 404 });
  if (payment.userId !== userId) throw Object.assign(new Error('Not authorized'), { statusCode: 403 });
  payment.status = 'cancelled';
  payment.metadata = { ...payment.metadata, cancelReason: reason };
  await payment.save();
  return payment;
}

async function processRefund({ paymentId, amount, reason, processedBy }) {
  const payment = await Payment.findByPk(paymentId);
  if (!payment) throw Object.assign(new Error('Payment not found'), { statusCode: 404 });
  payment.status = 'refunded';
  payment.metadata = { ...payment.metadata, refundAmount: amount, refundReason: reason, refundedBy: processedBy };
  await payment.save();
  return payment;
}

async function getPaymentStats() {
  const total = await Payment.count();
  const completed = await Payment.count({ where: { status: 'completed' } });
  const refunded = await Payment.count({ where: { status: 'refunded' } });
  return { total, completed, refunded };
}

async function processWebhook({ provider, headers, payload }) {
  // Placeholder: provider-specific logic lives in provider modules
  return { provider, received: true };
}

async function createSubscription({ userId, plan, paymentId, trialDays = 7 }) {
  const now = new Date();
  const trialEndsAt = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);
  return Subscription.create({
    userId,
    plan,
    status: 'trial',
    startDate: now,
    trialEndsAt,
    paymentId
  });
}

async function getUserSubscriptions(userId) {
  return Subscription.findAll({ where: { userId }, order: [['createdAt', 'DESC']] });
}

async function updateSubscriptionStatus(id, status) {
  return Subscription.update({ status }, { where: { id } });
}

module.exports = {
  listUserPayments,
  getPaymentById,
  initializePayment,
  verifyPayment,
  cancelPayment,
  processRefund,
  getPaymentStats,
  processWebhook,
  createSubscription,
  getUserSubscriptions,
  updateSubscriptionStatus
};


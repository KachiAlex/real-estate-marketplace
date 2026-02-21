// Sequelize-only paymentService (clean, single source)
const db = require('../config/sequelizeDb');
const { Payment } = db;

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
  return payment;
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

module.exports = {
  listUserPayments,
  getPaymentById,
  initializePayment,
  verifyPayment,
  cancelPayment,
  processRefund,
  getPaymentStats,
  processWebhook
};


const { getFirestore, admin } = require('../config/firestore');
const notificationService = require('./notificationService');
const flutterwaveService = require('./flutterwaveService');
const paystackService = require('./paystackService');
const stripeService = require('./stripeService');

const COLLECTION = 'payments';

const ensureDb = () => {
  const db = getFirestore();
  if (!db) {
    throw new Error('Firestore not initialized');
  }
  return db;
};

const convertTimestamp = (value) => {
  if (!value) return value;
  return value.toDate ? value.toDate() : value;
};

const convertTimeline = (timeline = []) =>
  timeline.map((event) => ({
    ...event,
    timestamp: convertTimestamp(event.timestamp)
  }));

const convertPaymentDoc = (doc) => {
  if (!doc) return null;
  const data = doc.data ? doc.data() : doc;

  if (!data) {
    return null;
  }

  return {
    id: doc.id || data.id,
    ...data,
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
    timeline: convertTimeline(data.timeline),
    refund: data.refund
      ? {
          ...data.refund,
          processedAt: convertTimestamp(data.refund.processedAt)
        }
      : undefined,
    netAmount: data.amount - (data.fees?.totalFees || 0)
  };
};

const sanitizeFirestoreData = (value, fallback = null) => {
  const target = value ?? fallback;
  return JSON.parse(JSON.stringify(target));
};

const buildTimelineEvent = (status, description, metadata = {}) => ({
  status,
  description,
  metadata,
  timestamp: admin.firestore.Timestamp.now()
});

const resolveFlutterwaveIdentifier = (payment, overrideReference) => {
  const flutterwaveMetadata = payment.metadata?.flutterwave || {};
  return overrideReference
    || flutterwaveMetadata.txRef
    || flutterwaveMetadata.flwRef
    || flutterwaveMetadata.transactionId
    || payment.reference;
};

const generateId = (prefix) => `${prefix}${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

const calculateFees = (amount, paymentMethod) => {
  let platformFee = 0;
  let processingFee = 0;

  switch (paymentMethod) {
    case 'flutterwave':
    case 'paystack':
      platformFee = amount * 0.025;
      processingFee = amount * 0.015;
      break;
    case 'stripe':
      platformFee = amount * 0.025;
      processingFee = amount * 0.029;
      break;
    case 'bank_transfer':
      platformFee = amount * 0.025;
      processingFee = 0;
      break;
    default:
      platformFee = amount * 0.025;
      processingFee = amount * 0.015;
  }

  return {
    platformFee,
    processingFee,
    totalFees: platformFee + processingFee
  };
};

const addTimelineEvent = async (docRef, event) => {
  await docRef.update({
    timeline: admin.firestore.FieldValue.arrayUnion(event),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
};

const listUserPayments = async ({
  userId,
  status,
  paymentType,
  page = 1,
  limit = 20
}) => {
  const db = ensureDb();
  let query = db.collection(COLLECTION)
    .where('userId', '==', userId)
    .where('isActive', '==', true);

  if (status) {
    query = query.where('status', '==', status);
  }

  if (paymentType) {
    query = query.where('paymentType', '==', paymentType);
  }

  const offset = (Number(page) - 1) * Number(limit);
  const snapshot = await query
    .orderBy('createdAt', 'desc')
    .offset(offset)
    .limit(Number(limit))
    .get();

  const payments = snapshot.docs.map(convertPaymentDoc);

  const countSnap = await query.count().get();
  const totalItems = countSnap.data().count;
  const totalPages = Math.ceil(totalItems / Number(limit)) || 1;

  return {
    payments,
    pagination: {
      currentPage: Number(page),
      totalPages,
      totalItems,
      itemsPerPage: Number(limit),
      hasNextPage: Number(page) < totalPages,
      hasPrevPage: Number(page) > 1
    }
  };
};

const getPaymentById = async (paymentId) => {
  const db = ensureDb();
  const doc = await db.collection(COLLECTION).doc(paymentId).get();
  return doc.exists ? convertPaymentDoc(doc) : null;
};

const initializePayment = async ({
  user,
  amount,
  paymentMethod,
  paymentType,
  relatedEntity,
  description,
  currency = 'NGN'
}) => {
  const db = ensureDb();
  const fees = calculateFees(amount, paymentMethod);
  const transactionId = generateId('TXN');
  const reference = generateId('PAY');

  const docRef = db.collection(COLLECTION).doc();
  const paymentDoc = {
    userId: user.id,
    transactionId,
    reference,
    amount,
    currency,
    paymentMethod,
    paymentProvider: paymentMethod,
    paymentType,
    relatedEntity,
    description,
    fees,
    status: 'pending',
    metadata: {},
    timeline: [],
    isActive: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  await docRef.set(paymentDoc);

  await addTimelineEvent(docRef, buildTimelineEvent('pending', 'Payment initialized', { amount, paymentMethod, paymentType }));

  let providerResult = {};

  try {
    switch (paymentMethod) {
      case 'flutterwave':
        providerResult = await flutterwaveService.initializePayment({
          amount: amount + fees.totalFees,
          currency,
          reference,
          description,
          customer: {
            email: user.email,
            phone: user.phone,
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim()
          }
        });
        break;
      case 'paystack':
        providerResult = await paystackService.initializePayment({
          amount: (amount + fees.totalFees) * 100,
          currency,
          reference,
          email: user.email,
          metadata: {
            paymentId: docRef.id,
            userId: user.id
          }
        });
        break;
      case 'stripe':
        providerResult = await stripeService.createPaymentIntent({
          amount: Math.round((amount + fees.totalFees) * 100),
          currency: currency.toLowerCase(),
          metadata: {
            paymentId: docRef.id,
            userId: user.id
          }
        });
        break;
      case 'bank_transfer':
        providerResult = {
          success: true,
          data: {
            bankDetails: {
              bankName: 'PROPERTY ARK Bank',
              accountNumber: '1234567890',
              accountName: 'PROPERTY ARK Escrow Account'
            },
            reference,
            amount: amount + fees.totalFees
          }
        };
        break;
      default:
        throw new Error('Unsupported payment method');
    }

    if (!providerResult.success) {
      throw new Error(providerResult.message || 'Failed to initialize payment');
    }

    const providerMetadata = { ...paymentDoc.metadata };
    const cleanedProviderData = sanitizeFirestoreData(providerResult.data, {});
    providerMetadata[paymentMethod] = cleanedProviderData;

    await docRef.update({
      metadata: providerMetadata,
      status: 'processing',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const providerDataForTimeline = sanitizeFirestoreData(providerResult.data, {});

    await addTimelineEvent(docRef, buildTimelineEvent('processing', 'Payment processing initiated', {
      provider: paymentMethod,
      providerData: providerDataForTimeline
    }));

    const updated = await docRef.get();
    return {
      payment: convertPaymentDoc(updated),
      providerData: providerResult.data
    };
  } catch (error) {
    await docRef.update({
      status: 'failed',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    await addTimelineEvent(docRef, buildTimelineEvent('failed', 'Payment initialization failed', {
      error: error.message
    }));

    throw error;
  }
};

const verifyPayment = async ({
  paymentId,
  userId,
  providerReference
}) => {
  const db = ensureDb();
  const docRef = db.collection(COLLECTION).doc(paymentId);
  const snapshot = await docRef.get();

  if (!snapshot.exists) {
    throw Object.assign(new Error('Payment not found'), { statusCode: 404 });
  }

  const payment = convertPaymentDoc(snapshot);

  if (payment.userId !== userId) {
    throw Object.assign(new Error('Not authorized to verify this payment'), { statusCode: 403 });
  }

  if (!['processing', 'pending'].includes(payment.status)) {
    throw Object.assign(new Error('Payment is not in a verifiable status'), { statusCode: 400 });
  }

  let verificationResult = {};

  switch (payment.paymentProvider) {
    case 'flutterwave': {
      const identifier = resolveFlutterwaveIdentifier(payment, providerReference);
      verificationResult = await flutterwaveService.verifyPayment(identifier);
      break;
    }
    case 'paystack':
      verificationResult = await paystackService.verifyPayment(
        providerReference || payment.reference
      );
      break;
    case 'stripe':
      verificationResult = await stripeService.verifyPayment(
        payment.metadata.stripe?.paymentIntentId
      );
      break;
    case 'bank_transfer':
      verificationResult = {
        success: true,
        data: {
          status: 'success',
          amount: payment.amount + (payment.fees?.totalFees || 0)
        }
      };
      break;
    default:
      throw new Error('Unsupported payment provider');
  }

  if (!verificationResult.success) {
    await addTimelineEvent(docRef, buildTimelineEvent(payment.status, 'Payment verification attempt failed', {
      provider: payment.paymentProvider,
      error: verificationResult.message || 'Unknown verification error'
    }));

    throw Object.assign(new Error(verificationResult.message || 'Failed to verify payment'), { statusCode: 400 });
  }

  const providerStatusRaw = verificationResult.data?.status || '';
  const providerStatus = providerStatusRaw.toString().toLowerCase();
  const isSuccess = ['success', 'successful', 'completed'].includes(providerStatus);
  const isPending = ['pending', 'processing'].includes(providerStatus);

  const verificationDataForTimeline = sanitizeFirestoreData(verificationResult.data, {});

  let targetStatus = payment.status;
  let timelineDescription = 'Payment verification result received';

  if (isSuccess) {
    targetStatus = 'completed';
    timelineDescription = 'Payment verified and completed';
  } else if (isPending) {
    targetStatus = 'processing';
    timelineDescription = 'Payment still processing with provider';
  } else {
    targetStatus = 'failed';
    timelineDescription = 'Payment verification failed';
  }

  const updatePayload = {
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  if (targetStatus !== payment.status) {
    updatePayload.status = targetStatus;
  }

  await docRef.update(updatePayload);

  await addTimelineEvent(docRef, buildTimelineEvent(targetStatus, timelineDescription, {
    provider: payment.paymentProvider,
    verificationData: verificationDataForTimeline
  }));

  if (isSuccess) {
    await notificationService.createNotification({
      recipient: payment.userId,
      sender: null,
      type: 'payment_received',
      title: 'Payment Successful',
      message: `Your payment of ₦${payment.amount.toLocaleString()} has been processed successfully`,
      data: {
        paymentId,
        amount: payment.amount,
        paymentType: payment.paymentType
      }
    });
  }

  const updated = await docRef.get();
  const updatedPayment = convertPaymentDoc(updated);

  if (isSuccess || isPending) {
    return updatedPayment;
  }

  throw Object.assign(new Error('Payment was not successful on Flutterwave'), { statusCode: 400 });
};

const cancelPayment = async ({ paymentId, userId, reason }) => {
  const db = ensureDb();
  const docRef = db.collection(COLLECTION).doc(paymentId);
  const snapshot = await docRef.get();

  if (!snapshot.exists) {
    throw Object.assign(new Error('Payment not found'), { statusCode: 404 });
  }

  const payment = convertPaymentDoc(snapshot);
  if (payment.userId !== userId) {
    throw Object.assign(new Error('Not authorized to cancel this payment'), { statusCode: 403 });
  }

  if (!['pending', 'processing'].includes(payment.status)) {
    throw Object.assign(new Error('Payment cannot be cancelled in current status'), { statusCode: 400 });
  }

  await docRef.update({
    status: 'cancelled',
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  await addTimelineEvent(docRef, buildTimelineEvent('cancelled', 'Payment cancelled by user', { reason }));

  const updated = await docRef.get();
  return convertPaymentDoc(updated);
};

const processRefund = async ({ paymentId, amount, reason, processedBy }) => {
  const db = ensureDb();
  const docRef = db.collection(COLLECTION).doc(paymentId);
  const snapshot = await docRef.get();

  if (!snapshot.exists) {
    throw Object.assign(new Error('Payment not found'), { statusCode: 404 });
  }

  const payment = convertPaymentDoc(snapshot);

  if (payment.status !== 'completed') {
    throw Object.assign(new Error('Only completed payments can be refunded'), { statusCode: 400 });
  }

  if (amount > payment.amount) {
    throw Object.assign(new Error('Refund amount cannot exceed original payment amount'), { statusCode: 400 });
  }

  const refundData = {
    amount,
    reason,
    processedBy,
    processedAt: admin.firestore.FieldValue.serverTimestamp(),
    refundReference: generateId('REF')
  };

  await docRef.update({
    status: 'refunded',
    refund: refundData,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  await addTimelineEvent(docRef, buildTimelineEvent('refunded', `Payment refunded: ${reason}`, {
    refundAmount: amount,
    reason
  }));

  await notificationService.createNotification({
    recipient: payment.userId,
    sender: processedBy,
    type: 'payment_failed',
    title: 'Payment Refunded',
    message: `Your payment of ₦${amount.toLocaleString()} has been refunded: ${reason}`,
    data: {
      paymentId,
      refundAmount: amount,
      reason
    }
  });

  const updated = await docRef.get();
  return convertPaymentDoc(updated);
};

const getPaymentStats = async () => {
  const db = ensureDb();
  const overviewSnapshot = await db.collection(COLLECTION).get();
  const payments = overviewSnapshot.docs.map((doc) => doc.data());

  const overview = payments.reduce((acc, payment) => {
    acc.totalPayments += 1;
    acc.totalAmount += payment.amount || 0;
    acc.totalFees += payment.fees?.totalFees || 0;
    acc.completedPayments += payment.status === 'completed' ? 1 : 0;
    acc.failedPayments += payment.status === 'failed' ? 1 : 0;
    acc.pendingPayments += payment.status === 'pending' ? 1 : 0;
    return acc;
  }, {
    totalPayments: 0,
    totalAmount: 0,
    totalFees: 0,
    completedPayments: 0,
    failedPayments: 0,
    pendingPayments: 0
  });

  const monthlyStatsMap = new Map();
  payments.forEach((payment) => {
    const createdAt = payment.createdAt?.toDate ? payment.createdAt.toDate() : payment.createdAt;
    if (!createdAt) return;
    const key = `${createdAt.getFullYear()}-${createdAt.getMonth() + 1}`;
    const record = monthlyStatsMap.get(key) || { year: createdAt.getFullYear(), month: createdAt.getMonth() + 1, count: 0, totalAmount: 0, totalFees: 0 };
    record.count += 1;
    record.totalAmount += payment.amount || 0;
    record.totalFees += payment.fees?.totalFees || 0;
    monthlyStatsMap.set(key, record);
  });

  const monthlyStats = Array.from(monthlyStatsMap.values())
    .sort((a, b) => (b.year - a.year) || (b.month - a.month))
    .slice(0, 12);

  return {
    overview,
    monthlyStats
  };
};

const processWebhook = async ({ provider, headers, payload }) => {
  const db = ensureDb();
  let isValidWebhook = false;

  switch (provider) {
    case 'flutterwave':
      isValidWebhook = flutterwaveService.verifyWebhook(headers, payload);
      break;
    case 'paystack':
      isValidWebhook = paystackService.verifyWebhook(headers, payload);
      break;
    case 'stripe':
      isValidWebhook = stripeService.verifyWebhook(headers, payload);
      break;
    default:
      throw Object.assign(new Error('Invalid payment provider'), { statusCode: 400 });
  }

  if (!isValidWebhook) {
    throw Object.assign(new Error('Invalid webhook signature'), { statusCode: 400 });
  }

  let paymentRef = null;
  let status = 'failed';
  let lookupField = 'reference';

  switch (provider) {
    case 'flutterwave':
      paymentRef = payload.tx_ref;
      status = payload.status === 'successful' ? 'completed' : 'failed';
      lookupField = 'reference';
      break;
    case 'paystack':
      paymentRef = payload.data?.reference;
      status = payload.data?.status === 'success' ? 'completed' : 'failed';
      lookupField = 'reference';
      break;
    case 'stripe':
      paymentRef = payload.data?.object?.id;
      status = payload.data?.object?.status === 'succeeded' ? 'completed' : 'failed';
      lookupField = 'metadata.stripe.paymentIntentId';
      break;
  }

  if (!paymentRef) {
    return { processed: false };
  }

  let paymentDoc = null;

  if (lookupField === 'reference') {
    const snapshot = await db.collection(COLLECTION)
      .where('reference', '==', paymentRef)
      .limit(1)
      .get();
    if (!snapshot.empty) {
      paymentDoc = { ref: snapshot.docs[0].ref, data: convertPaymentDoc(snapshot.docs[0]) };
    }
  } else {
    const snapshot = await db.collection(COLLECTION)
      .where('metadata.stripe.paymentIntentId', '==', paymentRef)
      .limit(1)
      .get();
    if (!snapshot.empty) {
      paymentDoc = { ref: snapshot.docs[0].ref, data: convertPaymentDoc(snapshot.docs[0]) };
    }
  }

  if (!paymentDoc || paymentDoc.data.status !== 'processing') {
    return { processed: false };
  }

  await paymentDoc.ref.update({
    status,
    webhookData: payload,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  await addTimelineEvent(paymentDoc.ref, buildTimelineEvent(status, `Payment ${status} via webhook`, {
    provider,
    webhookData: payload
  }));

  const notificationType = status === 'completed' ? 'payment_received' : 'payment_failed';
  const title = status === 'completed' ? 'Payment Successful' : 'Payment Failed';
  const message = status === 'completed'
    ? `Your payment of ₦${paymentDoc.data.amount.toLocaleString()} has been processed successfully`
    : `Your payment of ₦${paymentDoc.data.amount.toLocaleString()} failed to process`;

  await notificationService.createNotification({
    recipient: paymentDoc.data.userId,
    sender: null,
    type: notificationType,
    title,
    message,
    data: {
      paymentId: paymentDoc.ref.id,
      amount: paymentDoc.data.amount,
      paymentType: paymentDoc.data.paymentType
    }
  });

  return { processed: true };
};

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

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

async function getPaymentByReference(reference) {
  if (!reference) return null;
  return Payment.findOne({ where: { reference } });
}

async function createVerificationPaymentRecord({ reference, userId, amount, propertyId, provider = 'paystack', metadata = {} }) {
  if (!reference || !userId) {
    return null;
  }

  const existing = await getPaymentByReference(reference);
  if (existing) {
    return existing;
  }

  const safeAmount = Number(amount || 0);

  return Payment.create({
    userId,
    propertyId: propertyId || null,
    amount: safeAmount,
    currency: 'NGN',
    paymentType: 'property_verification',
    status: 'completed',
    provider,
    reference,
    metadata: {
      ...(metadata || {}),
      autoCreatedAt: new Date().toISOString(),
      autoCreatedReason: 'verification_payment_fallback'
    }
  });
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
      
      console.log('PaymentService: Initializing Paystack payment with payload:', paystackPayload);
      const paystackResult = await paystackService.initializePayment(paystackPayload);
      console.log('PaymentService: Paystack result:', paystackResult);
      
      if (paystackResult && paystackResult.success && paystackResult.data) {
        providerData = {
          txRef: paystackResult.data.reference || reference,
          authorizationUrl: paystackResult.data.authorizationUrl,
          accessCode: paystackResult.data.accessCode
        };
        console.log('PaymentService: Provider data set from Paystack API:', providerData);
      } else {
        console.warn('PaymentService: Paystack backend initialization failed, using client-side fallback:', paystackResult);
        // Fallback: Return a marker that tells frontend to use client-side Paystack SDK
        // The frontend will use initializePaystackPayment with the reference
        providerData = {
          txRef: reference,
          authorizationUrl: `paystack-client-side:${reference}`, // Special marker for client-side handling
          isClientSideFallback: true
        };
        console.log('PaymentService: Using client-side fallback for Paystack');
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
    console.error('PaymentService: Provider initialization error:', providerError.message);
    console.error('PaymentService: Provider error details:', providerError);
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
  if (!payment) {
    const error = new Error('Payment not found');
    error.statusCode = 404;
    throw error;
  }
  
  if (!amount || amount <= 0) {
    const error = new Error('Refund amount must be greater than 0');
    error.statusCode = 400;
    throw error;
  }
  
  if (amount > payment.amount) {
    const error = new Error('Refund amount exceeds payment amount');
    error.statusCode = 400;
    throw error;
  }
  
  // Call Paystack refund API
  if (payment.provider === 'paystack' && payment.reference) {
    console.log(`[REFUND] Processing Paystack refund for ${payment.reference}`);
    
    const refundResult = await paystackService.refundPayment(payment.reference, amount);
    if (!refundResult.success) {
      const error = new Error('Refund failed: ' + refundResult.message);
      error.statusCode = 400;
      throw error;
    }
    
    console.log(`[REFUND] Paystack refund successful: ${refundResult.data?.reference}`);
  }
  
  // Update payment record
  payment.status = 'refunded';
  payment.metadata = {
    ...payment.metadata,
    refundAmount: amount,
    refundReason: reason,
    refundedBy: processedBy,
    refundedAt: new Date().toISOString()
  };
  await payment.save();
  
  console.log(`[REFUND] Payment ${paymentId} marked as refunded`);
  
  // If escrow, mark as cancelled
  if (payment.paymentType === 'escrow') {
    const escrowId = payment.metadata?.relatedEntity?.id;
    if (escrowId) {
      const escrow = await db.EscrowTransaction?.findByPk(escrowId);
      if (escrow) {
        await escrow.update({ 
          status: 'cancelled', 
          cancelledAt: new Date()
        });
        
        console.log(`[REFUND] Escrow ${escrowId} marked as cancelled`);
        
        // Notify buyer
        try {
          await db.Notification?.create({
            recipientId: payment.userId,
            type: 'escrow_cancelled',
            title: 'Escrow Cancelled',
            message: `Escrow has been cancelled. Refund of ₦${amount?.toLocaleString() || 0} has been processed.`,
            data: { escrowId }
          });
        } catch (e) {
          console.warn('[REFUND] Failed to notify buyer:', e.message);
        }
        
        // Notify seller
        try {
          await db.Notification?.create({
            recipientId: escrow.sellerId,
            type: 'escrow_cancelled',
            title: 'Escrow Cancelled',
            message: 'The escrow for your property has been cancelled by the buyer.',
            data: { escrowId }
          });
        } catch (e) {
          console.warn('[REFUND] Failed to notify seller:', e.message);
        }
      }
    }
  }
  
  return payment;
}

async function getPaymentStats() {
  const total = await Payment.count();
  const completed = await Payment.count({ where: { status: 'completed' } });
  const refunded = await Payment.count({ where: { status: 'refunded' } });
  return { total, completed, refunded };
}

async function processWebhook({ provider, headers, payload }) {
  try {
    console.log(`[WEBHOOK] Processing ${provider} webhook`);
    
    // 1. SIGNATURE VERIFICATION
    let isValid = false;
    
    if (provider === 'paystack') {
      isValid = paystackService.verifyWebhook(headers, payload);
    }
    
    if (!isValid) {
      console.warn(`[WEBHOOK] Invalid signature for ${provider}`);
      const error = new Error('Webhook signature invalid');
      error.statusCode = 401;
      throw error;
    }
    
    // 2. EXTRACT REFERENCE AND STATUS
    let reference, status, amount;
    
    if (provider === 'paystack') {
      reference = payload.data?.reference;
      status = payload.data?.status;
      amount = payload.data?.amount / 100; // Convert from kobo
    }
    
    if (!reference) {
      console.warn('[WEBHOOK] No reference in webhook payload');
      return { success: true, alreadyProcessed: true };
    }
    
    console.log(`[WEBHOOK] Reference: ${reference}, Status: ${status}, Amount: ${amount}`);
    
    // 3. FIND PAYMENT
    const payment = await Payment.findOne({ where: { reference } });
    
    if (!payment) {
      console.warn(`[WEBHOOK] Payment not found for reference: ${reference}`);
      return { success: true, alreadyProcessed: true };
    }
    
    // If already processed, return success
    if (payment.status === 'completed') {
      console.log(`[WEBHOOK] Payment already processed: ${payment.id}`);
      return { success: true, alreadyProcessed: true };
    }
    
    // 4. UPDATE PAYMENT STATUS
    if (status === 'success') {
      payment.status = 'completed';
      payment.metadata = {
        ...payment.metadata,
        webhookReceived: true,
        webhookAmount: amount,
        webhookReceivedAt: new Date().toISOString(),
        webhookStatus: status
      };
      await payment.save();
      
      console.log(`[WEBHOOK] Payment marked completed: ${payment.id}`);
      
      // 5. HANDLE BY PAYMENT TYPE
      switch (payment.paymentType) {
        case 'escrow': {
          const escrowId = payment.metadata?.relatedEntity?.id;
          if (escrowId) {
            const escrow = await db.EscrowTransaction.findByPk(escrowId);
            if (escrow) {
              await escrow.update({
                status: 'funded',
                fundedAt: new Date()
              });
              
              console.log(`[WEBHOOK] Escrow ${escrowId} marked funded`);
              
              // Notify seller
              try {
                await db.Notification?.create({
                  recipientId: escrow.sellerId,
                  type: 'escrow_funded',
                  title: 'Escrow Payment Received',
                  message: `Buyer has completed payment of ₦${amount?.toLocaleString() || 0}. Please upload required documents.`,
                  data: { escrowId },
                  priority: 'high'
                });
              } catch (e) {
                console.warn('[WEBHOOK] Failed to create seller notification:', e.message);
              }
            }
          }
          break;
        }
        
        case 'investment': {
          const investmentId = payment.metadata?.relatedEntity?.id;
          if (investmentId) {
            const investment = await db.Investment?.findByPk(investmentId);
            if (investment && db.UserInvestment) {
              const userInvestment = await db.UserInvestment.create({
                userId: payment.userId,
                investmentId,
                amount,
                status: 'active',
                investmentDate: new Date()
              });
              
              console.log(`[WEBHOOK] User investment created: ${userInvestment.id}`);
            }
          }
          break;
        }
        
        case 'vendor_listing': {
          const propertyId = payment.metadata?.relatedEntity?.id;
          if (propertyId) {
            const property = await db.Property?.findByPk(propertyId);
            if (property) {
              await property.update({
                status: 'listed',
                listedAt: new Date()
              });
              
              console.log(`[WEBHOOK] Property ${propertyId} marked listed`);
            }
          }
          break;
        }
        
        case 'subscription': {
          const userId = payment.userId;
          const plan = payment.metadata?.plan;
          
          if (db.Subscription) {
            const subscription = await db.Subscription.create({
              userId,
              plan,
              status: 'active',
              startDate: new Date(),
              renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            });
            
            console.log(`[WEBHOOK] Subscription created: ${subscription.id}`);
          }
          break;
        }
      }
      
      // 6. NOTIFY USER
      try {
        await db.Notification?.create({
          recipientId: payment.userId,
          type: 'payment_success',
          title: 'Payment Successful',
          message: `Payment of ₦${amount?.toLocaleString() || 0} has been received`,
          data: { paymentId: payment.id }
        });
      } catch (e) {
        console.warn('[WEBHOOK] Failed to create user notification:', e.message);
      }
      
    } else if (status === 'failed') {
      payment.status = 'failed';
      payment.metadata = {
        ...payment.metadata,
        failureReason: payload.data?.gateway_response || 'Payment failed',
        failureData: payload.data
      };
      await payment.save();
      
      console.log(`[WEBHOOK] Payment marked failed: ${payment.id}`);
      
      // Mark escrow as failed if this was an escrow payment
      if (payment.paymentType === 'escrow') {
        const escrowId = payment.metadata?.relatedEntity?.id;
        if (escrowId) {
          const escrow = await db.EscrowTransaction.findByPk(escrowId);
          if (escrow && escrow.status === 'pending') {
            await escrow.update({
              status: 'failed'
            });
            
            console.log(`[WEBHOOK] Escrow ${escrowId} marked failed due to payment failure`);
            
            // Notify buyer
            try {
              await db.Notification?.create({
                recipientId: escrow.buyerId,
                type: 'escrow_payment_failed',
                title: 'Escrow Payment Failed',
                message: `Your payment for escrow transaction failed. Please try again.`,
                data: { escrowId, paymentId: payment.id }
              });
            } catch (e) {
              console.warn('[WEBHOOK] Failed to create buyer failure notification:', e.message);
            }
            
            // Notify seller
            try {
              await db.Notification?.create({
                recipientId: escrow.sellerId,
                type: 'escrow_payment_failed',
                title: 'Buyer Payment Failed',
                message: `The buyer's payment for the escrow transaction has failed.`,
                data: { escrowId }
              });
            } catch (e) {
              console.warn('[WEBHOOK] Failed to create seller failure notification:', e.message);
            }
          }
        }
      }
      
      try {
        await db.Notification?.create({
          recipientId: payment.userId,
          type: 'payment_failed',
          title: 'Payment Failed',
          message: 'Your payment could not be processed. Please try again.',
          data: { paymentId: payment.id }
        });
      } catch (e) {
        console.warn('[WEBHOOK] Failed to create failure notification:', e.message);
      }
    }
    
    return { success: true, processed: true };
    
  } catch (error) {
    console.error('[WEBHOOK] Error processing webhook:', error.message);
    // Still return success to prevent Paystack retry
    return { success: true, error: error.message };
  }
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
  getPaymentByReference,
  createVerificationPaymentRecord,
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


const express = require('express');
const router = express.Router();
const { verifyPaystackTransaction } = require('../services/paystack');

// POST /api/payment/verify
router.post('/verify', async (req, res) => {
  const { reference } = req.body;
  if (!reference) return res.status(400).json({ success: false, message: 'Reference required' });
  try {
    const paystackData = await verifyPaystackTransaction(reference);
    // Store payment record in DB
    const Payment = require('../models/Payment');
    const userId = paystackData.customer?.id || null;
    const paymentRecord = await Payment.findOneAndUpdate(
      { reference },
      {
        userId,
        transactionId: paystackData.id,
        reference: paystackData.reference,
        amount: paystackData.amount / 100,
        currency: paystackData.currency,
        paymentMethod: 'paystack',
        paymentProvider: 'paystack',
        status: paystackData.status === 'success' ? 'completed' : 'failed',
        paymentType: paystackData.metadata?.paymentType || 'escrow',
        relatedEntity: paystackData.metadata?.relatedEntity || {},
        description: paystackData.metadata?.description || '',
        metadata: { paystack: paystackData },
        $push: {
          timeline: {
            status: paystackData.status === 'success' ? 'completed' : 'failed',
            description: `Paystack payment verification: ${paystackData.status}`,
            timestamp: new Date(),
            metadata: paystackData
          }
        }
      },
      { upsert: true, new: true }
    );
    res.json({ success: true, data: paystackData, payment: paymentRecord });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

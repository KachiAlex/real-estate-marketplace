const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

class StripeService {
  constructor() {
    this.publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
    this.secretKey = process.env.STRIPE_SECRET_KEY;
  }

  async createPaymentIntent(paymentData) {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: paymentData.amount,
        currency: paymentData.currency,
        metadata: paymentData.metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return {
        success: true,
        data: {
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency
        }
      };
    } catch (error) {
      console.error('Stripe payment intent creation error:', error);
      return {
        success: false,
        message: error.message || 'Failed to create payment intent'
      };
    }
  }

  async verifyPayment(paymentIntentId) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      return {
        success: true,
        data: {
          status: paymentIntent.status === 'succeeded' ? 'success' : 'failed',
          amount: paymentIntent.amount / 100, // Convert from cents
          currency: paymentIntent.currency,
          paymentIntentId: paymentIntent.id,
          charges: paymentIntent.charges
        }
      };
    } catch (error) {
      console.error('Stripe payment verification error:', error);
      return {
        success: false,
        message: error.message || 'Payment verification failed'
      };
    }
  }

  verifyWebhook(headers, payload) {
    try {
      const signature = headers['stripe-signature'];
      const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
      
      if (!signature || !endpointSecret) {
        return false;
      }

      // Verify webhook signature
      const event = stripe.webhooks.constructEvent(payload, signature, endpointSecret);
      return !!event;
    } catch (error) {
      console.error('Stripe webhook verification error:', error);
      return false;
    }
  }

  async refundPayment(paymentIntentId, amount) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount * 100, // Convert to cents
      });

      return {
        success: true,
        data: refund
      };
    } catch (error) {
      console.error('Stripe refund error:', error);
      return {
        success: false,
        message: error.message || 'Refund failed'
      };
    }
  }

  async createCustomer(customerData) {
    try {
      const customer = await stripe.customers.create({
        email: customerData.email,
        name: customerData.name,
        phone: customerData.phone,
        metadata: customerData.metadata
      });

      return {
        success: true,
        data: customer
      };
    } catch (error) {
      console.error('Stripe customer creation error:', error);
      return {
        success: false,
        message: error.message || 'Failed to create customer'
      };
    }
  }

  async createSetupIntent(customerId) {
    try {
      const setupIntent = await stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ['card'],
      });

      return {
        success: true,
        data: setupIntent
      };
    } catch (error) {
      console.error('Stripe setup intent creation error:', error);
      return {
        success: false,
        message: error.message || 'Failed to create setup intent'
      };
    }
  }
}

module.exports = new StripeService();

const axios = require('axios');

class PaystackService {
  constructor() {
    this.baseURL = 'https://api.paystack.co';
    this.publicKey = process.env.PAYSTACK_PUBLIC_KEY;
    this.secretKey = process.env.PAYSTACK_SECRET_KEY;
  }

  async initializePayment(paymentData) {
    try {
      const payload = {
        amount: paymentData.amount,
        email: paymentData.email,
        reference: paymentData.reference,
        currency: paymentData.currency,
        metadata: paymentData.metadata,
        callback_url: `${process.env.CLIENT_URL}/payment/callback`,
        channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer']
      };

      const response = await axios.post(`${this.baseURL}/transaction/initialize`, payload, {
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.status) {
        return {
          success: true,
          data: {
            authorizationUrl: response.data.data.authorization_url,
            accessCode: response.data.data.access_code,
            reference: response.data.data.reference
          }
        };
      } else {
        return {
          success: false,
          message: response.data.message || 'Failed to initialize payment'
        };
      }
    } catch (error) {
      console.error('Paystack payment initialization error:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Payment initialization failed'
      };
    }
  }

  async verifyPayment(reference) {
    try {
      const response = await axios.get(`${this.baseURL}/transaction/verify/${reference}`, {
        headers: {
          Authorization: `Bearer ${this.secretKey}`
        }
      });

      if (response.data.status) {
        const transaction = response.data.data;
        return {
          success: true,
          data: {
            status: transaction.status === 'success' ? 'success' : 'failed',
            amount: transaction.amount / 100, // Convert from kobo
            currency: transaction.currency,
            reference: transaction.reference,
            customer: transaction.customer,
            authorization: transaction.authorization
          }
        };
      } else {
        return {
          success: false,
          message: response.data.message || 'Payment verification failed'
        };
      }
    } catch (error) {
      console.error('Paystack payment verification error:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Payment verification failed'
      };
    }
  }

  verifyWebhook(headers, payload) {
    try {
      const signature = headers['x-paystack-signature'];
      const secret = process.env.PAYSTACK_SECRET_KEY;
      
      if (!signature || !secret) {
        return false;
      }

      // Simple verification - in production, use proper HMAC verification
      const crypto = require('crypto');
      const hash = crypto.createHmac('sha512', secret).update(JSON.stringify(payload)).digest('hex');
      
      return hash === signature;
    } catch (error) {
      console.error('Paystack webhook verification error:', error);
      return false;
    }
  }

  async refundPayment(reference, amount) {
    try {
      const payload = {
        transaction: reference,
        amount: amount * 100 // Convert to kobo
      };

      const response = await axios.post(`${this.baseURL}/refund`, payload, {
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.status) {
        return {
          success: true,
          data: response.data.data
        };
      } else {
        return {
          success: false,
          message: response.data.message || 'Refund failed'
        };
      }
    } catch (error) {
      console.error('Paystack refund error:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Refund failed'
      };
    }
  }

  // Initialize subscription payment
  async initializeSubscriptionPayment(subscriptionData) {
    try {
      const { vendor, plan, payment, callbackUrl } = subscriptionData;
      
      const payload = {
        amount: plan.amount * 100, // Convert to kobo
        email: vendor.email,
        reference: payment.transactionReference || `sub_${Date.now()}_${vendor.id.slice(0, 8)}`,
        currency: plan.currency || 'NGN',
        metadata: {
          vendorId: vendor.id,
          subscriptionId: payment.subscriptionId,
          paymentId: payment.id,
          planId: plan.id,
          planName: plan.name,
          billingCycle: plan.billingCycle,
          custom_fields: [
            {
              display_name: "Subscription Type",
              variable_name: "subscription_type",
              value: "vendor_monthly"
            },
            {
              display_name: "Vendor Name",
              variable_name: "vendor_name",
              value: `${vendor.firstName} ${vendor.lastName}`
            }
          ]
        },
        callback_url: callbackUrl || `${process.env.CLIENT_URL}/subscription/payment/verify`,
        channels: ['card', 'bank', 'ussd', 'bank_transfer']
      };

      const response = await axios.post(`${this.baseURL}/transaction/initialize`, payload, {
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.status) {
        // Update payment with Paystack reference
        await require('./subscriptionService').updatePaymentReference(
          payment.id, 
          response.data.data.reference
        );

        return {
          success: true,
          data: {
            authorizationUrl: response.data.data.authorization_url,
            accessCode: response.data.data.access_code,
            reference: response.data.data.reference,
            payment
          }
        };
      } else {
        return {
          success: false,
          message: response.data.message || 'Failed to initialize subscription payment'
        };
      }
    } catch (error) {
      console.error('Paystack subscription payment initialization error:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Subscription payment initialization failed'
      };
    }
  }

  // Create recurring subscription (for future auto-renewal)
  async createRecurringSubscription(subscriptionData) {
    try {
      const { vendor, plan, payment } = subscriptionData;
      
      const payload = {
        customer: {
          email: vendor.email,
          first_name: vendor.firstName,
          last_name: vendor.lastName
        },
        plan: {
          name: plan.name,
          amount: plan.amount * 100, // Convert to kobo
          interval: 'monthly',
          currency: plan.currency || 'NGN'
        },
        authorization: {
          card: {
            number: "4084084084084081",
            cvv: "408",
            expiry_month: "12",
            expiry_year: "2030"
          }
        }
      };

      // This would be for future auto-renewal implementation
      // For now, we'll handle manual renewals
      return {
        success: true,
        message: 'Recurring subscription setup not yet implemented',
        data: null
      };
    } catch (error) {
      console.error('Paystack recurring subscription error:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Recurring subscription setup failed'
      };
    }
  }

  // Handle Paystack webhook events
  async handleWebhookEvent(event, data) {
    try {
      switch (event) {
        case 'charge.success':
          // Process successful subscription payment
          if (data.metadata?.subscriptionId) {
            await require('./subscriptionService').processSuccessfulPayment(
              data.reference,
              data
            );
          }
          break;
        
        case 'charge.failed':
          // Handle failed payment
          if (data.metadata?.subscriptionId) {
            await require('./subscriptionService').processFailedPayment(
              data.reference,
              data
            );
          }
          break;
        
        case 'subscription.disable':
          // Handle subscription cancellation
          if (data.subscription_code) {
            await require('./subscriptionService').cancelSubscription(
              data.subscription_code
            );
          }
          break;
        
        default:
          console.log(`Unhandled webhook event: ${event}`);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Paystack webhook handling error:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new PaystackService();

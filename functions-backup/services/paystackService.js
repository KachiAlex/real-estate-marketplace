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
}

module.exports = new PaystackService();

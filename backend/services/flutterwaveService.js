const axios = require('axios');

class FlutterwaveService {
  constructor() {
    this.baseURL = 'https://api.flutterwave.com/v3';
    this.publicKey = process.env.FLUTTERWAVE_PUBLIC_KEY;
    this.secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
    this.encryptionKey = process.env.FLUTTERWAVE_ENCRYPTION_KEY;
  }

  async initializePayment(paymentData) {
    try {
      const payload = {
        tx_ref: paymentData.reference,
        amount: paymentData.amount,
        currency: paymentData.currency,
        redirect_url: `${process.env.CLIENT_URL}/payment/callback`,
        customer: {
          email: paymentData.customer.email,
          phonenumber: paymentData.customer.phone,
          name: paymentData.customer.name
        },
        customizations: {
          title: 'PROPERTY ARK',
          description: paymentData.description,
          logo: 'https://propertyark.com/logo.png'
        }
      };

      const response = await axios.post(`${this.baseURL}/payments`, payload, {
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.status === 'success') {
        return {
          success: true,
          data: {
            authorizationUrl: response.data.data.link,
            flwRef: response.data.data.flw_ref,
            txRef: response.data.data.tx_ref
          }
        };
      } else {
        return {
          success: false,
          message: response.data.message || 'Failed to initialize payment'
        };
      }
    } catch (error) {
      console.error('Flutterwave payment initialization error:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Payment initialization failed'
      };
    }
  }

  async verifyPayment(transactionId) {
    try {
      const response = await axios.get(`${this.baseURL}/transactions/${transactionId}/verify`, {
        headers: {
          Authorization: `Bearer ${this.secretKey}`
        }
      });

      if (response.data.status === 'success') {
        const transaction = response.data.data;
        return {
          success: true,
          data: {
            status: transaction.status === 'successful' ? 'success' : 'failed',
            amount: transaction.amount,
            currency: transaction.currency,
            reference: transaction.tx_ref,
            flwRef: transaction.flw_ref,
            customer: transaction.customer
          }
        };
      } else {
        return {
          success: false,
          message: response.data.message || 'Payment verification failed'
        };
      }
    } catch (error) {
      console.error('Flutterwave payment verification error:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Payment verification failed'
      };
    }
  }

  verifyWebhook(headers, payload) {
    try {
      const signature = headers['verif-hash'];
      const secretHash = process.env.FLUTTERWAVE_SECRET_HASH;
      
      if (!signature || !secretHash) {
        return false;
      }

      // Simple verification - in production, use proper HMAC verification
      return signature === secretHash;
    } catch (error) {
      console.error('Flutterwave webhook verification error:', error);
      return false;
    }
  }

  async refundPayment(transactionId, amount) {
    try {
      const payload = {
        amount: amount
      };

      const response = await axios.post(`${this.baseURL}/transactions/${transactionId}/refund`, payload, {
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.status === 'success') {
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
      console.error('Flutterwave refund error:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Refund failed'
      };
    }
  }
}

module.exports = new FlutterwaveService();



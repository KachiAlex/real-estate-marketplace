const axios = require('axios');

class FlutterwaveService {
  constructor() {
    this.baseURL = 'https://api.flutterwave.com/v3';
    this.publicKey = process.env.FLUTTERWAVE_PUBLIC_KEY;
    this.secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
    this.encryptionKey = process.env.FLUTTERWAVE_ENCRYPTION_KEY;
    this.clientUrl = this.resolveClientUrl();
  }

  normalizeTransaction(transaction) {
    if (!transaction) return null;

    return {
      status: transaction.status === 'successful' ? 'success' : transaction.status || 'failed',
      amount: transaction.amount,
      currency: transaction.currency,
      reference: transaction.tx_ref,
      flwRef: transaction.flw_ref,
      transactionId: transaction.id?.toString?.() || `${transaction.id}`,
      customer: transaction.customer
    };
  }

  resolveClientUrl() {
    const fallback = 'https://real-estate-marketplace-37544.web.app';
    const configured = process.env.CLIENT_URL
      || process.env.FRONTEND_URL
      || process.env.PUBLIC_URL
      || process.env.APP_URL;

    return (configured || fallback).replace(/\/$/, '');
  }

  buildRedirectUrl(path = '/payment/callback') {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.clientUrl}${normalizedPath}`;
  }

  async initializePayment(paymentData) {
    try {
      const payload = {
        tx_ref: paymentData.reference,
        amount: paymentData.amount,
        currency: paymentData.currency,
        redirect_url: this.buildRedirectUrl(paymentData.redirectPath),
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
        const transaction = response.data.data;
        return {
          success: true,
          data: {
            authorizationUrl: transaction.link,
            flwRef: transaction.flw_ref,
            txRef: transaction.tx_ref,
            transactionId: transaction.id?.toString?.() || `${transaction.id}`
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

  async verifyPayment(identifier) {
    const normalized = `${identifier || ''}`.trim();

    if (!normalized) {
      return {
        success: false,
        message: 'Transaction reference is required'
      };
    }

    const headers = {
      Authorization: `Bearer ${this.secretKey}`
    };

    const attemptVerification = async (url) => {
      try {
        const response = await axios.get(url, { headers });
        if (response.data.status === 'success') {
          return {
            success: true,
            data: this.normalizeTransaction(response.data.data)
          };
        }
        return {
          success: false,
          message: response.data.message || 'Payment verification failed'
        };
      } catch (error) {
        console.error('Flutterwave payment verification attempt error:', error.response?.data || error.message);
        return {
          success: false,
          message: error.response?.data?.message || 'Payment verification failed'
        };
      }
    };

    const isNumericReference = /^\d+$/.test(normalized);

    if (isNumericReference) {
      const byIdResult = await attemptVerification(`${this.baseURL}/transactions/${normalized}/verify`);
      if (byIdResult.success) {
        return byIdResult;
      }
    }

    return attemptVerification(`${this.baseURL}/transactions/verify_by_reference?tx_ref=${encodeURIComponent(normalized)}`);
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



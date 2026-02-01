const axios = require('axios');

// Simplified Flutterwave service for Firebase Functions
class SimpleFlutterwaveService {
  constructor() {
    this.baseURL = 'https://api.flutterwave.com/v3';
    this.publicKey = process.env.FLUTTERWAVE_PUBLIC_KEY || 'FLWPUBK_TEST-04fa9716ef05b43e581444120c688399-X';
    this.secretKey = process.env.FLUTTERWAVE_SECRET_KEY || 'FLWSECK_TEST-c913279c55318b1715de93539229f706-X';
  }

  async initializePayment(paymentData) {
    try {
      const payload = {
        tx_ref: paymentData.reference,
        amount: paymentData.amount,
        currency: paymentData.currency,
        redirect_url: 'https://real-estate-marketplace-37544.web.app/payment/callback',
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

      console.log('Flutterwave payload:', payload);
      console.log('Using secret key:', this.secretKey.substring(0, 10) + '...');

      const response = await axios.post(`${this.baseURL}/payments`, payload, {
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      });

      console.log('Flutterwave response:', response.data);

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
          message: response.data.message || 'Flutterwave payment initialization failed'
        };
      }
    } catch (error) {
      console.error('Flutterwave service error:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Flutterwave service error'
      };
    }
  }
}

module.exports = new SimpleFlutterwaveService();

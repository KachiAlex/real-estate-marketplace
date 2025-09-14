// Flutterwave Payment Integration Service
const FLUTTERWAVE_PUBLIC_KEY = process.env.REACT_APP_FLUTTERWAVE_PUBLIC_KEY;
const FLUTTERWAVE_SECRET_KEY = process.env.REACT_APP_FLUTTERWAVE_SECRET_KEY;
const FLUTTERWAVE_ENCRYPTION_KEY = process.env.REACT_APP_FLUTTERWAVE_ENCRYPTION_KEY;

class FlutterwaveService {
  constructor() {
    this.publicKey = FLUTTERWAVE_PUBLIC_KEY;
    this.secretKey = FLUTTERWAVE_SECRET_KEY;
    this.encryptionKey = FLUTTERWAVE_ENCRYPTION_KEY;
  }

  // Initialize Flutterwave payment
  async initializePayment(paymentData) {
    try {
      const {
        amount,
        email,
        phone_number,
        name,
        tx_ref,
        currency = 'NGN',
        redirect_url,
        meta = {}
      } = paymentData;

      // Create payment payload
      const payload = {
        public_key: this.publicKey,
        tx_ref,
        amount,
        currency,
        payment_options: 'card,mobilemoney,ussd,banktransfer',
        redirect_url,
        customer: {
          email,
          phone_number,
          name
        },
        customizations: {
          title: 'Naija Luxury Homes',
          description: 'Property Purchase Payment',
          logo: 'https://your-logo-url.com/logo.png'
        },
        meta
      };

      // Encrypt payload if encryption key is available
      if (this.encryptionKey) {
        payload.encryption_key = this.encryptionKey;
      }

      // Make API call to Flutterwave
      const response = await fetch('https://api.flutterwave.com/v3/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.secretKey}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.status === 'success') {
        return {
          success: true,
          payment_url: data.data.link,
          transaction_id: data.data.id,
          tx_ref: data.data.tx_ref
        };
      } else {
        throw new Error(data.message || 'Payment initialization failed');
      }
    } catch (error) {
      console.error('Flutterwave payment initialization error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Verify payment status
  async verifyPayment(transactionId) {
    try {
      const response = await fetch(`https://api.flutterwave.com/v3/transactions/${transactionId}/verify`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.secretKey}`
        }
      });

      const data = await response.json();

      if (data.status === 'success') {
        return {
          success: true,
          transaction: data.data,
          status: data.data.status,
          amount: data.data.amount,
          currency: data.data.currency,
          customer: data.data.customer,
          tx_ref: data.data.tx_ref
        };
      } else {
        throw new Error(data.message || 'Payment verification failed');
      }
    } catch (error) {
      console.error('Flutterwave payment verification error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Create escrow account (if using Flutterwave's escrow feature)
  async createEscrowAccount(accountData) {
    try {
      const {
        account_name,
        email,
        phone_number,
        bvn,
        bank_code,
        account_number
      } = accountData;

      const payload = {
        account_name,
        email,
        phone_number,
        bvn,
        bank_code,
        account_number
      };

      const response = await fetch('https://api.flutterwave.com/v3/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.secretKey}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.status === 'success') {
        return {
          success: true,
          account: data.data
        };
      } else {
        throw new Error(data.message || 'Escrow account creation failed');
      }
    } catch (error) {
      console.error('Flutterwave escrow account creation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Transfer funds to vendor (when escrow is released)
  async transferToVendor(transferData) {
    try {
      const {
        account_bank,
        account_number,
        amount,
        narration,
        currency = 'NGN',
        reference
      } = transferData;

      const payload = {
        account_bank,
        account_number,
        amount,
        narration,
        currency,
        reference
      };

      const response = await fetch('https://api.flutterwave.com/v3/transfers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.secretKey}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.status === 'success') {
        return {
          success: true,
          transfer: data.data
        };
      } else {
        throw new Error(data.message || 'Transfer failed');
      }
    } catch (error) {
      console.error('Flutterwave transfer error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Refund payment to buyer
  async refundPayment(refundData) {
    try {
      const {
        transaction_id,
        amount,
        reason
      } = refundData;

      const payload = {
        amount,
        reason
      };

      const response = await fetch(`https://api.flutterwave.com/v3/transactions/${transaction_id}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.secretKey}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.status === 'success') {
        return {
          success: true,
          refund: data.data
        };
      } else {
        throw new Error(data.message || 'Refund failed');
      }
    } catch (error) {
      console.error('Flutterwave refund error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get bank list for transfers
  async getBanks() {
    try {
      const response = await fetch('https://api.flutterwave.com/v3/banks/NG', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.secretKey}`
        }
      });

      const data = await response.json();

      if (data.status === 'success') {
        return {
          success: true,
          banks: data.data
        };
      } else {
        throw new Error(data.message || 'Failed to fetch banks');
      }
    } catch (error) {
      console.error('Flutterwave banks fetch error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Generate unique transaction reference
  generateTransactionRef() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `NLH_${timestamp}_${random}`.toUpperCase();
  }

  // Format amount for Flutterwave (multiply by 100 for kobo)
  formatAmount(amount) {
    return Math.round(amount * 100);
  }

  // Parse amount from Flutterwave (divide by 100 from kobo)
  parseAmount(amount) {
    return amount / 100;
  }
}

// Create singleton instance
const flutterwaveService = new FlutterwaveService();

export default flutterwaveService;

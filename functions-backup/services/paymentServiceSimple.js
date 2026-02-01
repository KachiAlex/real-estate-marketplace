const flutterwaveService = require('./flutterwaveService');

// Simplified payment service for Firebase Functions
const initializePayment = async ({
  user,
  amount,
  paymentMethod,
  paymentType,
  relatedEntity,
  description,
  currency = 'NGN'
}) => {
  try {
    // Calculate fees (simplified)
    const platformFee = amount * 0.025; // 2.5%
    const processingFee = amount * 0.015; // 1.5%
    const totalFees = platformFee + processingFee;
    
    // Generate IDs
    const transactionId = 'TXN_' + Date.now();
    const reference = 'PAY_' + Date.now();
    const paymentId = 'payment_' + Date.now();

    // Initialize Flutterwave payment
    let providerResult;
    switch (paymentMethod) {
      case 'flutterwave':
        providerResult = await flutterwaveService.initializePayment({
          amount: amount + totalFees,
          currency,
          reference,
          description,
          customer: {
            email: user.email,
            phone: user.phone || '+2341234567890',
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Test User'
          }
        });
        break;
      default:
        throw new Error(`Payment method ${paymentMethod} not supported`);
    }

    if (!providerResult.success) {
      throw new Error(providerResult.message || 'Payment initialization failed');
    }

    // Return payment record without saving to Firestore (for now)
    return {
      success: true,
      data: {
        payment: {
          id: paymentId,
          transactionId,
          reference,
          amount,
          currency,
          paymentMethod,
          paymentType,
          relatedEntity,
          description,
          status: 'pending',
          fees: {
            platformFee,
            processingFee,
            totalFees
          },
          createdAt: new Date(),
          updatedAt: new Date()
        },
        providerData: providerResult.data
      }
    };
  } catch (error) {
    console.error('Payment initialization error:', error);
    return {
      success: false,
      message: error.message || 'Payment initialization failed'
    };
  }
};

module.exports = {
  initializePayment
};

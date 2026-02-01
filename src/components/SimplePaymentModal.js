import React, { useState, useEffect } from 'react';
import { FaTimes, FaCheckCircle, FaCreditCard, FaLock } from 'react-icons/fa';

const SimplePaymentModal = ({ 
  isOpen, 
  onClose, 
  amount = 50000, 
  propertyTitle,
  onPaymentSuccess,
  onPaymentError 
}) => {
  const [paymentStep, setPaymentStep] = useState('details');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card'); // 'card' or 'transfer'
  const [formData, setFormData] = useState({
    email: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
    cardName: '',
    accountName: '',
    bankName: '',
    transferReference: ''
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setPaymentStep('details');
      setIsProcessing(false);
      setPaymentComplete(false);
      setFormData({
        email: '',
        cardNumber: '',
        expiry: '',
        cvv: '',
        cardName: '',
        accountName: '',
        bankName: '',
        transferReference: ''
      });
      setPaymentMethod('card');
    }
  }, [isOpen]);

  const formatCardNumber = (value) => {
    const cleaned = value.replace(/\s/g, '');
    const chunks = cleaned.match(/.{1,4}/g) || [];
    return chunks.join(' ');
  };

  const formatExpiry = (value) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'cardNumber') {
      setFormData(prev => ({
        ...prev,
        [name]: formatCardNumber(value)
      }));
    } else if (name === 'expiry') {
      setFormData(prev => ({
        ...prev,
        [name]: formatExpiry(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.email) {
      alert('Please fill in your email address');
      return;
    }

    if (paymentMethod === 'card') {
      if (!formData.cardNumber || !formData.expiry || !formData.cvv) {
        alert('Please fill in all card details');
        return;
      }
    } else if (paymentMethod === 'transfer') {
      if (!formData.accountName || !formData.bankName || !formData.transferReference) {
        alert('Please fill in all transfer details');
        return;
      }
    }

    setIsProcessing(true);
    setPaymentStep('processing');

    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      setPaymentStep('success');
      setPaymentComplete(true);
      
      // Generate mock payment reference
      const paymentRef = paymentMethod === 'card' 
        ? 'CARD_' + Date.now()
        : 'TRANSFER_' + Date.now();
      
      // Call success callback
      if (onPaymentSuccess) {
        onPaymentSuccess({
          reference: paymentRef,
          amount: amount,
          method: paymentMethod,
          status: 'successful',
          timestamp: new Date().toISOString()
        });
      }
    }, paymentMethod === 'card' ? 2000 : 1500);
  };

  const handleClose = () => {
    if (paymentComplete) {
      onClose();
    } else {
      if (window.confirm('Are you sure you want to cancel this payment?')) {
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={handleClose}></div>
        
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-lg">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold">Property Verification Payment</h3>
                <p className="text-blue-100 text-sm mt-1">{propertyTitle || 'Property Verification'}</p>
              </div>
              <button
                onClick={handleClose}
                className="text-white hover:text-blue-200 transition-colors"
              >
                <FaTimes size={20} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {paymentStep === 'details' && (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Amount Display */}
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Payment Amount</p>
                  <p className="text-2xl font-bold text-gray-900">₦{amount.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-1">Property Verification Fee</p>
                </div>

                {/* Payment Method Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`p-3 border rounded-lg text-sm font-medium transition-colors ${
                        paymentMethod === 'card'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      <FaCreditCard className="inline mr-2" />
                      Card Payment
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('transfer')}
                      className={`p-3 border rounded-lg text-sm font-medium transition-colors ${
                        paymentMethod === 'transfer'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      <span className="inline mr-2">🏦</span>
                      Bank Transfer
                    </button>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="your@email.com"
                    required
                  />
                </div>

                {/* Card Payment Form */}
                {paymentMethod === 'card' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Card Number
                      </label>
                      <input
                        type="text"
                        name="cardNumber"
                        value={formData.cardNumber}
                        onChange={handleInputChange}
                        maxLength={19}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="1234 5678 9012 3456"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Expiry Date
                        </label>
                        <input
                          type="text"
                          name="expiry"
                          value={formData.expiry}
                          onChange={handleInputChange}
                          maxLength={5}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="MM/YY"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          CVV
                        </label>
                        <input
                          type="text"
                          name="cvv"
                          value={formData.cvv}
                          onChange={handleInputChange}
                          maxLength={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="123"
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Bank Transfer Form */}
                {paymentMethod === 'transfer' && (
                  <div className="space-y-3">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-2">Bank Transfer Details</h4>
                      <div className="text-sm text-blue-800 space-y-1">
                        <p><strong>Bank:</strong> Test Bank PLC</p>
                        <p><strong>Account Name:</strong> PropertyArk Verification</p>
                        <p><strong>Account Number:</strong> 1234567890</p>
                        <p><strong>Amount:</strong> ₦{amount.toLocaleString()}</p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Your Account Name
                      </label>
                      <input
                        type="text"
                        name="accountName"
                        value={formData.accountName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="John Doe"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bank Name
                      </label>
                      <input
                        type="text"
                        name="bankName"
                        value={formData.bankName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Your Bank Name"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Transfer Reference/Transaction ID
                      </label>
                      <input
                        type="text"
                        name="transferReference"
                        value={formData.transferReference}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Transaction ID from your bank"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Security Note */}
                <div className="flex items-center text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                  <FaLock className="text-blue-600 mr-2" />
                  <span>Your payment information is secure and encrypted</span>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <FaCreditCard className="mr-2" />
                  Pay ₦{amount.toLocaleString()}
                </button>
              </form>
            )}

            {paymentStep === 'processing' && (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Processing Payment</h3>
                <p className="text-gray-600">Please wait while we process your payment...</p>
              </div>
            )}

            {paymentStep === 'success' && (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <FaCheckCircle className="text-green-600 text-2xl" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Successful!</h3>
                <p className="text-gray-600 mb-4">Your property verification payment has been processed successfully.</p>
                <div className="bg-gray-50 p-3 rounded-lg text-sm">
                  <p className="text-gray-600">Payment Reference: <span className="font-mono font-semibold">PAY_{Date.now()}</span></p>
                  <p className="text-gray-600">Amount: <span className="font-semibold">₦{amount.toLocaleString()}</span></p>
                </div>
                <button
                  onClick={handleClose}
                  className="mt-6 w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  Continue
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimplePaymentModal;

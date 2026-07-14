import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useMortgage } from '../contexts/MortgageContext';
import { FaCreditCard, FaCheck, FaArrowLeft, FaLock, FaHome, FaCalendar, FaMoneyBillWave } from 'react-icons/fa';
import toast from 'react-hot-toast';

const MortgagePaymentFlow = ({ mortgageId, onPaymentSuccess, onClose }) => {
  const { user } = useAuth();
  const { getMortgageById, makePayment } = useMortgage();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1); // 1: Review, 2: Payment Method, 3: Confirmation
  const [paymentMethod, setPaymentMethod] = useState('flutterwave');
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: ''
  });
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const mortgage = getMortgageById(mortgageId);

  if (!mortgage) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Mortgage Not Found</h3>
          <p className="text-gray-600 mb-4">The requested mortgage could not be found.</p>
          <button
            onClick={onClose}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const handlePaymentDataChange = (field, value) => {
    setPaymentData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleProceedToPayment = () => {
    setStep(2);
  };

  const handleProcessPayment = async () => {
    try {
      // Validate payment data if card payment
      if (paymentMethod === 'card') {
        if (!paymentData.cardNumber || !paymentData.expiryDate || !paymentData.cvv || !paymentData.cardholderName) {
          toast.error('Please fill in all payment details');
          return;
        }
      }

      setProcessing(true);

      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Make the payment
      const result = await makePayment(mortgage.id, mortgage.monthlyPayment, paymentMethod);
      
      if (result.success) {
        setPaymentSuccess(true);
        setStep(3);
        if (onPaymentSuccess) {
          onPaymentSuccess(result.payment, result.mortgage);
        }
      } else {
        toast.error(result.error || 'Payment failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment processing failed');
    } finally {
      setProcessing(false);
    }
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">Mortgage Payment</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {/* Step 1: Payment Review */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <FaHome className="text-blue-600 text-xl" />
                  <div>
                    <h4 className="font-semibold text-blue-900">{mortgage.propertyTitle}</h4>
                    <p className="text-blue-700 text-sm">{mortgage.propertyLocation}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Payment Details</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monthly Payment:</span>
                    <span className="font-semibold text-gray-900">₦{mortgage.monthlyPayment.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Due Date:</span>
                    <span className="font-semibold text-gray-900">
                      {new Date(mortgage.nextPaymentDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment #:</span>
                    <span className="font-semibold text-gray-900">{mortgage.paymentsMade + 1} of {mortgage.totalPayments}</span>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <FaLock className="text-green-600 text-xl" />
                  <div>
                    <h4 className="font-semibold text-green-900">Secure Payment</h4>
                    <p className="text-green-700 text-sm">Your payment is protected by bank-level security</p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleProceedToPayment}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                Continue to Payment
              </button>
            </div>
          )}

          {/* Step 2: Payment Method */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setStep(1)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FaArrowLeft className="text-lg" />
                </button>
                <h4 className="text-lg font-semibold text-gray-900">Payment Method</h4>
              </div>

              {/* Payment Method Selection */}
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    id="flutterwave"
                    name="paymentMethod"
                    value="flutterwave"
                    checked={paymentMethod === 'flutterwave'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="text-blue-600"
                  />
                  <label htmlFor="flutterwave" className="flex items-center space-x-3 cursor-pointer">
                    <FaCreditCard className="text-blue-600" />
                    <span className="font-medium">Pay with Flutterwave</span>
                  </label>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    id="card"
                    name="paymentMethod"
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="text-blue-600"
                  />
                  <label htmlFor="card" className="flex items-center space-x-3 cursor-pointer">
                    <FaCreditCard className="text-gray-600" />
                    <span className="font-medium">Credit/Debit Card</span>
                  </label>
                </div>
              </div>

              {/* Card Details (if card payment selected) */}
              {paymentMethod === 'card' && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <h5 className="font-semibold text-gray-900">Card Details</h5>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                      <input
                        type="text"
                        value={paymentData.cardNumber}
                        onChange={(e) => handlePaymentDataChange('cardNumber', formatCardNumber(e.target.value))}
                        placeholder="1234 5678 9012 3456"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        maxLength={19}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                        <input
                          type="text"
                          value={paymentData.expiryDate}
                          onChange={(e) => handlePaymentDataChange('expiryDate', formatExpiryDate(e.target.value))}
                          placeholder="MM/YY"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          maxLength={5}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                        <input
                          type="text"
                          value={paymentData.cvv}
                          onChange={(e) => handlePaymentDataChange('cvv', e.target.value.replace(/\D/g, ''))}
                          placeholder="123"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          maxLength={4}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cardholder Name</label>
                      <input
                        type="text"
                        value={paymentData.cardholderName}
                        onChange={(e) => handlePaymentDataChange('cardholderName', e.target.value)}
                        placeholder="John Doe"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="font-semibold text-gray-900 mb-3">Payment Summary</h5>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monthly Payment:</span>
                    <span className="font-semibold text-gray-900">₦{mortgage.monthlyPayment.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Processing Fee:</span>
                    <span className="font-semibold text-gray-900">₦0</span>
                  </div>
                  <hr className="border-gray-300" />
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-900">Total:</span>
                    <span className="font-semibold text-gray-900">₦{mortgage.monthlyPayment.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleProcessPayment}
                disabled={processing}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? 'Processing Payment...' : 'Pay ₦' + mortgage.monthlyPayment.toLocaleString()}
              </button>
            </div>
          )}

          {/* Step 3: Payment Confirmation */}
          {step === 3 && paymentSuccess && (
            <div className="space-y-6 text-center">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <FaCheck className="text-green-600 text-2xl" />
                </div>
              </div>

              <div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">Payment Successful!</h4>
                <p className="text-gray-600">
                  Your mortgage payment of ₦{mortgage.monthlyPayment.toLocaleString()} has been processed successfully.
                </p>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center justify-center space-x-3 mb-2">
                  <FaCalendar className="text-green-600" />
                  <span className="font-semibold text-green-900">Next Payment Due</span>
                </div>
                <p className="text-green-700">
                  {new Date(mortgage.nextPaymentDate).toLocaleDateString()} - ₦{mortgage.monthlyPayment.toLocaleString()}
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => navigate('/mortgage')}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  View Mortgages
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MortgagePaymentFlow;

import React, { useState } from 'react';
import { FaCheckCircle, FaCreditCard, FaSpinner, FaExclamationTriangle } from 'react-icons/fa';

const PropertyVerification = ({ property, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [verificationRequest, setVerificationRequest] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardHolderName: ''
  });
  const [error, setError] = useState('');

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api-kzs3jdpe7a-uc.a.run.app';

  const verificationFee = 50000; // ₦50,000 default fee

  const handleRequestVerification = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/properties/${property.id}/request-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: property.ownerId || 'user_001', // This should come from auth context
          verificationFee
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create verification request');
      }

      const data = await response.json();
      setVerificationRequest(data.verificationRequest);
    } catch (err) {
      setError('Failed to create verification request. Please try again.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayment = async () => {
    setPaymentLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/verification/${verificationRequest.id}/process-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentDetails: {
            ...paymentDetails,
            amount: verificationFee,
            currency: 'NGN',
            timestamp: new Date().toISOString()
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Payment processing failed');
      }

      // Simulate successful payment
      setTimeout(() => {
        setVerificationRequest(prev => ({
          ...prev,
          status: 'payment_completed'
        }));
        setPaymentLoading(false);
        onSuccess?.('Verification request submitted successfully! Your property will be reviewed by our admin team.');
      }, 2000);

    } catch (err) {
      setError('Payment processing failed. Please try again.');
      console.error('Error:', err);
      setPaymentLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Property Verification</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              <div className="flex items-center">
                <FaExclamationTriangle className="mr-2" />
                {error}
              </div>
            </div>
          )}

          <div className="space-y-6">
            {/* Property Details */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-2">{property.title}</h3>
              <p className="text-gray-600 mb-2">{property.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold text-green-600">
                  {formatCurrency(property.price)}
                </span>
                <span className="text-sm text-gray-500">
                  {property.location?.city}, {property.location?.state}
                </span>
              </div>
            </div>

            {/* Verification Process */}
            {!verificationRequest ? (
              <div className="text-center">
                <div className="bg-blue-50 p-6 rounded-lg mb-4">
                  <FaCheckCircle className="text-blue-500 text-4xl mx-auto mb-3" />
                  <h3 className="text-lg font-semibold mb-2">Verify Your Property</h3>
                  <p className="text-gray-600 mb-4">
                    Get your property verified by our admin team to increase visibility and trust.
                  </p>
                  <div className="bg-white p-4 rounded border">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Verification Fee:</span>
                      <span className="text-xl font-bold text-green-600">
                        {formatCurrency(verificationFee)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      One-time payment - no additional charges for re-submission
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleRequestVerification}
                  disabled={loading}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center mx-auto"
                >
                  {loading ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      Creating Request...
                    </>
                  ) : (
                    'Request Verification'
                  )}
                </button>
              </div>
            ) : verificationRequest.status === 'pending_payment' ? (
              <div>
                <div className="bg-yellow-50 p-4 rounded-lg mb-4">
                  <h3 className="font-semibold text-lg mb-2">Payment Required</h3>
                  <p className="text-gray-600">
                    Please complete the payment to submit your property for verification.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Card Number
                    </label>
                    <input
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      value={paymentDetails.cardNumber}
                      onChange={(e) => setPaymentDetails(prev => ({
                        ...prev,
                        cardNumber: e.target.value
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        value={paymentDetails.expiryDate}
                        onChange={(e) => setPaymentDetails(prev => ({
                          ...prev,
                          expiryDate: e.target.value
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CVV
                      </label>
                      <input
                        type="text"
                        placeholder="123"
                        value={paymentDetails.cvv}
                        onChange={(e) => setPaymentDetails(prev => ({
                          ...prev,
                          cvv: e.target.value
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Card Holder Name
                    </label>
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={paymentDetails.cardHolderName}
                      onChange={(e) => setPaymentDetails(prev => ({
                        ...prev,
                        cardHolderName: e.target.value
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Total Amount:</span>
                      <span className="text-xl font-bold text-green-600">
                        {formatCurrency(verificationFee)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleProcessPayment}
                    disabled={paymentLoading || !paymentDetails.cardNumber || !paymentDetails.expiryDate || !paymentDetails.cvv || !paymentDetails.cardHolderName}
                    className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {paymentLoading ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" />
                        Processing Payment...
                      </>
                    ) : (
                      <>
                        <FaCreditCard className="mr-2" />
                        Pay {formatCurrency(verificationFee)}
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : verificationRequest.status === 'payment_completed' ? (
              <div className="text-center">
                <div className="bg-green-50 p-6 rounded-lg">
                  <FaCheckCircle className="text-green-500 text-4xl mx-auto mb-3" />
                  <h3 className="text-lg font-semibold mb-2">Payment Successful!</h3>
                  <p className="text-gray-600 mb-4">
                    Your property has been submitted for verification. Our admin team will review it within 24-48 hours.
                  </p>
                  <div className="bg-white p-4 rounded border">
                    <p className="text-sm text-gray-500">
                      Request ID: {verificationRequest.id}
                    </p>
                    <p className="text-sm text-gray-500">
                      Status: Pending Admin Review
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyVerification;

import React, { useState, useEffect } from 'react';
import { FaTimes, FaCheckCircle, FaSpinner } from 'react-icons/fa';
import toast from 'react-hot-toast';
import apiClient from '../services/apiClient';

const VerificationRequestModal = ({ property, isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [verificationFee, setVerificationFee] = useState(50000);
  const [message, setMessage] = useState('');
  const [badgeColor, setBadgeColor] = useState('#10B981');
  const [paymentId, setPaymentId] = useState(null);
  const [step, setStep] = useState('info'); // 'info' -> 'payment' -> 'confirm'

  useEffect(() => {
    if (isOpen) {
      fetchVerificationConfig();
    }
  }, [isOpen]);

  const fetchVerificationConfig = async () => {
    try {
      const response = await apiClient.get('/verification/config');
      if (response.data?.data?.verificationFee) {
        setVerificationFee(response.data.data.verificationFee);
      }
    } catch (error) {
      console.error('Failed to fetch verification config:', error);
    }
  };

  const handlePayment = async () => {
    if (!window.PaystackPop) {
      toast.error('Payment system not available');
      return;
    }

    setPaymentLoading(true);
    try {
      const handler = window.PaystackPop.setup({
        key: process.env.REACT_APP_PAYSTACK_PUBLIC_KEY,
        email: 'verification@propertyark.com',
        amount: verificationFee * 100,
        ref: `VERIFY-${property.id}-${Date.now()}`,
        onClose: () => {
          setPaymentLoading(false);
          toast.error('Payment cancelled');
        },
        onSuccess: (response) => {
          setPaymentLoading(false);
          setPaymentId(response.reference);
          setStep('confirm');
          toast.success('Payment successful! Proceeding with verification request...');
        }
      });
      handler.openIframe();
    } catch (error) {
      setPaymentLoading(false);
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again.');
    }
  };

  const handleSubmitVerification = async () => {
    if (!property?.id) {
      toast.error('Property information missing');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post('/verification/applications', {
        propertyId: property.id,
        propertyName: property.title,
        propertyUrl: property.url || '',
        propertyLocation: property.location?.address || property.location || '',
        message: message.trim(),
        preferredBadgeColor: badgeColor,
        verificationPaymentId: paymentId
      });

      if (response.data?.success) {
        toast.success('Verification request submitted successfully!');
        setLoading(false);
        onSuccess?.();
        onClose();
      } else {
        throw new Error(response.data?.message || 'Failed to submit verification request');
      }
    } catch (error) {
      setLoading(false);
      console.error('Verification submission error:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to submit verification request';
      toast.error(errorMsg);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold">Request Property Verification</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
          >
            <FaTimes />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Property Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Property</p>
            <p className="font-semibold text-gray-900">{property?.title}</p>
            <p className="text-sm text-gray-600 mt-1">{property?.location?.address || property?.location}</p>
          </div>

          {step === 'info' && (
            <>
              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message (Optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Add any additional information about your property..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={4}
                />
              </div>

              {/* Badge Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Badge Color
                </label>
                <div className="flex gap-3">
                  {['#10B981', '#3B82F6', '#8B5CF6', '#EC4899'].map((color) => (
                    <button
                      key={color}
                      onClick={() => setBadgeColor(color)}
                      className={`w-10 h-10 rounded-full border-2 transition-all ${
                        badgeColor === color ? 'border-gray-900 scale-110' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Fee Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-gray-700 mb-2">
                  <span className="font-semibold">Verification Fee:</span> ₦{verificationFee.toLocaleString()}
                </p>
                <p className="text-xs text-gray-600">
                  This fee covers the verification process. Your property will be reviewed by our admin team and assigned a verification badge upon approval.
                </p>
              </div>

              {/* Proceed Button */}
              <button
                onClick={() => setStep('payment')}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Proceed to Payment
              </button>
            </>
          )}

          {step === 'payment' && (
            <>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-gray-700 mb-2">
                  <span className="font-semibold">Amount to Pay:</span> ₦{verificationFee.toLocaleString()}
                </p>
                <p className="text-xs text-gray-600">
                  You will be redirected to Paystack to complete the payment securely.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('info')}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  disabled={paymentLoading}
                >
                  Back
                </button>
                <button
                  onClick={handlePayment}
                  disabled={paymentLoading}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {paymentLoading ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Pay with Paystack'
                  )}
                </button>
              </div>
            </>
          )}

          {step === 'confirm' && (
            <>
              <div className="text-center py-4">
                <FaCheckCircle className="text-green-500 text-4xl mx-auto mb-3" />
                <p className="text-lg font-semibold text-gray-900 mb-2">Payment Successful!</p>
                <p className="text-sm text-gray-600">
                  Your verification request is ready to submit. Click below to complete the process.
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Next Steps:</span>
                </p>
                <ul className="text-xs text-gray-600 mt-2 space-y-1 ml-4 list-disc">
                  <li>Your property will be reviewed by our admin team</li>
                  <li>You'll receive a notification when the review is complete</li>
                  <li>Upon approval, a verification badge will be displayed on your property</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setStep('info');
                    setPaymentId(null);
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitVerification}
                  disabled={loading}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Verification Request'
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerificationRequestModal;

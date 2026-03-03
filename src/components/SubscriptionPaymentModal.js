import React, { useState, useEffect } from 'react';
import { FaTimes, FaCreditCard, FaLock, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { getApiUrl } from '../utils/apiConfig';
import { useAuth } from '../contexts/AuthContext';
import { authenticatedFetch } from '../utils/authToken';

const SubscriptionPaymentModal = ({ isOpen, onClose, plan, onSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentUrl, setPaymentUrl] = useState('');
  const [reference, setReference] = useState('');

  useEffect(() => {
    if (isOpen) {
      initializePayment();
    }
  }, [isOpen, plan]);

  const initializePayment = async () => {
    if (!plan) return;

    try {
      setLoading(true);
      setError('');

      const response = await authenticatedFetch(getApiUrl('/subscription/pay'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          planId: plan.id,
          paymentMethod: 'paystack'
        })
      });

      const result = await response.json();

      if (result.success) {
        setPaymentUrl(result.data.paymentUrl);
        setReference(result.data.reference);
      } else {
        setError(result.message || 'Failed to initialize payment');
      }
    } catch (error) {
      console.error('Payment initialization error:', error);
      setError('Failed to initialize payment');
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = () => {
    if (paymentUrl) {
      // Open Paystack in new window
      const popup = window.open(
        paymentUrl,
        'paystack-payment',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );

      // Poll for payment completion
      const checkPayment = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkPayment);
          // Verify payment status
          verifyPayment();
        }
      }, 1000);

      // Fallback: check after 30 minutes
      setTimeout(() => {
        clearInterval(checkPayment);
        if (!popup.closed) {
          popup.close();
        }
      }, 30 * 60 * 1000);
    }
  };

  const verifyPayment = async () => {
    if (!reference) return;

    try {
      const response = await authenticatedFetch(getApiUrl('/subscription/verify'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reference })
      });

      const result = await response.json();

      if (result.success) {
        onSuccess && onSuccess(result.data);
        onClose();
      } else {
        setError('Payment verification failed. Please try again.');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      setError('Payment verification failed');
    }
  };

  const formatCurrency = (amount, currency = 'NGN') => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b flex-shrink-0">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 pr-4">Complete Subscription Payment</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Initializing payment...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <FaExclamationTriangle className="text-red-500 text-4xl mx-auto mb-4" />
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={initializePayment}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : paymentUrl ? (
            <div className="space-y-4 sm:space-y-6">
              {/* Plan Summary */}
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                <h3 className="font-semibold text-gray-900 mb-3 text-sm sm:text-base">Plan Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-start">
                    <span className="text-gray-600">Plan:</span>
                    <span className="font-medium text-right">{plan.name}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-medium text-right">{formatCurrency(plan.amount)}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-gray-600">Billing Cycle:</span>
                    <span className="font-medium capitalize text-right">{plan.billingCycle}</span>
                  </div>
                </div>
              </div>

              {/* Features */}
              {plan.features && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 text-sm sm:text-base">Features Included</h3>
                  <div className="space-y-2">
                    {Object.entries(plan.features).map(([key, value]) => (
                      <div key={key} className="flex items-center text-xs sm:text-sm">
                        {value ? (
                          <FaCheckCircle className="text-green-500 mr-2 flex-shrink-0" />
                        ) : (
                          <span className="text-gray-400 mr-2 flex-shrink-0">—</span>
                        )}
                        <span className="text-gray-700 capitalize">
                          {key.replace(/_/g, ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                <div className="flex items-start">
                  <FaLock className="text-blue-500 mt-1 mr-2 sm:mr-3 flex-shrink-0 text-sm" />
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-1 text-sm">Secure Payment</h4>
                    <p className="text-xs sm:text-sm text-blue-800">
                      Your payment is processed securely through Paystack. 
                      We never store your card information.
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Button */}
              <button
                onClick={handlePayNow}
                className="w-full bg-blue-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center text-sm sm:text-base"
              >
                <FaCreditCard className="mr-2 flex-shrink-0" />
                <span className="truncate">Pay {formatCurrency(plan.amount)} with Paystack</span>
              </button>

              <p className="text-xs text-gray-500 text-center">
                You will be redirected to Paystack's secure payment page
              </p>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">Failed to initialize payment</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-3 sm:p-4 flex-shrink-0">
          <div className="flex items-center justify-center text-xs text-gray-500">
            <FaLock className="mr-1 flex-shrink-0" />
            <span className="text-center">Powered by Paystack • Secure payment processing</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPaymentModal;

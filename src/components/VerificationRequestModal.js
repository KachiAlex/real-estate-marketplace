import React, { useState, useEffect, useMemo } from 'react';
import { FaTimes, FaCheckCircle, FaSpinner } from 'react-icons/fa';
import toast from 'react-hot-toast';
import apiClient from '../services/apiClient';

const PAYSTACK_INLINE_URL = 'https://js.paystack.co/v1/inline.js';
let paystackLoadingPromise = null;

const ensurePaystackSdk = () => {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Window is not available.'));
  }

  if (window.PaystackPop) {
    return Promise.resolve(window.PaystackPop);
  }

  if (paystackLoadingPromise) {
    return paystackLoadingPromise;
  }

  paystackLoadingPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${PAYSTACK_INLINE_URL}"]`);
    if (existingScript) {
      existingScript.addEventListener('load', () => {
        return window.PaystackPop ? resolve(window.PaystackPop) : reject(new Error('Paystack SDK failed to initialise.'));
      }, { once: true });
      existingScript.addEventListener('error', () => reject(new Error('Unable to load Paystack SDK.')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = PAYSTACK_INLINE_URL;
    script.async = true;
    script.onload = () => {
      return window.PaystackPop ? resolve(window.PaystackPop) : reject(new Error('Paystack SDK loaded without PaystackPop.'));
    };
    script.onerror = () => reject(new Error('Unable to load Paystack SDK.'));
    document.body.appendChild(script);
  }).finally(() => {
    paystackLoadingPromise = null;
  });

  return paystackLoadingPromise;
};

const VerificationRequestModal = ({ property, isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [verificationFee, setVerificationFee] = useState(50000);
  const [message, setMessage] = useState('');
  const [badgeColor, setBadgeColor] = useState('#10B981');
  const [paymentId, setPaymentId] = useState(null);
  const [step, setStep] = useState('info'); // 'info' -> 'payment' -> 'confirm'

  const locationDisplay = useMemo(() => {
    const raw = property?.location;
    if (!raw) return '';
    if (typeof raw === 'string') return raw;

    const {
      address,
      city,
      state,
      country,
      zipCode,
      nearestBusStop
    } = raw;

    const busStopName = typeof nearestBusStop === 'string'
      ? nearestBusStop
      : nearestBusStop?.name;

    const segments = [address, city, state, country];
    if (zipCode) segments.push(zipCode);
    if (busStopName) segments.push(`Near ${busStopName}`);
    return segments.filter(Boolean).join(', ');
  }, [property?.location]);

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
    setPaymentLoading(true);
    try {
      await ensurePaystackSdk();

      const publicKey = process.env.REACT_APP_PAYSTACK_PUBLIC_KEY;
      if (!publicKey) {
        throw new Error('Paystack key missing. Please configure REACT_APP_PAYSTACK_PUBLIC_KEY.');
      }

      const handler = window.PaystackPop.setup({
        key: publicKey,
        email: 'verification@propertyark.com',
        amount: verificationFee * 100,
        ref: `VERIFY-${property.id}-${Date.now()}`,
        callback: (response) => {
          setPaymentLoading(false);
          setPaymentId(response.reference);
          setStep('confirm');
          toast.success('Payment successful! Proceeding with verification request...');
        },
        onClose: () => {
          // Only treat as cancellation if we never received a payment reference
          if (!paymentId) {
            toast.error('Payment cancelled');
          }
          setPaymentLoading(false);
        }
      });
      handler.openIframe();
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Payment failed. Please try again.');
      setPaymentLoading(false);
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
        propertyLocation: locationDisplay,
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
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm" onClick={onClose}></div>
        
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto transform transition-all">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white p-6 rounded-t-2xl shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold">Property Verification</h2>
                  <p className="text-indigo-100 text-sm">Get your property verified with a trusted badge</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-all duration-200"
              >
                <FaTimes className="text-white" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
          {/* Property Info */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700 mb-1">Property Details</p>
                <p className="font-semibold text-gray-900 text-lg">{property?.title}</p>
                <p className="text-sm text-gray-600 mt-1 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {locationDisplay || 'Location not specified'}
                </p>
              </div>
            </div>
          </div>

          {step === 'info' && (
            <>
              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Additional Message (Optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Add any additional information about your property that might help with verification..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition-all duration-200"
                  rows={4}
                />
              </div>

              {/* Badge Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                  Preferred Badge Color
                </label>
                <div className="flex gap-4 justify-center">
                  {[
                    { color: '#10B981', name: 'Green' },
                    { color: '#3B82F6', name: 'Blue' },
                    { color: '#8B5CF6', name: 'Purple' },
                    { color: '#EC4899', name: 'Pink' }
                  ].map((item) => (
                    <button
                      key={item.color}
                      onClick={() => setBadgeColor(item.color)}
                      className={`relative group transition-all duration-200 ${
                        badgeColor === item.color ? 'scale-110' : 'scale-100 hover:scale-105'
                      }`}
                    >
                      <div
                        className={`w-12 h-12 rounded-full border-3 transition-all duration-200 ${
                          badgeColor === item.color 
                            ? 'border-gray-800 shadow-lg' 
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        {item.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Fee Info */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-700 mb-2">
                      <span className="font-semibold text-lg">Verification Fee:</span> 
                      <span className="text-2xl font-bold text-indigo-600 ml-2">#{verificationFee.toLocaleString()}</span>
                    </p>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      This fee covers the comprehensive verification process. Your property will be reviewed by our admin team and assigned a trusted verification badge upon approval.
                    </p>
                  </div>
                </div>
              </div>

              {/* Proceed Button */}
              <button
                onClick={() => setStep('payment')}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 font-medium text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center space-x-2"
              >
                <span>Proceed to Payment</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </>
          )}

          {step === 'payment' && (
            <>
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-700 mb-2">
                      <span className="font-semibold text-lg">Payment Amount:</span> 
                      <span className="text-2xl font-bold text-amber-600 ml-2">#{verificationFee.toLocaleString()}</span>
                    </p>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      You will be redirected to Paystack's secure payment gateway to complete this transaction. Your payment information is encrypted and protected.
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Security Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900">Secure Payment</p>
                    <p className="text-xs text-blue-700">Your payment is processed securely through Paystack's PCI-DSS compliant platform.</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('info')}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium border border-gray-200"
                  disabled={paymentLoading}
                >
                  <span className="flex items-center justify-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back
                  </span>
                </button>
                <button
                  onClick={handlePayment}
                  disabled={paymentLoading}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-medium disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  {paymentLoading ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      <span>Processing Payment...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      <span>Pay with Paystack</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {step === 'confirm' && (
            <>
              <div className="text-center py-6">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaCheckCircle className="text-green-500 text-5xl" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h3>
                <p className="text-gray-600 max-w-sm mx-auto">
                  Your verification request is ready to submit. Click below to complete the process and get your property verified.
                </p>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-2">Next Steps:</p>
                    <ul className="text-xs text-gray-600 space-y-2">
                      <li className="flex items-start">
                        <svg className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>Your property will be reviewed by our admin team within 24-48 hours</span>
                      </li>
                      <li className="flex items-start">
                        <svg className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>You'll receive a notification when the review is complete</span>
                      </li>
                      <li className="flex items-start">
                        <svg className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>Upon approval, a verification badge will be displayed on your property</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setStep('info');
                    setPaymentId(null);
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium border border-gray-200"
                  disabled={loading}
                >
                  <span className="flex items-center justify-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Cancel
                  </span>
                </button>
                <button
                  onClick={handleSubmitVerification}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-medium disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  {loading ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      <span>Submitting Request...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      <span>Submit Verification Request</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationRequestModal;

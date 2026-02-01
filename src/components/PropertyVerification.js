import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FaCheckCircle, FaSpinner, FaExclamationTriangle, FaShieldAlt, FaCreditCard } from 'react-icons/fa';
import { getApiUrl } from '../utils/apiConfig';
import { useAuth } from '../contexts/AuthContext';
import SimplePaymentModal from './SimplePaymentModal';

const sanitizePropertyUrl = (rawValue) => {
  if (!rawValue) return '';
  const trimmed = rawValue.trim();
  if (!trimmed) return '';

  const valueWithProtocol = /^(https?:)?\/\//i.test(trimmed) ? trimmed : `https://${trimmed.replace(/^\/\//, '')}`;

  try {
    const parsed = new URL(valueWithProtocol);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return '';
    }
    return parsed.toString();
  } catch (error) {
    console.warn('PropertyVerification: invalid property URL provided', trimmed, error);
    return '';
  }
};

const PropertyVerification = ({ property, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [configLoading, setConfigLoading] = useState(true);
  const [configError, setConfigError] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [config, setConfig] = useState(null);
  const [formValues, setFormValues] = useState({
    propertyName: '',
    propertyUrl: '',
    propertyLocation: '',
    message: '',
    preferredBadgeColor: ''
  });
  const [verificationPaymentId, setVerificationPaymentId] = useState('');
  const [pendingPayment, setPendingPayment] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [isPaymentVerifying, setIsPaymentVerifying] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [resumePaymentEntry, setResumePaymentEntry] = useState(null);

  // Handle payment success message from mock payment page
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data.type === 'PAYMENT_SUCCESS') {
        console.log('PropertyVerification: Payment successful', event.data);
        // Close the checkout modal
        setShowCheckoutModal(false);
        // Verify the payment
        if (pendingPayment) {
          handleVerifyPayment();
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [pendingPayment]);

  const CALLBACK_STORAGE_KEY = 'propertyVerificationPayments';

  const [paymentStatus, setPaymentStatus] = useState('idle');
  const [paymentError, setPaymentError] = useState('');
  const [isPaymentInitializing, setIsPaymentInitializing] = useState(false);
  const [providerLimit, setProviderLimit] = useState(null);

  const getStoredToken = () => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem('token');
    } catch (storageError) {
      console.warn('PropertyVerification: unable to read token from storage', storageError);
      return null;
    }
  };

  const readStoredPayments = () => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(CALLBACK_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (error) {
      console.warn('PropertyVerification: unable to read stored payments', error);
      return [];
    }
  };

  const writeStoredPayments = (entries) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(CALLBACK_STORAGE_KEY, JSON.stringify(entries));
    } catch (error) {
      console.warn('PropertyVerification: unable to write stored payments', error);
    }
  };

  const updateStoredPayment = (paymentId, updates) => {
    const entries = readStoredPayments();
    const updatedEntries = entries.map((item) =>
      item.paymentId === paymentId ? { ...item, ...updates } : item
    );
    writeStoredPayments(updatedEntries);
    return updatedEntries.find((item) => item.paymentId === paymentId);
  };

  const saveInitiatedPayment = (entry) => {
    const entries = readStoredPayments();
    const filtered = entries.filter((item) => item.paymentId !== entry.paymentId);
    filtered.push(entry);
    writeStoredPayments(filtered);
  };

  const removeStoredPayment = (paymentId) => {
    const entries = readStoredPayments();
    const filtered = entries.filter((item) => item.paymentId !== paymentId);
    writeStoredPayments(filtered);
  };

  const verificationFee = useMemo(() => {
    if (config?.verificationFee) {
      return Number(config.verificationFee);
    }
    return 50000;
  }, [config?.verificationFee]);

  const badgePreviewColor = formValues.preferredBadgeColor || config?.verificationBadgeColor || '#10B981';

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setConfigLoading(true);
        const response = await fetch(getApiUrl('/verification/config'));
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Unable to load verification configuration');
        }
        setConfig(data.data);
        setFormValues((prev) => ({
          ...prev,
          preferredBadgeColor: data.data?.verificationBadgeColor || prev.preferredBadgeColor
        }));
      } catch (err) {
        console.warn('PropertyVerification: failed to load config', err);
        setConfigError(err?.message || 'Failed to load verification configuration');
      } finally {
        setConfigLoading(false);
      }
    };

    fetchConfig();
  }, []);

  useEffect(() => {
    if (!property) return;
    const derivedLocation = (() => {
      const location = property.location;
      if (!location) return '';
      if (typeof location === 'string') return location;
      const parts = [location.address, location.city, location.state].filter(Boolean);
      return parts.join(', ');
    })();

    setFormValues((prev) => ({
      ...prev,
      propertyName: property.title || property.name || prev.propertyName,
      propertyUrl: property.shareUrl || property.listingUrl || prev.propertyUrl,
      propertyLocation: derivedLocation || prev.propertyLocation
    }));
  }, [property]);

  useEffect(() => {
    setVerificationPaymentId('');
    setPendingPayment(null);
    setPaymentStatus('idle');
    setPaymentError('');
    setCheckoutUrl('');
  }, [property?.id]);

  const hydratePendingPaymentFromStorage = useCallback(() => {
    if (!property?.id) return;
    const entries = readStoredPayments();
    const matched = entries.find((entry) => entry.propertyId === property.id);
    if (!matched) return;

    setPendingPayment((prev) => prev || {
      id: matched.paymentId,
      reference: matched.reference,
      txRef: matched.txRef,
      metadata: matched.metadata || {}
    });

    if (matched.verified && matched.verificationPaymentId) {
      setPaymentStatus('completed');
      setVerificationPaymentId(matched.verificationPaymentId);
      setResumePaymentEntry(matched);
    } else {
      setPaymentStatus('processing');
      setResumePaymentEntry(null);
    }
  }, [property?.id]);

  useEffect(() => {
    hydratePendingPaymentFromStorage();
  }, [hydratePendingPaymentFromStorage]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const handlePaymentMessage = (event) => {
      const { type, payload } = event.data || {};
      if (type !== 'PROPERTY_VERIFICATION_PAYMENT' || !payload) return;

      if (payload.status === 'success' && payload.verificationPaymentId && payload.paymentId) {
        const updatedEntry = updateStoredPayment(payload.paymentId, {
          verified: true,
          verificationPaymentId: payload.verificationPaymentId,
          resumedAt: Date.now()
        });
        setPaymentStatus('completed');
        setVerificationPaymentId(payload.verificationPaymentId);
        setResumePaymentEntry(updatedEntry || {
          paymentId: payload.paymentId,
          verificationPaymentId: payload.verificationPaymentId,
          propertyId: property?.id,
          verified: true
        });
      } else if (payload.status === 'error') {
        setPaymentStatus('failed');
        setPaymentError(payload.message || 'Unable to verify payment. Please try again.');
        setResumePaymentEntry(null);
      }
    };

    window.addEventListener('message', handlePaymentMessage);
    return () => window.removeEventListener('message', handlePaymentMessage);
  }, [hydratePendingPaymentFromStorage]);

  const buildAuthHeaders = () => {
    const token = user?.token || getStoredToken();
    const fallbackEmail = user?.email;

    if (!token && !fallbackEmail) {
      return null;
    }

    const headers = {
      'Content-Type': 'application/json'
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    } else if (fallbackEmail) {
      headers['X-Mock-User-Email'] = fallbackEmail;
    }

    return headers;
  };

  const handleInitializePayment = async () => {
    console.log('🔥 handleInitializePayment called');
    console.log('🔥 User:', user);
    console.log('🔥 Verification fee:', verificationFee);
    
    const headers = buildAuthHeaders();
    console.log('🔥 Headers:', headers);

    if (!headers) {
      console.log('❌ No headers - authentication required');
      setPaymentError('Please sign in as a vendor/agent before paying the verification fee.');
      return;
    }

    setIsPaymentInitializing(true);
    setPaymentError('');
    console.log('🚀 Starting payment initialization...');

    try {
      const payload = {
        amount: verificationFee,
        paymentMethod: 'flutterwave',
        paymentType: 'property_verification',
        relatedEntity: {
          type: 'verification',
          id: property?.id || property?.slug || property?.propertyCode || 'property-verification'
        },
        description: `Property verification fee for ${formValues.propertyName || property?.title || 'selected property'}`,
        currency: 'NGN'
      };
      
      console.log('🔥 API Payload:', payload);
      console.log('🔥 API URL:', getApiUrl('/payments/initialize'));
      
      const response = await fetch(getApiUrl('/payments/initialize'), {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      console.log('🔥 Response status:', response.status);
      const data = await response.json();
      console.log('🔥 Response data:', data);
      if (!response.ok || !data.success) {
        const pd = data.data?.providerData || data.providerData || data.error?.providerData || data.error?.meta || {};
        const rawMsg = data.message || pd?.message || data.error?.message || '';
        const maxCandidates = [pd?.maximum_amount, pd?.maximumAmount, pd?.max_amount, pd?.maxAmount, pd?.max_charge, pd?.maxCharge];
        const foundMax = maxCandidates.find(v => Number.isFinite(Number(v))) || null;
        if (foundMax) {
          setProviderLimit(Number(foundMax));
          setPaymentError(`Charge amount must not exceed ${new Intl.NumberFormat('en-NG', {style: 'currency', currency: 'NGN', maximumFractionDigits:0}).format(Number(foundMax))}. Try Bank Transfer or split the payment.`);
          setIsPaymentInitializing(false);
          return;
        }

        if (/exceed|maximum|max/i.test(rawMsg)) {
          setPaymentError(rawMsg || 'Charge amount exceeds provider limit. Try another payment method.');
          setIsPaymentInitializing(false);
          return;
        }

        throw new Error(data.message || 'Failed to initialize verification payment');
      }

      const paymentRecord = data.data?.payment;
      // Handle both new format (data.payment) and old format (data.paymentId)
      const paymentId = paymentRecord?.id || data.data?.paymentId;
      
      if (!paymentId) {
        throw new Error('Payment reference missing from initialization response');
      }

      // Create a normalized payment record
      const normalizedPayment = paymentRecord || {
        id: data.data?.paymentId,
        amount: data.data?.amount,
        currency: data.data?.currency,
        status: data.data?.status,
        txRef: data.data?.txRef
      };

      const authorizationUrl = data.data?.providerData?.authorizationUrl || 
                               data.data?.providerData?.link || 
                               data.data?.paymentUrl || '';
      
      // Fix Flutterwave URL to use correct domain for CSP
      const correctedUrl = authorizationUrl.replace('https://flutterwave.com/', 'https://app.flutterwave.com/');
      
      const providerTxRef = data.data?.providerData?.txRef || data.data?.providerData?.tx_ref || normalizedPayment?.txRef;

      setPendingPayment(normalizedPayment);
      setPaymentStatus('processing');
      setVerificationPaymentId('');
      setCheckoutUrl(correctedUrl);

      saveInitiatedPayment({
        paymentId: normalizedPayment.id,
        reference: normalizedPayment.reference,
        txRef: providerTxRef || normalizedPayment.reference,
        propertyId: property?.id,
        storedAt: Date.now()
      });

      // Show the modal instead of popup
      if (correctedUrl) {
        setShowCheckoutModal(true);
      }
    } catch (err) {
      console.error('PropertyVerification: payment initialization error', err);
      setPaymentStatus('failed');
      setPaymentError(err?.message || 'Failed to initialize payment. Please try again.');
    } finally {
      setIsPaymentInitializing(false);
    }
  };

  const handleOpenCheckout = () => {
    if (!checkoutUrl || typeof window === 'undefined') return;
    setShowCheckoutModal(true);
  };

  const handleVerifyPayment = async () => {
    if (!pendingPayment?.id) {
      setPaymentError('Initialize the payment before attempting verification.');
      return;
    }

    const headers = buildAuthHeaders();
    if (!headers) {
      setPaymentError('Please sign in as a vendor/agent before verifying payment.');
      return;
    }

    setIsPaymentVerifying(true);
    setPaymentError('');

    try {
      const response = await fetch(getApiUrl(`/payments/${pendingPayment.id}/verify`), {
        method: 'POST',
        headers,
        body: JSON.stringify({ providerReference: pendingPayment.txRef || pendingPayment.metadata?.flutterwave?.txRef || pendingPayment.reference })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to verify payment');
      }

      const verifiedPayment = data.data;
      if (verifiedPayment.status !== 'completed') {
        throw new Error('Payment is not completed yet. Please finalize the Flutterwave checkout and try again.');
      }

      setPaymentStatus('completed');
      setVerificationPaymentId(verifiedPayment.id);
      setPendingPayment(verifiedPayment);
      const updatedEntry = updateStoredPayment(verifiedPayment.id, {
        verified: true,
        verificationPaymentId: verifiedPayment.id,
        resumedAt: Date.now()
      });
      setResumePaymentEntry(updatedEntry || {
        paymentId: verifiedPayment.id,
        verificationPaymentId: verifiedPayment.id,
        propertyId: property?.id,
        verified: true
      });
    } catch (err) {
      console.error('PropertyVerification: payment verification error', err);
      setPaymentStatus('failed');
      setPaymentError(err?.message || 'Unable to verify payment. Please try again.');
      setResumePaymentEntry(null);
    } finally {
      setIsPaymentVerifying(false);
    }
  };

  const hasCompletedPayment = paymentStatus === 'completed' && Boolean(verificationPaymentId);
  const paymentStatusLabel = (() => {
    switch (paymentStatus) {
      case 'processing':
        return 'Awaiting Flutterwave confirmation';
      case 'completed':
        return 'Payment verified';
      case 'failed':
        return 'Payment failed';
      default:
        return 'Not started';
    }
  })();

  const handleRequestVerification = async (event) => {
    event?.preventDefault();
    const storedToken = getStoredToken();
    const fallbackEmail = user?.email;

    if (!user && !storedToken) {
      setError('Please sign in as a vendor/agent before requesting verification.');
      return;
    }

    if (!formValues.propertyName || !formValues.propertyLocation) {
      setError('Property name and location are required.');
      return;
    }

    if (!hasCompletedPayment) {
      setError('Please complete and verify the verification fee payment before submitting.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const token = user?.token || storedToken;
      const headers = {
        'Content-Type': 'application/json'
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      } else if (fallbackEmail) {
        headers['X-Mock-User-Email'] = fallbackEmail;
      }

      const sanitizedUrl = sanitizePropertyUrl(formValues.propertyUrl || property?.shareUrl || property?.listingUrl);

      const payload = {
        propertyId: property?.id,
        propertyName: formValues.propertyName,
        propertyLocation: formValues.propertyLocation,
        message: formValues.message || 'Kindly verify this property so it can display the PropertyArk verified badge.',
        preferredBadgeColor: formValues.preferredBadgeColor || config?.verificationBadgeColor,
        verificationPaymentId
      };

      if (sanitizedUrl) {
        payload.propertyUrl = sanitizedUrl;
      }

      const response = await fetch(getApiUrl('/verification/applications'), {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        const errorDetails = data.errors?.map(e => `${e.field}: ${e.message}`).join(', ') || '';
        const fullMessage = errorDetails ? `${data.message} (${errorDetails})` : (data.message || 'Failed to submit verification request');
        console.error('PropertyVerification: validation errors', data.errors);
        throw new Error(fullMessage);
      }

      const successPayload = {
        message: 'Verification request submitted successfully! Our admin team will review it soon.',
        application: data.data
      };

      setSuccessMessage(successPayload.message);
      onSuccess?.(successPayload);

      if (resumePaymentEntry?.paymentId) {
        removeStoredPayment(resumePaymentEntry.paymentId);
      } else if (pendingPayment?.id) {
        removeStoredPayment(pendingPayment.id);
      } else if (payload?.verificationPaymentId) {
        removeStoredPayment(payload.verificationPaymentId);
      }

      setResumePaymentEntry(null);
    } catch (err) {
      console.error('PropertyVerification: submit error', err);
      setError(err?.message || 'Failed to submit verification request. Please try again.');
    } finally {
      setLoading(false);
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
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-2xl font-bold text-green-600">
                  {formatCurrency(property.price)}
                </span>
                <span className="text-sm text-gray-500">
                  {formValues.propertyLocation || 'Location not specified'}
                </span>
              </div>
            </div>

            {configError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                <div className="flex items-center">
                  <FaExclamationTriangle className="mr-2" />
                  {configError}
                </div>
              </div>
            )}

            {configLoading ? (
              <div className="bg-white border border-gray-200 rounded-lg p-6 text-center text-gray-500">
                Loading verification configuration...
              </div>
            ) : (
              <form className="space-y-5" onSubmit={handleRequestVerification}>
                <div className="bg-white border border-blue-100 rounded-lg p-4 space-y-4">
                  {resumePaymentEntry?.verified && resumePaymentEntry?.verificationPaymentId && (
                    <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded flex items-start gap-3">
                      <FaCheckCircle className="text-green-500 mt-1" />
                      <div>
                        <p className="font-semibold">Payment already verified</p>
                        <p className="text-sm text-green-700">
                          We detected a completed payment from your previous session. Click "Submit verification request" to finish without paying again.
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                      <FaCreditCard className="text-xl" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <p className="text-base font-semibold text-gray-900">Step 1: Pay the verification fee</p>
                          <p className="text-sm text-gray-600">Flutterwave checkout opens in a secure window.</p>
                        </div>
                        <span
                          className={`text-xs font-semibold uppercase tracking-wide px-2 py-1 rounded-full ${
                            paymentStatus === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : paymentStatus === 'failed'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {paymentStatusLabel}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-gray-600">
                        Fee due: <span className="font-semibold text-gray-900">{formatCurrency(verificationFee)}</span>
                      </p>
                      {pendingPayment?.reference && (
                        <p className="mt-1 text-xs text-gray-500">Payment reference: {pendingPayment.reference}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={handleInitializePayment}
                      disabled={isPaymentInitializing}
                      className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isPaymentInitializing ? (
                        <>
                          <FaSpinner className="animate-spin" />
                          Initializing Flutterwave checkout...
                        </>
                      ) : (
                        'Start Flutterwave Checkout'
                      )}
                    </button>

                    {checkoutUrl && paymentStatus === 'processing' && (
                      <button
                        type="button"
                        onClick={handleOpenCheckout}
                        className="w-full border border-blue-200 text-blue-700 py-2.5 rounded-lg hover:bg-blue-50"
                      >
                        Launch Flutterwave Checkout window
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleVerifyPayment}
                      disabled={isPaymentVerifying || paymentStatus === 'completed'}
                      className="w-full border border-green-200 text-green-700 py-2.5 rounded-lg hover:bg-green-50 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isPaymentVerifying ? (
                        <>
                          <FaSpinner className="animate-spin" />
                          Verifying payment...
                        </>
                      ) : (
                        "I've completed payment - Verify now"
                      )}
                    </button>

                    {paymentError && (
                      <p className="text-sm text-red-600">{paymentError}</p>
                    )}
                    {providerLimit && (
                      <p className="text-sm text-gray-700 mt-2">Suggested: split the payment into smaller amounts or use Bank Transfer for large payments.</p>
                    )}
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <FaCheckCircle className="text-blue-500 text-3xl" />
                    <div>
                      <h3 className="text-lg font-semibold">Boost trust with a Verified badge</h3>
                      <p className="text-sm text-blue-900/80">
                        The badge highlights that your property has passed PropertyArk compliance checks.
                      </p>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 flex flex-col gap-2 border border-blue-100">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Verification Fee:</span>
                      <span className="text-2xl font-bold text-green-600">{formatCurrency(verificationFee)}</span>
                    </div>
                    <p className="text-xs text-gray-500">One-time fee. Includes badge issuance & compliance review.</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Property name *</label>
                  <input
                    type="text"
                    value={formValues.propertyName}
                    onChange={(event) => setFormValues((prev) => ({ ...prev, propertyName: event.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Pearl Towers Ikoyi"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Listing URL</label>
                  <input
                    type="url"
                    value={formValues.propertyUrl}
                    onChange={(event) => setFormValues((prev) => ({ ...prev, propertyUrl: event.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://propertyark.com/property/..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Property location *</label>
                  <input
                    type="text"
                    value={formValues.propertyLocation}
                    onChange={(event) => setFormValues((prev) => ({ ...prev, propertyLocation: event.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Lekki Phase 1, Lagos"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message to compliance team</label>
                  <textarea
                    rows={4}
                    value={formValues.message}
                    onChange={(event) => setFormValues((prev) => ({ ...prev, message: event.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Share any approvals, CAC documents or highlights here"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Preferred badge color</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="color"
                      value={badgePreviewColor}
                      onChange={(event) => setFormValues((prev) => ({ ...prev, preferredBadgeColor: event.target.value }))}
                      className="h-12 w-16 rounded-md border border-gray-200 cursor-pointer"
                    />
                    <div className="text-sm text-gray-600">
                      <p>Preview:</p>
                      <div
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-white font-medium"
                        style={{ backgroundColor: badgePreviewColor }}
                      >
                        <FaShieldAlt /> PropertyArk Verified
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !hasCompletedPayment}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      Submitting request...
                    </>
                  ) : (
                    (hasCompletedPayment ? 'Submit verification request' : `Pay ${formatCurrency(verificationFee)} & Submit`)
                  )}
                </button>
              </form>
            )}

            {successMessage && (
              <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
                {successMessage}
              </div>
            )}
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

      {/* Flutterwave Checkout Modal */}
      {showCheckoutModal && checkoutUrl && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full md:max-w-5xl lg:max-w-6xl max-h-[95vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Flutterwave Payment</h3>
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="text-gray-500 hover:text-gray-700 bg-gray-100 rounded-full p-2 hover:bg-gray-200 transition-colors"
                aria-label="Close checkout"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <iframe
                src={checkoutUrl}
                title="Flutterwave Checkout"
                className="w-full h-[75vh] min-h-[640px] border-none"
                allow="payment"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
                onLoad={(e) => {
                  // Check if iframe loaded successfully
                  try {
                    const iframeContent = e.target.contentWindow?.document?.body;
                    if (!iframeContent) {
                      // Iframe blocked by CSP, fallback to new window
                      console.warn('PropertyVerification: Iframe blocked by CSP, opening in new window');
                      window.open(checkoutUrl, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
                      setShowCheckoutModal(false);
                    }
                  } catch (error) {
                    // CSP blocked access, open in new window
                    console.warn('PropertyVerification: CSP blocked iframe, opening in new window');
                    window.open(checkoutUrl, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
                    setShowCheckoutModal(false);
                  }
                }}
                onError={() => {
                  // Iframe failed to load, try mock payment
                  console.warn('PropertyVerification: Iframe load error, trying mock payment');
                  const mockUrl = `https://real-estate-marketplace-37544.web.app/mock-payment.html?amount=${pendingPayment?.amount || 50000}&tx_ref=${pendingPayment?.txRef || 'test'}`;
                  window.open(mockUrl, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
                  setShowCheckoutModal(false);
                }}
              />
              
              {/* Fallback button if iframe doesn't work */}
              <div className="p-4 text-center border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-3">
                  If the payment form doesn't load above, click below to open in a new window
                </p>
                <button
                  onClick={() => {
                    // Try the original URL first, then fallback to mock payment
                    if (checkoutUrl.includes('mock-payment')) {
                      window.open(checkoutUrl, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
                    } else {
                      const mockUrl = `https://real-estate-marketplace-37544.web.app/mock-payment.html?amount=${pendingPayment?.amount || 50000}&tx_ref=${pendingPayment?.txRef || 'test'}`;
                      window.open(mockUrl, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
                    }
                    setShowCheckoutModal(false);
                  }}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Open Payment in New Window
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyVerification;

import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getApiUrl } from '../utils/apiConfig';
import LoadingSpinner from '../components/LoadingSpinner';

const CALLBACK_STORAGE_KEY = 'propertyVerificationPayments';

const readStoredPayments = () => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CALLBACK_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.warn('PaymentCallback: unable to read stored payments', error);
    return [];
  }
};

const writeStoredPayments = (entries) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CALLBACK_STORAGE_KEY, JSON.stringify(entries));
  } catch (error) {
    console.warn('PaymentCallback: unable to write stored payments', error);
  }
};

const PaymentCallback = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Processing payment confirmation...');
  const [details, setDetails] = useState('Hold on while we confirm your payment status.');

  const callbackInfo = useMemo(() => ({
    status: searchParams.get('status'),
    txRef: searchParams.get('tx_ref') || searchParams.get('txRef'),
    transactionId: searchParams.get('transaction_id') || searchParams.get('transactionId'),
    processor: searchParams.get('processor')
  }), [searchParams]);

  useEffect(() => {
    const { txRef, status: paymentStatus } = callbackInfo;

    if (!txRef) {
      setStatus('error');
      setMessage('Missing payment reference');
      setDetails('Unable to determine which payment to verify.');
      return;
    }

    const storedEntries = readStoredPayments();
    const entry = storedEntries.find((item) => item.txRef === txRef || item.reference === txRef);

    if (!entry) {
      setStatus('error');
      setMessage('Payment reference not found');
      setDetails('Please return to the verification form and start the payment again.');
      return;
    }

    verifyPayment(entry, paymentStatus, storedEntries);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callbackInfo]);

  const buildHeaders = () => {
    const token = user?.token || (() => {
      try {
        return localStorage.getItem('token');
      } catch {
        return null;
      }
    })();

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

  const verifyPayment = async (entry, paymentStatus, storedEntries) => {
    const headers = buildHeaders();

    if (!headers) {
      setStatus('error');
      setMessage('Sign in required');
      setDetails('Please log in again to complete verification.');
      return;
    }

    try {
      setStatus('verifying');
      setMessage('Verifying payment...');
      setDetails('Hold on while we confirm your payment status.');

      const response = await fetch(getApiUrl(`/payments/${entry.paymentId}/verify`), {
        method: 'POST',
        headers,
        body: JSON.stringify({ txRef: entry.txRef, status: paymentStatus })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Payment verification failed');
      }

      if (data.data?.status !== 'completed') {
        setStatus('pending');
        setMessage('Payment still processing');
        setDetails('We have not received confirmation from Flutterwave yet. Please try again shortly.');
        return;
      }

      const updatedEntries = storedEntries.map((item) =>
        item.paymentId === entry.paymentId
          ? {
              ...item,
              verified: true,
              verificationPaymentId: data.data.id
            }
          : item
      );
      writeStoredPayments(updatedEntries);

      const messagePayload = {
        type: 'PROPERTY_VERIFICATION_PAYMENT',
        payload: {
          paymentId: entry.paymentId,
          verificationPaymentId: data.data.id,
          status: 'success'
        }
      };

      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(messagePayload, '*');
      }

      if (window.parent && window.parent !== window) {
        window.parent.postMessage(messagePayload, '*');
      }

      setStatus('success');
      setMessage('Payment verified successfully');
      setDetails('You can now return to the verification request modal to finish submission.');

      setTimeout(() => {
        window.close();
        if (entry.propertyId) {
          navigate(`/property/${entry.propertyId}?verification=completed`, { replace: true });
        }
      }, 1500);
    } catch (error) {
      console.error('PaymentCallback: verification error', error);
      setStatus('error');
      setMessage('Unable to verify payment');
      setDetails(error?.message || 'Please try again from the verification page.');

      const messagePayload = {
        type: 'PROPERTY_VERIFICATION_PAYMENT',
        payload: {
          paymentId: entry?.paymentId,
          status: 'error',
          message: error?.message || 'Verification failed'
        }
      };

      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(messagePayload, '*');
      }

      if (window.parent && window.parent !== window) {
        window.parent.postMessage(messagePayload, '*');
      }
    }
  };

  const StatusIcon = () => {
    switch (status) {
      case 'success':
        return <span className="text-green-600 text-4xl">✔</span>;
      case 'error':
        return <span className="text-red-500 text-4xl">✖</span>;
      case 'pending':
        return <span className="text-amber-500 text-4xl">⏳</span>;
      default:
        return <LoadingSpinner size="lg" />;
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <div className="bg-white shadow-lg rounded-2xl p-8 text-center space-y-4">
        <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-gray-100">
          <StatusIcon />
        </div>
        <h1 className="text-2xl font-semibold text-gray-900">Flutterwave Payment Callback</h1>
        <p className="text-gray-600">{message}</p>
        {details && <p className="text-sm text-gray-500">{details}</p>}
        {callbackInfo.txRef && (
          <div className="text-xs text-gray-400">Reference: {callbackInfo.txRef}</div>
        )}
        <div className="pt-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:underline"
          >
            Go back
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentCallback;

import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

/**
 * Custom hook for managing payments
 * Handles payment initialization, verification, and error handling
 */
export const usePayments = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);

  // Initialize payment
  const initializePayment = useCallback(async (amount, paymentMethod = 'paystack', metadata = {}) => {
    if (!user) {
      toast.error('Please login to make a payment');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount,
          paymentMethod,
          metadata
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to initialize payment');
      }

      const data = await response.json();
      setPaymentStatus('initialized');
      return data.data;
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
      console.error('Error initializing payment:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Verify payment
  const verifyPayment = useCallback(async (paymentReference) => {
    if (!paymentReference) {
      toast.error('Payment reference is required');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/payments/verify/${paymentReference}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to verify payment');
      }

      const data = await response.json();
      
      if (data.data?.status === 'success') {
        setPaymentStatus('verified');
        toast.success('Payment verified successfully');
      } else if (data.data?.status === 'pending') {
        setPaymentStatus('pending');
        toast.info('Payment is pending verification');
      } else {
        setPaymentStatus('failed');
        throw new Error('Payment verification failed');
      }

      return data.data;
    } catch (err) {
      setError(err.message);
      setPaymentStatus('failed');
      toast.error(err.message);
      console.error('Error verifying payment:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle payment error
  const handlePaymentError = useCallback((errorMessage) => {
    setError(errorMessage);
    setPaymentStatus('failed');
    toast.error(errorMessage);
    console.error('Payment error:', errorMessage);
  }, []);

  // Reset payment state
  const resetPaymentState = useCallback(() => {
    setLoading(false);
    setError(null);
    setPaymentStatus(null);
  }, []);

  return {
    loading,
    error,
    paymentStatus,
    initializePayment,
    verifyPayment,
    handlePaymentError,
    resetPaymentState
  };
};

export default usePayments;

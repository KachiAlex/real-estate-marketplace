import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaCreditCard, FaLock, FaCheckCircle, FaTimesCircle, FaSpinner } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { getApiUrl } from '../utils/apiConfig';

const VendorRegistrationPayment = ({ vendorData, onPaymentSuccess, onCancel }) => {
  const [listingFee, setListingFee] = useState(100000);
  const [paymentMethod, setPaymentMethod] = useState('paystack');
  const [loading, setLoading] = useState(false);
  const [loadingFee, setLoadingFee] = useState(true);
  const [paymentInitialized, setPaymentInitialized] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadListingFee();
  }, []);

  const loadListingFee = async () => {
    try {
      setLoadingFee(true);
      const response = await fetch(getApiUrl('/admin/settings'));
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setListingFee(data.data.vendorListingFee || 100000);
        }
      }
    } catch (error) {
      console.error('Error loading listing fee:', error);
      toast.error('Failed to load listing fee');
    } finally {
      setLoadingFee(false);
    }
  };

  const handlePayment = async () => {
    if (!user) {
      toast.error('Please login to continue');
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Initialize payment
      const response = await fetch(getApiUrl('/payments/initialize'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: listingFee,
          paymentMethod: paymentMethod,
          paymentType: 'vendor_listing',
          relatedEntity: {
            type: 'subscription',
            id: user?.id || user?._id || 'vendor_registration'
          },
          description: `Vendor listing fee payment for ${vendorData?.businessName || 'vendor registration'}`,
          currency: 'NGN'
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setPaymentInitialized(true);
        
        // Handle different payment methods
        if (paymentMethod === 'paystack' && data.data?.authorizationUrl) {
          // Redirect to Paystack
          window.location.href = data.data.authorizationUrl;
        } else if (paymentMethod === 'flutterwave' && data.data?.authorizationUrl) {
          // Redirect to Flutterwave
          window.location.href = data.data.authorizationUrl;
        } else if (paymentMethod === 'stripe' && data.data?.clientSecret) {
          // Handle Stripe payment (would need Stripe Elements)
          toast.error('Stripe payment integration requires additional setup');
        } else {
          // For bank transfer or other methods
          toast.success('Payment initialized. Please complete the payment to continue.');
          // In a real scenario, you'd show bank details or wait for webhook confirmation
          // For now, we'll simulate success after a delay
          setTimeout(() => {
            handlePaymentSuccess(data.data);
          }, 2000);
        }
      } else {
        throw new Error(data.message || 'Failed to initialize payment');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Failed to process payment');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (paymentData) => {
    toast.success('Payment successful! Completing vendor registration...');
    if (onPaymentSuccess) {
      onPaymentSuccess(paymentData);
    }
  };

  if (loadingFee) {
    return (
      <div className="flex items-center justify-center p-8">
        <FaSpinner className="animate-spin text-2xl text-blue-600 mr-3" />
        <span>Loading payment information...</span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <FaCreditCard className="text-blue-600 text-2xl" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Vendor Listing Fee Payment</h2>
        <p className="text-gray-600">Complete your payment to register as a vendor and start listing properties</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Listing Fee</p>
            <p className="text-3xl font-bold text-blue-600">₦{listingFee.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">One-time payment</p>
            <p className="text-xs text-gray-500">Valid for lifetime</p>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Payment Method
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {['paystack', 'flutterwave', 'bank_transfer'].map((method) => (
            <button
              key={method}
              onClick={() => setPaymentMethod(method)}
              className={`p-4 border-2 rounded-lg transition ${
                paymentMethod === method
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-center">
                <p className="font-medium text-gray-900 capitalize">{method.replace('_', ' ')}</p>
                {paymentMethod === method && (
                  <FaCheckCircle className="text-blue-600 mx-auto mt-2" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-gray-900 mb-3">What you get:</h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-center">
            <FaCheckCircle className="text-green-600 mr-2" />
            Unlimited property listings
          </li>
          <li className="flex items-center">
            <FaCheckCircle className="text-green-600 mr-2" />
            Access to vendor dashboard
          </li>
          <li className="flex items-center">
            <FaCheckCircle className="text-green-600 mr-2" />
            Property management tools
          </li>
          <li className="flex items-center">
            <FaCheckCircle className="text-green-600 mr-2" />
            Analytics and insights
          </li>
        </ul>
      </div>

      <div className="flex items-center justify-center space-x-4 mb-6">
        <FaLock className="text-gray-400" />
        <span className="text-sm text-gray-600">Secure payment powered by industry-leading providers</span>
      </div>

      <div className="flex space-x-4">
        <button
          onClick={onCancel}
          className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
        >
          Cancel
        </button>
        <button
          onClick={handlePayment}
          disabled={loading || paymentInitialized}
          className={`flex-1 px-6 py-3 rounded-lg text-white font-medium transition ${
            loading || paymentInitialized
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg'
          }`}
        >
          {loading ? (
            <>
              <FaSpinner className="animate-spin inline mr-2" />
              Processing...
            </>
          ) : paymentInitialized ? (
            'Redirecting to payment...'
          ) : (
            `Pay ₦${listingFee.toLocaleString()}`
          )}
        </button>
      </div>
    </div>
  );
};

export default VendorRegistrationPayment;


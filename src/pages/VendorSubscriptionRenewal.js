import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { getApiUrl } from '../utils/apiConfig';
import { authenticatedFetch } from '../utils/authToken';

const VendorSubscriptionRenewal = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [paymentComplete, setPaymentComplete] = useState(false);

  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await authenticatedFetch(getApiUrl('/vendor/status'));
      if (response.ok) {
        const data = await response.json();
        setSubscriptionData(data);
      }
    } catch (error) {
      toast.error('Failed to fetch subscription status');
    }
  };

  const handlePayment = async () => {
    setLoading(true);
    try {
      // Initialize Paystack payment
      const response = await authenticatedFetch(getApiUrl('/vendor/renew'), {
        method: 'POST',
        body: JSON.stringify({
          paymentReference: `REF_${Date.now()}`,
          paymentMethod: 'paystack'
        })
      });

      if (response.ok) {
        setPaymentComplete(true);
        toast.success('Subscription renewed successfully!');
        setTimeout(() => {
          navigate('/vendor/dashboard');
        }, 2000);
      } else {
        toast.error('Payment failed. Please try again.');
      }
    } catch (error) {
      toast.error('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (paymentComplete) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-green-600">✓</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
          <p className="text-gray-600 mb-4">
            Your subscription has been renewed successfully.
          </p>
          <p className="text-sm text-gray-500">
            Redirecting to your dashboard...
          </p>
        </div>
      </div>
    );
  }

  const isExpired = subscriptionData?.subscription?.isExpired;
  const daysUntilExpiry = subscriptionData?.subscription?.daysUntilExpiry || 0;
  const subscriptionAmount = subscriptionData?.subscription?.amount || 50000;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Subscription Renewal</h1>
          <p className="text-gray-600">Renew your vendor subscription to continue accessing all features</p>
        </div>

        {/* Subscription Status Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Current Status</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              isExpired
                ? 'bg-red-100 text-red-800'
                : daysUntilExpiry <= 7
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-green-100 text-green-800'
            }`}>
              {isExpired ? 'Expired' : daysUntilExpiry <= 7 ? 'Expiring Soon' : 'Active'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">₦{subscriptionAmount.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Monthly Fee</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {subscriptionData?.subscription?.nextDue
                  ? new Date(subscriptionData.subscription.nextDue).toLocaleDateString()
                  : 'N/A'
                }
              </div>
              <div className="text-sm text-gray-600">Next Due Date</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {daysUntilExpiry > 0 ? `${daysUntilExpiry} days` : 'Expired'}
              </div>
              <div className="text-sm text-gray-600">Days Remaining</div>
            </div>
          </div>

          {isExpired && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-center">
                <span className="text-red-600 mr-2">⚠️</span>
                <div>
                  <h3 className="font-medium text-red-900">Subscription Expired</h3>
                  <p className="text-sm text-red-800">
                    Your account has been suspended. Renew now to regain access to all vendor features.
                  </p>
                </div>
              </div>
            </div>
          )}

          {daysUntilExpiry <= 7 && !isExpired && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-center">
                <span className="text-yellow-600 mr-2">⏰</span>
                <div>
                  <h3 className="font-medium text-yellow-900">Renewal Due Soon</h3>
                  <p className="text-sm text-yellow-800">
                    Your subscription expires in {daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''}.
                    Renew now to avoid service interruption.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Payment Card */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Renew Subscription</h2>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium text-blue-900">Monthly Subscription</span>
              <span className="text-2xl font-bold text-blue-600">₦{subscriptionAmount.toLocaleString()}</span>
            </div>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Continue accessing all vendor features</li>
              <li>• List and manage your properties</li>
              <li>• Access to buyer inquiries</li>
              <li>• Priority customer support</li>
            </ul>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-gray-900 mb-2">Payment Method</h3>
            <div className="flex items-center">
              <img
                src="https://cdn.paystack.com/assets/img/paystack-logo.png"
                alt="Paystack"
                className="h-8 mr-3"
              />
              <div>
                <div className="font-medium text-gray-900">Paystack</div>
                <div className="text-sm text-gray-600">Secure payment processing</div>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-yellow-900 mb-2">Important:</h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Subscription renews automatically each month</li>
              <li>• You can cancel anytime from your dashboard</li>
              <li>• Late payments may incur additional fees</li>
              <li>• Account suspension occurs after 7 days of non-payment</li>
            </ul>
          </div>

          <button
            onClick={handlePayment}
            disabled={loading}
            className="w-full py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium text-lg"
          >
            {loading ? 'Processing Payment...' : `Pay ₦${subscriptionAmount.toLocaleString()} & Renew`}
          </button>

          <p className="text-xs text-gray-500 text-center mt-4">
            By proceeding, you agree to our terms of service and subscription policy.
          </p>
        </div>

        {/* Back to Dashboard */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/vendor/dashboard')}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default VendorSubscriptionRenewal;

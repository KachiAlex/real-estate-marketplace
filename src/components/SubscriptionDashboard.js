import React, { useState, useEffect, useMemo } from 'react';
import { FaCreditCard, FaCalendarAlt, FaExclamationTriangle, FaCheckCircle, FaTimesCircle, FaClock, FaShieldAlt, FaStar, FaChartLine, FaUsers, FaHome } from 'react-icons/fa';
import { getApiUrl } from '../utils/apiConfig';
import { useAuth } from '../contexts/AuthContext';
import { authenticatedFetch } from '../utils/authToken';
import SubscriptionPaymentModal from './SubscriptionPaymentModal';

const SubscriptionDashboard = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [plans, setPlans] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [countdown, setCountdown] = useState(null);

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const countdownTarget = useMemo(() => {
    if (!subscriptionStatus && !subscription) return null;

    const labelFor = (type) => {
      if (type === 'trial') return 'Trial ends in';
      return 'Next billing in';
    };

    if (subscription?.trialEndDate && subscriptionStatus?.status === 'trial') {
      return {
        label: labelFor('trial'),
        date: new Date(subscription.trialEndDate)
      };
    }

    const nextDateString = subscription?.nextPaymentDate || subscriptionStatus?.nextPaymentDate;
    if (nextDateString) {
      return {
        label: labelFor('billing'),
        date: new Date(nextDateString)
      };
    }

    return null;
  }, [subscriptionStatus, subscription]);

  useEffect(() => {
    if (!countdownTarget?.date) {
      setCountdown(null);
      return;
    }

    const updateCountdown = () => {
      const now = new Date();
      const diff = countdownTarget.date.getTime() - now.getTime();

      if (diff <= 0) {
        setCountdown({ label: countdownTarget.label, expired: true, display: 'Due now' });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      const pad = (value) => String(value).padStart(2, '0');
      const display = `${days}d ${pad(hours)}h:${pad(minutes)}m:${pad(seconds)}s`;

      setCountdown({
        label: countdownTarget.label,
        display,
        nextDate: countdownTarget.date
      });
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);

    return () => clearInterval(timer);
  }, [countdownTarget]);

  const currentPlanDetails = useMemo(() => {
    if (!plans?.length || !subscription) return null;
    return plans.find((plan) => plan.id === subscription.planId || plan.name === subscription.plan) || null;
  }, [plans, subscription]);

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true);
      
      // Fetch subscription status
      const statusResponse = await authenticatedFetch(getApiUrl('/subscription/status'));
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        setSubscriptionStatus(statusData.data);
      }

      // Fetch current subscription
      const subResponse = await authenticatedFetch(getApiUrl('/subscription/current'));
      if (subResponse.ok) {
        const subData = await subResponse.json();
        setSubscription(subData.data);
      }

      // Fetch available plans
      const plansResponse = await fetch(getApiUrl('/subscription/plans'));
      if (plansResponse.ok) {
        const plansData = await plansResponse.json();
        setPlans(plansData.data);
      }

      // Fetch payment history
      const paymentsResponse = await authenticatedFetch(getApiUrl('/subscription/payments'));
      if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json();
        setPayments(paymentsData.data);
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error);
      setError('Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'trial':
        return <FaClock className="text-yellow-500" />;
      case 'active':
        return <FaCheckCircle className="text-green-500" />;
      case 'expired':
        return <FaExclamationTriangle className="text-red-500" />;
      case 'suspended':
        return <FaTimesCircle className="text-gray-600" />;
      case 'cancelled':
        return <FaTimesCircle className="text-gray-500" />;
      default:
        return <FaExclamationTriangle className="text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'trial':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'expired':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'suspended':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-600 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const formatCurrency = (amount, currency = 'NGN') => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const defaultPlan = useMemo(() => ({
    id: 'vendor-default-plan',
    name: 'Vendor Subscription',
    amount: subscription?.amount || subscriptionStatus?.suggestedAmount || 50000,
    billingCycle: subscription?.billingCycle || subscription?.interval || 'monthly',
    features: {
      property_listings: true,
      escrow_support: true,
      analytics: true,
      premium_support: false
    }
  }), [subscription, subscriptionStatus]);

  const handlePayment = (plan) => {
    setSelectedPlan(plan);
    setShowPaymentModal(true);
  };

  const resolveDefaultPlan = () => {
    if (plans && plans.length > 0) return plans[0];
    if (currentPlanDetails) return currentPlanDetails;
    return defaultPlan;
  };

  const handleRenewCurrentPlan = () => {
    const planToUse = currentPlanDetails || resolveDefaultPlan();
    if (!planToUse) {
      setError('No subscription plan available yet. Please contact support.');
      return;
    }
    handlePayment(planToUse);
  };

  const handleSubscribeNow = () => {
    const planToUse = resolveDefaultPlan();
    if (!planToUse) {
      setError('No subscription plan available yet. Please contact support.');
      return;
    }
    handlePayment(planToUse);
  };

  const handlePaymentSuccess = (paymentData) => {
    // Refresh subscription data
    fetchSubscriptionData();
    setError('');
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm('Are you sure you want to cancel your subscription?')) {
      return;
    }

    try {
      const response = await authenticatedFetch(getApiUrl('/subscription/cancel'), {
        method: 'POST'
      });

      const result = await response.json();

      if (result.success) {
        fetchSubscriptionData();
      } else {
        setError(result.message || 'Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Cancel error:', error);
      setError('Failed to cancel subscription');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Subscription Management</h2>
            <p className="text-gray-600">Manage your vendor subscription and billing</p>
          </div>
          <button
            onClick={handleSubscribeNow}
            disabled={loading}
            className={`inline-flex items-center justify-center px-4 py-2 rounded-lg text-white transition-colors ${loading ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            <FaCreditCard className="mr-2" />
            Subscribe Now
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <FaExclamationTriangle className="text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Subscription Status Card */}
      {subscriptionStatus && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Current Status</h3>
            <div className={`flex items-center px-3 py-1 rounded-full border ${getStatusColor(subscriptionStatus.status)}`}>
              {getStatusIcon(subscriptionStatus.status)}
              <span className="ml-2 text-sm font-medium capitalize">{subscriptionStatus.status}</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Status Message:</span>
              <span className="font-medium">{subscriptionStatus.message}</span>
            </div>

            {subscriptionStatus.trialDaysRemaining > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Trial Days Remaining:</span>
                <span className="font-medium">{subscriptionStatus.trialDaysRemaining} days</span>
              </div>
            )}

            {subscription && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Plan:</span>
                  <span className="font-medium">{subscription.plan}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-medium">{formatCurrency(subscription.amount)}</span>
                </div>
                {subscription.trialEndDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Trial Ends:</span>
                    <span className="font-medium">{formatDate(subscription.trialEndDate)}</span>
                  </div>
                )}
                {subscription.nextPaymentDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Next Payment:</span>
                    <span className="font-medium">{formatDate(subscription.nextPaymentDate)}</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex space-x-4">
            {subscriptionStatus.needsPayment && (
              <button
                onClick={() => setShowPaymentModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FaCreditCard className="inline mr-2" />
                Pay Now
              </button>
            )}
            
            {subscription && subscription.status === 'active' && (
              <button
                onClick={handleCancelSubscription}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                <FaTimesCircle className="inline mr-2" />
                Cancel Subscription
              </button>
            )}
          </div>
        </div>
      )}

      {/* Countdown / Renewal Card */}
      {countdown && (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-blue-100">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <p className="text-sm uppercase tracking-wide text-blue-500 font-semibold">{countdown.label}</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{countdown.display}</p>
              {countdown.nextDate && (
                <p className="text-sm text-gray-500 mt-1">
                  Next cycle date: <span className="font-medium">{formatDate(countdown.nextDate)}</span>
                </p>
              )}
            </div>
            <div className="flex flex-col items-start md:items-end gap-2">
              <p className="text-sm text-gray-600">
                Keep your listings live by renewing before the timer hits zero.
              </p>
              <button
                onClick={handleRenewCurrentPlan}
                className="inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FaCreditCard className="mr-2" />
                {subscriptionStatus?.status === 'trial' ? 'Activate plan' : 'Renew subscription'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Available Plans */}
      {plans.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Plans</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div key={plan.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900">{plan.name}</h4>
                  <p className="text-2xl font-bold text-blue-600 mt-2">
                    {formatCurrency(plan.amount)}
                    <span className="text-sm text-gray-500 font-normal">/{plan.billingCycle}</span>
                  </p>
                </div>

                <div className="space-y-2 mb-4">
                  {plan.features && Object.entries(plan.features).map(([key, value]) => (
                    <div key={key} className="flex items-center text-sm">
                      {value ? (
                        <FaCheckCircle className="text-green-500 mr-2" />
                      ) : (
                        <FaTimesCircle className="text-gray-400 mr-2" />
                      )}
                      <span className="text-gray-700 capitalize">
                        {key.replace(/_/g, ' ')}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handlePayment(plan)}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Select Plan
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Default Plan</h3>
              <p className="text-sm text-gray-500">Admin has not configured custom plans yet. The default vendor plan is available below.</p>
            </div>
            <span className="text-sm font-medium text-gray-600">₦{defaultPlan.amount?.toLocaleString()} / month</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="font-semibold text-gray-800 mb-1">What's included</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Property listings</li>
                <li>Escrow & support</li>
                <li>Basic analytics</li>
              </ul>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="font-semibold text-gray-800 mb-1">Billing</p>
              <p>₦{defaultPlan.amount?.toLocaleString()} every {defaultPlan.billingCycle}</p>
              <p className="text-xs text-gray-500 mt-1">Price can be updated by admin anytime.</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg flex flex-col gap-3 justify-between">
              <p className="font-semibold text-gray-800">Ready to activate?</p>
              <button
                onClick={() => handlePayment(defaultPlan)}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Subscribe Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment History */}
      {payments.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(payment.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payment.paymentMethod}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        payment.status === 'success' 
                          ? 'bg-green-100 text-green-800'
                          : payment.status === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.transactionReference || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Onboarding Warning */}
      {subscriptionStatus && subscriptionStatus.status === 'trial' && subscriptionStatus.trialDaysRemaining > 60 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            <FaShieldAlt className="text-blue-500 mt-1 mr-3 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">Important Notice</h4>
              <div className="text-blue-800 space-y-2">
                <p>• You have a 3-month free trial period</p>
                <p>• After trial: N50,000/month subscription fee</p>
                <p>• Auto-payment via Paystack</p>
                <p>• <strong>Falsified details = Immediate suspension</strong></p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      <SubscriptionPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        plan={selectedPlan}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
};

export default SubscriptionDashboard;

import React, { useState, useEffect } from 'react';
import { FaClock, FaCheckCircle, FaExclamationTriangle, FaTimesCircle, FaCreditCard } from 'react-icons/fa';
import { getApiUrl } from '../utils/apiConfig';
import { useAuth } from '../contexts/AuthContext';
import { authenticatedFetch } from '../utils/authToken';

const SubscriptionStatus = ({ compact = false, showActions = false }) => {
  const { user } = useAuth();
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.roles?.includes('vendor') || user?.role === 'vendor') {
      fetchSubscriptionStatus();
    }
  }, [user]);

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await authenticatedFetch(getApiUrl('/subscription/status'));
      if (response.ok) {
        const data = await response.json();
        setSubscriptionStatus(data.data);
      }
    } catch (error) {
      console.error('Error fetching subscription status:', error);
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

  const handlePayment = () => {
    // Navigate to subscription dashboard or open payment modal
    window.location.href = '/dashboard?tab=subscription';
  };

  if (loading) {
    return compact ? (
      <div className="animate-pulse h-6 w-20 bg-gray-200 rounded"></div>
    ) : (
      <div className="animate-pulse h-12 w-48 bg-gray-200 rounded"></div>
    );
  }

  if (!subscriptionStatus) {
    return null;
  }

  if (compact) {
    return (
      <div className={`flex items-center px-3 py-1 rounded-full border ${getStatusColor(subscriptionStatus.status)}`}>
        {getStatusIcon(subscriptionStatus.status)}
        <span className="ml-2 text-xs font-medium capitalize">{subscriptionStatus.status}</span>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border p-4 ${getStatusColor(subscriptionStatus.status)}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {getStatusIcon(subscriptionStatus.status)}
          <div className="ml-3">
            <h4 className="font-semibold capitalize">{subscriptionStatus.status}</h4>
            <p className="text-sm opacity-90">{subscriptionStatus.message}</p>
          </div>
        </div>
        
        {subscriptionStatus.needsPayment && showActions && (
          <button
            onClick={handlePayment}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
          >
            <FaCreditCard className="inline mr-1" />
            Pay Now
          </button>
        )}
      </div>

      {subscriptionStatus.trialDaysRemaining > 0 && (
        <div className="mt-3 pt-3 border-t border-current border-opacity-20">
          <div className="flex justify-between text-sm">
            <span>Trial Days Remaining:</span>
            <span className="font-medium">{subscriptionStatus.trialDaysRemaining} days</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionStatus;

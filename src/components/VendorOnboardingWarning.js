import React, { useState, useEffect } from 'react';
import { FaExclamationTriangle, FaShieldAlt, FaCreditCard, FaClock, FaCheckCircle, FaTimes } from 'react-icons/fa';
import { getApiUrl } from '../utils/apiConfig';
import { useAuth } from '../contexts/AuthContext';
import { authenticatedFetch } from '../utils/authToken';

const VendorOnboardingWarning = ({ onboardingStep = 'complete', onDismiss }) => {
  const { user } = useAuth();
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(false);

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
    }
  };

  const handleDismiss = async () => {
    setDismissed(true);
    onDismiss && onDismiss();
  };

  const handlePaymentSetup = () => {
    window.location.href = '/dashboard?tab=subscription';
  };

  if (dismissed) return null;

  // Show different warnings based on onboarding step and subscription status
  const getWarningContent = () => {
    if (onboardingStep === 'registration') {
      return {
        type: 'info',
        title: 'Vendor Registration - Important Information',
        icon: <FaShieldAlt className="text-blue-500" />,
        color: 'bg-blue-50 border-blue-200 text-blue-800',
        points: [
          '• 3-month free trial period for all new vendors',
          '• After trial: N50,000/month subscription fee',
          '• Payment via Paystack (card, bank transfer, etc.)',
          '• <strong>Warning: Falsified details = Immediate suspension</strong>',
          '• Auto-approval but subject to verification'
        ],
        action: null
      };
    }

    if (onboardingStep === 'complete' && subscriptionStatus) {
      if (subscriptionStatus.status === 'trial' && subscriptionStatus.trialDaysRemaining > 60) {
        return {
          type: 'info',
          title: 'Subscription Trial Active',
          icon: <FaClock className="text-yellow-500" />,
          color: 'bg-yellow-50 border-yellow-200 text-yellow-800',
          points: [
            `• ${subscriptionStatus.trialDaysRemaining} days remaining in free trial`,
            '• After trial: N50,000/month subscription fee',
            '• Set up payment method to avoid interruption',
            '• <strong>Falsified details = Immediate suspension</strong>'
          ],
          action: {
            text: 'Set Up Payment Method',
            handler: handlePaymentSetup
          }
        };
      }

      if (subscriptionStatus.status === 'trial' && subscriptionStatus.trialDaysRemaining <= 7) {
        return {
          type: 'warning',
          title: 'Trial Ending Soon - Action Required',
          icon: <FaExclamationTriangle className="text-orange-500" />,
          color: 'bg-orange-50 border-orange-200 text-orange-800',
          points: [
            `• Only ${subscriptionStatus.trialDaysRemaining} days left in trial`,
            '• Account will be suspended if payment not set up',
            '• Subscribe now to continue using platform',
            '• <strong>Immediate suspension for falsified details</strong>'
          ],
          action: {
            text: 'Subscribe Now',
            handler: handlePaymentSetup
          }
        };
      }

      if (subscriptionStatus.status === 'expired') {
        return {
          type: 'error',
          title: 'Trial Expired - Account Suspended',
          icon: <FaExclamationTriangle className="text-red-500" />,
          color: 'bg-red-50 border-red-200 text-red-800',
          points: [
            '• Your free trial has expired',
            '• Account is currently suspended',
            '• Subscribe immediately to reactivate',
            '• <strong>Verify all details are accurate</strong>'
          ],
          action: {
            text: 'Subscribe Now',
            handler: handlePaymentSetup
          }
        };
      }

      if (subscriptionStatus.status === 'active') {
        return {
          type: 'success',
          title: 'Subscription Active',
          icon: <FaCheckCircle className="text-green-500" />,
          color: 'bg-green-50 border-green-200 text-green-800',
          points: [
            '• Your subscription is active and in good standing',
            '• Next payment date: ' + (subscriptionStatus.subscription?.nextPaymentDate ? 
              new Date(subscriptionStatus.subscription.nextPaymentDate).toLocaleDateString() : 'N/A'),
            '• Keep your details updated to avoid suspension',
            '• <strong>Report any issues to support</strong>'
          ],
          action: null
        };
      }
    }

    return null;
  };

  const warning = getWarningContent();

  if (!warning) return null;

  return (
    <div className={`rounded-lg border p-6 ${warning.color} relative`}>
      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className="absolute top-4 right-4 text-current opacity-60 hover:opacity-100 transition-opacity"
      >
        <FaTimes />
      </button>

      {/* Warning Content */}
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-3 mt-1">
          {warning.icon}
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-3">{warning.title}</h3>
          
          <div className="space-y-2 mb-4">
            {warning.points.map((point, index) => (
              <p 
                key={index} 
                className="text-sm"
                dangerouslySetInnerHTML={{ __html: point }}
              />
            ))}
          </div>

          {/* Action Button */}
          {warning.action && (
            <button
              onClick={warning.action.handler}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                warning.type === 'error' 
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : warning.type === 'warning'
                  ? 'bg-orange-600 text-white hover:bg-orange-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {warning.action.text}
            </button>
          )}

          {/* Additional Info for Trial Users */}
          {subscriptionStatus?.status === 'trial' && (
            <div className="mt-4 pt-4 border-t border-current border-opacity-20">
              <div className="flex items-center text-sm">
                <FaCreditCard className="mr-2" />
                <span>Payment Methods: Card, Bank Transfer, USSD, QR Code</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorOnboardingWarning;

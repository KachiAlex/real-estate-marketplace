import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext-new';

/**
 * Enhanced Dashboard Role Switcher (Buyer ↔ Vendor)
 * - Only visible for users who are not admin
 * - Buyer can switch to vendor dashboard (if onboarded as vendor)
 * - Vendor can switch to buyer dashboard
 * - If buyer tries to access vendor dashboard without onboarding, prompt and route to onboarding
 * - Enhanced UX with better visual indicators and status
 */

export default function RoleSwitcher({ onClose }) {
  const { user, isBuyer, isVendor, hasDualRole, isVendorOnboarded, isVendorSubscriptionActive } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Only show for users with both buyer and vendor roles
  if (!hasDualRole) return null;

  // Determine current role by route
  const isOnBuyerDashboard = location.pathname.startsWith('/dashboard');
  const isOnVendorDashboard = location.pathname.startsWith('/vendor/dashboard');

  // Handler for switching to vendor dashboard
  const handleSwitchToVendor = () => {
    if (!isVendorOnboarded) {
      if (window.confirm('You need to complete vendor onboarding before accessing the vendor dashboard. Proceed to onboarding?')) {
        navigate('/vendor/onboarding-wizard', { replace: true });
        onClose?.();
      }
      return;
    }
    if (!isVendorSubscriptionActive) {
      if (window.confirm('Your vendor subscription is inactive. Please renew your subscription to access the vendor dashboard.')) {
        navigate('/vendor/renew-subscription', { replace: true });
        onClose?.();
      }
      return;
    }
    navigate('/vendor/dashboard', { replace: true });
    onClose?.();
  };

  // Handler for switching to buyer dashboard
  const handleSwitchToBuyer = () => {
    navigate('/dashboard', { replace: true });
    onClose?.();
  };

  const getVendorStatus = () => {
    if (!isVendorOnboarded) return { status: 'not_onboarded', text: 'Complete Setup', color: 'text-orange-600' };
    if (!isVendorSubscriptionActive) return { status: 'inactive', text: 'Renew Subscription', color: 'text-red-600' };
    return { status: 'active', text: 'Active', color: 'text-green-600' };
  };

  const vendorStatus = getVendorStatus();

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Switch Dashboard</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>

      <div className="space-y-3">
        {/* Buyer Dashboard Option */}
        <button
          onClick={handleSwitchToBuyer}
          className={`w-full p-3 rounded-lg border-2 transition-all ${
            isOnBuyerDashboard
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-200 hover:border-blue-300 text-gray-700 hover:bg-blue-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${isOnBuyerDashboard ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
              <div className="text-left">
                <div className="font-medium">Buyer Dashboard</div>
                <div className="text-sm text-gray-500">Browse & purchase properties</div>
              </div>
            </div>
            {isOnBuyerDashboard && (
              <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        </button>

        {/* Vendor Dashboard Option */}
        <button
          onClick={handleSwitchToVendor}
          className={`w-full p-3 rounded-lg border-2 transition-all ${
            isOnVendorDashboard
              ? 'border-green-500 bg-green-50 text-green-700'
              : 'border-gray-200 hover:border-green-300 text-gray-700 hover:bg-green-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${isOnVendorDashboard ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <div className="text-left">
                <div className="font-medium">Vendor Dashboard</div>
                <div className="text-sm text-gray-500">Manage your properties & business</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`text-xs font-medium ${vendorStatus.color}`}>
                {vendorStatus.text}
              </span>
              {isOnVendorDashboard && (
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          </div>
        </button>
      </div>

      {/* Status Indicators */}
      {vendorStatus.status !== 'active' && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <svg className="w-5 h-5 text-amber-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="text-sm">
              <div className="font-medium text-amber-800">Action Required</div>
              <div className="text-amber-700 mt-1">
                {vendorStatus.status === 'not_onboarded' && 'Complete your vendor onboarding to access the vendor dashboard.'}
                {vendorStatus.status === 'inactive' && 'Your subscription is inactive. Renew to continue using vendor features.'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex space-x-2">
          {!isVendorOnboarded && (
            <button
              onClick={() => navigate('/vendor/onboarding-wizard')}
              className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Complete Setup
            </button>
          )}
          {isVendorOnboarded && !isVendorSubscriptionActive && (
            <button
              onClick={() => navigate('/vendor/renew-subscription')}
              className="flex-1 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Renew Subscription
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

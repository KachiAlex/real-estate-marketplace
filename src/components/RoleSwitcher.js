import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext-new';

/**
 * Dashboard Role Switcher (Buyer <-> Vendor)
 * - Only visible for users who are not admin
 * - Buyer can switch to vendor dashboard (if onboarded as vendor)
 * - Vendor can switch to buyer dashboard
 * - If buyer tries to access vendor dashboard without onboarding, prompt and route to onboarding
 */

export default function RoleSwitcher({ onClose }) {
  const { user, isBuyer, isVendor, isVendorOnboarded, isVendorSubscriptionActive } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine current role by route
  const isOnBuyerDashboard = location.pathname.startsWith('/dashboard');
  const isOnVendorDashboard = location.pathname.startsWith('/vendor/dashboard');

  // Admins cannot switch
  if (user?.role === 'admin') return null;

  // Handler for switching to vendor dashboard
  const handleSwitchToVendor = () => {
    if (!isVendorOnboarded) {
      if (window.confirm('You need to register as a vendor before accessing the vendor dashboard. Proceed to onboarding?')) {
        navigate('/vendor/onboarding-dashboard', { replace: true });
        onClose?.();
      }
      return;
    }
    if (!isVendorSubscriptionActive) {
      if (window.confirm('You need to renew your vendor subscription to access the vendor dashboard. Proceed to payment?')) {
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

  return (
    <div className="role-switcher flex flex-col gap-2 p-4">
      {isOnBuyerDashboard && (
        <button
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
          onClick={handleSwitchToVendor}
        >
          Switch to Vendor Dashboard
        </button>
      )}
      {isOnVendorDashboard && (
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          onClick={handleSwitchToBuyer}
        >
          Switch to Buyer Dashboard
        </button>
      )}
    </div>
  );
}

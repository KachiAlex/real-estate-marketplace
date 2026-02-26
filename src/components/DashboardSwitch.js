import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function DashboardSwitch() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Only show for users with 'user' or 'vendor' roles
  if (!user || !Array.isArray(user.roles) || (!user.roles.includes('user') && !user.roles.includes('vendor'))) {
    return null;
  }

  // Determine current dashboard
  const isVendorDashboard = location.pathname.startsWith('/vendor');
  const isBuyerDashboard = location.pathname.startsWith('/dashboard');

  const { switchRole } = useAuth();
  const [loading, setLoading] = useState(false);

  // Optimized switch handler: change active role then navigate
  const handleSwitch = async (target) => {
    const wanted = target === 'vendor' ? 'vendor' : 'user';
    if (!switchRole) {
      // fallback to client-side navigation
      navigate(target === 'vendor' ? '/vendor/dashboard' : '/dashboard');
      return;
    }
    try {
      setLoading(true);
      await switchRole(wanted);
      // route to appropriate dashboard after successful switch
      navigate(wanted === 'vendor' ? '/vendor/dashboard' : '/dashboard');
    } catch (e) {
      console.error('Role switch failed', e);
      toast.error(e.message || 'Failed to switch dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2 bg-white rounded shadow p-2 mb-4">
      <span className="font-semibold text-gray-700">Switch Dashboard:</span>
      <button
        className={`px-3 py-1 rounded transition-colors font-medium flex items-center gap-2 ${isBuyerDashboard ? 'bg-brand-blue text-white' : 'bg-gray-100 text-gray-700'}`}
        onClick={() => handleSwitch('buyer')}
        disabled={isBuyerDashboard || loading}
        aria-busy={loading}
      >
        {loading && <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>}
        <span>Buyer</span>
      </button>
      <button
        className={`px-3 py-1 rounded transition-colors font-medium flex items-center gap-2 ${isVendorDashboard ? 'bg-brand-blue text-white' : 'bg-gray-100 text-gray-700'}`}
        onClick={() => handleSwitch('vendor')}
        disabled={isVendorDashboard || loading}
        aria-busy={loading}
      >
        {loading && <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>}
        <span>Vendor</span>
      </button>
    </div>
  );
}

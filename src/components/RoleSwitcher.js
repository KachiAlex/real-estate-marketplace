import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { registerRuntimeGuards } from '../utils/runtimeGuards';

const RoleSwitcher = ({ onClose }) => {
  const { user, switchRole } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSwitch = async (targetRole) => {
    if (!user) return;
    setLoading(true);
    try {
      const result = await switchRole(targetRole);

      // Re-apply runtime guards after role switch
      registerRuntimeGuards();

      // If server requires vendor onboarding, route there
      if (result && result.requiresVendorRegistration) {
        toast('Please complete vendor onboarding', { icon: 'ℹ️' });
        onClose?.();
        return navigate('/vendor/register', { replace: true });
      }

      // If result is a user object or contains roles, determine outcome
      const updated = result || {};
      const roles = updated.roles || user.roles || [];
      const activeRole = updated.activeRole || user.activeRole || (roles[0] ?? null);

      if (targetRole === 'vendor' && !roles.includes('vendor')) {
        // Not a vendor after attempting switch — go to onboarding
        onClose?.();
        return navigate('/vendor/register', { replace: true });
      }

      // Successful switch — route to appropriate dashboard
      onClose?.();
      if (activeRole === 'vendor' || targetRole === 'vendor') {
        navigate('/vendor/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      console.error('Role switch failed', err);
      toast.error(err?.message || 'Failed to switch role');
      // Fallback to vendor registration if target was vendor
      if (targetRole === 'vendor') navigate('/vendor/register', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 pb-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500">Active Role</span>
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
          {user?.activeRole === 'vendor' ? 'Vendor' : 'Buyer'}
        </span>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <button
          onClick={() => handleSwitch('buyer')}
          disabled={loading}
          className={`text-xs px-2 py-1 rounded border ${user?.activeRole !== 'buyer' ? 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50' : 'bg-blue-600 text-white border-blue-600'}`}
        >
          Buyer
        </button>

        <button
          onClick={() => handleSwitch('vendor')}
          disabled={loading}
          className={`text-xs px-2 py-1 rounded border ${user?.activeRole === 'vendor' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50'}`}
        >
          Vendor
        </button>
      </div>
    </div>
  );
};

export default RoleSwitcher;

import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

export default function DashboardSwitch() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user || !user.roles || !Array.isArray(user.roles)) return null;
  const isVendor = user.roles.includes('vendor');
  const isUser = user.roles.includes('user') || user.roles.includes('buyer');

  // Only show if user has both roles
  if (!(isVendor && isUser)) return null;

  const onSwitch = (target) => {
    if (target === 'vendor') {
      navigate('/vendor/dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  const onVendor = location.pathname.startsWith('/vendor/');

  return (
    <div className="flex gap-2 items-center">
      <button
        className={`px-3 py-1 rounded ${!onVendor ? 'bg-brand-blue text-white' : 'bg-gray-200 text-gray-700'}`}
        onClick={() => onSwitch('user')}
        disabled={!onVendor}
      >
        User Dashboard
      </button>
      <button
        className={`px-3 py-1 rounded ${onVendor ? 'bg-brand-blue text-white' : 'bg-gray-200 text-gray-700'}`}
        onClick={() => onSwitch('vendor')}
        disabled={onVendor}
      >
        Vendor Dashboard
      </button>
    </div>
  );
}

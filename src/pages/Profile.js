import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import BecomeVendorModal from '../components/BecomeVendorModal.js';
import VendorStatusCard from '../components/VendorStatusCard';

const Profile = () => {
  const { currentUser } = useAuth();
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
            <p className="text-gray-600">Manage your account information</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <VendorStatusCard onOpenKyc={() => setIsVendorModalOpen(true)} />
          </div>
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Overview</h2>
              <p className="text-sm text-gray-600">This is a simplified profile overview for smoke build checks.</p>
              <pre className="mt-4 text-xs bg-gray-100 p-3 rounded">{JSON.stringify(currentUser || {}, null, 2)}</pre>
            </div>
          </div>
        </div>

        {isVendorModalOpen && (
          <BecomeVendorModal isOpen={isVendorModalOpen} onClose={() => setIsVendorModalOpen(false)} />
        )}
      </div>
    </div>
  );
};

export default Profile;

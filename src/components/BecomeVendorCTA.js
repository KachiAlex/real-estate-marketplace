import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext-new';
import BecomeVendorModal from './BecomeVendorModal';

const BecomeVendorCTA = () => {
  const { user, isVendor } = useAuth();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  // Don't show if user is already a vendor
  if (isVendor) return null;

  // Temporarily show for debugging - remove this later
  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white mb-8 flex flex-col items-center justify-center">
      <div className="flex flex-col items-center justify-center w-full">
        <h3 className="text-xl font-bold mb-2 text-center">Become a Property Vendor</h3>
        <p className="text-blue-100 mb-4 text-center">
          List your properties, reach more buyers, and grow your real estate business.
          Join our network of professional vendors today.
        </p>
        <div className="flex items-center justify-center space-x-4 text-sm mb-4">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>List unlimited properties</span>
          </div>
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>Access buyer leads</span>
          </div>
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>Professional tools</span>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors mx-auto"
        >
          Become a Vendor
        </button>
      </div>
      {showModal && (
        <BecomeVendorModal isOpen={showModal} onClose={() => setShowModal(false)} />
      )}
    </div>
  );

  return (
    <>
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-2">Become a Property Vendor</h3>
            <p className="text-blue-100 mb-4">
              List your properties, reach more buyers, and grow your real estate business.
              Join our network of professional vendors today.
            </p>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>List unlimited properties</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Access buyer leads</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Professional tools</span>
              </div>
            </div>
          </div>
          <div className="ml-6">
            <button
              onClick={() => setShowModal(true)}
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Become a Vendor
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 pt-6 border-t border-blue-500/30">
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold">500+</div>
              <div className="text-blue-100 text-sm">Active Vendors</div>
            </div>
            <div>
              <div className="text-2xl font-bold">10K+</div>
              <div className="text-blue-100 text-sm">Properties Listed</div>
            </div>
            <div>
              <div className="text-2xl font-bold">₦50K</div>
              <div className="text-blue-100 text-sm">Monthly Fee</div>
            </div>
          </div>
        </div>
      </div>

      <BecomeVendorModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
};

export default BecomeVendorCTA;
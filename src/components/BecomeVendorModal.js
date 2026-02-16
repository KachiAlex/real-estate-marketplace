import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext-new';
import toast from 'react-hot-toast';
import { getApiUrl } from '../utils/apiConfig';
import { authenticatedFetch } from '../utils/authToken';

const BecomeVendorModal = ({ isOpen, onClose }) => {
  const { user, refreshAccessToken } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    businessName: '',
    businessType: '',
    agreeToTerms: false
  });

  const handleChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.businessName || !form.businessType) {
      toast.error('Please fill in all business information');
      return;
    }

    if (!form.agreeToTerms) {
      toast.error('You must agree to the terms and conditions');
      return;
    }

    setLoading(true);
    try {
      // Register as vendor
      const response = await authenticatedFetch(getApiUrl('/vendor/register'), {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to register as vendor');
      }

      // Update vendor profile with business info
      const profileResponse = await authenticatedFetch(getApiUrl('/vendor/profile/update'), {
        method: 'PUT',
        body: JSON.stringify({
          businessName: form.businessName,
          businessType: form.businessType
        })
      });

      if (!profileResponse.ok) {
        console.warn('Profile update failed, but vendor registration succeeded');
      }

      toast.success('Successfully registered as vendor!');

      // Refresh user data
      await refreshAccessToken();

      // Close modal and redirect to onboarding
      onClose();
      navigate('/vendor/onboarding-wizard');

    } catch (error) {
      toast.error(error.message || 'Failed to become a vendor');
    } finally {
      setLoading(false);
    }
  };

  const businessTypes = [
    'Real Estate Agent',
    'Property Developer',
    'Property Manager',
    'Real Estate Consultant',
    'Broker',
    'Other'
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Become a Vendor</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Join Our Vendor Network</h3>
            <p className="text-gray-600 text-sm">
              List properties, manage clients, and grow your real estate business with our platform.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Name
            </label>
            <input
              type="text"
              value={form.businessName}
              onChange={handleChange('businessName')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Your Business Name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Type
            </label>
            <select
              value={form.businessType}
              onChange={handleChange('businessType')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select business type</option>
              {businessTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">What you'll get:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• List unlimited properties</li>
              <li>• Access to buyer leads</li>
              <li>• Professional dashboard</li>
              <li>• Marketing tools</li>
              <li>• 24/7 support</li>
            </ul>
          </div>

          <div className="bg-amber-50 p-4 rounded-lg">
            <h4 className="font-semibold text-amber-900 mb-2">Next Steps:</h4>
            <ul className="text-sm text-amber-800 space-y-1">
              <li>1. Complete KYC verification</li>
              <li>2. Pay subscription fee (₦50,000/month)</li>
              <li>3. Set up your vendor profile</li>
              <li>4. Start listing properties</li>
            </ul>
          </div>

          <div>
            <label className="flex items-start space-x-3">
              <input
                type="checkbox"
                checked={form.agreeToTerms}
                onChange={handleChange('agreeToTerms')}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                required
              />
              <span className="text-sm text-gray-700">
                I agree to the{' '}
                <a href="/terms" className="text-blue-600 hover:text-blue-500 underline">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="/privacy" className="text-blue-600 hover:text-blue-500 underline">
                  Privacy Policy
                </a>
              </span>
            </label>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Registering...' : 'Become a Vendor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BecomeVendorModal;
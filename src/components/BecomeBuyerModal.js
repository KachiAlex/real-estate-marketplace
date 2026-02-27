import React, { useState } from 'react';
import Modal from './Modal';
import { useAuth } from '../contexts/AuthContext-new';
import toast from 'react-hot-toast';
import { getApiUrl } from '../utils/apiConfig';

const BecomeBuyerModal = ({ isOpen, onClose }) => {
  const { addRole, currentUser, accessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState({
    propertyTypes: [],
    budgetRange: '',
    locations: [],
    investmentInterest: false,
    notifications: true
  });

  const propertyTypes = [
    'Apartment', 'House', 'Land', 'Commercial', 'Office Space', 'Shortlet'
  ];

  const budgetRanges = [
    'Under 5M', '5M - 10M', '10M - 20M', '20M - 50M', '50M - 100M', 'Over 100M'
  ];

  const locations = [
    'Lagos', 'Abuja', 'Port Harcourt', 'Kano', 'Ibadan', 'Enugu'
  ];

  const handlePropertyTypeChange = (type) => {
    setPreferences(prev => ({
      ...prev,
      propertyTypes: prev.propertyTypes.includes(type)
        ? prev.propertyTypes.filter(t => t !== type)
        : [...prev.propertyTypes, type]
    }));
  };

  const handleLocationChange = (location) => {
    setPreferences(prev => ({
      ...prev,
      locations: prev.locations.includes(location)
        ? prev.locations.filter(l => l !== location)
        : [...prev.locations, location]
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // 1) Add buyer role to the user
      await addRole('buyer', false);
      
      // 2) Save buyer preferences
      const buyerProfile = {
        userId: currentUser.id,
        preferences: {
          propertyTypes: preferences.propertyTypes,
          budgetRange: preferences.budgetRange,
          locations: preferences.locations,
          investmentInterest: preferences.investmentInterest,
          notifications: preferences.notifications
        },
        buyerSince: new Date().toISOString(),
        source: 'vendor_to_buyer_conversion'
      };

      const response = await fetch(getApiUrl('/buyer/profile'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken && { Authorization: `Bearer ${accessToken}` })
        },
        body: JSON.stringify(buyerProfile)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save buyer profile');
      }

      toast.success('Congratulations! You are now a buyer. Start exploring properties!');
      if (onClose) onClose();
    } catch (err) {
      console.error('BecomeBuyer submit error', err);
      toast.error(err.message || 'Failed to become buyer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Become a Buyer">
      <form onSubmit={submit} className="space-y-6">
        <div className="text-sm text-gray-600">
          <p>As a buyer, you'll be able to:</p>
          <ul className="mt-2 list-disc list-inside space-y-1">
            <li>Save properties to your wishlist</li>
            <li>Make property inquiries</li>
            <li>Track your favorite listings</li>
            <li>Get personalized recommendations</li>
            <li>Participate in property investments</li>
          </ul>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What types of properties are you interested in?
          </label>
          <div className="grid grid-cols-2 gap-2">
            {propertyTypes.map(type => (
              <label key={type} className="flex items-center">
                <input
                  type="checkbox"
                  checked={preferences.propertyTypes.includes(type)}
                  onChange={() => handlePropertyTypeChange(type)}
                  className="mr-2"
                />
                <span className="text-sm">{type}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What's your budget range?
          </label>
          <select
            value={preferences.budgetRange}
            onChange={(e) => setPreferences(prev => ({ ...prev, budgetRange: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Select budget range</option>
            {budgetRanges.map(range => (
              <option key={range} value={range}>{range}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preferred locations
          </label>
          <div className="grid grid-cols-2 gap-2">
            {locations.map(location => (
              <label key={location} className="flex items-center">
                <input
                  type="checkbox"
                  checked={preferences.locations.includes(location)}
                  onChange={() => handleLocationChange(location)}
                  className="mr-2"
                />
                <span className="text-sm">{location}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={preferences.investmentInterest}
              onChange={(e) => setPreferences(prev => ({ ...prev, investmentInterest: e.target.checked }))}
              className="mr-2"
            />
            <span className="text-sm">Interested in property investment opportunities</span>
          </label>
        </div>

        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={preferences.notifications}
              onChange={(e) => setPreferences(prev => ({ ...prev, notifications: e.target.checked }))}
              className="mr-2"
            />
            <span className="text-sm">Send me notifications about matching properties</span>
          </label>
        </div>

        <div className="flex gap-2 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Become a Buyer'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md"
          >
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default BecomeBuyerModal;

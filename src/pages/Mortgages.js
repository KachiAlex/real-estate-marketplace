import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import MortgageDashboard from '../components/MortgageDashboard';
import { FaHome, FaPlus } from 'react-icons/fa';

const Mortgages = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    navigate('/');
    return null;
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">My Mortgages</h1>
            <p className="text-gray-600">
              Manage your mortgage payments and track your property financing progress.
            </p>
          </div>
          <button
            onClick={() => navigate('/mortgage')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <FaPlus />
            <span>Apply for Mortgage</span>
          </button>
        </div>
      </div>

      {/* Mortgage Dashboard */}
      <MortgageDashboard />
    </div>
  );
};

export default Mortgages;
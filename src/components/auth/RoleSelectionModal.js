import React from 'react';
import { FaShoppingCart, FaBuilding, FaShieldAlt } from 'react-icons/fa';

/**
 * Reusable Role Selection Modal Component
 * Displays when a user has multiple roles and needs to choose which dashboard to access
 */
const RoleSelectionModal = ({ 
  user, 
  onRoleSelect, 
  onClose 
}) => {
  if (!user || !user.roles || user.roles.length <= 1) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full p-8">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Choose Your Dashboard
          </h3>
          <p className="text-gray-600">
            You have access to multiple account types. Which would you like to use?
          </p>
        </div>
        
        <div className="space-y-4">
          {user.roles.includes('buyer') && (
            <button
              onClick={() => onRoleSelect('buyer')}
              className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-300 group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <FaShoppingCart className="text-blue-600 text-xl" />
                </div>
                <div className="text-left">
                  <h4 className="font-semibold text-gray-900">Buyer Dashboard</h4>
                  <p className="text-sm text-gray-600">Browse and purchase properties</p>
                </div>
              </div>
            </button>
          )}
          
          {user.roles.includes('vendor') && (
            <button
              onClick={() => onRoleSelect('vendor')}
              className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all duration-300 group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <FaBuilding className="text-green-600 text-xl" />
                </div>
                <div className="text-left">
                  <h4 className="font-semibold text-gray-900">Vendor Dashboard</h4>
                  <p className="text-sm text-gray-600">Manage and list properties</p>
                </div>
              </div>
            </button>
          )}

          {user.roles.includes('admin') && (
            <button
              onClick={() => onRoleSelect('admin')}
              className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-red-500 hover:bg-red-50 transition-all duration-300 group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors">
                  <FaShieldAlt className="text-red-600 text-xl" />
                </div>
                <div className="text-left">
                  <h4 className="font-semibold text-gray-900">Admin Dashboard</h4>
                  <p className="text-sm text-gray-600">Manage platform and users</p>
                </div>
              </div>
            </button>
          )}
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            You can switch between dashboards anytime from the header menu
          </p>
        </div>
      </div>
    </div>
  );
};

export default RoleSelectionModal;


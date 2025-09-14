import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  FaHome, 
  FaChartLine, 
  FaPlus, 
  FaEnvelope, 
  FaUsers, 
  FaDollarSign, 
  FaCog, 
  FaFileContract,
  FaBell,
  FaQuestionCircle,
  FaSignOutAlt
} from 'react-icons/fa';

const VendorSidebar = () => {
  const menuItems = [
    { path: '/vendor/dashboard', label: 'Dashboard', icon: FaHome },
    { path: '/vendor/properties', label: 'My Properties', icon: FaHome },
    { path: '/vendor/add-property', label: 'Add Property', icon: FaPlus },
    { path: '/vendor/inquiries', label: 'Inquiries', icon: FaEnvelope },
    { path: '/vendor/analytics', label: 'Analytics', icon: FaChartLine },
    { path: '/vendor/earnings', label: 'Earnings', icon: FaDollarSign },
    { path: '/vendor/team', label: 'Team', icon: FaUsers },
    { path: '/vendor/contracts', label: 'Contracts', icon: FaFileContract }
  ];

  const accountItems = [
    { path: '/vendor/profile', label: 'Profile Settings', icon: FaCog },
    { path: '/vendor/notifications', label: 'Notifications', icon: FaBell },
    { path: '/vendor/help', label: 'Help & Support', icon: FaQuestionCircle }
  ];

  const isActive = (path) => {
    return window.location.pathname === path;
  };

  return (
    <div className="w-64 bg-white shadow-lg h-full fixed left-0 top-0 overflow-y-auto">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-brand-blue to-blue-600 rounded-lg flex items-center justify-center">
            <FaHome className="text-white text-sm" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Naija Luxury</h1>
            <p className="text-xs text-gray-500">Vendor Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="p-4">
        <div className="mb-8">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Main Menu</h3>
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? 'bg-brand-blue text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        {/* Account Section */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Account</h3>
          <ul className="space-y-1">
            {accountItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? 'bg-brand-blue text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Bottom Section */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
        {/* User Profile Section */}
        <div className="mb-4">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-gray-600">V</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Vendor Account</p>
              <p className="text-xs text-gray-500 mt-1">Premium Member</p>
            </div>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="mb-4 space-y-2">
          <button className="w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <FaBell className="h-4 w-4" />
            <span>Notifications</span>
          </button>
          <button className="w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <FaQuestionCircle className="h-4 w-4" />
            <span>Help & Support</span>
          </button>
        </div>
        
        {/* Sign Out Button */}
        <button className="w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <FaSignOutAlt className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default VendorSidebar;

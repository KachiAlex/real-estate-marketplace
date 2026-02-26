import React, { useState } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useVendor } from '../../contexts/VendorContext';
import { useSidebar } from '../../contexts/SidebarContext';
import { 
  FaHome, 
  FaPlus, 
  FaBuilding, 
  FaUsers, 
  FaDollarSign, 
  FaCog, 
  FaFileContract,
  FaBell,
  FaQuestionCircle,
  FaSignOutAlt,
  FaChevronLeft,
  FaChevronRight,
  FaUser
} from 'react-icons/fa';

const VendorSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { isAgent, isPropertyOwner, documentStatus } = useVendor();
  const { isCollapsed, toggleSidebar } = useSidebar();
  
  const menuItems = [
    { path: '/vendor/dashboard', label: 'Overview', icon: FaHome },
    { path: '/vendor/properties', label: 'My Properties', icon: FaBuilding },
    { path: '/vendor/inspection-requests', label: 'Inspection Requests', icon: FaBell },
    { path: '/vendor/earnings', label: 'Earnings', icon: FaDollarSign },
    { path: '/vendor/contracts', label: 'Contracts', icon: FaFileContract },
    { path: '/vendor/subscription', label: 'Subscription', icon: FaDollarSign }
  ];

  const accountItems = [
    { path: '/vendor/profile', label: 'Profile Settings', icon: FaCog }
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleSignOut = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const safeString = (value, fallback = '') => (typeof value === 'string' ? value : fallback);

  const getUserInitials = () => {
    const displayName = safeString(user?.displayName);
    if (displayName) {
      return displayName
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .join('')
        .toUpperCase();
    }

    const email = safeString(user?.email);
    if (email) {
      return email[0].toUpperCase();
    }

    return 'U';
  };

  const getUserDisplayName = () => {
    const displayName = safeString(user?.displayName);
    if (displayName) return displayName;

    const email = safeString(user?.email);
    if (email) {
      const [prefix] = email.split('@');
      return prefix || 'Vendor Account';
    }

    return 'Vendor Account';
  };

  const getActiveSection = () => {
    const path = location.pathname;
    if (path.startsWith('/vendor/dashboard')) return 'main';
    if (path.startsWith('/vendor/profile')) return 'account';
    if (path.startsWith('/vendor/notifications') || path.startsWith('/vendor/help')) return 'support';
    return 'main';
  };

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-64'} bg-white shadow-lg h-full fixed left-0 top-0 overflow-y-auto flex flex-col transition-all duration-300 z-50`}>
      {/* Logo */}
      <div className="px-4 py-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <Link to="/" className="flex items-center flex-shrink-0 focus:outline-none focus:ring-0 border-none hover:opacity-80 transition-opacity">
            <img 
              src={`${process.env.PUBLIC_URL}/logo.png?v=4.0`} 
              alt="PropertyArk Logo" 
              className="w-auto h-20 sm:h-24 md:h-28"
              style={{ 
                maxHeight: '7rem',
                backgroundColor: 'transparent',
                mixBlendMode: 'normal',
                border: 'none',
                outline: 'none'
              }}
              onError={(e) => {
                // Fallback to icon if logo image doesn't exist
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="w-8 h-8 bg-gradient-to-r from-brand-blue to-blue-600 rounded-lg flex items-center justify-center" style={{ display: 'none' }}>
              <FaHome className="text-white text-sm" />
            </div>
          </Link>
          <button
            onClick={toggleSidebar}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <FaChevronRight className="h-4 w-4 text-gray-600" /> : <FaChevronLeft className="h-4 w-4 text-gray-600" />}
          </button>
        </div>
        {!isCollapsed && (
          <p className="text-xs text-gray-500 ml-1">Vendor Portal</p>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="px-4 pt-2 pb-4 flex-1">
        {/* Main Menu Section */}
        <div className="mb-8">
          {!isCollapsed && (
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Main Menu</h3>
          )}
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end
                  className={({ isActive }) => `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors group relative ${
                    isActive ? 'bg-brand-blue text-white' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {!isCollapsed && <span>{item.label}</span>}
                  {isCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                      {item.label}
                    </div>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        {/* Account Section */}
        <div className="mb-8">
          {!isCollapsed && (
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Account</h3>
          )}
          <ul className="space-y-1">
            {accountItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end
                  className={({ isActive }) => `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors group relative ${
                    isActive ? 'bg-brand-blue text-white' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {!isCollapsed && <span>{item.label}</span>}
                  {isCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                      {item.label}
                    </div>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        {/* Support Section */}
        <div className="mb-8">
          {!isCollapsed && (
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Support</h3>
          )}
          <ul className="space-y-1">
            <li>
              <NavLink
                to="/vendor/help"
                end
                className={({ isActive }) => `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors group relative ${
                  isActive ? 'bg-brand-blue text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
                title={isCollapsed ? 'Help & Support' : undefined}
              >
                <FaQuestionCircle className="h-4 w-4 flex-shrink-0" />
                {!isCollapsed && <span>Help & Support</span>}
                {isCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                    Help & Support
                  </div>
                )}
              </NavLink>
            </li>
          </ul>
        </div>
      </nav>

      {/* Bottom Section */}
      <div className="mt-auto border-t border-gray-200 bg-white">
        {/* User Profile Section */}
        <div className="p-4">
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-gradient-to-r from-brand-blue to-blue-600 rounded-full flex items-center justify-center">
              {user?.photoURL ? (
                <img 
                  src={user?.photoURL} 
                  alt="User avatar" 
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <span className="text-sm font-medium text-white">{getUserInitials()}</span>
              )}
            </div>
            {!isCollapsed && (
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {getUserDisplayName()}
                </p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {isAgent && (
                    <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                      Agent
                    </span>
                  )}
                  {isPropertyOwner && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      Owner
                    </span>
                  )}
                  {isAgent && documentStatus && (
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      documentStatus.attestationStatus === 'verified' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {documentStatus.attestationStatus === 'verified' ? 'Verified' : 'Pending'}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Sign Out Button */}
        <button 
          onClick={handleSignOut}
          className="w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors group relative"
          title={isCollapsed ? 'Sign Out' : undefined}
        >
          <FaSignOutAlt className="h-4 w-4 flex-shrink-0" />
          {!isCollapsed && <span>Sign Out</span>}
          {isCollapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
              Sign Out
            </div>
          )}
        </button>
        </div>
      </div>
    </div>
  );
};

export default VendorSidebar;



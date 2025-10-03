import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  FaHome, 
  FaBuilding, 
  FaChartLine, 
  FaHeart, 
  FaQuestionCircle, 
  FaBell, 
  FaEnvelope, 
  FaUser, 
  FaSignOutAlt,
  FaFileInvoiceDollar,
  FaQuestionCircle as FaHelp,
  FaFileContract,
  FaCalendar,
  FaBlog
} from 'react-icons/fa';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

         const menuItems = [
           { path: '/dashboard', label: 'Dashboard', icon: FaHome },
           { path: '/properties', label: 'Properties', icon: FaBuilding },
           { path: '/blog', label: 'Blog', icon: FaBlog },
           { path: '/investment', label: 'Investment', icon: FaChartLine },
           { path: '/mortgage', label: 'Mortgage', icon: FaFileContract },
           { path: '/saved-properties', label: 'Saved Properties', icon: FaHeart },
           { path: '/inquiries', label: 'My Inquiries', icon: FaQuestionCircle },
           { path: '/alerts', label: 'Property Alerts', icon: FaBell },
           { path: '/messages', label: 'Messages', icon: FaEnvelope },
           { path: '/my-inspections', label: 'My Inspections', icon: FaCalendar },
    { path: '/profile', label: 'Profile Settings', icon: FaUser },
    { path: '/billing', label: 'Billing & Payments', icon: FaFileInvoiceDollar },
    { path: '/help', label: 'Help & Support', icon: FaHelp },
  ];

  return (
    <div className="w-64 bg-white shadow-lg h-screen fixed left-0 top-0 z-40">
      {/* User Account Section */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
            <FaUser className="text-gray-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">{(user?.role || 'buyer').toUpperCase()} ACCOUNT</p>
            <p className="text-sm font-semibold text-gray-900">
              {user?.firstName?.toUpperCase() || 'OLUWASEUN'} {user?.lastName?.toUpperCase() || 'ADEYEMI'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Menu */}
      <div className="p-4">
        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-3">MAIN MENU</p>
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? 'bg-brand-blue text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="text-lg" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>


      {/* Logout */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
        <button
          onClick={logout}
          className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 w-full transition-colors"
        >
          <FaSignOutAlt className="text-lg" />
          <span>Logout Account</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

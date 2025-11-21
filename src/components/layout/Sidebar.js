import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSidebar } from '../../contexts/SidebarContext';
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
  FaBlog,
  FaTimes
} from 'react-icons/fa';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { isMobileSidebarOpen, closeMobileSidebar } = useSidebar();

  const isActive = (path) => {
    return location.pathname === path;
  };

  // Close mobile sidebar when route changes
  useEffect(() => {
    if (user) {
      closeMobileSidebar();
    }
  }, [location.pathname, closeMobileSidebar, user]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobileSidebarOpen && user) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileSidebarOpen, user]);

  // Don't render sidebar if user is not authenticated
  if (!user) {
    return null;
  }

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
    <>
      {/* Mobile Backdrop */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-[60] lg:hidden transition-opacity"
          onClick={closeMobileSidebar}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        w-64 bg-white shadow-lg h-screen fixed left-0 top-0 z-[70] flex flex-col
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0
        ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
      {/* User Account Section */}
      <div className="p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
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
          {/* Close button for mobile */}
          <button
            onClick={closeMobileSidebar}
            className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close sidebar"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>
      </div>

      {/* Main Menu - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 pb-4">
        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-3">MAIN MENU</p>
        <nav className="space-y-1.5 sm:space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={closeMobileSidebar}
                className={`flex items-center space-x-3 px-3 py-2.5 sm:py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? 'bg-brand-blue text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="text-lg flex-shrink-0" />
                <span className="whitespace-nowrap">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>


      {/* Logout */}
      <div className="flex-shrink-0 p-4 sm:p-6 border-t border-gray-200 bg-white">
        <button
          onClick={logout}
          className="flex items-center space-x-3 px-3 py-2.5 sm:py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 w-full transition-colors"
        >
          <FaSignOutAlt className="text-lg" />
          <span>Logout Account</span>
        </button>
      </div>
    </div>
    </>
  );
};

export default Sidebar;

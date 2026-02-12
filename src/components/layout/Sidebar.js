import React, { useEffect, useRef, useState } from 'react';
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
  FaTimes
} from 'react-icons/fa';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { isMobileSidebarOpen, closeMobileSidebar } = useSidebar();
  const prevPathnameRef = useRef(location.pathname);
  const [logoError, setLogoError] = useState(false);

  const isActive = (path) => {
    return location.pathname === path;
  };

  // Close mobile sidebar when route changes (but not on initial mount)
  useEffect(() => {
    // Only close if pathname actually changed (not on initial mount)
    if (prevPathnameRef.current !== location.pathname && user && isMobileSidebarOpen) {
      closeMobileSidebar();
    }
    // Update the ref to the current pathname
    prevPathnameRef.current = location.pathname;
  }, [location.pathname, user, isMobileSidebarOpen, closeMobileSidebar]);

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

  // If user is not authenticated, render a provisional public sidebar
  if (!user) {
    const publicMenuItems = [
      { path: '/', label: 'Home', icon: FaHome },
      { path: '/properties', label: 'Properties', icon: FaBuilding },
      { path: '/about', label: 'About', icon: FaQuestionCircle },
      { path: '/contact', label: 'Contact', icon: FaEnvelope },
      { path: '/help', label: 'Help', icon: FaHelp },
    ];

    return (
      <>
        {isMobileSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-[60] lg:hidden transition-opacity"
            onClick={closeMobileSidebar}
          />
        )}

        <div className={`
          w-64 bg-white shadow-lg h-screen fixed left-0 top-0 z-[70] flex flex-col
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="flex-shrink-0 px-4 py-4 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between mb-2">
              <Link to="/" onClick={closeMobileSidebar} className="flex items-center">
                <img
                  src={`${process.env.PUBLIC_URL}/logo.png?v=4.0`}
                  alt="PropertyArk Logo"
                  className="w-auto h-16"
                  onError={() => setLogoError(true)}
                />
              </Link>
              <button
                onClick={closeMobileSidebar}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
                aria-label="Close sidebar"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>
            <p className="text-xs text-gray-500 ml-1">Welcome</p>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pt-2 pb-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-3">Explore</p>
            <nav className="space-y-1.5 sm:space-y-2">
              {publicMenuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={closeMobileSidebar}
                    className={`flex items-center space-x-3 px-3 py-2.5 sm:py-2 rounded-lg text-sm font-medium transition-colors text-gray-700 hover:bg-gray-100`}
                  >
                    <Icon className="text-lg flex-shrink-0" />
                    <span className="whitespace-nowrap">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex-shrink-0 p-4 sm:p-6 border-t border-gray-200 bg-white">
            <Link to="/auth/login" onClick={closeMobileSidebar} className="block mb-3 px-3 py-2 rounded-lg text-center bg-brand-blue text-white font-medium">Sign in</Link>
            <Link to="/auth/register" onClick={closeMobileSidebar} className="block px-3 py-2 rounded-lg text-center border border-gray-300">Register</Link>
          </div>
        </div>
      </>
    );
  }

            const menuItems = [
              { path: '/dashboard', label: 'Dashboard', icon: FaHome },
              { path: '/properties', label: 'Properties', icon: FaBuilding },
              { path: '/investment', label: 'Investment', icon: FaChartLine },
           { path: '/mortgage', label: 'Mortgage', icon: FaFileContract },
           { path: '/saved-properties', label: 'Saved Properties', icon: FaHeart },
           { path: '/my-inquiries', label: 'My Inquiries', icon: FaQuestionCircle },
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
      {/* Logo Section - Fixed at top, aligned with header */}
      <div className="flex-shrink-0 px-4 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-2">
          <Link 
            to="/" 
            onClick={closeMobileSidebar}
            className="flex items-center flex-shrink-0 focus:outline-none focus:ring-0 border-none hover:opacity-80 transition-opacity"
          >
            {!logoError ? (
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
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                PropertyArk
              </div>
            )}
          </Link>
          {/* Close button for mobile */}
          <button
            onClick={closeMobileSidebar}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
            aria-label="Close sidebar"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>
        <p className="text-xs text-gray-500 ml-1">Buyer Dashboard</p>
      </div>

      {/* Main Menu - Scrollable - Aligned with header menu */}
      <div className="flex-1 overflow-y-auto px-4 pt-2 pb-4">
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

      {/* Logout Section - Moved to bottom */}
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

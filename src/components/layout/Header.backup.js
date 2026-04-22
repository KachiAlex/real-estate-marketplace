import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSidebar } from '../../contexts/SidebarContext';
import { FaHome, FaBars, FaTimes, FaSearch, FaUser, FaShieldAlt } from 'react-icons/fa';
import GlobalSearch from '../GlobalSearch';
import { useGlobalSearch } from '../../hooks/useGlobalSearch';
import AdminProfileModal from '../AdminProfileModalNew';
import toast from 'react-hot-toast';
import LocalModeBanner from '../LocalModeBanner';
import BecomeVendorModal from '../BecomeVendorModal.js';
import DashboardSwitch from '../DashboardSwitch';

const Header = () => {
  const { user, logout, isBuyer, isVendor, switchRole, registerAsVendor, signInWithGooglePopup } = useAuth();
  const [showBecomeVendorModal, setShowBecomeVendorModal] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { toggleMobileSidebar } = useSidebar();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [showVendorRegistrationModal, setShowVendorRegistrationModal] = useState(false);
  const [showAdminProfileModal, setShowAdminProfileModal] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const { isSearchOpen, openSearch, closeSearch, handleResultClick } = useGlobalSearch();
  
  // Hide search bar on home page since it's in the banner
  const isHomePage = location.pathname === '/';
  
  // Check if user is on a protected route (where sidebar should be visible)
  const isProtectedRoute = user && location.pathname !== '/';
  
  // Dashboard routes where we show minimal header (just user profile icon)
  const dashboardRoutes = [
    '/dashboard', '/properties', '/profile', '/billing', '/saved-properties', 
    '/inquiries', '/alerts', '/messages', '/my-inspections', '/investment', 
    '/mortgage', '/escrow', '/search', '/add-property', '/admin',
    '/vendor/dashboard', '/vendor/properties', '/vendor/inspection-requests',
    '/vendor/earnings', '/vendor/team', '/vendor/contracts', '/vendor/profile',
    '/vendor/notifications', '/vendor/help', '/mortgage-bank/dashboard'
  ];
  const isDashboardRoute = dashboardRoutes.some(route => location.pathname.startsWith(route));
  
  // Detect if we're in vendor context to route profile correctly
  const isVendorContext = location.pathname.startsWith('/vendor');
  const isAdminContext = user?.role === 'admin'; // Only check actual role, not pathname
  const profilePath = isVendorContext ? '/vendor/profile' : (isAdminContext ? '#' : '/profile');
  
  // Debug logging
  console.log('Header Debug:', {
    pathname: location.pathname,
    userRole: user?.role,
    isAdminContext,
    isVendorContext,
    profilePath
  });

  return (
    <>
      {/* Skip to content link for accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Skip to main content
      </a>
      <header className={`bg-white shadow ${isHomePage ? 'sticky top-0 z-50' : ''}`}>
        {/* Local/offline banner (appears when fallback/local-mode is active) */}
        <div className="w-full">
          <React.Suspense fallback={null}>
            {/* lazy show so header load isn't blocked */}
            <LocalModeBanner />
          </React.Suspense>
        </div>
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-16 md:h-20 py-2">
            <div className="flex items-center flex-shrink-0 space-x-2 sm:space-x-4 lg:space-x-6">
              {/* Logo: show a smaller logo when on dashboard routes to keep header compact */}
              <Link to="/" className="flex items-center flex-shrink-0 focus:outline-none focus:ring-0 border-none">
                <img
                  src={'/logo.png?v=4.0'}
                  alt="PropertyArk Logo"
                  className={`w-auto ${isDashboardRoute ? 'h-8 sm:h-8' : 'h-20 sm:h-24 md:h-28'}`}
                  style={{
                    maxHeight: isDashboardRoute ? '2rem' : '7rem',
                    backgroundColor: 'transparent',
                    mixBlendMode: 'normal',
                    border: 'none',
                    outline: 'none'
                  }}
                  onError={(e) => {
                    // if image fails, hide it and show a simple initials / icon badge
                    try {
                      e.target.style.display = 'none';
                      if (e.target && e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                    } catch (err) {}
                  }}
                />
                <div className="w-10 h-10 bg-brand-orange rounded-lg flex items-center justify-center" style={{ display: 'none' }}>
                  <FaHome className="text-white text-xl" />
                </div>
              </Link>
              {/* Dashboard switch for users with both roles */}

              <DashboardSwitch />
            </div>

            {/* Navigation Menu */}
            <nav className="hidden lg:flex items-center flex-nowrap space-x-2 xl:space-x-4">
              {/* For Sale - direct link */}
              <Link
                to="/properties?status=For%20Sale"
                className="px-2 xl:px-3 py-2 text-xs xl:text-sm font-medium text-brand-blue hover:text-brand-orange transition-colors whitespace-nowrap"
              >
                For Sale
              </Link>

              {/* For Rent - direct link */}
              <Link
                to="/properties?status=For%20Rent"
                className="px-2 xl:px-3 py-2 text-xs xl:text-sm font-medium text-brand-blue hover:text-brand-orange transition-colors whitespace-nowrap"
              >
                For Rent
              </Link>

              {/* Shortlet - link directly to shortlet listings instead of opening a locations dropdown */}
              <Link
                to="/properties?status=Shortlet"
                onClick={() => setActiveDropdown(null)}
                className="px-2 xl:px-3 py-2 text-xs xl:text-sm font-medium text-brand-blue hover:text-brand-orange transition-colors whitespace-nowrap"
              >
                Shortlet
              </Link>

              {/* Professional Services */}
            </nav>
          </div>

          {/* Search Bar - Hidden on home page */}
          {!isHomePage && (
            <div className="hidden lg:flex items-center flex-1 max-w-md mx-2 xl:mx-4">
              <div className="relative w-full">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search properties, investments, users..."
                  onClick={openSearch}
                  readOnly
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer text-sm"
                />
              </div>
              <button
                onClick={openSearch}
                className="ml-2 px-3 xl:px-4 py-2 bg-brand-orange text-white rounded-lg hover:bg-orange-600 transition-colors text-xs xl:text-sm whitespace-nowrap"
              >
                Search
              </button>
            </div>
          )}

          {/* Desktop User Menu */}
            <div className="hidden md:flex items-center space-x-2 xl:space-x-4 flex-shrink-0">
            {user ? (
              <>
              <div className="relative user-menu-container">
                <button
                  data-testid="user-menu"
                  aria-label="User menu"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-brand-orange transition-colors duration-300"
                >
                  <div className="w-8 h-8">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt="User"
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-brand-orange rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {user.firstName?.[0]}{user.lastName?.[0]}
                      </div>
                    )}
                  </div>
                  <span className="hidden lg:inline-block text-sm font-medium">
                    Welcome, {user.firstName || user.displayName?.split(' ')[0] || 'User'}
                  </span>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 user-menu-dropdown" onClick={(e) => e.stopPropagation()}>
                    {/* Active role badge and switcher */}
                    {user?.roles && user.roles.length > 1 && (
                      <div className="px-4 py-2 flex items-center justify-between border-b border-gray-100">
                        <div className="text-xs text-gray-500">Active role</div>
                        <div className="flex items-center gap-3">
                          <div className="text-sm font-medium text-gray-700">{user.activeRole === 'vendor' ? 'Vendor' : 'Buyer'}</div>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              const newRole = user.activeRole === 'vendor' ? 'user' : 'vendor';
                              try {
                                // optimistic UI: close menu while switching
                                setIsUserMenuOpen(false);
                                await switchRole(newRole);
                              } catch (err) {
                                console.warn('Role switch failed', err);
                                setIsUserMenuOpen(false);
                              }
                            }}
                            aria-label="Toggle active role"
                            className="relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <span className={`absolute left-0 right-0 h-6 rounded-full ${user.activeRole === 'vendor' ? 'bg-brand-orange' : 'bg-gray-200'}`} />
                            <span className={`relative inline-block w-5 h-5 transform bg-white rounded-full shadow transition-transform ${user.activeRole === 'vendor' ? 'translate-x-5' : 'translate-x-0'}`} />
                          </button>
                        </div>
                      </div>
                    )}
                    <Link
                      to={profilePath}
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsUserMenuOpen(false);
                      }}
                      className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-300"
                    >
                      Profile
                    </Link>
                    <Link
                      to={(user && Array.isArray(user.roles) && user.roles.includes('vendor') && !user.roles.includes('user') && !user.roles.includes('buyer')) ? '/vendor/dashboard' : (isVendorContext ? '/vendor/dashboard' : '/dashboard')}
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsUserMenuOpen(false);
                      }}
                      className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-300"
                    >
                      Dashboard
                    </Link>

                    {/* Switch to Vendor (for users who can upgrade) */}
                    {!isVendor && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVendorSwitch();
                          }}
                          className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-300"
                        >
                          Switch to Vendor
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowBecomeVendorModal(true);
                            setIsUserMenuOpen(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-300"
                        >
                          Become a vendor
                        </button>
                      </>
                    )}
                    {user.role === 'admin' && (
                      <Link
                        to="/admin"
                          className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-300"
                      >
                        Admin Panel
                      </Link>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLogout();
                      }}
                      className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-300"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
              </>
            ) : (
              <>
                <Link to="/auth/login" onClick={(e) => { e.preventDefault(); navigate('/auth/login'); }} className="text-sm text-gray-700 hover:text-brand-orange">Sign in</Link>
              </>
            )}
          </div>

          {/* Mobile menu button - Always show on mobile, opens sidebar for authenticated users */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (isProtectedRoute) {
                console.log('Hamburger clicked, toggling sidebar');
                toggleMobileSidebar();
              } else {
                setIsMobileMenuOpen(!isMobileMenuOpen);
              }
            }}
            className="lg:hidden p-2 rounded-lg text-gray-700 hover:text-brand-orange hover:bg-gray-100 transition-colors duration-300"
            aria-label={isProtectedRoute ? "Toggle sidebar" : "Toggle menu"}
          >
            {isProtectedRoute ? (
              <FaBars className="text-xl" />
            ) : (
              isMobileMenuOpen ? <FaTimes /> : <FaBars />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        </header>
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <nav className="flex flex-col space-y-4">
              <Link
                to="/"
                className="text-gray-700 hover:text-red-600 transition-colors duration-300 font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/properties?status=For%20Sale"
                className="text-gray-700 hover:text-red-600 transition-colors duration-300 font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                For Sale
              </Link>
*** End Patch
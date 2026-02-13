import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSidebar } from '../../contexts/SidebarContext';
import { FaHome, FaBars, FaTimes, FaSearch, FaUser, FaShieldAlt } from 'react-icons/fa';
import GlobalSearch from '../GlobalSearch';
import { useGlobalSearch } from '../../hooks/useGlobalSearch';
import AdminProfileModal from '../AdminProfileModalNew';
import toast from 'react-hot-toast';

const Header = () => {
  const { user, logout, isBuyer, isVendor, switchRole, registerAsVendor, signInWithGooglePopup } = useAuth();
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

  // Quick Filters with sublinks
  const quickFilters = {
    'All Properties': [],
    'For Sale': ['House', 'Apartment', 'Condo', 'Penthouse', 'Land', 'Villa', 'Townhouse'],
    'For Rent': ['Lagos', 'Abuja', 'Port Harcourt', 'Kano', 'Ibadan', 'Kaduna', 'Enugu', 'Aba'],
    'Shortlet': ['Lagos', 'Abuja', 'Port Harcourt', 'Kano', 'Calabar', 'Jos', 'Ibadan', 'Kaduna'],
    'New Developments': [],
    'Waterfront': [],
    'Luxury': [],
    'Blog': [],
    'Professional Services': ['Legal Services', 'Account & Book Keeping', 'Business Office for consultation']
  };

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
  };

  const handleVendorSwitch = async () => {
    const result = await switchRole('vendor');

    // Fallback: if user is not vendor, redirect to vendor registration
    if (!isVendor || (result && result.requiresVendorRegistration)) {
      setIsUserMenuOpen(false);
      navigate('/vendor/register', { replace: true });
      return;
    }

    // If result indicates success (boolean) or is a user object, treat as successful switch
    const switchedSuccessfully = (result && result.success) || (result && (result.id || result.roles || result.role));
    if (switchedSuccessfully) {
      setIsUserMenuOpen(false);
      navigate('/vendor/dashboard', { replace: true });
    }
  };

  const handleVendorRegistration = async () => {
    const result = await registerAsVendor({
      businessName: user?.firstName + ' ' + user?.lastName + ' Properties',
      businessType: 'Real Estate Agent',
      experience: '1+ years'
    });
    
    if (result.success) {
      setShowVendorRegistrationModal(false);
      // Navigate to vendor dashboard after registration
      if (result.navigateTo) {
        navigate(result.navigateTo, { replace: true });
      } else {
        navigate('/vendor/dashboard', { replace: true });
      }
    }
  };

  const handleAdminProfileClick = (e) => {
    console.log('Admin profile clicked!', { e, showAdminProfileModal });
    e.preventDefault();
    e.stopPropagation();
    setShowAdminProfileModal(true);
    setIsUserMenuOpen(false);
  };

  // Keyboard shortcut for global search (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        openSearch();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [openSearch]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeDropdown && !event.target.closest('.dropdown-container')) {
        setActiveDropdown(null);
      }
      // Close user menu when clicking outside
      // Check both the container and the dropdown menu itself
      if (isUserMenuOpen && 
          !event.target.closest('.user-menu-container') && 
          !event.target.closest('.user-menu-dropdown')) {
        setIsUserMenuOpen(false);
      }
    };

    // Use click instead of mousedown to allow button clicks to register first
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [activeDropdown, isUserMenuOpen]);

  // Always render the full header (do not return a minimal header for dashboard routes)

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
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-16 md:h-20 py-2">
          <div className="flex items-center flex-shrink-0 space-x-2 sm:space-x-4 lg:space-x-6">
            {/* Logo */}
            <Link to="/" className="flex items-center flex-shrink-0 focus:outline-none focus:ring-0 border-none">
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
              <div className="w-10 h-10 bg-brand-orange rounded-lg flex items-center justify-center" style={{ display: 'none' }}>
                <FaHome className="text-white text-xl" />
              </div>
            </Link>

            {/* Navigation Menu */}
            <nav className="hidden lg:flex items-center flex-nowrap space-x-2 xl:space-x-4">
              {/* For Sale */}
              <div className="relative dropdown-container">
                <button
                  onClick={() => setActiveDropdown(activeDropdown === 'For Sale' ? null : 'For Sale')}
                  className={`flex items-center space-x-1 px-2 xl:px-3 py-2 text-xs xl:text-sm font-medium transition-colors whitespace-nowrap ${
                    activeDropdown === 'For Sale' ? 'text-brand-orange' : 'text-brand-blue hover:text-brand-orange'
                  }`}
                >
                  <span>For Sale</span>
                  <svg 
                    className={`w-4 h-4 transition-transform ${
                      activeDropdown === 'For Sale' ? 'rotate-180' : ''
                    }`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {activeDropdown === 'For Sale' && (
                  <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-48">
                    <div className="py-2">
                      {quickFilters['For Sale'].map((item) => (
                        <Link
                          key={item}
                          to={`/properties?type=${encodeURIComponent(item)}&status=For Sale`}
                          onClick={() => setActiveDropdown(null)}
                          className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors text-gray-700"
                        >
                          {item}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* For Rent */}
              <div className="relative dropdown-container">
                <button
                  onClick={() => setActiveDropdown(activeDropdown === 'For Rent' ? null : 'For Rent')}
                  className={`flex items-center space-x-1 px-2 xl:px-3 py-2 text-xs xl:text-sm font-medium transition-colors whitespace-nowrap ${
                    activeDropdown === 'For Rent' ? 'text-brand-orange' : 'text-brand-blue hover:text-brand-orange'
                  }`}
                >
                  <span>For Rent</span>
                  <svg 
                    className={`w-4 h-4 transition-transform ${
                      activeDropdown === 'For Rent' ? 'rotate-180' : ''
                    }`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {activeDropdown === 'For Rent' && (
                  <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-48">
                    <div className="py-2">
                      {quickFilters['For Rent'].map((location) => (
                        <Link
                          key={location}
                          to={`/properties?location=${encodeURIComponent(location)}&status=For Rent`}
                          onClick={() => setActiveDropdown(null)}
                          className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors text-gray-700"
                        >
                          {location}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Shortlet - link directly to shortlet listings instead of opening a locations dropdown */}
              <Link
                to="/properties?status=Shortlet"
                onClick={() => setActiveDropdown(null)}
                className="px-2 xl:px-3 py-2 text-xs xl:text-sm font-medium text-brand-blue hover:text-brand-orange transition-colors whitespace-nowrap"
              >
                Shortlet
              </Link>

              {/* Blog removed */}

              {/* Professional Services */}
              <div className="relative dropdown-container">
                <button
                  onClick={() => setActiveDropdown(activeDropdown === 'Professional Services' ? null : 'Professional Services')}
                  aria-label="Professional Services"
                  aria-expanded={activeDropdown === 'Professional Services'}
                  className={`flex items-center space-x-1 px-2 xl:px-3 py-2 text-xs xl:text-sm font-medium transition-colors whitespace-nowrap ${
                    activeDropdown === 'Professional Services' ? 'text-brand-orange' : 'text-brand-blue hover:text-brand-orange'
                  }`}
                >
                  <span className="hidden xl:inline">Professional Services</span>
                  <span className="xl:hidden">Services</span>
                  <svg 
                    className={`w-4 h-4 transition-transform ${
                      activeDropdown === 'Professional Services' ? 'rotate-180' : ''
                    }`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {activeDropdown === 'Professional Services' && (
                  <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-48">
                    <div className="py-2">
                      {quickFilters['Professional Services'].map((service) => (
                        <button
                          key={service}
                          onClick={() => {
                            setActiveDropdown(null);
                            navigate(`/professional-services/enquiry?service=${encodeURIComponent(service)}`);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors text-gray-700"
                        >
                          {service}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
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
                    <div className="px-4 pb-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-500">Active Role</span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          {user?.activeRole === 'vendor' ? 'Vendor' : 'Buyer'}
                        </span>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            setIsUserMenuOpen(false);
                            try {
                              const result = await switchRole('buyer');
                              const updated = result || {};
                              const switched = Boolean(
                                updated.success || updated.id || updated.roles || updated.role || updated.activeRole
                              );
                              if (switched) {
                                navigate('/dashboard', { replace: true });
                              }
                            } catch (err) {
                              console.error('Error switching to buyer role', err);
                            }
                          }}
                          className={`text-xs px-2 py-1 rounded border ${!isVendorContext ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50'}`}
                          disabled={!user?.roles?.includes('buyer')}
                        >
                          Buyer
                        </button>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            setIsUserMenuOpen(false);
                            try {
                              const result = await switchRole('vendor');
                              const updated = result || {};

                              // If the server indicates vendor registration is required, go to registration
                              if (updated.requiresVendorRegistration) {
                                navigate('/vendor/register', { replace: true });
                                return;
                              }

                              // Decide based on returned user/flags instead of stale `isVendor`
                              const isNowVendor = Boolean(
                                updated.roles?.includes('vendor') || updated.role === 'vendor' || updated.activeRole === 'vendor'
                              );

                              if (!isNowVendor) {
                                // If not a vendor after the switch attempt, navigate to registration
                                navigate('/vendor/register', { replace: true });
                              } else {
                                navigate('/vendor/dashboard', { replace: true });
                              }
                            } catch (err) {
                              console.error('Error switching to vendor role', err);
                              // On error, fallback to vendor registration flow
                              navigate('/vendor/register', { replace: true });
                            }
                          }}
                          className={`text-xs px-2 py-1 rounded border ${isVendorContext ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50'}`}
                          disabled={!user?.roles?.includes('vendor')}
                        >
                          Vendor
                        </button>
                      </div>
                    </div>
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
                      to={isVendorContext ? '/vendor/dashboard' : '/dashboard'}
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsUserMenuOpen(false);
                      }}
                      className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-300"
                    >
                      Dashboard
                    </Link>
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
                to="/properties"
                className="text-gray-700 hover:text-red-600 transition-colors duration-300 font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Properties
              </Link>
              {/* Shortlet - direct link for mobile menu */}
              <Link
                to="/properties?status=Shortlet"
                className="text-gray-700 hover:text-red-600 transition-colors duration-300 font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Shortlet
              </Link>
              <Link
                to="/investments"
                className="text-gray-700 hover:text-red-600 transition-colors duration-300 font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Investments
              </Link>
              <Link
                to="/escrow"
                className="text-gray-700 hover:text-red-600 transition-colors duration-300 font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Escrow
              </Link>
              <Link
                to="/about"
                className="text-gray-700 hover:text-red-600 transition-colors duration-300 font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                About
              </Link>
              <Link
                to="/contact"
                className="text-gray-700 hover:text-red-600 transition-colors duration-300 font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Contact
              </Link>

              {!user && (
                <div className="pt-4 border-t border-gray-200">
                  <Link
                    to="/auth/login" onClick={(e) => { e.preventDefault(); navigate('/auth/login'); }}
                    className="block text-gray-700 hover:text-red-600 transition-colors duration-300 mb-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign in
                  </Link>
                </div>
              )}

              {user && (
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-2 mb-4">
                    <img
                      src={user.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face'}
                      alt="User"
                      className="w-8 h-8 rounded-full"
                    />
                    <span className="font-medium text-gray-900">
                      {user.firstName} {user.lastName}
                    </span>
                  </div>
                  {isAdminContext ? (
                    <button
                      onClick={(e) => {
                        handleAdminProfileClick(e);
                        setIsMobileMenuOpen(false);
                      }}
                      className="block w-full text-left text-gray-700 hover:text-red-600 transition-colors duration-300 mb-2"
                    >
                      Profile
                    </button>
                  ) : (
                    <Link
                      to={profilePath}
                      className="block text-gray-700 hover:text-red-600 transition-colors duration-300 mb-2"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Profile
                    </Link>
                  )}
                  <Link
                    to={isVendorContext ? '/vendor/dashboard' : '/dashboard'}
                    className="block text-gray-700 hover:text-red-600 transition-colors duration-300 mb-2"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    Dashboard
                  </Link>
                  {user.role === 'admin' && (
                    <Link
                      to="/admin"
                      className="block text-gray-700 hover:text-red-600 transition-colors duration-300 mb-2"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="block text-gray-700 hover:text-red-600 transition-colors duration-300"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>

      {/* Vendor Registration Modal */}
      {showVendorRegistrationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Register as Vendor</h3>
              <button
                onClick={() => setShowVendorRegistrationModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                Join our network of verified property vendors and start listing your properties to reach thousands of potential buyers.
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm text-gray-700">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>List unlimited properties</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-700">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Access to buyer leads</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-700">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Secure escrow payments</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-700">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Professional support</span>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowVendorRegistrationModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleVendorRegistration}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Register as Vendor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Profile Modal */}
      <AdminProfileModal
        isOpen={showAdminProfileModal}
        onClose={() => setShowAdminProfileModal(false)}
      />

      {/* Global Search Modal */}
      {isSearchOpen && (
        <GlobalSearch
          isOpen={isSearchOpen}
          onClose={closeSearch}
          onResultClick={handleResultClick}
        />
      )}
    </header>
    </>
  );
};

export default Header; 

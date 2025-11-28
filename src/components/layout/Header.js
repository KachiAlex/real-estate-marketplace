import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSidebar } from '../../contexts/SidebarContext';
import { FaHome, FaBars, FaTimes, FaSearch } from 'react-icons/fa';
import GlobalSearch from '../GlobalSearch';
import { useGlobalSearch } from '../../hooks/useGlobalSearch';
import toast from 'react-hot-toast';

const Header = () => {
  const { user, logout, isBuyer, isVendor, switchRole, registerAsVendor } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { toggleMobileSidebar } = useSidebar();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [showVendorRegistrationModal, setShowVendorRegistrationModal] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const { isSearchOpen, openSearch, closeSearch, handleResultClick } = useGlobalSearch();
  
  // Hide search bar on home page since it's in the banner
  const isHomePage = location.pathname === '/';
  
  // Check if user is on a protected route (where sidebar should be visible)
  const isProtectedRoute = user && !['/', '/login', '/register'].includes(location.pathname);
  
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
    'Diasporan Services': ['Legal Services', 'Account & Book Keeping', 'Business Office for consultation']
  };

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
  };

  const handleVendorSwitch = async () => {
    const result = await switchRole('vendor');
    
    if (result.requiresVendorRegistration) {
      // Show vendor registration modal
      setShowVendorRegistrationModal(true);
      setIsUserMenuOpen(false);
    } else if (result.success) {
      setIsUserMenuOpen(false);
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
    }
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
      if (isUserMenuOpen && !event.target.closest('.user-menu-container')) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeDropdown, isUserMenuOpen]);

  // If on dashboard route, show minimal header with just user profile
  if (isDashboardRoute) {
    return (
      <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="flex justify-end items-center h-14 py-2">
            {/* User Profile Icon Only */}
            {user ? (
              <div className="relative user-menu-container">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="User menu"
                >
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {user.avatar ? (
                      <img 
                        src={user.avatar} 
                        alt={`${user.firstName} ${user.lastName}`}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <span>{user.firstName?.[0]?.toUpperCase() || 'U'}{user.lastName?.[0]?.toUpperCase() || ''}</span>
                    )}
                  </div>
                </button>
                
                {/* User Menu Dropdown */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-semibold text-gray-900">{user.firstName} {user.lastName}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                      {(user.roles && user.roles.length > 1) && (
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          <button
                            onClick={() => switchRole('buyer').then(() => setIsUserMenuOpen(false))}
                            className={`text-xs px-2 py-1 rounded border ${isBuyer() ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50'}`}
                            disabled={!user?.roles?.includes('buyer')}
                          >
                            Buyer
                          </button>
                          <button
                            onClick={handleVendorSwitch}
                            className={`text-xs px-2 py-1 rounded border ${isVendor() ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50'}`}
                          >
                            Vendor
                          </button>
                        </div>
                      )}
                    </div>
                    <Link
                      to="/dashboard"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-300"
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/profile"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-300"
                    >
                      Profile
                    </Link>
                    {user.role === 'admin' && (
                      <Link
                        to="/admin"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-300"
                      >
                        Admin Panel
                      </Link>
                    )}
                    {user.role === 'mortgage_bank' && (
                      <Link
                        to="/mortgage-bank/dashboard"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-300"
                      >
                        Mortgage Bank Dashboard
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-300"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300 font-medium text-sm"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white shadow-lg sticky top-0 z-50 border-b border-gray-200">
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

              {/* Shortlet */}
              <div className="relative dropdown-container">
                <button
                  onClick={() => setActiveDropdown(activeDropdown === 'Shortlet' ? null : 'Shortlet')}
                  className={`flex items-center space-x-1 px-2 xl:px-3 py-2 text-xs xl:text-sm font-medium transition-colors whitespace-nowrap ${
                    activeDropdown === 'Shortlet' ? 'text-brand-orange' : 'text-brand-blue hover:text-brand-orange'
                  }`}
                >
                  <span>Shortlet</span>
                  <svg 
                    className={`w-4 h-4 transition-transform ${
                      activeDropdown === 'Shortlet' ? 'rotate-180' : ''
                    }`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {activeDropdown === 'Shortlet' && (
                  <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-48">
                    <div className="py-2">
                      {quickFilters['Shortlet'].map((location) => (
                        <Link
                          key={location}
                          to={`/properties?location=${encodeURIComponent(location)}&status=Shortlet`}
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

              {/* Blog */}
              <Link
                to="/blog"
                className="px-2 xl:px-3 py-2 text-xs xl:text-sm font-medium text-brand-blue hover:text-brand-orange transition-colors whitespace-nowrap"
              >
                Blog
              </Link>

              {/* Diasporan Services */}
              <div className="relative dropdown-container">
                <button
                  onClick={() => setActiveDropdown(activeDropdown === 'Diasporan Services' ? null : 'Diasporan Services')}
                  className={`flex items-center space-x-1 px-2 xl:px-3 py-2 text-xs xl:text-sm font-medium transition-colors whitespace-nowrap ${
                    activeDropdown === 'Diasporan Services' ? 'text-brand-orange' : 'text-brand-blue hover:text-brand-orange'
                  }`}
                >
                  <span className="hidden xl:inline">Diasporan Services</span>
                  <span className="xl:hidden">Diasporan</span>
                  <svg 
                    className={`w-4 h-4 transition-transform ${
                      activeDropdown === 'Diasporan Services' ? 'rotate-180' : ''
                    }`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {activeDropdown === 'Diasporan Services' && (
                  <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-48">
                    <div className="py-2">
                      {quickFilters['Diasporan Services'].map((service) => (
                        <button
                          key={service}
                          onClick={() => {
                            toast.info(`${service} - Coming soon!`);
                            setActiveDropdown(null);
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
              <div className="relative">
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
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
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
                          onClick={() => switchRole('buyer').then(() => setIsUserMenuOpen(false))}
                          className={`text-xs px-2 py-1 rounded border ${isBuyer() ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50'}`}
                          disabled={!user?.roles?.includes('buyer')}
                        >
                          Buyer
                        </button>
                        <button
                          onClick={handleVendorSwitch}
                          className={`text-xs px-2 py-1 rounded border ${isVendor() ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50'}`}
                        >
                          Vendor
                        </button>
                      </div>
                    </div>
                    <Link
                      to="/profile"
                        className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-300"
                    >
                      Profile
                    </Link>
                    <Link
                      to="/dashboard"
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
                      onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-300"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
              </>
            ) : (
              <div className="flex items-center space-x-2 xl:space-x-4">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-brand-orange transition-colors duration-300 font-medium text-xs xl:text-sm whitespace-nowrap"
                >
                  Sign In
                </Link>
                <Link
                  to="/mortgage-bank/register"
                  className="px-3 xl:px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors duration-300 font-medium text-xs xl:text-sm whitespace-nowrap"
                >
                  Mortgage Bank Sign Up
                </Link>
                <Link
                  to="/login?redirect=/mortgage-bank/dashboard"
                  className="px-3 xl:px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors duration-300 font-medium text-xs xl:text-sm whitespace-nowrap"
                >
                  Mortgage Bank Login
                </Link>
              </div>
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

              {user ? (
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
                  <Link
                    to="/profile"
                    className="block text-gray-700 hover:text-red-600 transition-colors duration-300 mb-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <Link
                    to="/dashboard"
                    className="block text-gray-700 hover:text-red-600 transition-colors duration-300 mb-2"
                    onClick={() => setIsMobileMenuOpen(false)}
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
              ) : (
                <div className="pt-4 border-t border-gray-200">
                  <Link
                    to="/login"
                    className="block text-gray-700 hover:text-red-600 transition-colors duration-300 mb-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/mortgage-bank/register"
                    className="block px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors duration-300 mb-2 text-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Mortgage Bank Sign Up
                  </Link>
                  <Link
                    to="/login?redirect=/mortgage-bank/dashboard"
                    className="block px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors duration-300 mb-2 text-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Mortgage Bank Login
                  </Link>
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

      {/* Global Search Modal */}
      {isSearchOpen && (
        <GlobalSearch
          isOpen={isSearchOpen}
          onClose={closeSearch}
          onResultClick={handleResultClick}
        />
      )}
    </header>
  );
};

export default Header; 

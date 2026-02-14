import React from 'react';

const Header = () => {
  return (
    <header>
      <h1>Header Placeholder</h1>
    </header>
  );
};

export default Header;
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
                    {/* Centralized role switcher component */}

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
      {/* Dashboard Role Switcher (buyer/vendor only) */}
      {user && user.role !== 'admin' && (
        <div className="w-full flex justify-center py-2 bg-gray-50 border-t">
          <RoleSwitcher />
        </div>
      )}
    </header>
    </>
  );
};

export default Header; 

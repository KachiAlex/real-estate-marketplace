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
  import React from 'react';
  import { Link } from 'react-router-dom';

  // Minimal header used as a safe fallback while debugging syntax issues
  export default function Header() {
    return (
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="font-bold text-lg text-gray-800">PropertyArk</Link>
          <nav>
            <Link to="/properties" className="text-sm text-gray-600 hover:text-gray-900">Properties</Link>
          </nav>
        </div>
      </header>
    );
  }
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

      <BecomeVendorModal isOpen={showBecomeVendorModal} onClose={() => setShowBecomeVendorModal(false)} />

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
    </>
  );
}

export default Header;

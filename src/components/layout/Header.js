import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FaShieldAlt, FaUser, FaSignOutAlt, FaBars, FaTimes, FaSearch, FaHeart, FaBell } from 'react-icons/fa';

const Header = () => {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
  };

  return (
    <header className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-r from-red-600 to-red-700 rounded-lg flex items-center justify-center">
              <FaShieldAlt className="text-white text-xl" />
            </div>
            <span className="text-2xl font-bold text-gray-900">PropertyPro</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className="text-gray-700 hover:text-red-600 transition-colors duration-300 font-medium"
            >
              Home
            </Link>
            <Link
              to="/properties"
              className="text-gray-700 hover:text-red-600 transition-colors duration-300 font-medium"
            >
              Properties
            </Link>
            <Link
              to="/investments"
              className="text-gray-700 hover:text-red-600 transition-colors duration-300 font-medium"
            >
              Investments
            </Link>
            <Link
              to="/investor-dashboard"
              className="text-gray-700 hover:text-red-600 transition-colors duration-300 font-medium"
            >
              Landvest
            </Link>
            <Link
              to="/escrow"
              className="text-gray-700 hover:text-red-600 transition-colors duration-300 font-medium"
            >
              Escrow
            </Link>
            <Link
              to="/about"
              className="text-gray-700 hover:text-red-600 transition-colors duration-300 font-medium"
            >
              About
            </Link>
            <Link
              to="/contact"
              className="text-gray-700 hover:text-red-600 transition-colors duration-300 font-medium"
            >
              Contact
            </Link>
          </nav>

          {/* Desktop User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-red-600 transition-colors duration-300"
                >
                  <img
                    src={user.avatar || 'https://picsum.photos/32/32'}
                    alt="User"
                    className="w-8 h-8 rounded-full"
                  />
                  <span className="font-medium">
                    {user.firstName} {user.lastName}
                  </span>
                  <FaUser className="text-sm" />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors duration-300"
                    >
                      Profile
                    </Link>
                    <Link
                      to="/dashboard"
                      className="block px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors duration-300"
                    >
                      Dashboard
                    </Link>
                    {user.role === 'admin' && (
                      <Link
                        to="/admin"
                        className="block px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors duration-300"
                      >
                        Admin Panel
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors duration-300"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-red-600 transition-colors duration-300 font-medium"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-6 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-300 font-medium"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-700 hover:text-red-600 hover:bg-red-50 transition-colors duration-300"
          >
            {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
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
                      src={user.avatar || 'https://picsum.photos/32/32'}
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
                    to="/register"
                    className="block px-6 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-300 font-medium text-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header; 
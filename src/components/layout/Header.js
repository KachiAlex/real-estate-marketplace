import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FaHome, FaUser, FaSignOutAlt, FaBars, FaTimes, FaShieldAlt, FaBuilding, FaChartLine, FaCreditCard } from 'react-icons/fa';

const Header = () => {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: 'Home', href: '/', icon: FaHome },
    { name: 'Properties', href: '/properties', icon: FaBuilding },
    { name: 'Investments', href: '/investments', icon: FaChartLine },
    { name: 'Escrow', href: '/escrow', icon: FaCreditCard },
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
  };

  return (
    <header className="bg-white shadow-lg border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <FaShieldAlt className="text-white text-xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">PropertyPro</h1>
                <p className="text-xs text-gray-500 -mt-1">Real Estate</p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                  isActive(item.href)
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                <item.icon className="text-sm" />
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>

          {/* User Menu / Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="relative group">
                <button className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-all duration-300">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <FaUser className="text-white text-sm" />
                  </div>
                  <span className="text-gray-700 font-medium">
                    {user.firstName} {user.lastName}
                  </span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top-right">
                  <div className="py-2">
                    {user.role === 'admin' && (
                      <Link
                        to="/admin"
                        className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                      >
                        <FaShieldAlt className="mr-3 text-blue-600" />
                        Admin Dashboard
                      </Link>
                    )}
                    <Link
                      to="/dashboard"
                      className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                    >
                      <FaUser className="mr-3 text-blue-600" />
                      Dashboard
                    </Link>
                    <Link
                      to="/profile"
                      className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                    >
                      <FaUser className="mr-3 text-blue-600" />
                      Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                    >
                      <FaSignOutAlt className="mr-3 text-red-600" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="px-6 py-2 text-gray-700 hover:text-blue-600 font-medium transition-colors duration-300"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-medium"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors duration-300"
            >
              {isMenuOpen ? (
                <FaTimes className="w-6 h-6" />
              ) : (
                <FaBars className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t border-gray-100">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                    isActive(item.href)
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <item.icon className="text-sm" />
                  <span>{item.name}</span>
                </Link>
              ))}

              {/* Mobile User Menu */}
              {user ? (
                <div className="border-t border-gray-100 pt-4 mt-4">
                  <div className="flex items-center space-x-3 px-4 py-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <FaUser className="text-white text-sm" />
                    </div>
                    <span className="text-gray-700 font-medium">
                      {user.firstName} {user.lastName}
                    </span>
                  </div>
                  
                  {user.role === 'admin' && (
                    <Link
                      to="/admin"
                      className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <FaShieldAlt className="mr-3 text-blue-600" />
                      Admin Dashboard
                    </Link>
                  )}
                  
                  <Link
                    to="/dashboard"
                    className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <FaUser className="mr-3 text-blue-600" />
                    Dashboard
                  </Link>
                  
                  <Link
                    to="/profile"
                    className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <FaUser className="mr-3 text-blue-600" />
                    Profile
                  </Link>
                  
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                  >
                    <FaSignOutAlt className="mr-3 text-red-600" />
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="border-t border-gray-100 pt-4 mt-4 space-y-2">
                  <Link
                    to="/login"
                    className="block px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors duration-200 rounded-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="block px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 text-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header; 
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FaHome, FaSearch, FaUser, FaSignOutAlt, FaBars, FaTimes, FaBuilding, FaChartLine, FaShieldAlt } from 'react-icons/fa';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <header className="bg-white shadow-lg border-b border-gray-100 sticky top-0 z-50 backdrop-blur-sm bg-white/90">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-105">
              <FaHome className="text-white text-lg" />
            </div>
            <div>
              <span className="text-2xl font-bold gradient-text">RealEstate</span>
              <div className="text-xs text-gray-500 font-medium">Premium Properties</div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            <Link
              to="/"
              className={`text-sm font-semibold transition-all duration-300 relative group ${
                isActive('/') ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              <span className="relative">
                Home
                {isActive('/') && (
                  <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-blue-600 to-purple-600"></span>
                )}
              </span>
            </Link>
            <Link
              to="/properties"
              className={`text-sm font-semibold transition-all duration-300 relative group ${
                isActive('/properties') ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              <span className="relative">
                Properties
                {isActive('/properties') && (
                  <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-blue-600 to-purple-600"></span>
                )}
              </span>
            </Link>
            <Link
              to="/investments"
              className={`text-sm font-semibold transition-all duration-300 relative group ${
                isActive('/investments') ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              <span className="relative">
                Investments
                {isActive('/investments') && (
                  <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-blue-600 to-purple-600"></span>
                )}
              </span>
            </Link>
            <Link
              to="/mortgages"
              className={`text-sm font-semibold transition-all duration-300 relative group ${
                isActive('/mortgages') ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              <span className="relative">
                Mortgages
                {isActive('/mortgages') && (
                  <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-blue-600 to-purple-600"></span>
                )}
              </span>
            </Link>
            <Link
              to="/about"
              className={`text-sm font-semibold transition-all duration-300 relative group ${
                isActive('/about') ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              <span className="relative">
                About
                {isActive('/about') && (
                  <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-blue-600 to-purple-600"></span>
                )}
              </span>
            </Link>
            <Link
              to="/contact"
              className={`text-sm font-semibold transition-all duration-300 relative group ${
                isActive('/contact') ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              <span className="relative">
                Contact
                {isActive('/contact') && (
                  <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-blue-600 to-purple-600"></span>
                )}
              </span>
            </Link>
          </nav>

          {/* User Menu / Auth Buttons */}
          <div className="hidden lg:flex items-center space-x-6">
            {user ? (
              <div className="flex items-center space-x-6">
                <Link
                  to="/dashboard"
                  className="text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors duration-300 flex items-center space-x-2"
                >
                  <FaChartLine className="text-lg" />
                  <span>Dashboard</span>
                </Link>
                <div className="relative group">
                  <button className="flex items-center space-x-3 text-sm font-semibold text-gray-700 hover:text-blue-600 transition-all duration-300 bg-gray-50 hover:bg-gray-100 px-4 py-2 rounded-xl">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-8 h-8 rounded-full border-2 border-white shadow-md"
                    />
                    <span>{user.name}</span>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  </button>
                  <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl py-2 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform group-hover:translate-y-0 translate-y-2 border border-gray-100">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="text-sm font-semibold text-gray-900">{user.name}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </div>
                    <Link
                      to="/profile"
                      className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
                    >
                      <FaUser className="text-gray-400" />
                      <span>Profile</span>
                    </Link>
                    <Link
                      to="/add-property"
                      className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
                    >
                      <FaBuilding className="text-gray-400" />
                      <span>Add Property</span>
                    </Link>
                    <Link
                      to="/escrow"
                      className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
                    >
                      <FaShieldAlt className="text-gray-400" />
                      <span>Escrow</span>
                    </Link>
                    <div className="border-t border-gray-100 mt-2">
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 w-full text-left transition-colors duration-200"
                      >
                        <FaSignOutAlt className="text-red-400" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors duration-300"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="btn btn-primary text-sm px-6 py-3"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-3 rounded-xl text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300"
          >
            {isMobileMenuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden py-6 border-t border-gray-100 animate-fadeIn">
            <nav className="flex flex-col space-y-4">
              <Link
                to="/"
                className={`flex items-center space-x-3 text-sm font-semibold transition-all duration-300 p-3 rounded-xl ${
                  isActive('/') ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <FaHome className="text-lg" />
                <span>Home</span>
              </Link>
              <Link
                to="/properties"
                className={`flex items-center space-x-3 text-sm font-semibold transition-all duration-300 p-3 rounded-xl ${
                  isActive('/properties') ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <FaBuilding className="text-lg" />
                <span>Properties</span>
              </Link>
              <Link
                to="/investments"
                className={`flex items-center space-x-3 text-sm font-semibold transition-all duration-300 p-3 rounded-xl ${
                  isActive('/investments') ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <FaChartLine className="text-lg" />
                <span>Investments</span>
              </Link>
              <Link
                to="/mortgages"
                className={`flex items-center space-x-3 text-sm font-semibold transition-all duration-300 p-3 rounded-xl ${
                  isActive('/mortgages') ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <FaShieldAlt className="text-lg" />
                <span>Mortgages</span>
              </Link>
              <Link
                to="/about"
                className={`flex items-center space-x-3 text-sm font-semibold transition-all duration-300 p-3 rounded-xl ${
                  isActive('/about') ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span>About</span>
              </Link>
              <Link
                to="/contact"
                className={`flex items-center space-x-3 text-sm font-semibold transition-all duration-300 p-3 rounded-xl ${
                  isActive('/contact') ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span>Contact</span>
              </Link>

              {user ? (
                <div className="pt-6 border-t border-gray-100 space-y-3">
                  <div className="px-3 py-2 bg-gray-50 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-8 h-8 rounded-full border-2 border-white shadow-md"
                      />
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{user.name}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </div>
                  <Link
                    to="/dashboard"
                    className="flex items-center space-x-3 text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors duration-300 p-3 rounded-xl hover:bg-gray-50"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <FaChartLine className="text-lg" />
                    <span>Dashboard</span>
                  </Link>
                  <Link
                    to="/profile"
                    className="flex items-center space-x-3 text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors duration-300 p-3 rounded-xl hover:bg-gray-50"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <FaUser className="text-lg" />
                    <span>Profile</span>
                  </Link>
                  <Link
                    to="/add-property"
                    className="flex items-center space-x-3 text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors duration-300 p-3 rounded-xl hover:bg-gray-50"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <FaBuilding className="text-lg" />
                    <span>Add Property</span>
                  </Link>
                  <Link
                    to="/escrow"
                    className="flex items-center space-x-3 text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors duration-300 p-3 rounded-xl hover:bg-gray-50"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <FaShieldAlt className="text-lg" />
                    <span>Escrow</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-3 text-sm font-semibold text-red-600 hover:text-red-700 transition-colors duration-300 p-3 rounded-xl hover:bg-red-50 w-full text-left"
                  >
                    <FaSignOutAlt className="text-lg" />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <div className="pt-6 border-t border-gray-100 space-y-3">
                  <Link
                    to="/login"
                    className="flex items-center justify-center text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors duration-300 p-3 rounded-xl hover:bg-gray-50"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="btn btn-primary w-full text-center"
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
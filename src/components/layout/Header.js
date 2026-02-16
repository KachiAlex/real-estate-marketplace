import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaBars, FaTimes, FaBell, FaUser, FaSearch } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';

const Header = () => {
  const { user, logout, isVendor } = useAuth() || {};
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location?.pathname === '/' || location?.pathname === '/home';
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isPropertiesOpen, setIsPropertiesOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const menuRef = useRef(null);
  const propertiesRef = useRef(null);

  useEffect(() => {
    const onWindowClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
      if (propertiesRef.current && !propertiesRef.current.contains(e.target)) {
        setIsPropertiesOpen(false);
      }
    };
    window.addEventListener('click', onWindowClick);
    return () => window.removeEventListener('click', onWindowClick);
  }, []);

  const handleLogout = async () => {
    try {
      await logout?.();
    } catch (err) {
      console.warn('Logout failed', err);
    } finally {
      navigate('/auth/login');
    }
  };

  const headerClass = `bg-white border-b shadow-sm fixed top-0 left-0 right-0 z-[100]`;
  // Responsive header: keep logo size, ensure header height is consistent, add modal offset utility
  return (
    <header className={headerClass} style={{height: '80px', minHeight: '80px'}}>
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between h-full">
        <Link to="/" className="flex items-center space-x-3">
          {!logoError ? (
            <img
              src={`${process.env.PUBLIC_URL}/logo.png?v=4.0`}
              alt="PropertyArk Logo"
              className="w-auto h-20 sm:h-24 md:h-28"
              onError={() => setLogoError(true)}
            />
          ) : (
            <span className="text-xl font-bold">Property Ark</span>
          )}
        </Link>

        <nav className="hidden md:flex items-center space-x-6">
          <div className="relative" ref={propertiesRef}>
            <button
                  onClick={() => setIsPropertiesOpen(!isPropertiesOpen)}
                  className="text-sm text-[#0a2a5c] hover:underline flex items-center space-x-1"
            >
              <span>Properties</span>
            </button>

            {isPropertiesOpen && (
              <div className="absolute left-0 mt-2 w-56 bg-white border rounded shadow z-50">
                <Link to="/properties?type=buy" className="block px-4 py-2 text-sm text-blue-600 hover:underline">For Sale</Link>
                  <Link to="/properties?type=buy" className="block px-4 py-2 text-sm text-[#0a2a5c] hover:underline">For Sale</Link>
                  <Link to="/properties?type=rent" className="block px-4 py-2 text-sm text-[#0a2a5c] hover:underline">For Rent</Link>
                  <Link to="/properties?type=short-let" className="block px-4 py-2 text-sm text-[#0a2a5c] hover:underline">Shortlet</Link>
                  <Link to="/properties" className="block px-4 py-2 text-sm text-[#0a2a5c] hover:underline">All Properties</Link>
              </div>
            )}
          </div>

          <Link to="/professional-services/enquiry" className="text-sm text-[#0a2a5c] hover:underline">Professional Service</Link>
          <Link to="/investments" className="text-sm text-[#0a2a5c] hover:underline">Investments</Link>
          <Link to="/about" className="text-sm text-[#0a2a5c] hover:underline">About</Link>
          {user && !isVendor && (
            <Link to="/auth/vendor-register" className="text-sm text-[#0a2a5c] hover:underline px-3 py-1 rounded">
              Become a Vendor
            </Link>
          )}
        </nav>

        <div className="flex items-center space-x-2 md:space-x-3">

          {user ? (
            <div className="relative" ref={menuRef}>
              <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="flex items-center space-x-2 p-2 rounded">
                <FaUser />
                <span className="hidden sm:inline">{user.firstName || user.displayName || 'User'}</span>
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow z-50">
                  <Link to="/dashboard" className="block px-4 py-2 text-sm">Dashboard</Link>
                  <Link to="/profile" className="block px-4 py-2 text-sm">Profile</Link>
                  <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm">Sign out</button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden sm:flex space-x-2">
              <Link to="/auth/login" className="text-sm text-[#0a2a5c] hover:underline">Sign in</Link>
            </div>
          )}

          <button className="md:hidden p-2" onClick={() => setIsMobileOpen(!isMobileOpen)} aria-label="Toggle menu">
            {isMobileOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </div>

      {isMobileOpen && (
        <div className="md:hidden border-t bg-white">
            <nav className="px-2 py-2 space-y-1">
            <Link to="/" onClick={() => setIsMobileOpen(false)} className="block">Home</Link>
            <Link to="/properties?type=buy" onClick={() => setIsMobileOpen(false)} className="block">For Sale</Link>
            <Link to="/properties?type=rent" onClick={() => setIsMobileOpen(false)} className="block">For Rent</Link>
            <Link to="/properties?type=short-let" onClick={() => setIsMobileOpen(false)} className="block">Shortlet</Link>
            <Link to="/professional-services/enquiry" onClick={() => setIsMobileOpen(false)} className="block">Professional Service</Link>
            <Link to="/properties" onClick={() => setIsMobileOpen(false)} className="block">Properties</Link>
            <Link to="/about" onClick={() => setIsMobileOpen(false)} className="block">About</Link>
            {user ? (
              <button onClick={() => { setIsMobileOpen(false); handleLogout(); }} className="block text-left">Sign out</button>
            ) : (
              <Link to="/auth/login" onClick={() => setIsMobileOpen(false)} className="block">Sign in</Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;

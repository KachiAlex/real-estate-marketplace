import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaHome, FaBars, FaTimes } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext-new';

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  // Debug auth state
  console.log('Header auth currentUser:', currentUser);

  return (
    <header className="bg-white shadow fixed top-0 inset-x-0 z-50">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 flex justify-between items-center h-16 py-2">
        <div className="flex items-center space-x-4">
          <Link to="/" className="flex items-center">
            {!logoError ? (
              <img 
                src={`${process.env.PUBLIC_URL || ''}/logo.png`} 
                alt="PropertyArk Logo" 
                className="h-16 w-auto"
                style={{ backgroundColor: 'transparent', border: 'none' }}
                onError={(e) => {
                  console.error('Logo failed to load:', e);
                  setLogoError(true);
                }}
              />
            ) : (
              <div className="h-16 w-auto flex items-center justify-center text-brand-blue font-bold text-xl">
                PropertyArk
              </div>
            )}
          </Link>
        </div>
        <nav className="hidden lg:flex items-center space-x-4">
          <Link to="/properties?status=For%20Sale" className="px-3 py-2 text-sm font-medium text-brand-blue hover:text-brand-orange">For Sale</Link>
          <Link to="/properties?status=For%20Rent" className="px-3 py-2 text-sm font-medium text-brand-blue hover:text-brand-orange">For Rent</Link>
          <Link to="/properties?status=Shortlet" className="px-3 py-2 text-sm font-medium text-brand-blue hover:text-brand-orange">Shortlet</Link>
          <Link to="/services" className="px-3 py-2 text-sm font-medium text-brand-blue hover:text-brand-orange">Professional Services</Link>
        </nav>
        <div className="hidden lg:flex items-center space-x-4">
          {currentUser ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 text-sm text-gray-700 hover:text-brand-orange"
                aria-label="Open profile menu"
              >
                {currentUser.avatar || currentUser.photoURL ? (
                  <img src={currentUser.avatar || currentUser.photoURL} alt="avatar" className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-brand-blue text-white flex items-center justify-center font-medium">{(currentUser.firstName || currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}</div>
                )}
                <span className="hidden sm:inline">{currentUser.firstName || currentUser.displayName || (currentUser.email && currentUser.email.split('@')[0])}</span>
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-lg z-50">
                  <button onClick={() => { setMenuOpen(false); navigate('/profile'); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">Profile</button>
                  <button onClick={() => { setMenuOpen(false); navigate('/dashboard'); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">Dashboard</button>
                  <div className="border-t" />
                  <button onClick={async () => { setMenuOpen(false); await logout(); navigate('/', { replace: true }); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50">Logout</button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/auth/login" className="text-sm text-gray-700 hover:text-brand-orange">Sign in</Link>
          )}
        </div>
        {/* Mobile menu button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="lg:hidden p-2 rounded-lg text-gray-700 hover:text-brand-orange hover:bg-gray-100"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>
      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden py-4 border-t border-gray-200">
          <nav className="flex flex-col space-y-4">
            <Link to="/" className="text-gray-700 hover:text-red-600 font-medium" onClick={() => setIsMobileMenuOpen(false)}>Home</Link>
            <Link to="/properties?status=For%20Sale" className="text-gray-700 hover:text-red-600 font-medium" onClick={() => setIsMobileMenuOpen(false)}>For Sale</Link>
            <Link to="/properties?status=For%20Rent" className="text-gray-700 hover:text-red-600 font-medium" onClick={() => setIsMobileMenuOpen(false)}>For Rent</Link>
            <Link to="/properties?status=Shortlet" className="text-gray-700 hover:text-red-600 font-medium" onClick={() => setIsMobileMenuOpen(false)}>Shortlet</Link>
            <Link to="/services" className="text-gray-700 hover:text-red-600 font-medium" onClick={() => setIsMobileMenuOpen(false)}>Professional Services</Link>
            <Link to="/auth/login" className="text-gray-700 hover:text-red-600 font-medium" onClick={() => setIsMobileMenuOpen(false)}>Sign in</Link>
          </nav>
        </div>
      )}
    </header>
  );
}

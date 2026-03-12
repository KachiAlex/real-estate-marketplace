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
  const [servicesDropdownOpen, setServicesDropdownOpen] = useState(false);
  const menuRef = useRef(null);
  const servicesRef = useRef(null);

  const professionalServices = [
    { name: 'Legal Services', service: 'Legal Services' },
    { name: 'Account & Book Keeping', service: 'Account & Book Keeping' },
    { name: 'Business Office for consultation', service: 'Business Office for consultation' }
  ];

  useEffect(() => {
    const onDocClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
      if (servicesRef.current && !servicesRef.current.contains(e.target)) setServicesDropdownOpen(false);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  return (
    <header className="bg-white shadow fixed top-0 inset-x-0 z-50">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 flex justify-between items-center h-16 py-2">
        <div className="flex items-center space-x-4">
          <Link to="/" className="flex items-center">
            {!logoError ? (
              <img 
                src={`${process.env.PUBLIC_URL || ''}/logo.png?v=4.0`} 
                alt="PropertyArk Logo" 
                className="w-auto h-14 sm:h-16 md:h-20"
                style={{ backgroundColor: 'transparent', border: 'none' }}
                onError={(e) => {
                  console.error('Logo failed to load:', e);
                  setLogoError(true);
                }}
              />
            ) : (
              <div className="w-auto h-14 sm:h-16 md:h-20 flex items-center justify-center text-brand-blue font-bold text-xl">
                PropertyArk
              </div>
            )}
          </Link>
        </div>
        <nav className="hidden lg:flex items-center space-x-4">
          <Link to="/properties?status=For%20Sale" className="px-3 py-2 text-sm font-medium text-brand-blue hover:text-brand-orange">For Sale</Link>
          <Link to="/properties?status=For%20Rent" className="px-3 py-2 text-sm font-medium text-brand-blue hover:text-brand-orange">For Rent</Link>
          <Link to="/properties?status=Shortlet" className="px-3 py-2 text-sm font-medium text-brand-blue hover:text-brand-orange">Shortlet</Link>
          
          {/* Professional Services Dropdown */}
          <div className="relative" ref={servicesRef}>
            <button
              onClick={() => setServicesDropdownOpen(!servicesDropdownOpen)}
              className="px-3 py-2 text-sm font-medium text-brand-blue hover:text-brand-orange flex items-center gap-1"
            >
              Professional Services
              <svg className={`w-4 h-4 transition-transform ${servicesDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>
            
            {servicesDropdownOpen && (
              <div className="absolute left-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                {professionalServices.map((service) => (
                  <button
                    key={service.service}
                    onClick={() => {
                      navigate(`/professional-services/enquiry?service=${encodeURIComponent(service.service)}`);
                      setServicesDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-brand-blue transition-colors first:rounded-t-lg last:rounded-b-lg border-b last:border-b-0 border-gray-100"
                  >
                    {service.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </nav>
        <div className="hidden lg:flex items-center space-x-4">
          {currentUser ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 text-sm text-gray-700 hover:text-brand-orange"
                aria-label="User menu"
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
                  {(currentUser?.role === 'admin' || currentUser?.roles?.includes('admin')) && (
                    <button onClick={() => { setMenuOpen(false); navigate('/admin'); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">Admin Panel</button>
                  )}
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
        <div className="lg:hidden py-2 border-t border-gray-200 shadow-md">
          <nav className="flex flex-col px-4">
            <Link to="/" className="flex items-center min-h-[44px] text-gray-700 hover:text-brand-orange font-medium" onClick={() => setIsMobileMenuOpen(false)}>Home</Link>
            <Link to="/properties?status=For%20Sale" className="flex items-center min-h-[44px] text-gray-700 hover:text-brand-orange font-medium" onClick={() => setIsMobileMenuOpen(false)}>For Sale</Link>
            <Link to="/properties?status=For%20Rent" className="flex items-center min-h-[44px] text-gray-700 hover:text-brand-orange font-medium" onClick={() => setIsMobileMenuOpen(false)}>For Rent</Link>
            <Link to="/properties?status=Shortlet" className="flex items-center min-h-[44px] text-gray-700 hover:text-brand-orange font-medium" onClick={() => setIsMobileMenuOpen(false)}>Shortlet</Link>

            {/* Mobile Professional Services Dropdown */}
            <div>
              <button
                onClick={() => setServicesDropdownOpen(!servicesDropdownOpen)}
                className="w-full min-h-[44px] flex items-center justify-between text-gray-700 hover:text-brand-orange font-medium"
              >
                Professional Services
                <svg className={`w-4 h-4 transition-transform ${servicesDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {servicesDropdownOpen && (
                <div className="pl-4 mb-2 space-y-1 border-l-2 border-gray-200">
                  {professionalServices.map((service) => (
                    <button
                      key={service.service}
                      onClick={() => {
                        navigate(`/professional-services/enquiry?service=${encodeURIComponent(service.service)}`);
                        setServicesDropdownOpen(false);
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full min-h-[44px] flex items-center text-left text-gray-600 hover:text-brand-blue text-sm"
                    >
                      {service.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile auth section */}
            <div className="border-t border-gray-100 pt-1 mt-1">
              {currentUser ? (
                <>
                  <div className="flex items-center gap-3 min-h-[44px] text-sm text-gray-700 font-medium">
                    {currentUser.avatar || currentUser.photoURL ? (
                      <img src={currentUser.avatar || currentUser.photoURL} alt="avatar" className="h-7 w-7 rounded-full object-cover" />
                    ) : (
                      <div className="h-7 w-7 rounded-full bg-brand-blue text-white flex items-center justify-center text-xs font-medium">
                        {(currentUser.firstName || currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                      </div>
                    )}
                    <span>{currentUser.firstName || currentUser.displayName || (currentUser.email && currentUser.email.split('@')[0])}</span>
                  </div>
                  <button onClick={() => { setIsMobileMenuOpen(false); navigate('/dashboard'); }} className="w-full min-h-[44px] flex items-center text-gray-700 hover:text-brand-orange font-medium text-sm">Dashboard</button>
                  <button onClick={() => { setIsMobileMenuOpen(false); navigate('/profile'); }} className="w-full min-h-[44px] flex items-center text-gray-700 hover:text-brand-orange font-medium text-sm">Profile</button>
                  {(currentUser?.role === 'admin' || currentUser?.roles?.includes('admin')) && (
                    <button onClick={() => { setIsMobileMenuOpen(false); navigate('/admin'); }} className="w-full min-h-[44px] flex items-center text-gray-700 hover:text-brand-orange font-medium text-sm">Admin Panel</button>
                  )}
                  <button
                    onClick={async () => { setIsMobileMenuOpen(false); await logout(); navigate('/', { replace: true }); }}
                    className="w-full min-h-[44px] flex items-center text-red-600 hover:text-red-700 font-medium text-sm"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link to="/auth/login" className="flex items-center min-h-[44px] text-brand-blue hover:text-brand-orange font-medium" onClick={() => setIsMobileMenuOpen(false)}>Sign in</Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

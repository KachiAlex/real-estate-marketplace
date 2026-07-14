import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaHome, FaBars, FaTimes } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext-new';
import { useSidebar } from '../../contexts/SidebarContext';

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const isAdminUser = currentUser?.role === 'admin' || currentUser?.roles?.includes('admin');
  const [menuOpen, setMenuOpen] = useState(false);
  const [servicesDropdownOpen, setServicesDropdownOpen] = useState(false);
  const menuRef = useRef(null);
  const servicesRef = useRef(null);
  const { toggleMobileSidebar } = useSidebar();

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
    <header
      className="bg-white shadow fixed top-0 inset-x-0 z-50 border-b border-gray-100"
      style={{
        paddingTop: 'max(env(safe-area-inset-top, 0px), var(--safe-area-inset-top, 0px))',
        paddingLeft: 'max(env(safe-area-inset-left, 0px), var(--safe-area-inset-left, 0px))',
        paddingRight: 'max(env(safe-area-inset-right, 0px), var(--safe-area-inset-right, 0px))'
      }}
    >
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 flex justify-between items-center gap-3 h-20 sm:h-24 md:h-28">
        <div className="flex items-center">
          <Link to="/" className="flex items-center" aria-label="PropertyArk home">
            {!logoError ? (
              <img 
                src={`${process.env.PUBLIC_URL || ''}/logo.png?v=4.0`} 
                alt="PropertyArk Logo" 
                className="h-20 sm:h-24 md:h-28 w-auto object-contain"
                style={{ backgroundColor: 'transparent', border: 'none' }}
                onError={(e) => {
                  console.error('Logo failed to load:', e);
                  setLogoError(true);
                }}
              />
            ) : (
              <div className="min-h-[40px] flex items-center justify-center text-brand-blue font-bold text-xl">
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
                  {!isAdminUser && (
                    <button onClick={() => { setMenuOpen(false); navigate('/dashboard'); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">Dashboard</button>
                  )}
                  {isAdminUser && (
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
          type="button"
          onClick={toggleMobileSidebar}
          className="lg:hidden p-2 rounded-xl text-gray-700 hover:text-brand-orange hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
          aria-label="Toggle menu"
        >
          <FaBars className="text-2xl" />
        </button>
      </div>
      {/* Mobile Navigation - Removed since sidebar now handles mobile navigation */}
    </header>
  );
}

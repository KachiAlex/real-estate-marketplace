import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaHome, FaBars, FaTimes } from 'react-icons/fa';

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <header className="bg-white shadow sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 flex justify-between items-center h-16 py-2">
        <div className="flex items-center space-x-4">
          <Link to="/" className="flex items-center">
            <img src={'/logo.png?v=4.0'} alt="PropertyArk Logo" className="h-12 w-auto" style={{ backgroundColor: 'transparent', border: 'none' }} />
          </Link>
        </div>
        <nav className="hidden lg:flex items-center space-x-4">
          <Link to="/properties?status=For%20Sale" className="px-3 py-2 text-sm font-medium text-brand-blue hover:text-brand-orange">For Sale</Link>
          <Link to="/properties?status=For%20Rent" className="px-3 py-2 text-sm font-medium text-brand-blue hover:text-brand-orange">For Rent</Link>
          <Link to="/properties?status=Shortlet" className="px-3 py-2 text-sm font-medium text-brand-blue hover:text-brand-orange">Shortlet</Link>
          <Link to="/services" className="px-3 py-2 text-sm font-medium text-brand-blue hover:text-brand-orange">Professional Services</Link>
        </nav>
        <div className="hidden lg:flex items-center space-x-4">
          <Link to="/auth/login" className="text-sm text-gray-700 hover:text-brand-orange">Sign in</Link>
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

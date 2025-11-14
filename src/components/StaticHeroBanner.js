import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGlobalSearch } from '../hooks/useGlobalSearch';
import GlobalSearch from './GlobalSearch';
import { FaSearch, FaArrowRight } from 'react-icons/fa';

const StaticHeroBanner = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isSearchOpen, openSearch, closeSearch, handleResultClick } = useGlobalSearch();

  // Beautiful real estate image - Replace with your own image featuring Nigerians in real estate context
  // Recommended: Use a high-quality image (1920x600px or larger) showing modern Nigerian real estate with people
  // You can upload your image to a CDN or use your own image hosting service
  const backgroundImage = "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920&q=80&auto=format&fit=crop";

  return (
    <div className="relative h-[600px] w-full overflow-hidden shadow-2xl">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${backgroundImage})`,
        }}
      >
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-6xl">
          {/* Main Heading */}
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
              Find Your Dream Property <span className="text-orange-400">in Nigeria</span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
              Secure real estate transactions with escrow protection, verified listings, and transparent processes
            </p>
          </div>

          {/* Search Bar - Prominent in Banner */}
          <div className="w-full max-w-4xl mx-auto mb-6">
            <div className="bg-white rounded-2xl shadow-2xl p-2 flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
                <input
                  type="text"
                  placeholder="Search properties, locations, investments..."
                  onClick={openSearch}
                  readOnly
                  className="w-full pl-12 pr-4 py-4 text-lg border-0 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none cursor-pointer"
                />
              </div>
              <button
                onClick={openSearch}
                className="px-8 py-4 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center space-x-2 font-semibold text-lg whitespace-nowrap"
              >
                <span>Search</span>
                <FaArrowRight />
              </button>
            </div>
          </div>

          {/* CTA Buttons */}
          {!user && (
            <div className="flex justify-center items-center">
              <button 
                onClick={() => navigate('/register')}
                className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl border-2 border-white/30 hover:bg-white/20 transition-all duration-300 shadow-xl text-lg"
              >
                Get Started Free
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Global Search Modal */}
      <GlobalSearch 
        isOpen={isSearchOpen} 
        onClose={closeSearch} 
        onResultClick={handleResultClick}
      />
    </div>
  );
};

export default StaticHeroBanner;


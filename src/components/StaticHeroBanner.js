import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGlobalSearch } from '../hooks/useGlobalSearch';
import GlobalSearch from './GlobalSearch';
import { FaSearch, FaArrowRight } from 'react-icons/fa';

const StaticHeroBanner = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isSearchOpen, openSearch, closeSearch, handleResultClick } = useGlobalSearch();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);
  const searchContainerRef = useRef(null);

  // Beautiful real estate image - Replace with your own image featuring Nigerians in real estate context
  // Recommended: Use a high-quality image (1920x600px or larger) showing modern Nigerian real estate with people
  // You can upload your image to a CDN or use your own image hosting service
  const backgroundImage = "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920&q=80&auto=format&fit=crop";

  // Popular search suggestions
  const popularSearches = [
    'Lekki Phase 1',
    'Victoria Island',
    'Ikoyi',
    'Banana Island',
    '3 Bedroom Apartment',
    'Luxury Villa',
    'For Sale',
    'For Rent'
  ];

  // Handle search submission
  const handleSearch = (query = searchQuery) => {
    const trimmedQuery = (query || searchQuery).trim();
    
    if (!trimmedQuery) {
      // If empty, open advanced search modal
      openSearch();
      return;
    }

    // Navigate to properties page with search query
    const searchParams = new URLSearchParams();
    searchParams.set('search', trimmedQuery);
    
    // Check if query looks like a location (contains common location keywords)
    const locationKeywords = ['lagos', 'abuja', 'lekki', 'ikoyi', 'victoria', 'banana', 'island', 'phase', 'gra', 'maitama', 'wuse', 'surulere', 'yaba'];
    const isLocation = locationKeywords.some(keyword => trimmedQuery.toLowerCase().includes(keyword));
    
    if (isLocation) {
      searchParams.set('location', trimmedQuery);
    }

    navigate(`/properties?${searchParams.toString()}`);
    setShowSuggestions(false);
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // Handle input focus
  const handleInputFocus = () => {
    if (searchQuery.trim()) {
      setShowSuggestions(true);
    }
  };

  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowSuggestions(value.trim().length > 0);
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion);
    handleSearch(suggestion);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSuggestions]);

  // Filter popular searches based on input
  const filteredSuggestions = searchQuery.trim()
    ? popularSearches.filter(suggestion => 
        suggestion.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5)
    : popularSearches.slice(0, 5);

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
            <p className="text-lg sm:text-xl text-white/90 mt-2">
              Search thousands of properties for sale, rent, and investment opportunities
            </p>
          </div>

          {/* Search Bar - Prominent in Banner */}
          <div className="w-full max-w-4xl mx-auto mb-6" ref={searchContainerRef}>
            <div className="bg-white rounded-2xl shadow-2xl p-2 relative">
              <div className="relative flex-1">
                <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl z-10" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search properties, locations, investments..."
                  value={searchQuery}
                  onChange={handleInputChange}
                  onFocus={handleInputFocus}
                  onKeyDown={handleKeyPress}
                  className="w-full pl-12 pr-4 py-4 text-lg border-0 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
                
                {/* Search Suggestions Dropdown */}
                {showSuggestions && filteredSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-64 overflow-y-auto">
                    {filteredSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full px-4 py-3 text-left hover:bg-orange-50 transition-colors flex items-center space-x-2 text-gray-700"
                      >
                        <FaSearch className="text-gray-400 text-sm" />
                        <span>{suggestion}</span>
                      </button>
                    ))}
                    <div className="border-t border-gray-200 px-4 py-2">
                      <button
                        onClick={openSearch}
                        className="text-sm text-orange-500 hover:text-orange-600 font-medium w-full text-left"
                      >
                        Advanced Search →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
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


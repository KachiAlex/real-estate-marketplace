import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useProperty } from '../contexts/PropertyContext';
import { FaSearch, FaMapMarkerAlt, FaBed, FaBath, FaRulerCombined, FaHeart, FaStar, FaFilter, FaTimes, FaArrowRight, FaBuilding } from 'react-icons/fa';

const Properties = () => {
  const { properties, loading, filters, updateFilters, clearFilters, getFilterOptions } = useProperty();
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });

  const filterOptions = getFilterOptions();

  useEffect(() => {
    // Properties are loaded automatically by the context
  }, []);

  const handleFilterChange = (key, value) => {
    updateFilters({ [key]: value });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    updateFilters({ search: searchQuery });
  };

  const handleClearFilters = () => {
    clearFilters();
    setSearchQuery('');
    setSelectedType('');
    setSelectedStatus('');
    setPriceRange({ min: '', max: '' });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'for-sale': return 'bg-green-500 text-white';
      case 'for-rent': return 'bg-blue-500 text-white';
      case 'for-lease': return 'bg-purple-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'for-sale': return 'For Sale';
      case 'for-rent': return 'For Rent';
      case 'for-lease': return 'For Lease';
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 via-purple-900 to-indigo-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Find Your Perfect Property</h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Browse through our extensive collection of properties and find the one that matches your dreams
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Search Bar */}
            <div className="flex-1">
              <form onSubmit={handleSearch} className="relative">
                <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
                <input
                  type="text"
                  placeholder="Search by location, property type, or keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 text-gray-900 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                />
              </form>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center justify-center space-x-2"
            >
              <FaFilter />
              <span>Filters</span>
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Property Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Property Type</label>
                  <select
                    value={selectedType}
                    onChange={(e) => {
                      setSelectedType(e.target.value);
                      handleFilterChange('type', e.target.value);
                    }}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                  >
                    <option value="">All Types</option>
                    {filterOptions.types.map(type => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => {
                      setSelectedStatus(e.target.value);
                      handleFilterChange('status', e.target.value);
                    }}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                  >
                    <option value="">All Status</option>
                    {filterOptions.statuses.map(status => (
                      <option key={status} value={status}>
                        {getStatusLabel(status)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Min Price */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Min Price</label>
                  <input
                    type="number"
                    placeholder="Min Price"
                    value={priceRange.min}
                    onChange={(e) => {
                      setPriceRange({ ...priceRange, min: e.target.value });
                      handleFilterChange('minPrice', e.target.value);
                    }}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                  />
                </div>

                {/* Max Price */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Max Price</label>
                  <input
                    type="number"
                    placeholder="Max Price"
                    value={priceRange.max}
                    onChange={(e) => {
                      setPriceRange({ ...priceRange, max: e.target.value });
                      handleFilterChange('maxPrice', e.target.value);
                    }}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                  />
                </div>
              </div>

              {/* Clear Filters */}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleClearFilters}
                  className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-300 flex items-center space-x-2"
                >
                  <FaTimes />
                  <span>Clear Filters</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-600">
            Showing <span className="font-semibold">{properties.length}</span> properties
          </p>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Sort by:</span>
            <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="newest">Newest First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>
        </div>

        {/* Properties Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading properties...</p>
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-12">
            <FaBuilding className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Properties Found</h3>
            <p className="text-gray-600">Try adjusting your search criteria or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {properties.map((property) => (
              <div key={property.id} className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 overflow-hidden">
                {/* Property Image */}
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={property.images?.[0]?.url || 'https://picsum.photos/400/300'}
                    alt={property.title}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                  />
                  <div className="absolute top-4 left-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(property.status)}`}>
                      {getStatusLabel(property.status)}
                    </span>
                  </div>
                  <div className="absolute top-4 right-4">
                    <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-50 transition-colors duration-300">
                      <FaHeart className="text-gray-400 hover:text-red-500 transition-colors duration-300" />
                    </button>
                  </div>
                  {property.isVerified && (
                    <div className="absolute bottom-4 left-4">
                      <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full flex items-center">
                        <FaStar className="mr-1" />
                        Verified
                      </span>
                    </div>
                  )}
                </div>

                {/* Property Details */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-bold text-gray-900 truncate">{property.title}</h3>
                    <div className="flex items-center text-yellow-400">
                      <FaStar className="text-sm" />
                      <span className="ml-1 text-sm text-gray-600">4.8</span>
                    </div>
                  </div>

                  <div className="flex items-center text-gray-600 mb-4">
                    <FaMapMarkerAlt className="mr-2" />
                    <span className="text-sm">{property.location?.address}, {property.location?.city}</span>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <FaBed className="mr-1" />
                        <span>{property.details?.bedrooms || property.bedrooms} Beds</span>
                      </div>
                      <div className="flex items-center">
                        <FaBath className="mr-1" />
                        <span>{property.details?.bathrooms || property.bathrooms} Baths</span>
                      </div>
                      <div className="flex items-center">
                        <FaRulerCombined className="mr-1" />
                        <span>{property.details?.sqft || property.sqft} sqft</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        ${property.price.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        {property.status === 'for-rent' ? '/month' : ''}
                      </p>
                    </div>
                    <Link
                      to={`/property/${property.id}`}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center"
                    >
                      View Details
                      <FaArrowRight className="ml-2 text-sm" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More */}
        {properties.length > 0 && (
          <div className="text-center mt-12">
            <button className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:-translate-y-1 shadow-lg font-semibold">
              Load More Properties
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Properties; 
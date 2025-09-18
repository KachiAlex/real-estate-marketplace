import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProperty } from '../contexts/PropertyContext';
import { FaBed, FaBath, FaRulerCombined, FaHeart, FaShare } from 'react-icons/fa';
import toast from 'react-hot-toast';

const Properties = () => {
  const navigate = useNavigate();
  const { properties = [], filters = {}, setFilters, fetchProperties, toggleFavorite, saveSearch } = useProperty();
  const safeProperties = useMemo(() => Array.isArray(properties) ? properties : [], [properties]);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);

  const filterOptions = useMemo(() => {
    const types = Array.from(new Set(safeProperties.map(p => p.type).filter(Boolean)));
    const statuses = Array.from(new Set(safeProperties.map(p => p.status).filter(Boolean)));
    const locations = Array.from(new Set(safeProperties.map(p => p.location?.city || p.location).filter(Boolean)));
    return {
      types: types.length ? types : ['Apartment','House','Villa','Condo'],
      statuses: statuses.length ? statuses : ['for-sale','for-rent','for-lease'],
      locations
    };
  }, [safeProperties]);

  useEffect(() => {
    // Properties are loaded automatically by the context
  }, []);

  // Reserved for future granular filter controls
  const handleFilterChange = () => {};

  const handleApplyFilters = () => {
    const next = {
      ...filters,
      type: selectedType,
      status: selectedStatus,
      minPrice: priceRange.min,
      maxPrice: priceRange.max
    };
    setFilters(next);
    fetchProperties(next, 1);
  };

  const handleSaveSearch = async () => {
    await saveSearch('Quick Saved Search', filters);
  };

  const handleToggleFavorite = async (id) => {
    await toggleFavorite(id);
  };

  const handleViewDetails = (propertyId) => {
    navigate(`/property/${propertyId}`);
  };

  const handleShareProperty = async (property) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: property.title,
          text: property.description,
          url: `${window.location.origin}/property/${property.id}`
        });
      } catch (error) {
        console.log('Error sharing:', error);
        handleCopyLink(property);
      }
    } else {
      handleCopyLink(property);
    }
  };

  const handleCopyLink = (property) => {
    const url = `${window.location.origin}/property/${property.id}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Property link copied to clipboard!');
    }).catch(() => {
      toast.error('Failed to copy link');
    });
  };

  const handleResetFilters = () => {
    setSelectedType('');
    setSelectedStatus('');
    setPriceRange({ min: '', max: '' });
    setFilters({});
    setCurrentPage(1);
    toast.success('Filters cleared');
  };

  // Pagination logic
  const totalPages = Math.ceil(safeProperties.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProperties = safeProperties.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Status helpers currently unused in this layout

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Properties</h1>
        <p className="text-gray-600">Browse and filter properties to find your perfect match</p>
      </div>

      {/* Active Filters Bar */}
      {(filters.type || filters.status || filters.minPrice || filters.maxPrice) && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-blue-900">Active Filters:</span>
              {filters.type && (
                <span className="px-2 py-1 bg-blue-200 text-blue-800 rounded text-xs">
                  Type: {filters.type}
                </span>
              )}
              {filters.status && (
                <span className="px-2 py-1 bg-blue-200 text-blue-800 rounded text-xs">
                  Status: {filters.status}
                </span>
              )}
              {(filters.minPrice || filters.maxPrice) && (
                <span className="px-2 py-1 bg-blue-200 text-blue-800 rounded text-xs">
                  Price: ₦{filters.minPrice || '0'} - ₦{filters.maxPrice || '∞'}
                </span>
              )}
            </div>
            <button 
              onClick={handleSaveSearch} 
              className="bg-orange-500 text-white px-3 py-1 rounded text-xs flex items-center"
            >
              Save Search
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-6">
        {/* Left Sidebar - Filters */}
        <div className="w-80 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
          
          {/* Price Range */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Min Price"
                value={priceRange.min}
                onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="number"
                placeholder="Max Price"
                value={priceRange.max}
                onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Property Type */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Property Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              {filterOptions.types.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Property Status */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              {filterOptions.statuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button 
              onClick={handleApplyFilters} 
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Apply Filters
            </button>
            <button 
              onClick={handleResetFilters}
              className="w-full text-gray-600 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1">
          {/* Results Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {safeProperties.length} Properties Found
              </h2>
              <p className="text-sm text-gray-600">Showing {startIndex + 1}-{Math.min(endIndex, safeProperties.length)} of {safeProperties.length} properties</p>
            </div>
            <select className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700">
              <option>Sort by: Most Recent</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
              <option>Most Popular</option>
            </select>
          </div>

          {/* Properties Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentProperties.length > 0 ? currentProperties.map((property) => (
              <div key={property.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="relative">
                  <img
                    src={property.image || 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop'}
                    alt={property.title}
                    className="w-full h-48 object-cover"
                  />
                  {property.tag && (
                    <div className={`absolute top-2 left-2 ${property.tagColor || 'bg-orange-500'} text-white px-2 py-1 rounded text-xs font-medium`}>
                      {property.tag}
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex space-x-2">
                    <button
                      onClick={() => handleToggleFavorite(property.id)}
                      className="w-8 h-8 bg-black bg-opacity-50 rounded-full flex items-center justify-center hover:bg-opacity-75 transition-colors"
                    >
                      <FaHeart className="text-white text-lg" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShareProperty(property);
                      }}
                      className="w-8 h-8 bg-black bg-opacity-50 rounded-full flex items-center justify-center hover:bg-opacity-75 transition-colors"
                    >
                      <FaShare className="text-white text-sm" />
                    </button>
                  </div>
                </div>

                <div className="p-4">
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    ₦{property.price?.toLocaleString() || '0'}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{property.title}</h3>
                  <p className="text-gray-600 text-sm mb-3">{property.location}</p>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center space-x-1">
                      <FaBed />
                      <span>{property.bedrooms || 0} Bedrooms</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <FaBath />
                      <span>{property.bathrooms || 0} Bathrooms</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <FaRulerCombined />
                      <span>{property.area || 0}m² Area</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleViewDetails(property.id)}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                  >
                    View Details →
                  </button>
                </div>
              </div>
            )) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500 text-lg">No properties found matching your criteria.</p>
                <button 
                  onClick={handleResetFilters}
                  className="mt-4 text-blue-600 hover:text-blue-800"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <div className="flex items-center space-x-2">
                <button 
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ‹
                </button>
                
                {/* Page numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-2 border rounded text-sm ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <>
                    <span className="px-2 text-gray-500">...</span>
                    <button
                      onClick={() => handlePageChange(totalPages)}
                      className="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
                    >
                      {totalPages}
                    </button>
                  </>
                )}
                
                <button 
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ›
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Properties;
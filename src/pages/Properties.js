import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useProperty } from '../contexts/PropertyContext';
import { useAuth } from '../contexts/AuthContext';
import { FaBed, FaBath, FaRulerCombined, FaHeart, FaShare, FaBell, FaCalendar } from 'react-icons/fa';
import toast from 'react-hot-toast';

const Properties = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { properties = [], filters = {}, setFilters, fetchProperties, toggleFavorite, saveSearch } = useProperty();
  const { user, setAuthRedirect } = useAuth();
  const safeProperties = useMemo(() => Array.isArray(properties) ? properties : [], [properties]);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [favorites, setFavorites] = useState(new Set());
  const [saveSearchName, setSaveSearchName] = useState('');
  const [showSaveSearchModal, setShowSaveSearchModal] = useState(false);
  const [alertName, setAlertName] = useState('');

  // Real-time search functionality
  const filteredProperties = useMemo(() => {
    let filtered = [...safeProperties];

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(property => 
        property.title?.toLowerCase().includes(query) ||
        property.description?.toLowerCase().includes(query) ||
        property.location?.toLowerCase().includes(query) ||
        property.address?.toLowerCase().includes(query)
      );
    }

    // Apply type filter
    if (selectedType) {
      filtered = filtered.filter(property => property.type === selectedType);
    }

    // Apply status filter
    if (selectedStatus) {
      filtered = filtered.filter(property => property.status === selectedStatus || property.listingType === selectedStatus);
    }

    // Apply price range filter
    if (priceRange.min) {
      filtered = filtered.filter(property => property.price >= parseFloat(priceRange.min));
    }
    if (priceRange.max) {
      filtered = filtered.filter(property => property.price <= parseFloat(priceRange.max));
    }

    return filtered;
  }, [safeProperties, searchQuery, selectedType, selectedStatus, priceRange]);

  const filterOptions = useMemo(() => {
    const types = Array.from(new Set(safeProperties.map(p => p.type).filter(Boolean)));
    const statuses = Array.from(new Set(safeProperties.map(p => p.status || p.listingType).filter(Boolean)));
    const locations = Array.from(new Set(safeProperties.map(p => p.location?.city || p.location).filter(Boolean)));
    return {
      types: types.length ? types : ['apartment','house','villa','condo','duplex'],
      statuses: statuses.length ? statuses : ['for-sale','for-rent','for-lease'],
      locations
    };
  }, [safeProperties]);

  // Pagination for filtered properties
  const totalPages = Math.ceil(filteredProperties.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProperties = filteredProperties.slice(startIndex, endIndex);

  useEffect(() => {
    // Properties are loaded automatically by the context
  }, []);

  // Handle URL parameters from property alerts
  useEffect(() => {
    const fromAlert = searchParams.get('fromAlert');
    const alertNameParam = searchParams.get('alertName');
    
    if (fromAlert && alertNameParam) {
      console.log('Loading properties from alert:', alertNameParam);
      setAlertName(alertNameParam);
      
      // Apply filters from URL parameters
      const location = searchParams.get('location');
      const type = searchParams.get('type');
      const minPrice = searchParams.get('minPrice');
      const maxPrice = searchParams.get('maxPrice');
      const minBedrooms = searchParams.get('minBedrooms');
      const maxBedrooms = searchParams.get('maxBedrooms');
      const minBathrooms = searchParams.get('minBathrooms');
      const maxBathrooms = searchParams.get('maxBathrooms');
      const minArea = searchParams.get('minArea');
      const maxArea = searchParams.get('maxArea');
      const features = searchParams.get('features');
      
      // Update local filter states
      if (location) setSearchQuery(location);
      if (type) setSelectedType(type);
      if (minPrice) setPriceRange(prev => ({ ...prev, min: minPrice }));
      if (maxPrice) setPriceRange(prev => ({ ...prev, max: maxPrice }));
      
      // Apply filters to context
      const alertFilters = {
        location: location || '',
        type: type || '',
        minPrice: minPrice ? parseInt(minPrice) : '',
        maxPrice: maxPrice ? parseInt(maxPrice) : '',
        minBedrooms: minBedrooms ? parseInt(minBedrooms) : '',
        maxBedrooms: maxBedrooms ? parseInt(maxBedrooms) : '',
        minBathrooms: minBathrooms ? parseInt(minBathrooms) : '',
        maxBathrooms: maxBathrooms ? parseInt(maxBathrooms) : '',
        minArea: minArea ? parseInt(minArea) : '',
        maxArea: maxArea ? parseInt(maxArea) : '',
        features: features ? features.split(',') : []
      };
      
      setFilters(alertFilters);
      toast.success(`Showing properties matching "${alertNameParam}" alert criteria`);
    }
  }, [searchParams, setFilters]);

  // Handle individual filter changes
  const handleFilterChange = (filterType, value) => {
    switch (filterType) {
      case 'type':
        setSelectedType(value);
        break;
      case 'status':
        setSelectedStatus(value);
        break;
      case 'minPrice':
        setPriceRange(prev => ({ ...prev, min: value }));
        break;
      case 'maxPrice':
        setPriceRange(prev => ({ ...prev, max: value }));
        break;
      case 'search':
        setSearchQuery(value);
        break;
      default:
        break;
    }
  };

  const handleApplyFilters = () => {
    const next = {
      ...filters,
      type: selectedType,
      status: selectedStatus,
      minPrice: priceRange.min,
      maxPrice: priceRange.max,
      search: searchQuery
    };
    setFilters(next);
    fetchProperties(next, 1);
    setCurrentPage(1);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSelectedType('');
    setSelectedStatus('');
    setPriceRange({ min: '', max: '' });
    setSearchQuery('');
    setFilters({});
    fetchProperties({}, 1);
    setCurrentPage(1);
  };

  const handleSaveSearch = () => {
    if (!user) {
      toast.error('Please login to save searches');
      navigate('/login');
      return;
    }
    setShowSaveSearchModal(true);
  };

  const handleConfirmSaveSearch = async () => {
    if (!saveSearchName.trim()) {
      toast.error('Please enter a name for your search');
      return;
    }

    try {
      const searchCriteria = {
        type: selectedType,
        status: selectedStatus,
        priceRange,
        searchQuery,
        location: filters.location,
        bedrooms: filters.bedrooms,
        bathrooms: filters.bathrooms
      };

      await saveSearch(saveSearchName, searchCriteria);
      toast.success(`Search "${saveSearchName}" saved successfully!`);
      setShowSaveSearchModal(false);
      setSaveSearchName('');
    } catch (error) {
      console.error('Error saving search:', error);
      toast.error('Failed to save search');
    }
  };

  const closeSaveSearchModal = () => {
    setShowSaveSearchModal(false);
    setSaveSearchName('');
  };

  const handleToggleFavorite = async (propertyId) => {
    if (!user) {
      // Set redirect URL to return to current page after login
      const currentUrl = `/properties`;
      setAuthRedirect(currentUrl);
      toast.error('Please login to save properties to favorites');
      navigate('/login');
      return;
    }
    
    try {
      const newFavorites = new Set(favorites);
      if (newFavorites.has(propertyId)) {
        newFavorites.delete(propertyId);
        toast.success('Removed from favorites');
      } else {
        newFavorites.add(propertyId);
        toast.success('Added to favorites');
      }
      setFavorites(newFavorites);
      
      // Also call the context function
      await toggleFavorite(propertyId);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorites');
    }
  };

  const handleViewDetails = (propertyId) => {
    navigate(`/property/${propertyId}`);
  };

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [viewingMessage, setViewingMessage] = useState('');

  const handleScheduleViewing = (property) => {
    if (!user) {
      toast.error('Please login to schedule viewings');
      navigate('/login');
      return;
    }
    
    setSelectedProperty(property);
    setShowScheduleModal(true);
  };

  const handleConfirmScheduleViewing = () => {
    if (!selectedDate || !selectedTime) {
      toast.error('Please select both date and time');
      return;
    }

    // Create viewing request data
    const viewingRequest = {
      id: `viewing-${Date.now()}`,
      propertyId: selectedProperty.id,
      propertyTitle: selectedProperty.title,
      propertyLocation: selectedProperty.location,
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      userEmail: user.email,
      status: 'pending_vendor_confirmation',
      requestedAt: new Date().toISOString(),
      preferredDate: selectedDate,
      preferredTime: selectedTime,
      message: viewingMessage,
      agentContact: selectedProperty.agent || {
        name: 'Property Agent',
        phone: '+234-XXX-XXXX',
        email: 'agent@example.com'
      },
      vendorResponse: null,
      confirmedDate: null,
      confirmedTime: null
    };
    
    // Store in localStorage for demo
    const existingRequests = JSON.parse(localStorage.getItem('viewingRequests') || '[]');
    existingRequests.push(viewingRequest);
    localStorage.setItem('viewingRequests', JSON.stringify(existingRequests));
    
    toast.success(`Viewing request sent for "${selectedProperty.title}"! The vendor will confirm or suggest an alternative time.`);
    
    // Reset modal
    setShowScheduleModal(false);
    setSelectedProperty(null);
    setSelectedDate('');
    setSelectedTime('');
    setViewingMessage('');
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

  // Pagination logic is now handled above with filteredProperties

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
        <div className="flex items-center space-x-3 mb-2">
          <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
          {alertName && (
            <div className="flex items-center space-x-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
              <FaBell className="text-xs" />
              <span>From Alert: {alertName}</span>
            </div>
          )}
        </div>
        <p className="text-gray-600">
          {alertName 
            ? `Properties matching your "${alertName}" alert criteria`
            : "Browse and filter properties to find your perfect match"
          }
        </p>
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
          
          {/* Search Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Properties</label>
            <input
              type="text"
              placeholder="Search by title, location, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
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
              onClick={handleClearFilters}
              className="w-full bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors"
            >
              Clear All Filters
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
                {filteredProperties.length} Properties Found
              </h2>
              <p className="text-sm text-gray-600">
                Showing {startIndex + 1}-{Math.min(endIndex, filteredProperties.length)} of {filteredProperties.length} properties
                {filteredProperties.length !== safeProperties.length && (
                  <span className="text-blue-600 ml-2">(filtered from {safeProperties.length} total)</span>
                )}
              </p>
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
                      title={favorites.has(property.id) ? "Remove from favorites" : "Add to favorites"}
                    >
                      <FaHeart className={`text-lg transition-colors ${
                        favorites.has(property.id) ? 'text-red-500' : 'text-white'
                      }`} />
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
                      <span>{property.bedrooms || property.details?.bedrooms || 0} Bedrooms</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <FaBath />
                      <span>{property.bathrooms || property.details?.bathrooms || 0} Bathrooms</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <FaRulerCombined />
                      <span>{property.area || property.details?.sqft || 0}m² Area</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <button 
                      onClick={() => handleViewDetails(property.id)}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                    >
                      View Details →
                    </button>
                    <button 
                      onClick={() => handleScheduleViewing(property)}
                      className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                      title={`Schedule a viewing for ${property.title}`}
                    >
                      <FaCalendar className="mr-2" />
                      Schedule Viewing
                    </button>
                  </div>
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

      {/* Save Search Modal */}
      {showSaveSearchModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Save Search</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Name
                </label>
                <input
                  type="text"
                  value={saveSearchName}
                  onChange={(e) => setSaveSearchName(e.target.value)}
                  placeholder="e.g., 3-bedroom apartments in Lagos"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <h4 className="font-medium text-gray-900 mb-2">Search Criteria:</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  {selectedType && <p>• Type: {selectedType}</p>}
                  {selectedStatus && <p>• Status: {selectedStatus}</p>}
                  {priceRange.min && <p>• Min Price: ₦{parseInt(priceRange.min).toLocaleString()}</p>}
                  {priceRange.max && <p>• Max Price: ₦{parseInt(priceRange.max).toLocaleString()}</p>}
                  {searchQuery && <p>• Search: "{searchQuery}"</p>}
                  {(!selectedType && !selectedStatus && !priceRange.min && !priceRange.max && !searchQuery) && (
                    <p className="text-gray-500">No specific filters applied</p>
                  )}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  💡 You'll receive notifications when new properties matching these criteria become available.
                </p>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={closeSaveSearchModal}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSaveSearch}
                disabled={!saveSearchName.trim()}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Save Search
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Viewing Modal */}
      {showScheduleModal && selectedProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Schedule Property Viewing</h3>
            <p className="text-gray-600 mb-4">{selectedProperty.title}</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Time</label>
                <select
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Time</option>
                  <option value="09:00">9:00 AM</option>
                  <option value="10:00">10:00 AM</option>
                  <option value="11:00">11:00 AM</option>
                  <option value="12:00">12:00 PM</option>
                  <option value="13:00">1:00 PM</option>
                  <option value="14:00">2:00 PM</option>
                  <option value="15:00">3:00 PM</option>
                  <option value="16:00">4:00 PM</option>
                  <option value="17:00">5:00 PM</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Additional Message (Optional)</label>
                <textarea
                  value={viewingMessage}
                  onChange={(e) => setViewingMessage(e.target.value)}
                  placeholder="Any specific requirements or questions..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowScheduleModal(false);
                  setSelectedProperty(null);
                  setSelectedDate('');
                  setSelectedTime('');
                  setViewingMessage('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmScheduleViewing}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Request Viewing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Properties;
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useProperty } from '../contexts/PropertyContext';
import { FaSearch, FaMapMarkerAlt, FaBed, FaBath, FaRulerCombined, FaHeart, FaStar, FaFilter, FaTimes, FaArrowRight, FaBuilding, FaShare } from 'react-icons/fa';

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
      case 'for-sale': return 'bg-red-600 text-white';
      case 'for-rent': return 'bg-red-700 text-white';
      case 'for-lease': return 'bg-black text-white';
      default: return 'bg-gray-600 text-white';
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
    <div className="p-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Properties</h1>
        <p className="text-gray-600">Browse and filter properties to find your perfect match</p>
      </div>

      {/* Active Filters Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Active filters:</span>
            <div className="flex items-center space-x-2">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">Price: ₦25M - ₦150M</span>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">Apartment</span>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">2+ Bedrooms</span>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">Lagos</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button className="bg-blue-600 text-white px-3 py-1 rounded text-xs">₦25M - ₦150M</button>
            <button className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-xs">Bedrooms</button>
            <button className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-xs">Locations</button>
            <button className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-xs">More Filters</button>
            <button className="bg-orange-500 text-white px-3 py-1 rounded text-xs flex items-center">
              <FaHeart className="mr-1" />
              Save Search
            </button>
            <span className="text-sm text-gray-500 cursor-pointer">Clear all filters</span>
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Left Sidebar - Filters */}
        <div className="w-80 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Filters</h3>
          
          {/* Price Range */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>₦ 25,000,000</span>
                <span>₦ 150,000,000</span>
              </div>
              <div className="relative">
                <input
                  type="range"
                  min="25000000"
                  max="150000000"
                  step="1000000"
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
            </div>

          {/* Property Features */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Beds</label>
            <div className="flex space-x-2">
              <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm">Any Beds</button>
              <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm">2+ Beds</button>
              <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm">3+ Beds</button>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Baths</label>
            <div className="flex space-x-2">
              <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm">Any Baths</button>
              <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm">2+ Baths</button>
              <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm">3+ Baths</button>
            </div>
                </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Size</label>
            <div className="flex space-x-2">
              <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm">Any Size</button>
              <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm">100m²+ Size</button>
              <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm">200m²+ Size</button>
            </div>
                </div>

          {/* Amenities */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Amenities</label>
            <div className="space-y-2">
              {[
                { name: 'Swimming Pool', checked: true },
                { name: 'Gym', checked: true },
                { name: '24/7 Security', checked: true },
                { name: 'Air Conditioning', checked: true },
                { name: 'Parking Space', checked: true },
                { name: 'WiFi', checked: true },
                { name: 'Furnished', checked: true },
                { name: 'Balcony', checked: false }
              ].map((amenity) => (
                <label key={amenity.name} className="flex items-center">
                  <input
                    type="checkbox"
                    defaultChecked={amenity.checked}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{amenity.name}</span>
                </label>
              ))}
              <button className="text-blue-600 text-sm">Show more amenities</button>
            </div>
                </div>

          {/* Property Age */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Property Age</label>
            <div className="flex space-x-2">
              <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm">Any Age</button>
              <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm">New 0-5 yrs</button>
              <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm">5-10 yrs Age</button>
                </div>
              </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
              Apply Filters
            </button>
            <button className="w-full text-gray-600 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors">
              Reset
                </button>
              </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1">
          {/* Results Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Available Properties</h2>
          <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Showing 1-9 of 230 properties</span>
              <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>Sort By: Newest</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Most Popular</option>
            </select>
          </div>
        </div>

        {/* Properties Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                id: 1,
                title: "Luxury Apartment in Victoria Island",
                price: 75000000,
                location: "Victoria Island, Lagos",
                bedrooms: 3,
                bathrooms: 2,
                area: 210,
                image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop",
                tag: "New Listing",
                tagColor: "bg-orange-500"
              },
              {
                id: 2,
                title: "Modern Family House in Lekki",
                price: 120000000,
                location: "Lekki Phase 1, Lagos",
                bedrooms: 4,
                bathrooms: 3,
                area: 350,
                image: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400&h=300&fit=crop",
                tag: "Featured",
                tagColor: "bg-blue-500"
              },
              {
                id: 3,
                 title: "Penthouse with Ocean View in Ikoyi",
                 price: 95000000,
                 location: "Ikoyi, Lagos",
                 bedrooms: 2,
                 bathrooms: 2,
                 area: 180,
                 image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop",
                tag: "Hot Deals",
                tagColor: "bg-red-500"
              },
              {
                id: 4,
                 title: "Elegant Townhouse in Maitama Island",
                 price: 75000000,
                 location: "Maitama, Abuja",
                 bedrooms: 3,
                 bathrooms: 2,
                 area: 210,
                 image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop",
                tag: "Exclusive",
                tagColor: "bg-blue-500"
              },
              {
                id: 5,
                 title: "Garden View Apartment in Ikeja GRA",
                 price: 120000000,
                 location: "Ikeja GRA, Lagos",
                 bedrooms: 4,
                 bathrooms: 3,
                 area: 350,
                 image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=300&fit=crop",
                tag: "Exclusive",
                tagColor: "bg-blue-500"
              },
              {
                id: 6,
                 title: "Beachfront Villa in Banana Island",
                 price: 95000000,
                 location: "Banana Island, Lagos",
                 bedrooms: 2,
                 bathrooms: 2,
                 area: 180,
                 image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop",
                tag: "Exclusive",
                tagColor: "bg-blue-500"
              },
              {
                id: 7,
                 title: "Contemporary Apartment in Maryland",
                 price: 75000000,
                 location: "Maryland, Lagos",
                 bedrooms: 3,
                 bathrooms: 2,
                 area: 210,
                 image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop",
                tag: "New",
                tagColor: "bg-green-500"
              },
              {
                id: 8,
                 title: "Luxury Villa in Asokoro",
                 price: 120000000,
                 location: "Asokoro, Abuja",
                 bedrooms: 4,
                 bathrooms: 3,
                 area: 350,
                 image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop",
                tag: null,
                tagColor: ""
              },
              {
                id: 9,
                 title: "Waterfront Condominium in Oniru",
                 price: 95000000,
                 location: "Oniru, Lagos",
                 bedrooms: 2,
                 bathrooms: 2,
                 area: 180,
                 image: "https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=400&h=300&fit=crop",
                tag: "Hot Deals",
                tagColor: "bg-red-500"
              }
            ].map((property) => (
              <div key={property.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="relative">
                  <img
                    src={property.image}
                    alt={property.title}
                    className="w-full h-48 object-cover"
                  />
                  {property.tag && (
                    <div className={`absolute top-2 left-2 ${property.tagColor} text-white px-2 py-1 rounded text-xs font-medium`}>
                      {property.tag}
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex space-x-2">
                    <FaHeart className="text-white bg-black bg-opacity-50 p-1 rounded cursor-pointer" />
                    <FaShare className="text-white bg-black bg-opacity-50 p-1 rounded cursor-pointer" />
                    </div>
                  </div>

                <div className="p-4">
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    ₦{property.price.toLocaleString()}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{property.title}</h3>
                  <p className="text-gray-600 text-sm mb-3">{property.location}</p>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center space-x-1">
                      <FaBed />
                      <span>{property.bedrooms} Bedrooms</span>
                      </div>
                    <div className="flex items-center space-x-1">
                      <FaBath />
                      <span>{property.bathrooms} Bathrooms</span>
                      </div>
                    <div className="flex items-center space-x-1">
                      <FaRulerCombined />
                      <span>{property.area}m² Area</span>
                    </div>
                  </div>

                  <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center">
                    View Details →
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-center mt-8">
            <div className="flex items-center space-x-2">
              <button className="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50">‹</button>
              <button className="px-3 py-2 bg-blue-600 text-white rounded text-sm">1</button>
              <button className="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50">2</button>
              <button className="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50">3</button>
              <button className="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50">4</button>
              <span className="px-2 text-gray-500">...</span>
              <button className="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50">25</button>
              <button className="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50">›</button>
            </div>
          </div>
          </div>
      </div>
    </div>
  );
};

export default Properties; 

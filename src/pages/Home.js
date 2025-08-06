import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useProperty } from '../contexts/PropertyContext';
import { FaSearch, FaMapMarkerAlt, FaBed, FaBath, FaRulerCombined, FaHeart, FaStar, FaArrowRight, FaHome, FaBuilding, FaLandmark, FaShieldAlt, FaUsers, FaChartLine } from 'react-icons/fa';

const Home = () => {
  const { properties, loading } = useProperty();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [featuredProperties, setFeaturedProperties] = useState([]);

  useEffect(() => {
    if (properties.length > 0) {
      setFeaturedProperties(properties.slice(0, 6));
    }
  }, [properties]);

  const propertyTypes = [
    { value: 'house', label: 'Houses', icon: FaHome },
    { value: 'apartment', label: 'Apartments', icon: FaBuilding },
    { value: 'land', label: 'Land', icon: FaLandmark },
    { value: 'commercial', label: 'Commercial', icon: FaBuilding }
  ];

  const statusOptions = [
    { value: 'for-sale', label: 'For Sale' },
    { value: 'for-rent', label: 'For Rent' },
    { value: 'for-lease', label: 'For Lease' }
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    // Handle search logic
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-900 via-purple-900 to-indigo-900 text-white overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Find Your Dream
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                Property
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto">
              Discover the perfect property with our comprehensive marketplace. 
              Buy, rent, or invest in real estate with confidence.
            </p>

            {/* Search Section */}
            <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-4xl mx-auto">
              <form onSubmit={handleSearch} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Search Input */}
                  <div className="md:col-span-2">
                    <div className="relative">
                      <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
                      <input
                        type="text"
                        placeholder="Search by location, property type..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 text-gray-900 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                      />
                    </div>
                  </div>

                  {/* Property Type */}
                  <div>
                    <select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      className="w-full px-4 py-4 text-gray-900 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                    >
                      <option value="">Property Type</option>
                      {propertyTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Status */}
                  <div>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-full px-4 py-4 text-gray-900 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                    >
                      <option value="">Status</option>
                      {statusOptions.map(status => (
                        <option key={status.value} value={status.value}>{status.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:-translate-y-1 shadow-lg font-semibold text-lg"
                >
                  <FaSearch className="inline mr-2" />
                  Search Properties
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FaHome className="text-white text-2xl" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">2,500+</h3>
              <p className="text-gray-600">Properties Listed</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FaUsers className="text-white text-2xl" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">10,000+</h3>
              <p className="text-gray-600">Happy Clients</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FaChartLine className="text-white text-2xl" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">95%</h3>
              <p className="text-gray-600">Success Rate</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FaShieldAlt className="text-white text-2xl" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">100%</h3>
              <p className="text-gray-600">Secure Transactions</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Featured Properties</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover our handpicked selection of premium properties in prime locations
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading featured properties...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredProperties.map((property) => (
                <div key={property.id} className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 overflow-hidden">
                  {/* Property Image */}
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src={property.images?.[0]?.url || 'https://picsum.photos/400/300'}
                      alt={property.title}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                    />
                    <div className="absolute top-4 left-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        property.status === 'for-sale' ? 'bg-green-500 text-white' :
                        property.status === 'for-rent' ? 'bg-blue-500 text-white' :
                        'bg-purple-500 text-white'
                      }`}>
                        {property.status === 'for-sale' ? 'For Sale' :
                         property.status === 'for-rent' ? 'For Rent' : 'For Lease'}
                      </span>
                    </div>
                    <div className="absolute top-4 right-4">
                      <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-50 transition-colors duration-300">
                        <FaHeart className="text-gray-400 hover:text-red-500 transition-colors duration-300" />
                      </button>
                    </div>
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

          <div className="text-center mt-12">
            <Link
              to="/properties"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:-translate-y-1 shadow-lg font-semibold"
            >
              View All Properties
              <FaArrowRight className="ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose PropertyPro</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We provide the best real estate experience with secure transactions and professional service
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <FaShieldAlt className="text-white text-2xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Secure Transactions</h3>
              <p className="text-gray-600">
                All transactions are protected with our secure escrow system and verified properties
              </p>
            </div>

            <div className="text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <FaUsers className="text-white text-2xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Expert Support</h3>
              <p className="text-gray-600">
                Our team of real estate experts is here to help you find the perfect property
              </p>
            </div>

            <div className="text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <FaChartLine className="text-white text-2xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Market Insights</h3>
              <p className="text-gray-600">
                Get detailed market analysis and property insights to make informed decisions
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-900 via-purple-900 to-indigo-900 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold mb-6">Ready to Find Your Dream Property?</h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of satisfied customers who found their perfect home with us
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/properties"
              className="px-8 py-4 bg-white text-blue-900 rounded-xl hover:bg-gray-100 transition-all duration-300 transform hover:-translate-y-1 shadow-lg font-semibold"
            >
              Browse Properties
            </Link>
            <Link
              to="/register"
              className="px-8 py-4 border-2 border-white text-white rounded-xl hover:bg-white hover:text-blue-900 transition-all duration-300 transform hover:-translate-y-1 font-semibold"
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home; 
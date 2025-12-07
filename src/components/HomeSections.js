import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FaUser, FaMapMarkerAlt, FaPhone, FaEnvelope, FaArrowRight, FaSearch, FaChevronLeft, FaChevronRight, FaCity, FaMonument, FaIndustry, FaMapMarkedAlt } from 'react-icons/fa';
import { useProperty } from '../contexts/PropertyContext';
import { getAllAgents, filterAgents, paginateAgents } from '../services/agentService';

const HomeSections = () => {
  const { properties } = useProperty();
  const [allAgents, setAllAgents] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const itemsPerPage = 6;

  // Fetch all agents from users and properties
  useEffect(() => {
    setLoading(true);
    try {
      const agents = getAllAgents(properties || []);
      setAllAgents(agents);
    } catch (error) {
      console.error('Error fetching agents:', error);
    } finally {
      setLoading(false);
    }
  }, [properties]);

  // Filter and paginate agents
  const { data: paginatedAgents, pagination } = useMemo(() => {
    try {
      // Ensure allAgents is an array
      const safeAgents = Array.isArray(allAgents) ? allAgents : [];
      // Ensure filterAgents and paginateAgents are functions before calling
      if (typeof filterAgents === 'function' && typeof paginateAgents === 'function') {
        const filtered = filterAgents(safeAgents, searchQuery || '', selectedLocation || 'all');
        return paginateAgents(filtered, currentPage || 1, itemsPerPage || 6);
      }
      // Return default structure if functions aren't available
      return {
        data: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: 6,
          hasNextPage: false,
          hasPreviousPage: false
        }
      };
    } catch (error) {
      console.error('Error in useMemo for agents:', error);
      // Return safe default on error
      return {
        data: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: 6,
          hasNextPage: false,
          hasPreviousPage: false
        }
      };
    }
  }, [allAgents, searchQuery, selectedLocation, currentPage, itemsPerPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedLocation]);

  const locations = [
    { value: 'all', label: 'All Real Estate Agents' },
    { value: 'Lagos', label: 'Real Estate Agents in Lagos' },
    { value: 'Abuja', label: 'Real Estate Agents in Abuja' },
    { value: 'Rivers', label: 'Real Estate Agents in Rivers' },
  ];

  const propertySubLinks = [
    {
      category: 'Short-let',
      icon: '🏠',
      links: [
        { label: 'Short let in Abuja', href: '/properties?type=short-let&location=Abuja' },
        { label: 'Short let in Lagos', href: '/properties?type=short-let&location=Lagos' },
        { label: 'All Short Lets', href: '/properties?type=short-let' },
      ]
    },
    {
      category: 'Buy',
      icon: '💰',
      links: [
        { label: 'Buy in Abuja', href: '/properties?type=buy&location=Abuja' },
        { label: 'Buy in Lagos', href: '/properties?type=buy&location=Lagos' },
        { label: 'Buy in Rivers', href: '/properties?type=buy&location=Rivers' },
        { label: 'All Properties for Sale', href: '/properties?type=buy' },
      ]
    },
    {
      category: 'Rent',
      icon: '🔑',
      links: [
        { label: 'Rent in Abuja', href: '/properties?type=rent&location=Abuja' },
        { label: 'Rent in Lagos', href: '/properties?type=rent&location=Lagos' },
        { label: 'Rent in Rivers', href: '/properties?type=rent&location=Rivers' },
        { label: 'All Properties for Rent', href: '/properties?type=rent' },
      ]
    }
  ];

  return (
    <div className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Real Estate Agents Section */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Find Professional Real Estate Agents
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Connect with experienced real estate agents in your preferred location
            </p>
          </div>

          {/* Search and Filter Section */}
          <div className="mb-8 space-y-4">
            {/* Search Input */}
            <div className="max-w-md mx-auto">
              <div className="relative">
                <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search agents by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Location Filter */}
            <div className="flex flex-wrap justify-center gap-4">
              {locations.map((location) => (
                <button
                  key={location.value}
                  onClick={() => setSelectedLocation(location.value)}
                  className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                    selectedLocation === location.value
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-white text-gray-700 hover:bg-blue-50 border border-gray-200'
                  }`}
                >
                  {location.label}
                </button>
              ))}
            </div>
          </div>

          {/* Agents Grid */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
                {paginatedAgents.map((agent) => (
                  <div key={agent.id || agent.email} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <img
                        src={agent.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'}
                        alt={`${agent.firstName || ''} ${agent.lastName || ''}`}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">
                          {agent.firstName || ''} {agent.lastName || ''}
                        </h3>
                        <p className="text-blue-600 font-medium">
                          {agent.vendorData?.businessName || `${agent.firstName || ''} Real Estate`}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center text-gray-600">
                        <FaMapMarkerAlt className="mr-2 text-blue-500" />
                        <span>{agent.vendorData?.agentLocation || 'Location not specified'}</span>
                      </div>
                      {agent.phone && (
                        <div className="flex items-center text-gray-600">
                          <FaPhone className="mr-2 text-blue-500" />
                          <span>{agent.phone}</span>
                        </div>
                      )}
                      {agent.email && (
                        <div className="flex items-center text-gray-600">
                          <FaEnvelope className="mr-2 text-blue-500" />
                          <span className="text-sm truncate">{agent.email}</span>
                        </div>
                      )}
                      {agent.vendorData?.experience && (
                        <div className="flex items-center text-gray-600">
                          <FaUser className="mr-2 text-blue-500" />
                          <span>{agent.vendorData.experience}</span>
                        </div>
                      )}
                      {agent.propertiesCount > 0 && (
                        <div className="flex items-center text-gray-600">
                          <span className="text-sm text-gray-500">
                            {agent.propertiesCount} {agent.propertiesCount === 1 ? 'property' : 'properties'} listed
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {agent.phone ? (
                      <a
                        href={`tel:${agent.phone}`}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors duration-300 flex items-center justify-center space-x-2 no-underline"
                      >
                        <FaPhone className="mr-1" />
                        <span>Contact Agent</span>
                      </a>
                    ) : (
                      <button 
                        disabled
                        className="w-full bg-gray-400 text-white py-3 rounded-lg cursor-not-allowed transition-colors duration-300 flex items-center justify-center space-x-2"
                        title="Phone number not available"
                      >
                        <FaPhone className="mr-1" />
                        <span>Contact Agent</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center space-x-4 mt-8">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={!pagination.hasPreviousPage}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      pagination.hasPreviousPage
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <FaChevronLeft className="inline mr-2" />
                    Previous
                  </button>
                  
                  <span className="text-gray-700">
                    Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalItems} agents)
                  </span>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                    disabled={!pagination.hasNextPage}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      pagination.hasNextPage
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Next
                    <FaChevronRight className="inline ml-2" />
                  </button>
                </div>
              )}

              {paginatedAgents.length === 0 && !loading && (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">
                    {searchQuery || selectedLocation !== 'all'
                      ? 'No agents found matching your search criteria.'
                      : 'No agents available at the moment.'}
                  </p>
                </div>
              )}
            </>
          )}
        </section>

        {/* Property Sub-links Section */}
        <section>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Browse Properties by Category
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Find exactly what you're looking for with our organized property categories
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {propertySubLinks.map((category) => (
              <div key={category.category} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-8">
                <div className="text-center mb-6">
                  <div className="text-4xl mb-4">{category.icon}</div>
                  <h3 className="text-2xl font-bold text-gray-900">{category.category}</h3>
                </div>
                
                <div className="space-y-3">
                  {category.links.map((link, index) => (
                    <Link
                      key={index}
                      to={link.href}
                      className="block w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all duration-300 group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 group-hover:text-blue-600 font-medium">
                          {link.label}
                        </span>
                        <FaArrowRight className="text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-300" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Area Scoop Section */}
        <section className="py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Area Scoop
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Explore real estate opportunities across Nigeria's major cities and all 36 states
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Major Cities */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 text-white">
              <div className="text-center">
                <div className="text-4xl mb-4 flex justify-center">
                  <FaCity className="text-gray-200" />
                </div>
                <h3 className="text-xl font-bold mb-4">Navigate Lagos</h3>
                <p className="text-blue-100 mb-4">
                  Discover properties in Nigeria's commercial capital
                </p>
                <Link
                  to="/properties?location=Lagos"
                  className="inline-flex items-center px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
                >
                  Explore Lagos
                  <FaArrowRight className="ml-2" />
                </Link>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 text-white">
              <div className="text-center">
                <div className="text-4xl mb-4 flex justify-center">
                  <FaMonument className="text-gray-200" />
                </div>
                <h3 className="text-xl font-bold mb-4">Navigate Abuja</h3>
                <p className="text-green-100 mb-4">
                  Find properties in the federal capital territory
                </p>
                <Link
                  to="/properties?location=Abuja"
                  className="inline-flex items-center px-4 py-2 bg-white text-green-600 rounded-lg hover:bg-green-50 transition-colors font-medium"
                >
                  Explore Abuja
                  <FaArrowRight className="ml-2" />
                </Link>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 text-white">
              <div className="text-center">
                <div className="text-4xl mb-4 flex justify-center">
                  <FaIndustry className="text-gray-200" />
                </div>
                <h3 className="text-xl font-bold mb-4">Navigate Rivers</h3>
                <p className="text-purple-100 mb-4">
                  Explore properties in the oil-rich state
                </p>
                <Link
                  to="/properties?location=Rivers"
                  className="inline-flex items-center px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-purple-50 transition-colors font-medium"
                >
                  Explore Rivers
                  <FaArrowRight className="ml-2" />
                </Link>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 text-white">
              <div className="text-center">
                <div className="text-4xl mb-4 flex justify-center">
                  <FaMapMarkedAlt className="text-gray-200" />
                </div>
                <h3 className="text-xl font-bold mb-4">Navigate All 36 States</h3>
                <p className="text-orange-100 mb-4">
                  Discover properties across Nigeria
                </p>
                <Link
                  to="/properties"
                  className="inline-flex items-center px-4 py-2 bg-white text-orange-600 rounded-lg hover:bg-orange-50 transition-colors font-medium"
                >
                  Explore All States
                  <FaArrowRight className="ml-2" />
                </Link>
              </div>
            </div>
          </div>


        </section>
      </div>
    </div>
  );
};

export default HomeSections;

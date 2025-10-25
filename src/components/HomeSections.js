import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaUser, FaMapMarkerAlt, FaPhone, FaEnvelope, FaArrowRight } from 'react-icons/fa';

const HomeSections = () => {
  const [agents, setAgents] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [loading, setLoading] = useState(false);

  // Mock agents data
  useEffect(() => {
    setLoading(true);
    // Simulate API call delay
    setTimeout(() => {
      const mockAgents = [
        {
          id: 1,
          name: 'Sarah Johnson',
          location: 'Lagos',
          phone: '+234 801 234 5678',
          email: 'sarah@example.com',
          avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
          propertiesSold: 45,
          rating: 4.9
        },
        {
          id: 2,
          name: 'Michael Brown',
          location: 'Abuja',
          phone: '+234 802 345 6789',
          email: 'michael@example.com',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
          propertiesSold: 32,
          rating: 4.8
        },
        {
          id: 3,
          name: 'Emily Davis',
          location: 'Lagos',
          phone: '+234 803 456 7890',
          email: 'emily@example.com',
          avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
          propertiesSold: 28,
          rating: 4.7
        },
        {
          id: 4,
          name: 'David Wilson',
          location: 'Rivers',
          phone: '+234 804 567 8901',
          email: 'david@example.com',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
          propertiesSold: 38,
          rating: 4.9
        }
      ];

      // Filter agents based on selected location
      const filteredAgents = selectedLocation === 'all' 
        ? mockAgents 
        : mockAgents.filter(agent => agent.location === selectedLocation);
      
      setAgents(filteredAgents);
      setLoading(false);
    }, 500);
  }, [selectedLocation]);

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

          {/* Location Filter */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
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

          {/* Agents Grid */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {agents.map((agent) => (
                <div key={agent.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <img
                      src={agent.avatar}
                      alt={`${agent.firstName} ${agent.lastName}`}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {agent.firstName} {agent.lastName}
                      </h3>
                      <p className="text-blue-600 font-medium">
                        {agent.vendorData?.businessName}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-gray-600">
                      <FaMapMarkerAlt className="mr-2 text-blue-500" />
                      <span>{agent.vendorData?.agentLocation}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <FaPhone className="mr-2 text-blue-500" />
                      <span>{agent.phone}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <FaEnvelope className="mr-2 text-blue-500" />
                      <span>{agent.email}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <FaUser className="mr-2 text-blue-500" />
                      <span>{agent.vendorData?.experience}</span>
                    </div>
                  </div>
                  
                  <button className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors duration-300 flex items-center justify-center space-x-2">
                    <span>Contact Agent</span>
                    <FaArrowRight />
                  </button>
                </div>
              ))}
            </div>
          )}

          {agents.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No agents found for the selected location.</p>
            </div>
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
                <div className="text-4xl mb-4">🏙️</div>
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
                <div className="text-4xl mb-4">🏛️</div>
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
                <div className="text-4xl mb-4">⛽</div>
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
                <div className="text-4xl mb-4">🗺️</div>
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

          {/* Quick State Navigation */}
          <div className="mt-12">
            <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
              Quick State Navigation
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[
                'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa',
                'Benue', 'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo',
                'Ekiti', 'Enugu', 'Gombe', 'Imo', 'Jigawa', 'Kaduna',
                'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos',
                'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo',
                'Plateau', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara', 'FCT'
              ].map((state) => (
                <Link
                  key={state}
                  to={`/properties?location=${state}`}
                  className="block p-3 text-center bg-white rounded-lg shadow-sm hover:shadow-md hover:bg-blue-50 transition-all duration-300 border border-gray-200 hover:border-blue-300"
                >
                  <span className="text-sm font-medium text-gray-700 hover:text-blue-600">
                    {state}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default HomeSections;

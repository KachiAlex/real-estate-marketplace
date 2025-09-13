import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useProperty } from '../contexts/PropertyContext';
import { useInvestment } from '../contexts/InvestmentContext';
import { FaHeart, FaBell, FaQuestionCircle, FaShare, FaBed, FaBath, FaRuler, FaUser, FaCalendar, FaTag, FaHome, FaMapMarkerAlt, FaPhone, FaEnvelope, FaCheck, FaPlus, FaChartLine } from 'react-icons/fa';

const Dashboard = () => {
  const { user } = useAuth();

  // Mock data for the dashboard
  const mockProperties = [
    {
      id: 1,
      title: "Luxury Apartment in Victoria Island",
      price: 75000000,
      location: "Victoria Island, Lagos",
      bedrooms: 3,
      bathrooms: 2,
      area: 210,
      image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop",
      tag: "New Listing",
      tagColor: "bg-green-500"
    },
    {
      id: 2,
      title: "Modern Family House in Lekki",
      price: 120000000,
      location: "Lekki Phase 1, Lagos",
      bedrooms: 4,
      bathrooms: 3,
      area: 350,
      image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop",
      tag: "Featured",
      tagColor: "bg-brand-orange"
    },
    {
      id: 3,
      title: "Penthouse with Ocean View in Ikoyi",
      price: 95000000,
      location: "Ikoyi, Lagos",
      bedrooms: 2,
      bathrooms: 2,
      area: 180,
      image: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400&h=300&fit=crop",
      tag: null,
      tagColor: ""
    }
  ];

  const recommendedProperties = [
    {
      id: 4,
      title: "Elegant Townhouse in Maitama",
      price: 85000000,
      location: "Maitama, Abuja",
      bedrooms: 3,
      bathrooms: 2,
      area: 210,
      image: "https://picsum.photos/400/300?random=4",
      tag: "Hot Deal",
      tagColor: "bg-red-500"
    },
    {
      id: 5,
      title: "Garden View Apartment in Ikeja GRA",
      price: 55000000,
      location: "Ikeja GRA, Lagos",
      bedrooms: 4,
      bathrooms: 3,
      area: 350,
      image: "https://picsum.photos/400/300?random=5",
      tag: "Exclusive",
      tagColor: "bg-blue-500"
    },
    {
      id: 6,
      title: "Beachfront Villa in Banana Island",
      price: 180000000,
      location: "Banana Island, Lagos",
      bedrooms: 2,
      bathrooms: 2,
      area: 180,
      image: "https://picsum.photos/400/300?random=6",
      tag: "Premium",
      tagColor: "bg-purple-500"
    }
  ];

  return (
    <div className="p-6">
      {/* Main Content Area */}
      <div className="w-full">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="welcome-section">
            <h1 className="text-2xl font-bold mb-2">Good Afternoon, {user?.firstName || 'Oluwaseun'}!</h1>
            <p className="text-blue-100 mb-4">
              Welcome to your dashboard. Track your property journey, manage saved listings, and explore new opportunities in the African real estate market.
            </p>

        {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="stats-card">
                <div className="text-2xl font-bold">5</div>
                <div className="text-blue-200 text-sm">Saved Properties</div>
                </div>
              <div className="stats-card">
                <div className="text-2xl font-bold">3</div>
                <div className="text-blue-200 text-sm">Property Alerts</div>
              </div>
              <div className="stats-card">
                <div className="text-2xl font-bold">2</div>
                <div className="text-blue-200 text-sm">Pending Inquiries</div>
              </div>
            </div>
          </div>
        </div>

        {/* Continue Browsing Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Continue Browsing</h2>
            <Link to="/properties" className="text-brand-blue hover:text-blue-700 text-sm font-medium">
              View history →
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {mockProperties.map((property) => (
              <div key={property.id} className="property-card">
                <div className="relative">
                  <img
                    src={property.image}
                    alt={property.title}
                    className="property-card-image"
                  />
                  {property.tag && (
                    <div className={`absolute top-2 left-2 tag ${property.tagColor} text-white px-2 py-1 rounded text-xs font-medium`}>
                      {property.tag}
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex space-x-2">
                    <FaShare className="text-white bg-black bg-opacity-50 p-1 rounded cursor-pointer" />
                    <FaHeart className="text-white bg-black bg-opacity-50 p-1 rounded cursor-pointer" />
                </div>
              </div>
                
                <div className="property-card-content">
                  <div className="property-price">
                    ₦{property.price.toLocaleString()}
                  </div>
                  <h3 className="property-title">{property.title}</h3>
                  <p className="property-location">{property.location}</p>
                  
                  <div className="property-features">
                    <div className="flex items-center space-x-1">
                      <FaBed />
                      <span>{property.bedrooms} Bedrooms</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <FaBath />
                      <span>{property.bathrooms} Bathrooms</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <FaRuler />
                      <span>{property.area}m² Area</span>
                    </div>
              </div>
            </div>
          </div>
            ))}
                </div>
              </div>

        {/* Recommended for You Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Recommended for You</h2>
            <Link to="/properties" className="text-brand-blue hover:text-blue-700 text-sm font-medium">
              View all →
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recommendedProperties.map((property) => (
              <div key={property.id} className="property-card">
                <div className="relative">
                  <img
                    src={property.image}
                    alt={property.title}
                    className="property-card-image"
                  />
                  {property.tag && (
                    <div className={`absolute top-2 left-2 tag ${property.tagColor} text-white px-2 py-1 rounded text-xs font-medium`}>
                      {property.tag}
              </div>
                  )}
                  <div className="absolute top-2 right-2 flex space-x-2">
                    <FaShare className="text-white bg-black bg-opacity-50 p-1 rounded cursor-pointer" />
                    <FaHeart className="text-white bg-black bg-opacity-50 p-1 rounded cursor-pointer" />
            </div>
          </div>

                <div className="property-card-content">
                  <div className="property-price">
                    ₦{property.price.toLocaleString()}
                  </div>
                  <h3 className="property-title">{property.title}</h3>
                  <p className="property-location">{property.location}</p>
                  
                  <div className="property-features">
                    <div className="flex items-center space-x-1">
                      <FaBed />
                      <span>{property.bedrooms} Bedrooms</span>
                </div>
                    <div className="flex items-center space-x-1">
                      <FaBath />
                      <span>{property.bathrooms} Bathrooms</span>
              </div>
                    <div className="flex items-center space-x-1">
                      <FaRuler />
                      <span>{property.area}m² Area</span>
              </div>
            </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Market Insight Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Price Trends Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Price Trends in Lagos</h3>
              <FaChartLine className="text-brand-blue" />
              </div>
            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="w-full h-48 bg-white rounded border p-4">
                  <div className="flex items-end justify-between h-full">
                    <div className="flex flex-col items-center">
                      <div className="w-8 bg-green-500 rounded-t mb-2" style={{height: '60%'}}></div>
                      <span className="text-xs text-gray-600">Jan</span>
              </div>
                    <div className="flex flex-col items-center">
                      <div className="w-8 bg-green-500 rounded-t mb-2" style={{height: '70%'}}></div>
                      <span className="text-xs text-gray-600">Feb</span>
              </div>
                    <div className="flex flex-col items-center">
                      <div className="w-8 bg-green-500 rounded-t mb-2" style={{height: '80%'}}></div>
                      <span className="text-xs text-gray-600">Mar</span>
              </div>
                    <div className="flex flex-col items-center">
                      <div className="w-8 bg-green-500 rounded-t mb-2" style={{height: '75%'}}></div>
                      <span className="text-xs text-gray-600">Apr</span>
              </div>
                    <div className="flex flex-col items-center">
                      <div className="w-8 bg-green-500 rounded-t mb-2" style={{height: '85%'}}></div>
                      <span className="text-xs text-gray-600">May</span>
              </div>
                    <div className="flex flex-col items-center">
                      <div className="w-8 bg-green-500 rounded-t mb-2" style={{height: '90%'}}></div>
                      <span className="text-xs text-gray-600">Jun</span>
          </div>
        </div>
          </div>
                <p className="text-sm text-gray-500 mt-2">Victoria Island (Green), Lagos (Yellow), Ikoyi (Blue)</p>
                </div>
            </div>
        </div>

          {/* Recent Transactions */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
              <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                <FaHome className="w-4 h-4 text-brand-blue" />
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <FaHome className="text-brand-blue" />
                  <div>
                    <p className="font-medium text-gray-900">3 Bedroom Apartment</p>
                    <p className="text-sm text-gray-600">Victoria Island, Lagos</p>
                  </div>
                </div>
                <p className="font-semibold text-gray-900">₦100M</p>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <FaHome className="text-brand-blue" />
                  <div>
                    <p className="font-medium text-gray-900">2 Bedroom Penthouse</p>
                    <p className="text-sm text-gray-600">Ikoyi, Lagos</p>
                  </div>
                </div>
                <p className="font-semibold text-gray-900">₦82M</p>
          </div>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-3">
                  <FaHome className="text-brand-blue" />
                  <div>
                    <p className="font-medium text-gray-900">4 Bedroom Duplex</p>
                    <p className="text-sm text-gray-600">Lekki Phase 1, Lagos</p>
                  </div>
                  </div>
                <p className="font-semibold text-gray-900">₦95M</p>
                  </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 
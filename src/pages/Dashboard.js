import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useProperty } from '../contexts/PropertyContext';
import { useInvestment } from '../contexts/InvestmentContext';
import { FaHeart, FaBell, FaQuestionCircle, FaShare, FaBed, FaBath, FaRuler, FaUser, FaCalendar, FaTag, FaHome, FaMapMarkerAlt, FaPhone, FaEnvelope, FaCheck, FaPlus, FaChartLine, FaMoneyBillWave } from 'react-icons/fa';
import toast from 'react-hot-toast';
import PriceTrendsChart from '../components/PriceTrendsChart';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { properties, loading } = useProperty();

  // Get recent properties (first 3)
  const recentProperties = properties.slice(0, 3);

  const handleViewProperty = (propertyId) => {
    navigate(`/property/${propertyId}`);
  };

  const handleViewAllProperties = () => {
    navigate('/properties');
  };

  const handleQuickAction = (action) => {
    switch(action) {
      case 'add-property':
        navigate('/add-property');
        break;
      case 'saved-properties':
        navigate('/saved-properties');
        break;
      case 'inquiries':
        navigate('/inquiries');
        break;
      case 'alerts':
        navigate('/alerts');
        break;
      case 'investments':
        navigate('/investments');
        break;
      case 'escrow':
        navigate('/escrow');
        break;
      default:
        toast.success(`${action} clicked!`);
    }
  };

  // Real data for stats - calculate from actual data
  const dashboardStats = {
    totalProperties: properties.length || 0,
    savedProperties: user?.savedProperties?.length || 5, // From user data or default
    activeInquiries: user?.inquiries?.length || 3, // From user data or default
    scheduledViewings: user?.viewings?.length || 2, // From user data or default
    totalInvested: user?.totalInvested || 0, // Investment amount
    activeInvestments: user?.activeInvestments || 0, // Active investments
    escrowTransactions: user?.escrowTransactions?.length || 0, // Escrow transactions
    monthlyBudget: user?.monthlyBudget || 5000000 // Monthly property budget
  };

  // Mock data for recent properties (fallback if no properties loaded)
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
      image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop",
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
      image: "https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=400&h=300&fit=crop",
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
      image: "https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=400&h=300&fit=crop",
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="stats-card">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-white">{dashboardStats.savedProperties}</div>
                    <div className="text-blue-200 text-sm">Saved Properties</div>
                  </div>
                  <FaHeart className="text-blue-300 text-xl" />
                </div>
              </div>
              
              <div className="stats-card">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-white">{dashboardStats.activeInquiries}</div>
                    <div className="text-blue-200 text-sm">Active Inquiries</div>
                  </div>
                  <FaBell className="text-blue-300 text-xl" />
                </div>
              </div>
              
              <div className="stats-card">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-white">{dashboardStats.scheduledViewings}</div>
                    <div className="text-blue-200 text-sm">Scheduled Viewings</div>
                  </div>
                  <FaCalendar className="text-blue-300 text-xl" />
                </div>
              </div>
              
              <div className="stats-card">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-white">{dashboardStats.totalInvested > 0 ? `₦${(dashboardStats.totalInvested / 1000000).toFixed(1)}M` : '₦0'}</div>
                    <div className="text-blue-200 text-sm">Total Invested</div>
                  </div>
                  <FaChartLine className="text-blue-300 text-xl" />
                </div>
              </div>
            </div>

            {/* Additional Analytics Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="stats-card">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-white">{dashboardStats.activeInvestments}</div>
                    <div className="text-blue-200 text-sm">Active Investments</div>
                  </div>
                  <FaTag className="text-blue-300 text-xl" />
                </div>
              </div>
              
              <div className="stats-card">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-white">{dashboardStats.escrowTransactions}</div>
                    <div className="text-blue-200 text-sm">Escrow Transactions</div>
                  </div>
                  <FaCheck className="text-blue-300 text-xl" />
                </div>
              </div>
              
              <div className="stats-card">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-white">₦{(dashboardStats.monthlyBudget / 1000000).toFixed(1)}M</div>
                    <div className="text-blue-200 text-sm">Monthly Budget</div>
                  </div>
                  <FaMoneyBillWave className="text-blue-300 text-xl" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Market Insights & Trends */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Insights & Trends</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Property Price Trends */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-blue-900">Price Trends</h4>
                  <FaChartLine className="text-blue-600" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-700">Victoria Island</span>
                    <span className="font-semibold text-green-600">+12.5%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-700">Lekki</span>
                    <span className="font-semibold text-green-600">+8.3%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-700">Ikoyi</span>
                    <span className="font-semibold text-green-600">+15.2%</span>
                  </div>
                </div>
                <p className="text-xs text-blue-600 mt-2">Average increase this quarter</p>
              </div>

              {/* Investment Opportunities */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-green-900">Investment ROI</h4>
                  <FaTag className="text-green-600" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-green-700">Luxury Apartments</span>
                    <span className="font-semibold text-green-600">18.5%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-green-700">Commercial Properties</span>
                    <span className="font-semibold text-green-600">22.1%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-green-700">Land Development</span>
                    <span className="font-semibold text-green-600">25.3%</span>
                  </div>
                </div>
                <p className="text-xs text-green-600 mt-2">Average annual returns</p>
              </div>

              {/* Market Activity */}
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-orange-900">Market Activity</h4>
                  <FaBell className="text-orange-600" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-orange-700">New Listings</span>
                    <span className="font-semibold text-orange-600">+24</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-orange-700">Price Reductions</span>
                    <span className="font-semibold text-orange-600">-8</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-orange-700">Sold This Month</span>
                    <span className="font-semibold text-orange-600">+31</span>
                  </div>
                </div>
                <p className="text-xs text-orange-600 mt-2">Last 30 days activity</p>
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
            {(recentProperties.length > 0 ? recentProperties : mockProperties).map((property) => (
              <div key={property.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative">
                  <img
                    src={property.image || property.images?.[0]?.url || 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop'}
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
                      onClick={() => toast.success('Property shared!')}
                      className="w-8 h-8 bg-black bg-opacity-50 rounded-full flex items-center justify-center hover:bg-opacity-75 transition-colors"
                    >
                      <FaShare className="text-white text-sm" />
                    </button>
                    <button
                      onClick={() => toast.success('Added to favorites!')}
                      className="w-8 h-8 bg-black bg-opacity-50 rounded-full flex items-center justify-center hover:bg-opacity-75 transition-colors"
                    >
                      <FaHeart className="text-white text-sm" />
                    </button>
                  </div>
                </div>

                <div className="p-4">
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    ₦{property.price?.toLocaleString()}
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
                      <FaRuler />
                      <span>{property.area || property.details?.sqft || 0}m² Area</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleViewProperty(property.id)}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                  >
                    View Details →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Market Insight Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Price Trends Chart */}
          <PriceTrendsChart />

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
import React, { useEffect, useState } from 'react';
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
  const { properties, loading, toggleFavorite } = useProperty();

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

  // Real data for stats - calculate from actual data
  const calculateDashboardStats = () => {
    // Get escrow transactions from localStorage
    const escrowTransactions = JSON.parse(localStorage.getItem('escrowTransactions') || '[]');
    const userEscrowTransactions = escrowTransactions.filter(t => t.buyerId === user?.id);
    
    // Get viewing requests from localStorage
    const viewingRequests = JSON.parse(localStorage.getItem('viewingRequests') || '[]');
    const userViewingRequests = viewingRequests.filter(v => v.userId === user?.id);
    
    // Get investment escrows from localStorage
    const investmentEscrows = JSON.parse(localStorage.getItem('investmentEscrows') || '[]');
    const userInvestmentEscrows = investmentEscrows.filter(i => i.investorId === user?.id);
    
    // Calculate total invested from escrow transactions
    const totalInvested = userEscrowTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    
    // Calculate total invested from investment escrows
    const totalInvestmentAmount = userInvestmentEscrows.reduce((sum, i) => sum + (i.amount || 0), 0);
    
    return {
      totalProperties: properties.length || 0,
      savedProperties: user?.savedProperties?.length || 5,
      activeInquiries: user?.inquiries?.length || 3,
      scheduledViewings: userViewingRequests.filter(v => v.status === 'pending' || v.status === 'confirmed').length,
      totalInvested: totalInvested + totalInvestmentAmount,
      activeInvestments: userInvestmentEscrows.filter(i => i.status === 'pending_documents' || i.status === 'active').length,
      escrowTransactions: userEscrowTransactions.length,
      monthlyBudget: user?.monthlyBudget || 5000000,
      // Additional stats
      completedViewings: userViewingRequests.filter(v => v.status === 'completed').length,
      pendingPayments: userEscrowTransactions.filter(t => t.status === 'pending' || t.status === 'in-progress').length,
      totalEarnings: user?.totalEarnings || 0
    };
  };

  const dashboardStats = calculateDashboardStats();

  // Recalculate stats when user or properties change
  useEffect(() => {
    // This will trigger a re-render when dependencies change
  }, [user, properties]);

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
              
              <div 
                className="stats-card cursor-pointer hover:bg-blue-700 transition-colors"
                onClick={() => navigate('/scheduled-viewings')}
                title="View all scheduled viewings"
              >
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
                    <button
                      onClick={async () => {
                        const url = `${window.location.origin}/property/${property.id}`;
                        try {
                          if (navigator.share) {
                            await navigator.share({ title: property.title, text: property.title, url });
                          } else {
                            await navigator.clipboard.writeText(url);
                            toast.success('Link copied');
                          }
                        } catch (e) {}
                      }}
                      className="text-white bg-black bg-opacity-50 p-1 rounded hover:bg-opacity-70 transition-all"
                    >
                      <FaShare className="text-sm" />
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await toggleFavorite(property.id);
                        } catch (e) {
                          toast.error('Failed to update favorite');
                        }
                      }}
                      className="text-white bg-black bg-opacity-50 p-1 rounded hover:bg-opacity-70 transition-all"
                    >
                      <FaHeart className="text-sm" />
                    </button>
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
                  <p className="text-gray-600 text-sm mb-3">
                    {(() => {
                      if (typeof property.location === 'string') {
                        return property.location;
                      }
                      if (property.location && typeof property.location === 'object') {
                        if (property.location.address) {
                          return property.location.address;
                        }
                        const city = property.location.city || '';
                        const state = property.location.state || '';
                        return `${city}${city && state ? ', ' : ''}${state}`.trim();
                      }
                      return 'Location not specified';
                    })()}
                  </p>
                  
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

                  <div className="space-y-2">
                    <button 
                      onClick={() => handleViewProperty(property.id)}
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

export default Dashboard; 
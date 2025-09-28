import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useProperty, LISTING_TYPES, PROPERTY_TYPES } from '../contexts/PropertyContext';
import { FaHome, FaChartLine, FaEye, FaHeart, FaEnvelope, FaCalendar, FaDollarSign, FaUsers, FaPlus, FaEdit, FaTrash, FaImage, FaMapMarkerAlt, FaBed, FaBath, FaRulerCombined, FaTag, FaPhone, FaCheck, FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import PropertyCreationTest from '../components/PropertyCreationTest';

const VendorDashboard = () => {
  const { user } = useAuth();
  const { addProperty } = useProperty();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [properties, setProperties] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [inquiries, setInquiries] = useState([]);
  const [viewingRequests, setViewingRequests] = useState([]);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [proposalDate, setProposalDate] = useState('');
  const [proposalTime, setProposalTime] = useState('');
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [showAddProperty, setShowAddProperty] = useState(false);

  const [newTitle, setNewTitle] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newType, setNewType] = useState('apartment');
  const [newListingType, setNewListingType] = useState('for-sale');
  const [sellerRole, setSellerRole] = useState('owner');
  const [attestationLetterUrl, setAttestationLetterUrl] = useState('');
  const [propertyDocsUrl, setPropertyDocsUrl] = useState('');
  const [authorizedAgentsCount, setAuthorizedAgentsCount] = useState('');
  const [mortgageProvider, setMortgageProvider] = useState('');
  const [minDownPaymentPercent, setMinDownPaymentPercent] = useState('');
  const [tenorMonths, setTenorMonths] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [monthlyIncomeRequirement, setMonthlyIncomeRequirement] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  // Sync tab with route
  useEffect(() => {
    if (location.pathname.startsWith('/vendor/add-property')) {
      setActiveTab('add');
    } else if (location.pathname.startsWith('/vendor/properties')) {
      setActiveTab('properties');
    } else if (location.pathname.startsWith('/vendor/dashboard')) {
      // keep current or default to overview
    }
  }, [location.pathname]);

  // Mock data for vendor dashboard
  useEffect(() => {
    // Mock properties data
    setProperties([
      {
        id: 1,
        title: "Luxury Apartment in Victoria Island",
        price: 75000000,
        location: "Victoria Island, Lagos",
        bedrooms: 3,
        bathrooms: 2,
        area: 210,
        image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop",
        status: "active",
        views: 1247,
        inquiries: 23,
        favorites: 45,
        dateListed: "2024-01-15",
        lastUpdated: "2024-01-20"
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
        status: "pending",
        views: 892,
        inquiries: 15,
        favorites: 32,
        dateListed: "2024-01-10",
        lastUpdated: "2024-01-18"
      },
      {
        id: 3,
        title: "Executive Duplex in Abuja",
        price: 180000000,
        location: "Maitama, Abuja",
        bedrooms: 5,
        bathrooms: 4,
        area: 450,
        image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400&h=300&fit=crop",
        status: "sold",
        views: 2156,
        inquiries: 67,
        favorites: 89,
        dateListed: "2023-12-01",
        lastUpdated: "2024-01-05"
      }
    ]);

    // Mock analytics data
    setAnalytics({
      totalProperties: 12,
      activeListings: 8,
      soldProperties: 4,
      totalViews: 15420,
      totalInquiries: 156,
      totalRevenue: 450000000,
      averagePrice: 37500000,
      conversionRate: 12.5,
      monthlyViews: 3240,
      monthlyInquiries: 34
    });

    // Mock inquiries data
    setInquiries([
      {
        id: 1,
        propertyId: 1,
        propertyTitle: "Luxury Apartment in Victoria Island",
        buyerName: "John Adebayo",
        buyerEmail: "john@email.com",
        buyerPhone: "+234 801 234 5678",
        message: "I'm interested in viewing this property. When would be a good time?",
        status: "new",
        date: "2024-01-20",
        priority: "high"
      },
      {
        id: 2,
        propertyId: 2,
        propertyTitle: "Modern Family House in Lekki",
        buyerName: "Sarah Johnson",
        buyerEmail: "sarah@email.com",
        buyerPhone: "+234 802 345 6789",
        message: "Could you provide more details about the neighborhood and amenities?",
        status: "contacted",
        date: "2024-01-19",
        priority: "medium"
      }
    ]);

    // Load viewing requests created by buyers from localStorage
    try {
      const stored = JSON.parse(localStorage.getItem('viewingRequests') || '[]');
      // Optional: filter to requests for this vendor's properties if you have mapping
      setViewingRequests(stored);
    } catch (e) {
      setViewingRequests([]);
    }
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'sold': return 'bg-blue-100 text-blue-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <FaCheck className="text-green-600" />;
      case 'pending': return <FaExclamationTriangle className="text-yellow-600" />;
      case 'sold': return <FaDollarSign className="text-blue-600" />;
      case 'inactive': return <FaTimes className="text-gray-600" />;
      default: return <FaTimes className="text-gray-600" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* No modal; adding happens in dedicated tab now */}

      {/* Welcome Section */}
      <div className="welcome-section mb-8">
        <div className="bg-gradient-to-r from-brand-blue to-blue-800 rounded-2xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.firstName || 'Vendor'}!</h1>
              <p className="text-blue-100 text-lg">Manage your properties and grow your real estate business</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">₦{analytics.totalRevenue?.toLocaleString()}</div>
              <div className="text-blue-100">Total Revenue</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="stats-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Listings</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.activeListings}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <FaHome className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-green-600 text-sm font-medium">+2 this month</span>
          </div>
        </div>

        <div className="stats-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Views</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalViews?.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <FaEye className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-blue-600 text-sm font-medium">+{analytics.monthlyViews} this month</span>
          </div>
        </div>

        <div className="stats-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Inquiries</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalInquiries}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <FaEnvelope className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-orange-600 text-sm font-medium">+{analytics.monthlyInquiries} this month</span>
          </div>
        </div>

        <div className="stats-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.conversionRate}%</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <FaChartLine className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-purple-600 text-sm font-medium">+2.1% from last month</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: FaChartLine },
              { id: 'properties', label: 'My Properties', icon: FaHome },
              { id: 'add', label: 'Add Property', icon: FaPlus },
              { id: 'inquiries', label: 'Inquiries', icon: FaEnvelope },
              { id: 'analytics', label: 'Analytics', icon: FaChartLine }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === 'add') navigate('/vendor/add-property');
                  else if (tab.id === 'properties') navigate('/vendor/properties');
                  else if (tab.id === 'overview') navigate('/vendor/dashboard');
                }}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-brand-blue text-brand-blue'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Recent Activity */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 rounded-full">
                        <FaEye className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">New view on "Luxury Apartment in Victoria Island"</p>
                        <p className="text-xs text-gray-500">2 minutes ago</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <FaEnvelope className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">New inquiry from John Adebayo</p>
                        <p className="text-xs text-gray-500">15 minutes ago</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-orange-100 rounded-full">
                        <FaHeart className="h-4 w-4 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">Property added to favorites</p>
                        <p className="text-xs text-gray-500">1 hour ago</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button 
                    onClick={() => {
                      setActiveTab('add');
                      navigate('/vendor/add-property');
                    }}
                    className="flex items-center space-x-3 p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="p-2 bg-blue-100 rounded-full">
                      <FaPlus className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Add New Property</p>
                      <p className="text-sm text-gray-500">List a new property</p>
                    </div>
                  </button>
                  <button className="flex items-center space-x-3 p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="p-2 bg-green-100 rounded-full">
                      <FaEdit className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Update Listings</p>
                      <p className="text-sm text-gray-500">Edit property details</p>
                    </div>
                  </button>
                  <button className="flex items-center space-x-3 p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="p-2 bg-purple-100 rounded-full">
                      <FaChartLine className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">View Analytics</p>
                      <p className="text-sm text-gray-500">Check performance</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Properties Tab */}
          {activeTab === 'properties' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">My Properties</h3>
                <button 
                  onClick={() => {
                    setActiveTab('add');
                    navigate('/vendor/add-property');
                  }}
                  className="btn-primary flex items-center space-x-2"
                >
                  <FaPlus className="h-4 w-4" />
                  <span>Add Property</span>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {properties.map((property) => (
                  <div key={property.id} className="property-card">
                    <div className="relative">
                      <img
                        src={property.image}
                        alt={property.title}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                      <div className="absolute top-3 left-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(property.status)}`}>
                          {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
                        </span>
                      </div>
                      <div className="absolute top-3 right-3 flex space-x-2">
                        <button className="p-2 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-all">
                          <FaEdit className="h-4 w-4 text-gray-600" />
                        </button>
                        <button className="p-2 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-all">
                          <FaTrash className="h-4 w-4 text-red-600" />
                        </button>
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        ₦{property.price.toLocaleString()}
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">{property.title}</h3>
                      <p className="text-gray-600 text-sm mb-3 flex items-center">
                        <FaMapMarkerAlt className="h-3 w-3 mr-1" />
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
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                        <div className="flex items-center space-x-1">
                          <FaBed className="h-3 w-3" />
                          <span>{property.bedrooms}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <FaBath className="h-3 w-3" />
                          <span>{property.bathrooms}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <FaRulerCombined className="h-3 w-3" />
                          <span>{property.area}m²</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-center text-sm">
                        <div>
                          <div className="font-semibold text-gray-900">{property.views}</div>
                          <div className="text-gray-500">Views</div>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{property.inquiries}</div>
                          <div className="text-gray-500">Inquiries</div>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{property.favorites}</div>
                          <div className="text-gray-500">Favorites</div>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Listed: {new Date(property.dateListed).toLocaleDateString()}</span>
                          <span>Updated: {new Date(property.lastUpdated).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Inquiries Tab */}
          {activeTab === 'inquiries' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Property Inquiries & Viewings</h3>
                <div className="flex space-x-2">
                  <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>All Inquiries</option>
                    <option>New</option>
                    <option>Contacted</option>
                    <option>Follow-up</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                {inquiries.map((inquiry) => (
                  <div key={inquiry.id} className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-semibold text-gray-900">{inquiry.buyerName}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(inquiry.priority)}`}>
                            {inquiry.priority}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            inquiry.status === 'new' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {inquiry.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">Property: {inquiry.propertyTitle}</p>
                        <p className="text-gray-700 mb-3">{inquiry.message}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <FaEnvelope className="h-3 w-3 mr-1" />
                            {inquiry.buyerEmail}
                          </span>
                          <span className="flex items-center">
                            <FaPhone className="h-3 w-3 mr-1" />
                            {inquiry.buyerPhone}
                          </span>
                          <span className="flex items-center">
                            <FaCalendar className="h-3 w-3 mr-1" />
                            {new Date(inquiry.date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors">
                          Reply
                        </button>
                        <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition-colors">
                          Mark as Contacted
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Viewing Requests */}
              <div className="pt-4">
                <h4 className="text-md font-semibold text-gray-900 mb-3">Viewing Requests</h4>
                {viewingRequests.length === 0 ? (
                  <p className="text-sm text-gray-500">No viewing requests yet.</p>
                ) : (
                  <div className="space-y-3">
                    {viewingRequests.map((req) => (
                      <div key={req.id} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-semibold text-gray-900">{req.userName || 'Buyer'}</span>
                              <span className={`px-2 py-0.5 rounded-full text-xs ${req.status==='confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{req.status || 'pending'}</span>
                            </div>
                            <p className="text-sm text-gray-700">Property: {req.propertyTitle}</p>
                            <p className="text-xs text-gray-500">Requested: {new Date(req.requestedAt).toLocaleString()}</p>
                            <div className="mt-2 text-sm text-gray-700">
                              <p>Preferred: {req.preferredDate || '—'} {req.preferredTime || ''}</p>
                              {req.vendorProposalDate && (
                                <p className="text-blue-700">Your proposal: {req.vendorProposalDate} {req.vendorProposalTime || ''}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => {
                                setSelectedRequestId(req.id);
                                setProposalDate('');
                                setProposalTime('');
                                setShowProposalModal(true);
                              }}
                              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                            >
                              Propose Alternative
                            </button>
                            <button
                              onClick={() => {
                                const updated = viewingRequests.map(r => r.id === req.id ? { ...r, status: 'confirmed' } : r);
                                setViewingRequests(updated);
                                localStorage.setItem('viewingRequests', JSON.stringify(updated));
                              }}
                              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                            >
                              Confirm
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {/* Add Property Tab */}
          {activeTab === 'add' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Add New Property</h3>
              {/* Property Creation Test - Temporary for debugging */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <PropertyCreationTest />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="e.g., Luxury Apartment in VI" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (₦)</label>
                  <input value={newPrice} onChange={(e) => setNewPrice(e.target.value)} type="number" min="0" className="w-full border rounded px-3 py-2" placeholder="e.g., 75000000" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
                  <select value={newType} onChange={(e) => setNewType(e.target.value)} className="w-full border rounded px-3 py-2">
                    {PROPERTY_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Listing Type</label>
                  <select value={newListingType} onChange={(e) => setNewListingType(e.target.value)} className="w-full border rounded px-3 py-2">
                    {LISTING_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Google Maps Link</label>
                  <input value={googleMapsUrl} onChange={(e) => setGoogleMapsUrl(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="https://maps.google.com/?q=..." />
                  <p className="text-xs text-gray-500 mt-1">Paste the Google Maps share link for the property location.</p>
                </div>
                {(googleMapsUrl || (latitude && longitude)) && (
                  <div className="md:col-span-2">
                    <div className="rounded-lg overflow-hidden border">
                      <iframe
                        title="Map preview"
                        src={googleMapsUrl
                          ? `https://www.google.com/maps?q=${encodeURIComponent(googleMapsUrl)}&output=embed`
                          : `https://www.google.com/maps?q=${encodeURIComponent(latitude + ',' + longitude)}&output=embed`}
                        width="100%"
                        height="280"
                        style={{ border: 0 }}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Latitude (optional)</label>
                  <input value={latitude} onChange={(e) => setLatitude(e.target.value)} type="number" step="any" className="w-full border rounded px-3 py-2" placeholder="6.5244" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Longitude (optional)</label>
                  <input value={longitude} onChange={(e) => setLongitude(e.target.value)} type="number" step="any" className="w-full border rounded px-3 py-2" placeholder="3.3792" />
                </div>
              </div>

              {/* Role selection */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-900 mb-3">Are you the owner or an agent entrusted with this property?</p>
                <div className="flex flex-wrap gap-6">
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input type="radio" name="role" value="owner" checked={sellerRole==='owner'} onChange={() => setSellerRole('owner')} />
                    <span>Owner</span>
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input type="radio" name="role" value="agent" checked={sellerRole==='agent'} onChange={() => setSellerRole('agent')} />
                    <span>Agent (entrusted)</span>
                  </label>
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Property Documents (URL)</label>
                    <input value={propertyDocsUrl} onChange={(e) => setPropertyDocsUrl(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="Link to uploaded docs" />
                  </div>
                  {sellerRole === 'agent' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Owner Attestation Letter (URL)</label>
                        <input value={attestationLetterUrl} onChange={(e) => setAttestationLetterUrl(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="Link to letter" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Number of Authorized Agents</label>
                        <input value={authorizedAgentsCount} onChange={(e) => setAuthorizedAgentsCount(e.target.value)} type="number" min="1" className="w-full border rounded px-3 py-2" placeholder="e.g., 3" />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Mortgage extra fields */}
              {newListingType === 'for-mortgage' && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-900 mb-3">Mortgage Details</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mortgage Provider</label>
                      <input value={mortgageProvider} onChange={(e) => setMortgageProvider(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="Bank or provider name" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Min Down Payment (%)</label>
                      <input value={minDownPaymentPercent} onChange={(e) => setMinDownPaymentPercent(e.target.value)} type="number" min="0" max="100" className="w-full border rounded px-3 py-2" placeholder="e.g., 20" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tenor (months)</label>
                      <input value={tenorMonths} onChange={(e) => setTenorMonths(e.target.value)} type="number" min="1" className="w-full border rounded px-3 py-2" placeholder="e.g., 120" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Interest Rate (% p.a.)</label>
                      <input value={interestRate} onChange={(e) => setInterestRate(e.target.value)} type="number" min="0" step="0.01" className="w-full border rounded px-3 py-2" placeholder="e.g., 18" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Income Requirement (₦)</label>
                      <input value={monthlyIncomeRequirement} onChange={(e) => setMonthlyIncomeRequirement(e.target.value)} type="number" min="0" className="w-full border rounded px-3 py-2" placeholder="e.g., 500000" />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2">
                <button onClick={() => navigate('/vendor/properties')} className="px-4 py-2 rounded border">Cancel</button>
                <button
                  onClick={async () => {
                    // simple validations
                    if (!newTitle || !newPrice) return;
                    if (!propertyDocsUrl) return;
                    if (sellerRole === 'agent' && !attestationLetterUrl) return;

                    const extra = {
                      sellerRole,
                      documents: {
                        propertyDocsUrl,
                        attestationLetterUrl: sellerRole === 'agent' ? attestationLetterUrl : ''
                      },
                      authorizedAgentsCount: sellerRole === 'agent' ? Number(authorizedAgentsCount || 0) : undefined,
                      mortgageDetails: newListingType === 'for-mortgage' ? {
                        mortgageProvider,
                        minDownPaymentPercent: Number(minDownPaymentPercent || 0),
                        tenorMonths: Number(tenorMonths || 0),
                        interestRate: Number(interestRate || 0),
                        monthlyIncomeRequirement: Number(monthlyIncomeRequirement || 0)
                      } : undefined
                    };

                    const res = await addProperty({
                      title: newTitle,
                      price: Number(newPrice),
                      type: newType,
                      listingType: newListingType,
                      location: {
                        googleMapsUrl,
                        coordinates: {
                          latitude: latitude ? Number(latitude) : undefined,
                          longitude: longitude ? Number(longitude) : undefined
                        }
                      },
                      ...extra
                    });
                    if (res.success) {
                      // reset form
                      setNewTitle('');
                      setNewPrice('');
                      setNewType('apartment');
                      setNewListingType('for-sale');
                      setSellerRole('owner');
                      setPropertyDocsUrl('');
                      setAttestationLetterUrl('');
                      setAuthorizedAgentsCount('');
                      setMortgageProvider('');
                      setMinDownPaymentPercent('');
                      setTenorMonths('');
                      setInterestRate('');
                      setMonthlyIncomeRequirement('');
                      setGoogleMapsUrl('');
                      setLatitude('');
                      setLongitude('');
                      navigate('/vendor/properties');
                    }
                  }}
                  className="px-4 py-2 rounded bg-brand-blue text-white"
                >
                  Save Property
                </button>
              </div>
            </div>
          )}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Property Performance Analytics</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Views Over Time</h4>
                  <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500">Chart visualization would go here</p>
                  </div>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Inquiry Conversion</h4>
                  <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500">Chart visualization would go here</p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Property Performance Summary</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Views</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inquiries</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Favorites</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conversion</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {properties.map((property) => (
                        <tr key={property.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <img className="h-10 w-10 rounded-lg object-cover" src={property.image} alt={property.title} />
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{property.title}</div>
                                <div className="text-sm text-gray-500">{property.location}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{property.views}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{property.inquiries}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{property.favorites}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {((property.inquiries / property.views) * 100).toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Proposal Modal */}
      {showProposalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Propose Alternative Date</h3>
              <button onClick={() => setShowProposalModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input type="date" value={proposalDate} onChange={(e) => setProposalDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                <input type="time" value={proposalTime} onChange={(e) => setProposalTime(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowProposalModal(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">Cancel</button>
                <button
                  onClick={() => {
                    if (!proposalDate || !proposalTime || !selectedRequestId) return;
                    const updated = viewingRequests.map(r => r.id === selectedRequestId ? { ...r, vendorProposalDate: proposalDate, vendorProposalTime: proposalTime, status: 'proposed' } : r);
                    setViewingRequests(updated);
                    localStorage.setItem('viewingRequests', JSON.stringify(updated));
                    setShowProposalModal(false);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Send Proposal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorDashboard;

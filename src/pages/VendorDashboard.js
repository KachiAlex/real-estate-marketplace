import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useProperty, LISTING_TYPES, PROPERTY_TYPES } from '../contexts/PropertyContext';
import { FaHome, FaChartLine, FaEye, FaHeart, FaEnvelope, FaCalendar, FaDollarSign, FaUsers, FaPlus, FaEdit, FaTrash, FaImage, FaMapMarkerAlt, FaBed, FaBath, FaRulerCombined, FaTag, FaPhone, FaCheck, FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import PropertyVerification from '../components/PropertyVerification';
import VendorInspectionRequests from '../components/VendorInspectionRequests';

const VendorDashboard = () => {
  const { user } = useAuth();
  const { addProperty } = useProperty();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(() => {
    // Set initial tab based on current route
    if (location.pathname === '/vendor/properties') {
      return 'properties';
    }
    return 'overview';
  });

  // Update active tab when route changes
  useEffect(() => {
    if (location.pathname === '/vendor/properties') {
      setActiveTab('properties');
    } else if (location.pathname === '/vendor/dashboard') {
      setActiveTab('overview');
    }
  }, [location.pathname]);
  
  // Determine vendor type
  const isAgent = user?.vendorData?.vendorCategory === 'agent';
  const isPropertyOwner = user?.vendorData?.vendorCategory === 'property_owner';
  const [properties, setProperties] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [inquiries, setInquiries] = useState([]);
  const [viewingRequests, setViewingRequests] = useState([]);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [proposalDate, setProposalDate] = useState('');
  const [proposalTime, setProposalTime] = useState('');
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);


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
    const base = [
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
    ];

    // Merge any locally added properties for this vendor (support id or uid keys)
    try {
      const idKey = user ? `vendor_properties_${user.id}` : null;
      const uidKey = user?.uid ? `vendor_properties_${user.uid}` : null;
      const storedById = idKey ? JSON.parse(localStorage.getItem(idKey) || '[]') : [];
      const storedByUid = uidKey ? JSON.parse(localStorage.getItem(uidKey) || '[]') : [];
      const seen = new Set();
      const mergedStored = [...storedById, ...storedByUid].filter(item => {
        const key = String(item?.id ?? '') + '|' + String(item?.title ?? '');
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      setProperties([...(base || []), ...(mergedStored || [])]);
    } catch (e) {
      setProperties(base);
    }

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

  const loadProperties = () => {
    // Mock properties data - in a real app, this would fetch from API
    setProperties([
      {
        id: 1,
        title: "Luxury Apartment in Victoria Island",
        price: 85000000,
        type: "apartment",
        status: "active",
        bedrooms: 3,
        bathrooms: 2,
        area: 120,
        location: "Victoria Island, Lagos",
        image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=300&fit=crop",
        views: 245,
        inquiries: 12,
        favorites: 8,
        dateListed: "2024-01-15",
        lastUpdated: "2024-01-20",
        verificationStatus: 'pending',
        isVerified: false
      },
      {
        id: 2,
        title: "Modern Family House in Lekki",
        price: 125000000,
        type: "house",
        status: "active",
        bedrooms: 4,
        bathrooms: 3,
        area: 200,
        location: "Lekki Phase 1, Lagos",
        image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop",
        views: 189,
        inquiries: 7,
        favorites: 15,
        dateListed: "2024-01-10",
        lastUpdated: "2024-01-18",
        verificationStatus: 'verified',
        isVerified: true
      }
    ]);
  };

  const handleVerificationSuccess = (message) => {
    alert(message);
    setShowVerificationModal(false);
    setSelectedProperty(null);
    // Refresh properties list
    loadProperties();
  };

  const handleRequestVerification = (property) => {
    setSelectedProperty(property);
    setShowVerificationModal(true);
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
              <p className="text-blue-100 text-lg">
                {isAgent 
                  ? `Help clients find their dream properties in ${user?.vendorData?.agentLocation || 'your area'}`
                  : 'Manage your properties and grow your real estate portfolio'
                }
              </p>
              {isAgent && (
                <div className="mt-2 text-blue-200 text-sm">
                  📍 Primary Location: {user?.vendorData?.agentLocation || 'Not specified'}
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">₦{analytics.totalRevenue?.toLocaleString()}</div>
              <div className="text-blue-100">
                {isAgent ? 'Commission Earned' : 'Total Revenue'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="stats-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                {isAgent ? 'Managed Properties' : 'Active Listings'}
              </p>
              <p className="text-2xl font-bold text-gray-900">{analytics.activeListings}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <FaHome className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-green-600 text-sm font-medium">
              {isAgent ? '+3 this month' : '+2 this month'}
            </span>
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
              { id: 'viewings', label: 'Viewing Requests', icon: FaCalendar },
              { id: 'analytics', label: 'Analytics', icon: FaChartLine }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  // Stay within the same component; avoid route changes that could reset auth
                  setActiveTab(tab.id);
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

              {/* Agent Information (for agents only) */}
              {isAgent && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Agent Profile</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Business Information</h4>
                        <div className="space-y-2 text-sm">
                          <p><span className="font-medium">Company:</span> {user?.vendorData?.businessName}</p>
                          <p><span className="font-medium">Location:</span> {user?.vendorData?.agentLocation}</p>
                          <p><span className="font-medium">Experience:</span> {user?.vendorData?.experience}</p>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Contact Information</h4>
                        <div className="space-y-2 text-sm">
                          <p><span className="font-medium">Phone:</span> {user?.phone}</p>
                          <p><span className="font-medium">Email:</span> {user?.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-blue-200">
                      <p className="text-sm text-blue-700">
                        💡 <strong>Tip:</strong> Keep your profile updated to attract more clients in {user?.vendorData?.agentLocation}.
                      </p>
                    </div>
                  </div>
                </div>
              )}

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
                  onClick={() => navigate('/vendor/add-property')}
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
                          <span>{property.bedrooms || property.details?.bedrooms || 0}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <FaBath className="h-3 w-3" />
                          <span>{property.bathrooms || property.details?.bathrooms || 0}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <FaRulerCombined className="h-3 w-3" />
                          <span>{property.area || property.details?.sqft || 0}m²</span>
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
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                          <span>Listed: {new Date(property.dateListed).toLocaleDateString()}</span>
                          <span>Updated: {new Date(property.lastUpdated).toLocaleDateString()}</span>
                        </div>
                        
                        {/* Verification Status and Button */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              property.isVerified 
                                ? 'bg-green-100 text-green-800' 
                                : property.verificationStatus === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : property.verificationStatus === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {property.isVerified 
                                ? '✓ Verified' 
                                : property.verificationStatus === 'pending'
                                ? '⏳ Pending Review'
                                : property.verificationStatus === 'rejected'
                                ? '✗ Rejected'
                                : '⚠️ Not Verified'
                              }
                            </span>
                          </div>
                          
                          {!property.isVerified && (
                            <button
                              onClick={() => handleRequestVerification(property)}
                              className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
                            >
                              {property.verificationStatus === 'pending' ? 'View Status' : 'Get Verified'}
                            </button>
                          )}
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

          {/* Viewing Requests Tab */}
          {activeTab === 'viewings' && (
            <VendorInspectionRequests />
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

      {/* Property Verification Modal */}
      {showVerificationModal && selectedProperty && (
        <PropertyVerification
          property={selectedProperty}
          onClose={() => {
            setShowVerificationModal(false);
            setSelectedProperty(null);
          }}
          onSuccess={handleVerificationSuccess}
        />
      )}
    </div>
  );
};

export default VendorDashboard;

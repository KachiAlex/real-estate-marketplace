import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useProperty, LISTING_TYPES, PROPERTY_TYPES } from '../contexts/PropertyContext';
import { useNotifications } from '../contexts/NotificationContext';
import { FaHome, FaChartLine, FaEye, FaHeart, FaEnvelope, FaCalendar, FaDollarSign, FaUsers, FaPlus, FaEdit, FaTrash, FaImage, FaMapMarkerAlt, FaBed, FaBath, FaRulerCombined, FaTag, FaPhone, FaCheck, FaTimes, FaExclamationTriangle, FaBell } from 'react-icons/fa';
import PropertyVerification from '../components/PropertyVerification';
import VendorInspectionRequests from '../components/VendorInspectionRequests';
import NotificationDropdown from '../components/NotificationDropdown';
import toast from 'react-hot-toast';

const VendorDashboard = () => {
  const { user } = useAuth();
  const { addProperty, deleteProperty } = useProperty();
  const { unreadCount } = useNotifications();
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

  // Load vendor-specific properties from localStorage
  useEffect(() => {
    // Example demo data (not tied to any vendor) kept only for potential future use
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

    // Load only this vendor's properties from localStorage
    try {
      const vendorKey = user ? `vendor_properties_${user.id || user.uid}` : null;
      if (!vendorKey) {
        setProperties([]);
      } else {
        const stored = JSON.parse(localStorage.getItem(vendorKey) || '[]');
        setProperties(stored || []);
      }
    } catch (e) {
      setProperties([]);
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
    // Reload only this vendor's properties from localStorage
    try {
      const vendorKey = user ? `vendor_properties_${user.id || user.uid}` : null;
      if (!vendorKey) {
        setProperties([]);
        return;
      }
      const stored = JSON.parse(localStorage.getItem(vendorKey) || '[]');
      setProperties(stored || []);
    } catch {
      setProperties([]);
    }
  };

  const handleVerificationSuccess = (message) => {
    toast.success(message || 'Verification updated');
    setShowVerificationModal(false);
    setSelectedProperty(null);
    // Refresh properties list
    loadProperties();
  };

  const handleRequestVerification = (property) => {
    setSelectedProperty(property);
    setShowVerificationModal(true);
  };

  const handleDeleteProperty = async (propertyId) => {
    if (!user) {
      toast.error('Please login to manage your properties');
      navigate('/login');
      return;
    }

    const confirmed = window.confirm('Are you sure you want to delete this property?');
    if (!confirmed) return;

    // Update local vendor cache
    try {
      const vendorKey = `vendor_properties_${user.id || user.uid}`;
      const stored = JSON.parse(localStorage.getItem(vendorKey) || '[]');
      const updated = stored.filter((p) => p.id !== propertyId);
      localStorage.setItem(vendorKey, JSON.stringify(updated));
    } catch {
      // ignore localStorage errors
    }

    // Update in-memory list
    setProperties((prev) => prev.filter((p) => p.id !== propertyId));

    // Best-effort backend delete
    await deleteProperty(propertyId);
  };

  const getUserInitials = () => {
    if (user?.displayName) {
      return user.displayName.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'V';
  };

  return (
    <div className="p-6">
      {/* Main Content Area */}
      <div className="w-full">
        {/* Header with Profile and Notifications */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Profile Picture */}
            <div className="w-12 h-12 bg-gradient-to-r from-brand-blue to-blue-600 rounded-full flex items-center justify-center">
              {user?.photoURL || user?.avatar ? (
                <img 
                  src={user.photoURL || user.avatar} 
                  alt="User avatar" 
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <span className="text-lg font-medium text-white">{getUserInitials()}</span>
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {user?.displayName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Vendor Account'}
              </h2>
              <p className="text-sm text-gray-600">
                {isAgent ? 'Real Estate Agent' : 'Property Owner'}
              </p>
            </div>
          </div>
          
          {/* Notification Icon */}
          <div className="relative">
            <NotificationDropdown />
          </div>
        </div>

        {/* Welcome Section */}
        <div className="mb-8" style={{ marginTop: '0px' }}>
          <div className="welcome-section">
            <h1 className="text-2xl font-bold mb-2">Welcome back, {user?.firstName || 'Vendor'}!</h1>
            <p className="text-blue-100 mb-4">
              {isAgent 
                ? `Help clients find their dream properties in ${user?.vendorData?.agentLocation || 'your area'}. Manage your listings, track inquiries, and grow your real estate business.`
                : 'Manage your properties, track inquiries, schedule viewings, and grow your real estate portfolio. List, edit, and monitor all your property listings in one place.'
              }
            </p>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="stats-card">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-white">{analytics.activeListings || 0}</div>
                    <div className="text-blue-200 text-sm">{isAgent ? 'Managed Properties' : 'Active Listings'}</div>
                  </div>
                  <FaHome className="text-blue-300 text-xl" />
                </div>
              </div>
              
              <div className="stats-card">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-white">{analytics.totalViews?.toLocaleString() || 0}</div>
                    <div className="text-blue-200 text-sm">Total Views</div>
                  </div>
                  <FaEye className="text-blue-300 text-xl" />
                </div>
              </div>
              
              <div className="stats-card">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-white">{analytics.totalInquiries || 0}</div>
                    <div className="text-blue-200 text-sm">Inquiries</div>
                  </div>
                  <FaEnvelope className="text-blue-300 text-xl" />
                </div>
              </div>
              
              <div className="stats-card">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-white">{analytics.conversionRate || 0}%</div>
                    <div className="text-blue-200 text-sm">Conversion Rate</div>
                  </div>
                  <FaChartLine className="text-blue-300 text-xl" />
                </div>
              </div>
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
                      title="Add new property"
                  >
                    <div className="p-2 bg-blue-100 rounded-full">
                      <FaPlus className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Add New Property</p>
                      <p className="text-sm text-gray-500">List a new property</p>
                    </div>
                  </button>
                  <button
                    className="flex items-center space-x-3 p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    title="Update existing listings"
                  >
                    <div className="p-2 bg-green-100 rounded-full">
                      <FaEdit className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Update Listings</p>
                      <p className="text-sm text-gray-500">Edit property details</p>
                    </div>
                  </button>
                  <button
                    className="flex items-center space-x-3 p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    title="View performance analytics"
                  >
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
                        <button
                          className="p-2 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-all"
                          title="Edit property"
                          aria-label="Edit property"
                          onClick={() => navigate('/vendor/add-property', { state: { propertyToEdit: property } })}
                        >
                          <FaEdit className="h-4 w-4 text-gray-600" />
                        </button>
                        <button
                          className="p-2 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-all"
                          title="Delete property"
                          aria-label="Delete property"
                          onClick={() => handleDeleteProperty(property.id)}
                        >
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
    </div>
  );
};

export default VendorDashboard;

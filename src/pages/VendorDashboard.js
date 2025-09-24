import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useProperty, LISTING_TYPES, PROPERTY_TYPES } from '../contexts/PropertyContext';
import { FaHome, FaChartLine, FaEye, FaHeart, FaEnvelope, FaCalendar, FaDollarSign, FaUsers, FaPlus, FaEdit, FaTrash, FaImage, FaMapMarkerAlt, FaBed, FaBath, FaRulerCombined, FaTag, FaPhone, FaCheck, FaTimes, FaExclamationTriangle } from 'react-icons/fa';

const VendorDashboard = () => {
  const { user } = useAuth();
  const { addProperty } = useProperty();
  const [activeTab, setActiveTab] = useState('overview');
  const [properties, setProperties] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [inquiries, setInquiries] = useState([]);
  const [showAddProperty, setShowAddProperty] = useState(false);

  const [newTitle, setNewTitle] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newType, setNewType] = useState('apartment');
  const [newListingType, setNewListingType] = useState('for-sale');

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
      {/* Add Property Modal */}
      {showAddProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add New Property</h3>
              <button onClick={() => setShowAddProperty(false)} className="text-gray-500 hover:text-gray-700">
                <FaTimes />
              </button>
            </div>

            <div className="space-y-4">
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
            </div>

            <div className="flex items-center justify-end space-x-2 mt-6">
              <button onClick={() => setShowAddProperty(false)} className="px-4 py-2 rounded border">Cancel</button>
              <button
                onClick={async () => {
                  const res = await addProperty({
                    title: newTitle,
                    price: Number(newPrice),
                    type: newType,
                    listingType: newListingType
                  });
                  if (res.success) {
                    setShowAddProperty(false);
                    setNewTitle('');
                    setNewPrice('');
                    setNewType('apartment');
                    setNewListingType('for-sale');
                  }
                }}
                className="px-4 py-2 rounded bg-brand-blue text-white"
              >
                Save Property
              </button>
            </div>
          </div>
        </div>
      )}

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
              { id: 'inquiries', label: 'Inquiries', icon: FaEnvelope },
              { id: 'analytics', label: 'Analytics', icon: FaChartLine }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
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
                    onClick={() => setShowAddProperty(true)}
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
                  onClick={() => setShowAddProperty(true)}
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
                        {property.location}
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
                <h3 className="text-lg font-semibold text-gray-900">Property Inquiries</h3>
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
            </div>
          )}

          {/* Analytics Tab */}
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
    </div>
  );
};

export default VendorDashboard;

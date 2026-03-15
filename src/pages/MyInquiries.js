import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../services/apiClient';
import { formatCurrency } from '../utils/currency';
import { FaBox, FaSync, FaCheckCircle, FaTimes, FaClock } from 'react-icons/fa';
import toast from 'react-hot-toast';

const MyInquiries = () => {
  const { user } = useAuth();
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchInquiries = async (status = 'all') => {
    setLoading(true);
    try {
      const query = status && status !== 'all' ? `?status=${status}` : '';
      const resp = await apiClient.get(`/inquiries${query}`);
      const payload = resp.data || {};
      const data = Array.isArray(payload?.data) ? payload.data : [];
      console.log('[MyInquiries] Loaded:', data);
      setInquiries(data);
    } catch (err) {
      console.error('Failed to load inquiries', err);
      setInquiries([]);
      toast.error('Failed to load inquiries');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchInquiries(statusFilter);
      toast.success('Inquiries refreshed', { duration: 1500 });
    } catch (err) {
      toast.error('Failed to refresh inquiries');
    } finally {
      setRefreshing(false);
    }
  };

  const handleStatusChange = (newStatus) => {
    setStatusFilter(newStatus);
    fetchInquiries(newStatus);
  };

  const handleCloseInquiry = async (inquiryId) => {
    try {
      await apiClient.put(`/inquiries/${inquiryId}`, { status: 'closed' });
      toast.success('Inquiry closed');
      fetchInquiries(statusFilter);
    } catch (err) {
      console.error('Failed to close inquiry:', err);
      toast.error('Failed to close inquiry');
    }
  };

  useEffect(() => {
    fetchInquiries(statusFilter);
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'responded':
        return <FaCheckCircle className="text-green-500" />;
      case 'closed':
        return <FaTimes className="text-gray-400" />;
      case 'pending':
      default:
        return <FaClock className="text-blue-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'bg-blue-100 text-blue-800',
      responded: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800'
    };
    return variants[status] || variants.pending;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">My Inquiries</h1>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 hover:bg-gray-200 rounded-lg disabled:opacity-50"
              title="Refresh inquiries"
            >
              <FaSync className={`text-xl ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Status Filter */}
          <div className="flex gap-3 flex-wrap">
            {['all', 'pending', 'responded', 'closed'].map((status) => (
              <button
                key={status}
                onClick={() => handleStatusChange(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  statusFilter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-500'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Inquiries List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading inquiries...</p>
            </div>
          ) : inquiries.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <FaBox className="mx-auto mb-4 text-4xl text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No inquiries found</h3>
              <p className="text-gray-600">
                {statusFilter === 'all'
                  ? "You haven't sent any inquiries yet."
                  : `No ${statusFilter} inquiries yet.`}
              </p>
            </div>
          ) : (
            inquiries.map((inquiry) => (
              <div key={inquiry.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="flex gap-4 p-6">
                  {/* Property Image */}
                  <div className="flex-shrink-0">
                    <img
                      src={inquiry.propertyImage || 'https://via.placeholder.com/120?text=No+Image'}
                      alt={inquiry.propertyTitle}
                      className="h-24 w-24 object-cover rounded-lg"
                    />
                  </div>

                  {/* Inquiry Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {inquiry.propertyTitle}
                        </h3>
                        <p className="text-xl font-bold text-blue-600 mt-1">
                          {formatCurrency(inquiry.propertyPrice)}
                        </p>
                      </div>
                      <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(inquiry.status)}`}>
                        {getStatusIcon(inquiry.status)}
                        <span>{inquiry.status.charAt(0).toUpperCase() + inquiry.status.slice(1)}</span>
                      </div>
                    </div>

                    {/* Inquiry Info */}
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Type:</span> {inquiry.inquiryType}
                      </div>
                      <div>
                        <span className="font-medium">Sent:</span> {formatDate(inquiry.createdAt)}
                      </div>
                    </div>

                    {/* Message Preview */}
                    {inquiry.message && (
                      <div className="mt-3 p-2 bg-gray-50 rounded border-l-2 border-blue-500">
                        <p className="text-sm text-gray-700 line-clamp-2">{inquiry.message}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0 flex flex-col gap-2 justify-center">
                    {inquiry.status !== 'closed' && (
                      <button
                        onClick={() => handleCloseInquiry(inquiry.id)}
                        className="px-3 py-1 text-sm font-medium text-red-600 hover:bg-red-50 rounded border border-red-300 transition-colors"
                      >
                        Close
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MyInquiries;


  const handleScheduleViewing = (property) => {
    if (!user) {
      toast.error('Please login to schedule viewings');
      navigate('/');
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

    if (!user || !user.id || !user.firstName || !user.lastName || !user.email) {
      toast.error('User information incomplete. Please refresh and try again.');
      return;
    }

    // Create viewing request data
    const viewingRequest = {
      id: `viewing-${Date.now()}`,
      propertyId: selectedProperty.id,
      propertyTitle: selectedProperty.title,
      propertyLocation: selectedProperty.location,
      userId: user?.id,
      userName: `${user?.firstName || ''} ${user?.lastName || ''}`,
      userEmail: user?.email || '',
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
    
    // Dispatch event to notify Dashboard and other components
    window.dispatchEvent(new CustomEvent('viewingsUpdated', {
      detail: { viewingRequest, action: 'created' }
    }));
    
    // Also trigger a storage event for cross-tab synchronization
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'viewingRequests',
      newValue: JSON.stringify(existingRequests)
    }));
    
    toast.success(`Viewing request sent for "${selectedProperty.title}"! The vendor will confirm or suggest an alternative time.`);
    
    // Reset modal
    setShowScheduleModal(false);
    setSelectedProperty(null);
    setSelectedDate('');
    setSelectedTime('');
    setViewingMessage('');
  };

  // Load inquiries from localStorage
  useEffect(() => {
    if (!user || !user.id) {
      setLoading(false);
      return;
    }

    const loadInquiries = () => {
      try {
        const allInquiries = JSON.parse(localStorage.getItem('inquiries') || '[]');
        // Filter inquiries for current user
        const userInquiries = allInquiries.filter(
          inq => inq.userId === user.id || inq.buyerId === user.id
        );

        // Transform inquiries to match the expected format
        const transformedInquiries = userInquiries.map(inq => ({
          id: inq.id,
          property: {
            id: inq.propertyId,
            title: inq.propertyTitle,
            location: inq.propertyLocation,
            price: inq.propertyPrice,
            bedrooms: inq.propertyBedrooms,
            bathrooms: inq.propertyBathrooms,
            area: inq.propertyArea,
            image: inq.propertyImage || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=500&h=300&fit=crop'
          },
          message: inq.message,
          status: inq.status === 'new' || inq.status === 'contacted' ? 'pending' : 
                  inq.status === 'responded' ? 'responded' : 
                  inq.status === 'closed' ? 'closed' : 'pending',
          date: inq.createdAt || inq.date,
          agent: {
            name: inq.vendorName || 'Property Vendor',
            phone: inq.vendorPhone || '+234-XXX-XXXX',
            email: inq.vendorEmail || '',
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(inq.vendorName || 'Vendor')}&background=random`
          },
          responses: inq.responses || []
        }));

        // Sort by date (newest first)
        transformedInquiries.sort((a, b) => new Date(b.date) - new Date(a.date));

        setInquiries(transformedInquiries);
        setLoading(false);
      } catch (error) {
        console.error('Error loading inquiries:', error);
        setInquiries([]);
        setLoading(false);
      }
    };

    loadInquiries();

    // Listen for inquiries updates
    const handleInquiriesUpdate = () => {
      loadInquiries();
    };

    window.addEventListener('inquiriesUpdated', handleInquiriesUpdate);
    window.addEventListener('storage', (e) => {
      if (e.key === 'inquiries') {
        loadInquiries();
      }
    });

    return () => {
      window.removeEventListener('inquiriesUpdated', handleInquiriesUpdate);
    };
  }, [user]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
      case 'new':
      case 'contacted': return 'bg-yellow-100 text-yellow-800';
      case 'responded': return 'bg-blue-100 text-blue-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <FaClock className="text-yellow-600" />;
      case 'responded': return <FaReply className="text-blue-600" />;
      case 'closed': return <FaCheckCircle className="text-gray-600" />;
      default: return <FaQuestionCircle className="text-gray-600" />;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending':
      case 'new':
      case 'contacted': return 'Awaiting Response';
      case 'responded': return 'Responded';
      case 'closed': return 'Closed';
      default: return 'Unknown';
    }
  };

  const filteredAndSortedInquiries = inquiries
    .filter(inquiry => {
      if (filterBy === 'all') return true;
      // Map statuses for filtering
      const statusMap = {
        'pending': ['pending', 'new', 'contacted'],
        'responded': ['responded'],
        'closed': ['closed']
      };
      return statusMap[filterBy]?.includes(inquiry.status) || inquiry.status === filterBy;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.date) - new Date(a.date);
      }
      return 0;
    });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Inquiries</h1>
        <p className="text-gray-600">
          Track your property inquiries and communicate with agents
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FaQuestionCircle className="text-brand-blue text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Inquiries</p>
              <p className="text-2xl font-bold text-gray-900">{inquiries.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <FaClock className="text-yellow-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {inquiries.filter(i => i.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <FaReply className="text-green-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Responded</p>
              <p className="text-2xl font-bold text-gray-900">
                {inquiries.filter(i => i.status === 'responded').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-gray-100 rounded-lg">
              <FaCheckCircle className="text-gray-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Closed</p>
              <p className="text-2xl font-bold text-gray-900">
                {inquiries.filter(i => i.status === 'closed').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-blue focus:border-transparent"
            >
              <option value="all">All Inquiries</option>
              <option value="pending">Pending</option>
              <option value="responded">Responded</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          
          <div className="text-sm text-gray-600">
            Showing {filteredAndSortedInquiries.length} of {inquiries.length} inquiries
          </div>
        </div>
      </div>

      {/* Inquiries List */}
      {filteredAndSortedInquiries.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FaQuestionCircle className="text-gray-300 text-6xl mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Inquiries Found</h3>
          <p className="text-gray-600 mb-6">
            {filterBy === 'all' 
              ? "You haven't made any inquiries yet. Start browsing properties to ask questions!"
              : `No ${filterBy} inquiries found.`
            }
          </p>
          <Link 
            to="/properties" 
            className="btn-primary inline-flex items-center"
          >
            Browse Properties
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredAndSortedInquiries.map((inquiry) => (
            <div key={inquiry.id} className="bg-white rounded-lg shadow overflow-hidden">
              {/* Inquiry Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={`tag ${getStatusColor(inquiry.status)} flex items-center space-x-1`}>
                        {getStatusIcon(inquiry.status)}
                        <span>{getStatusLabel(inquiry.status)}</span>
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatDate(inquiry.date)}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {inquiry.property.title}
                    </h3>
                    <p className="text-gray-600 mb-4">{inquiry.message}</p>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Link
                      to={`/property/${inquiry.property.id}`}
                      className="btn-outline py-2 px-4"
                    >
                      <FaEye className="inline mr-1" />
                      View Property
                    </Link>
                  </div>
                </div>
              </div>

              {/* Property Details */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center space-x-6">
                  <img
                    src={inquiry.property.image}
                    alt={inquiry.property.title}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <FaMapMarkerAlt />
                        <span>{inquiry.property.location}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <FaBed />
                        <span>{inquiry.property.bedrooms} Bedrooms</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <FaBath />
                        <span>{inquiry.property.bathrooms} Bathrooms</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <FaRuler />
                        <span>{inquiry.property.area}m²</span>
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className="text-xl font-bold text-gray-900">
                        ₦{(inquiry.property?.price || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Agent Info */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center space-x-4">
                  <img
                    src={inquiry.agent.avatar}
                    alt={inquiry.agent.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{inquiry.agent.name}</h4>
                    <p className="text-sm text-gray-600">Property Agent</p>
                  </div>
                  <div className="flex space-x-2">
                    <a
                      href={`tel:${inquiry.agent.phone}`}
                      className="bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <FaPhone className="inline mr-1" />
                      Call
                    </a>
                    <a
                      href={`mailto:${inquiry.agent.email}`}
                      className="bg-blue-100 text-blue-700 py-2 px-4 rounded-lg hover:bg-blue-200 transition-colors"
                    >
                      <FaEnvelope className="inline mr-1" />
                      Email
                    </a>
                  </div>
                  
                  {/* Property Purchase Actions */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handlePurchaseProperty(inquiry.property)}
                        className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                      >
                        <FaShoppingCart className="mr-2" />
                        Buy Property - ₦{(inquiry.property?.price || 0).toLocaleString()}
                      </button>
                      <button 
                        onClick={() => handleScheduleViewing(inquiry.property)}
                        className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center"
                      >
                        <FaCalendar className="mr-2" />
                        Schedule Viewing
                      </button>
                      <Link
                        to={`/property/${inquiry.property.id}`}
                        className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center"
                      >
                        <FaEye className="mr-2" />
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Responses */}
              {inquiry.responses.length > 0 && (
                <div className="p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Conversation</h4>
                  <div className="space-y-4">
                    {inquiry.responses.map((response) => (
                      <div
                        key={response.id}
                        className={`p-4 rounded-lg ${
                          response.from === 'user' 
                            ? 'bg-blue-50 ml-8' 
                            : 'bg-gray-50 mr-8'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">
                            {response.from === 'user' ? 'You' : inquiry.agent.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDate(response.date)}
                          </span>
                        </div>
                        <p className="text-gray-800">{response.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

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

export default MyInquiries;


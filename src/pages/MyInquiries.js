import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaQuestionCircle, FaPhone, FaEnvelope, FaCalendar, FaMapMarkerAlt, FaBed, FaBath, FaRuler, FaEye, FaReply, FaClock, FaCheckCircle, FaTimesCircle, FaExclamationTriangle } from 'react-icons/fa';

const MyInquiries = () => {
  const { user } = useAuth();
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterBy, setFilterBy] = useState('all');
  const [sortBy, setSortBy] = useState('date');

  // Mock inquiries data
  useEffect(() => {
    const mockInquiries = [
      {
        id: 1,
        property: {
          id: 1,
          title: "Luxury 4-Bedroom Villa in Victoria Island",
          location: "Victoria Island, Lagos",
          price: 250000000,
          bedrooms: 4,
          bathrooms: 5,
          area: 450,
          image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=500&h=300&fit=crop"
        },
        message: "I'm interested in viewing this property. Could you please provide more details about the amenities and schedule a viewing?",
        status: "pending",
        date: "2024-01-15T10:30:00Z",
        agent: {
          name: "Sarah Johnson",
          phone: "+234 801 234 5678",
          email: "sarah@naijaluxury.com",
          avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face"
        },
        responses: [
          {
            id: 1,
            message: "Thank you for your interest! I'd be happy to show you this beautiful villa. The property includes a private pool, gym, and 24/7 security. I'm available for viewings this weekend. Would Saturday 2 PM work for you?",
            date: "2024-01-15T14:20:00Z",
            from: "agent"
          }
        ]
      },
      {
        id: 2,
        property: {
          id: 2,
          title: "Modern 3-Bedroom Apartment in Ikoyi",
          location: "Ikoyi, Lagos",
          price: 180000000,
          bedrooms: 3,
          bathrooms: 3,
          area: 320,
          image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=500&h=300&fit=crop"
        },
        message: "What are the maintenance fees and what's included in the building amenities?",
        status: "responded",
        date: "2024-01-12T09:15:00Z",
        agent: {
          name: "Michael Adebayo",
          phone: "+234 802 345 6789",
          email: "michael@naijaluxury.com",
          avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
        },
        responses: [
          {
            id: 1,
            message: "The monthly maintenance fee is ₦150,000 and includes: 24/7 security, generator backup, swimming pool, gym, children's playground, and regular maintenance of common areas.",
            date: "2024-01-12T11:45:00Z",
            from: "agent"
          },
          {
            id: 2,
            message: "Thank you for the information. I'm also interested in the parking situation - how many parking spaces are allocated per unit?",
            date: "2024-01-12T15:30:00Z",
            from: "user"
          },
          {
            id: 3,
            message: "Each unit comes with 2 covered parking spaces. There's also additional visitor parking available.",
            date: "2024-01-12T16:10:00Z",
            from: "agent"
          }
        ]
      },
      {
        id: 3,
        property: {
          id: 3,
          title: "Elegant 2-Bedroom Penthouse in Lekki",
          location: "Lekki Phase 1, Lagos",
          price: 120000000,
          bedrooms: 2,
          bathrooms: 2,
          area: 280,
          image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=500&h=300&fit=crop"
        },
        message: "Is this property still available? I'm looking to make an offer.",
        status: "closed",
        date: "2024-01-08T16:45:00Z",
        agent: {
          name: "Grace Okafor",
          phone: "+234 803 456 7890",
          email: "grace@naijaluxury.com",
          avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face"
        },
        responses: [
          {
            id: 1,
            message: "I'm sorry, but this property was sold yesterday. However, I have a similar penthouse in the same building that just became available. Would you like me to send you the details?",
            date: "2024-01-08T17:20:00Z",
            from: "agent"
          }
        ]
      },
      {
        id: 4,
        property: {
          id: 4,
          title: "Spacious 5-Bedroom Duplex in Abuja",
          location: "Asokoro, Abuja",
          price: 320000000,
          bedrooms: 5,
          bathrooms: 6,
          area: 580,
          image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=500&h=300&fit=crop"
        },
        message: "I'm interested in this property for investment purposes. What's the rental yield potential in this area?",
        status: "pending",
        date: "2024-01-05T13:20:00Z",
        agent: {
          name: "David Okonkwo",
          phone: "+234 804 567 8901",
          email: "david@naijaluxury.com",
          avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
        },
        responses: []
      }
    ];

    setTimeout(() => {
      setInquiries(mockInquiries);
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
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
      case 'pending': return 'Awaiting Response';
      case 'responded': return 'Responded';
      case 'closed': return 'Closed';
      default: return 'Unknown';
    }
  };

  const filteredAndSortedInquiries = inquiries
    .filter(inquiry => {
      if (filterBy === 'all') return true;
      return inquiry.status === filterBy;
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
                        ₦{inquiry.property.price.toLocaleString()}
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
                      className="btn-outline py-2 px-4"
                    >
                      <FaPhone className="inline mr-1" />
                      Call
                    </a>
                    <a
                      href={`mailto:${inquiry.agent.email}`}
                      className="btn-primary py-2 px-4"
                    >
                      <FaEnvelope className="inline mr-1" />
                      Email
                    </a>
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
    </div>
  );
};

export default MyInquiries;

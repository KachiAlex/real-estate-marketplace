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


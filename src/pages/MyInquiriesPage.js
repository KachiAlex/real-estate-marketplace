import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaFilter, FaSort, FaTrash, FaEye } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useInquiries } from '../hooks/useInquiries';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/Modal';

/**
 * MyInquiriesPage Component
 * Displays user's property inquiries with filtering, sorting, and deletion
 */
const MyInquiriesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { inquiries, loading, fetchInquiries, deleteInquiry } = useInquiries();

  // Filter and sort state
  const [filteredInquiries, setFilteredInquiries] = useState([]);
  const [sortBy, setSortBy] = useState('createdAt');
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Fetch inquiries on mount
  useEffect(() => {
    if (user) {
      fetchInquiries();
    } else {
      navigate('/auth/login');
    }
  }, [user, fetchInquiries, navigate]);

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...inquiries];

    // Filter by status
    if (filterStatus) {
      filtered = filtered.filter(inq => inq.status === filterStatus);
    }

    // Sort
    switch (sortBy) {
      case 'createdAt-newest':
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'createdAt-oldest':
        filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      default:
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    setFilteredInquiries(filtered);
    setCurrentPage(1);
  }, [inquiries, sortBy, filterStatus]);

  // Pagination
  const totalPages = Math.ceil(filteredInquiries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedInquiries = filteredInquiries.slice(startIndex, startIndex + itemsPerPage);

  const handleDeleteInquiry = async (inquiryId) => {
    if (window.confirm('Are you sure you want to delete this inquiry?')) {
      const success = await deleteInquiry(inquiryId);
      if (success) {
        toast.success('Inquiry deleted successfully');
        setShowDetailModal(false);
      }
    }
  };

  const handleViewDetails = (inquiry) => {
    setSelectedInquiry(inquiry);
    setShowDetailModal(true);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please login to view your inquiries</p>
          <button
            onClick={() => navigate('/auth/login')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Inquiries</h1>
          <p className="text-gray-600">
            {filteredInquiries.length} inquiry{filteredInquiries.length !== 1 ? 'ies' : ''}
          </p>
        </div>

        {/* Filters and Sort */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaFilter className="inline mr-2" />
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="responded">Responded</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaSort className="inline mr-2" />
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="createdAt-newest">Newest First</option>
                <option value="createdAt-oldest">Oldest First</option>
              </select>
            </div>

            {/* Reset Button */}
            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilterStatus('');
                  setSortBy('createdAt');
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        {/* Inquiries List */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : paginatedInquiries.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <FaEye className="text-4xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Inquiries</h3>
            <p className="text-gray-600">
              {filteredInquiries.length === 0 && inquiries.length === 0
                ? "You haven't made any inquiries yet."
                : 'No inquiries match your filters.'}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {paginatedInquiries.map((inquiry) => (
                <div key={inquiry.inquiryId} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        {inquiry.propertyTitle}
                      </h3>
                      <p className="text-gray-600 mb-3 line-clamp-2">
                        {inquiry.message}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>
                          {new Date(inquiry.createdAt).toLocaleDateString()}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          inquiry.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          inquiry.status === 'responded' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {inquiry.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleViewDetails(inquiry)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View details"
                      >
                        <FaEye />
                      </button>
                      <button
                        onClick={() => handleDeleteInquiry(inquiry.inquiryId)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete inquiry"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-4 py-2 rounded-lg ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedInquiry && (
        <Modal onClose={() => setShowDetailModal(false)}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {selectedInquiry.propertyTitle}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                  {selectedInquiry.message}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                  selectedInquiry.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  selectedInquiry.status === 'responded' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {selectedInquiry.status}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <p className="text-gray-600">
                  {new Date(selectedInquiry.createdAt).toLocaleString()}
                </p>
              </div>
              {selectedInquiry.responses && selectedInquiry.responses.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Responses
                  </label>
                  <div className="space-y-2">
                    {selectedInquiry.responses.map((response, idx) => (
                      <div key={idx} className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-600">{response.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(response.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowDetailModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleDeleteInquiry(selectedInquiry.inquiryId);
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
              >
                Delete
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default MyInquiriesPage;

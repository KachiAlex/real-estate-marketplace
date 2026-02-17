import React, { useState } from 'react';
import { 
  FaSearch, 
  FaFilter, 
  FaClock, 
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaEye,
  FaGavel,
  FaDollarSign,
  FaUser,
  FaHome,
  FaCalendar
} from 'react-icons/fa';

const AdminDisputesManagement = ({ disputes }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [resolutionType, setResolutionType] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  // Enhanced mock disputes data with more details
  const enhancedDisputes = disputes.map(dispute => ({
    ...dispute,
    propertyTitle: dispute.propertyTitle || 'Luxury Villa in Lekki',
    buyerName: dispute.buyerName || 'John Doe',
    buyerEmail: dispute.buyerEmail || 'buyer@example.com',
    sellerName: dispute.sellerName || 'Jane Smith',
    sellerEmail: dispute.sellerEmail || 'seller@example.com',
    reason: dispute.reason || 'property_condition',
    description: dispute.description || 'Property condition does not match the description provided.',
    amount: dispute.amount || 5000000,
    createdAt: dispute.createdAt || new Date().toISOString(),
    evidence: dispute.evidence || [],
    priority: dispute.priority || 'high'
  }));

  const filteredDisputes = enhancedDisputes.filter(dispute => {
    const matchesSearch = 
      dispute.propertyTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispute.buyerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispute.sellerName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || dispute.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const getDisputeReasonLabel = (reason) => {
    const reasons = {
      'property_condition': 'Property Condition',
      'title_issues': 'Title Issues',
      'seller_non_compliance': 'Seller Non-Compliance',
      'buyer_non_compliance': 'Buyer Non-Compliance',
      'payment_issues': 'Payment Issues',
      'other': 'Other'
    };
    return reasons[reason] || reason;
  };

  const getDisputePriorityColor = (priority) => {
    const colors = {
      'high': 'bg-red-100 text-red-800 border-red-300',
      'medium': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'low': 'bg-blue-100 text-blue-800 border-blue-300'
    };
    return colors[priority] || colors.medium;
  };

  const handleResolve = (dispute) => {
    setSelectedDispute(dispute);
    setShowResolutionModal(true);
  };

  const handleConfirmResolution = () => {
    if (!resolutionType || !adminNotes.trim()) {
      alert('Please select a resolution type and provide admin notes');
      return;
    }

    // Simulate resolution
    console.log('Resolving dispute:', {
      disputeId: selectedDispute.id,
      resolutionType,
      adminNotes
    });

    alert(`Dispute resolved! Resolution: ${resolutionType}`);
    setShowResolutionModal(false);
    setResolutionType('');
    setAdminNotes('');
    setSelectedDispute(null);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const config = {
      'pending': { icon: FaClock, color: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
      'under_review': { icon: FaExclamationTriangle, color: 'bg-blue-100 text-blue-800', text: 'Under Review' },
      'resolved': { icon: FaCheckCircle, color: 'bg-green-100 text-green-800', text: 'Resolved' },
      'rejected': { icon: FaTimesCircle, color: 'bg-red-100 text-red-800', text: 'Rejected' }
    };

    const { icon: Icon, color, text } = config[status] || config.pending;

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${color}`}>
        <Icon className="h-3 w-3" />
        <span>{text}</span>
      </span>
    );
  };

  if (loading) {
    return <div className="h-64 flex items-center justify-center text-sm text-gray-500">Loading disputes...</div>;
  }
  if (error) {
    return <div className="h-64 flex items-center justify-center text-sm text-red-500">{error}</div>;
  }
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dispute Management</h2>
          <p className="text-gray-600 mt-1">Review and resolve transaction disputes</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="bg-yellow-50 px-4 py-2 rounded-lg border border-yellow-200">
            <span className="text-yellow-800 font-semibold">
              {filteredDisputes.filter(d => d.status === 'pending').length} Pending
            </span>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by property, buyer, or seller..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Disputes List */}
      {filteredDisputes.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FaExclamationTriangle className="text-4xl text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Disputes Found</h3>
          <p className="text-gray-500">No disputes match your search criteria.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDisputes.map((dispute) => (
            <div key={dispute.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getDisputePriorityColor(dispute.priority)}`}>
                        {dispute.priority.toUpperCase()} PRIORITY
                      </span>
                      {getStatusBadge(dispute.status)}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{dispute.propertyTitle}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center">
                        <FaDollarSign className="mr-1" />
                        {formatCurrency(dispute.amount)}
                      </span>
                      <span className="flex items-center">
                        <FaCalendar className="mr-1" />
                        {formatDate(dispute.createdAt)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleResolve(dispute)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                  >
                    <FaGavel />
                    <span>Resolve</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                      <FaUser className="text-blue-600" />
                      <span>Buyer</span>
                    </div>
                    <p className="text-gray-900 font-medium">{dispute.buyerName}</p>
                    <p className="text-sm text-gray-600">{dispute.buyerEmail}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                      <FaUser className="text-green-600" />
                      <span>Seller</span>
                    </div>
                    <p className="text-gray-900 font-medium">{dispute.sellerName}</p>
                    <p className="text-sm text-gray-600">{dispute.sellerEmail}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                    <FaExclamationTriangle className="text-orange-600" />
                    <span>Dispute Reason</span>
                  </div>
                  <p className="text-gray-900 mb-2">
                    <span className="font-medium">{getDisputeReasonLabel(dispute.reason)}</span>
                  </p>
                  <p className="text-gray-600 text-sm">{dispute.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Resolution Modal */}
      {showResolutionModal && selectedDispute && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h3 className="text-xl font-bold text-gray-900">Resolve Dispute</h3>
              <p className="text-gray-600 mt-1">Property: {selectedDispute.propertyTitle}</p>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Resolution Type *
                </label>
                <select
                  value={resolutionType}
                  onChange={(e) => setResolutionType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select resolution...</option>
                  <option value="buyer_favor">Rule in Buyer's Favor</option>
                  <option value="seller_favor">Rule in Seller's Favor</option>
                  <option value="partial_refund">Partial Refund to Buyer</option>
                  <option value="full_refund">Full Refund to Buyer</option>
                  <option value="reject">Reject Dispute</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Notes *
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Explain your decision and any additional context..."
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <FaExclamationTriangle className="text-yellow-600 mr-2 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">Important:</p>
                    <p>This action is final and will notify both parties of the resolution.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowResolutionModal(false);
                  setResolutionType('');
                  setAdminNotes('');
                  setSelectedDispute(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmResolution}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Confirm Resolution
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDisputesManagement;

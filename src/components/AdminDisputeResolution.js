import React, { useState } from 'react';
import { useEscrow } from '../contexts/EscrowContext';
import { 
  FaCheck, 
  FaTimes, 
  FaExclamationTriangle,
  FaUser,
  FaHome,
  FaDollarSign,
  FaCalendarAlt,
  FaFileAlt,
  FaCamera,
  FaGavel,
  FaShieldAlt,
  FaClock
} from 'react-icons/fa';

const AdminDisputeResolution = ({ escrowTransaction, onClose }) => {
  const { 
    releaseEscrowFunds, 
    refundEscrowFunds, 
    loading 
  } = useEscrow();
  
  const [resolution, setResolution] = useState(null); // 'release' or 'refund'
  const [adminNotes, setAdminNotes] = useState('');
  const [investigationNotes, setInvestigationNotes] = useState('');

  const handleReleaseFunds = async () => {
    try {
      const result = await releaseEscrowFunds(escrowTransaction.id, 'admin_approved');
      if (result) {
        onClose();
      }
    } catch (error) {
      console.error('Error releasing funds:', error);
    }
  };

  const handleRefundFunds = async () => {
    try {
      const result = await refundEscrowFunds(escrowTransaction.id, adminNotes);
      if (result) {
        onClose();
      }
    } catch (error) {
      console.error('Error refunding funds:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Dispute Resolution</h2>
              <p className="text-gray-600 mt-1">Admin review and resolution of escrow dispute</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FaTimes className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Dispute Alert */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <FaExclamationTriangle className="text-red-600 h-6 w-6" />
              <div>
                <p className="text-sm font-medium text-red-900">Dispute Filed</p>
                <p className="text-sm text-red-800">
                  This transaction requires admin review and resolution
                </p>
              </div>
            </div>
          </div>

          {/* Transaction Details */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <FaHome className="text-gray-400 h-5 w-5" />
                  <div>
                    <p className="text-sm text-gray-500">Property</p>
                    <p className="font-medium text-gray-900">{escrowTransaction.propertyTitle}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <FaUser className="text-gray-400 h-5 w-5" />
                  <div>
                    <p className="text-sm text-gray-500">Buyer</p>
                    <p className="font-medium text-gray-900">{escrowTransaction.buyerName}</p>
                    <p className="text-xs text-gray-500">{escrowTransaction.buyerEmail}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <FaUser className="text-gray-400 h-5 w-5" />
                  <div>
                    <p className="text-sm text-gray-500">Vendor</p>
                    <p className="font-medium text-gray-900">{escrowTransaction.sellerName}</p>
                    <p className="text-xs text-gray-500">{escrowTransaction.sellerEmail}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <FaDollarSign className="text-gray-400 h-5 w-5" />
                  <div>
                    <p className="text-sm text-gray-500">Amount in Escrow</p>
                    <p className="font-medium text-gray-900">₦{escrowTransaction.amount.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <FaCalendarAlt className="text-gray-400 h-5 w-5" />
                  <div>
                    <p className="text-sm text-gray-500">Payment Date</p>
                    <p className="font-medium text-gray-900">
                      {new Date(escrowTransaction.paymentDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <FaClock className="text-gray-400 h-5 w-5" />
                  <div>
                    <p className="text-sm text-gray-500">Dispute Filed</p>
                    <p className="font-medium text-gray-900">
                      {new Date(escrowTransaction.disputeDate || escrowTransaction.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dispute Information */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Dispute Information</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Dispute Reason</p>
                <p className="text-sm text-gray-900 capitalize">
                  {escrowTransaction.disputeReason?.replace('_', ' ') || 'Not specified'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Buyer's Description</p>
                <p className="text-sm text-gray-900">
                  {escrowTransaction.disputeDescription || 'No description provided'}
                </p>
              </div>
              {escrowTransaction.disputeEvidence && escrowTransaction.disputeEvidence.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Evidence Provided</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {escrowTransaction.disputeEvidence.map((evidence, index) => (
                      <div key={index} className="border border-gray-200 rounded p-2">
                        <FaCamera className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                        <p className="text-xs text-gray-600 text-center">{evidence.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Investigation Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Investigation Notes
            </label>
            <textarea
              value={investigationNotes}
              onChange={(e) => setInvestigationNotes(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
              placeholder="Document your investigation findings, communication with parties, and any relevant details..."
            />
          </div>

          {/* Resolution Decision */}
          {!resolution && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Resolution Decision</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setResolution('release')}
                  className="p-6 border-2 border-green-200 bg-green-50 rounded-lg text-left hover:bg-green-100 transition-colors"
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <FaCheck className="text-green-600 h-6 w-6" />
                    <h4 className="text-lg font-semibold text-green-900">Release to Vendor</h4>
                  </div>
                  <p className="text-sm text-green-800">
                    The dispute is not valid or the vendor has fulfilled their obligations. 
                    Release funds to the vendor.
                  </p>
                </button>

                <button
                  onClick={() => setResolution('refund')}
                  className="p-6 border-2 border-red-200 bg-red-50 rounded-lg text-left hover:bg-red-100 transition-colors"
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <FaTimes className="text-red-600 h-6 w-6" />
                    <h4 className="text-lg font-semibold text-red-900">Refund to Buyer</h4>
                  </div>
                  <p className="text-sm text-red-800">
                    The dispute is valid and the vendor has not fulfilled their obligations. 
                    Refund funds to the buyer.
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* Release Funds Form */}
          {resolution === 'release' && (
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <FaCheck className="text-green-600 h-6 w-6" />
                <h3 className="text-lg font-semibold text-gray-900">Release Funds to Vendor</h3>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <FaShieldAlt className="text-green-600 h-5 w-5 mt-1" />
                  <div>
                    <p className="text-sm font-medium text-green-900">Fund Release</p>
                    <p className="text-sm text-green-800 mt-1">
                      This will release ₦{escrowTransaction.amount.toLocaleString()} to the vendor. 
                      The buyer will be notified of this decision.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Notes (Optional)
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                  placeholder="Add any notes about the decision..."
                />
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => setResolution(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleReleaseFunds}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Releasing...' : 'Release Funds to Vendor'}
                </button>
              </div>
            </div>
          )}

          {/* Refund Funds Form */}
          {resolution === 'refund' && (
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <FaTimes className="text-red-600 h-6 w-6" />
                <h3 className="text-lg font-semibold text-gray-900">Refund Funds to Buyer</h3>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <FaExclamationTriangle className="text-red-600 h-5 w-5 mt-1" />
                  <div>
                    <p className="text-sm font-medium text-red-900">Fund Refund</p>
                    <p className="text-sm text-red-800 mt-1">
                      This will refund ₦{escrowTransaction.amount.toLocaleString()} to the buyer. 
                      The vendor will be notified of this decision.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Refund Reason *
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                  placeholder="Explain why the refund is being issued..."
                  required
                />
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => setResolution(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleRefundFunds}
                  disabled={loading || !adminNotes.trim()}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Processing Refund...' : 'Refund Funds to Buyer'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDisputeResolution;

import React, { useState } from 'react';
import { useEscrow } from '../contexts/EscrowContext';
import { 
  FaCheck, 
  FaTimes, 
  FaClock, 
  FaHome, 
  FaExclamationTriangle,
  FaCamera,
  FaFileAlt,
  FaUser,
  FaCalendarAlt,
  FaShieldAlt
} from 'react-icons/fa';

const PropertyConfirmation = ({ escrowTransaction, onClose }) => {
  const { 
    confirmPropertyPossession, 
    disputeProperty, 
    getEscrowTimer,
    loading 
  } = useEscrow();
  
  const [action, setAction] = useState(null); // 'confirm' or 'dispute'
  const [confirmationData, setConfirmationData] = useState({
    satisfaction: '',
    condition: '',
    amenities: [],
    notes: '',
    photos: []
  });
  const [disputeData, setDisputeData] = useState({
    reason: '',
    description: '',
    evidence: []
  });

  const timer = getEscrowTimer(escrowTransaction.confirmationDeadline);

  const handleConfirm = async () => {
    try {
      const result = await confirmPropertyPossession(escrowTransaction.id, confirmationData);
      if (result) {
        onClose();
      }
    } catch (error) {
      console.error('Error confirming property:', error);
    }
  };

  const handleDispute = async () => {
    try {
      const result = await disputeProperty(escrowTransaction.id, disputeData);
      if (result) {
        onClose();
      }
    } catch (error) {
      console.error('Error filing dispute:', error);
    }
  };

  const satisfactionOptions = [
    { value: 'excellent', label: 'Excellent - Property exceeds expectations' },
    { value: 'good', label: 'Good - Property meets expectations' },
    { value: 'satisfactory', label: 'Satisfactory - Property is acceptable' },
    { value: 'poor', label: 'Poor - Property has significant issues' }
  ];

  const conditionOptions = [
    { value: 'excellent', label: 'Excellent condition' },
    { value: 'good', label: 'Good condition' },
    { value: 'fair', label: 'Fair condition' },
    { value: 'poor', label: 'Poor condition' }
  ];

  const disputeReasons = [
    { value: 'property_condition', label: 'Property condition differs from description' },
    { value: 'missing_amenities', label: 'Missing amenities or features' },
    { value: 'legal_issues', label: 'Legal or title issues' },
    { value: 'access_problems', label: 'Access or location problems' },
    { value: 'other', label: 'Other issues' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Property Possession Confirmation</h2>
              <p className="text-gray-600 mt-1">Confirm your property possession or file a dispute</p>
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
          {/* Timer Alert */}
          {!timer.expired && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <FaClock className="text-blue-600 h-5 w-5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Confirmation Deadline</p>
                  <p className="text-sm text-blue-800">
                    {timer.days} days, {timer.hours} hours, {timer.minutes} minutes remaining
                  </p>
                </div>
              </div>
            </div>
          )}

          {timer.expired && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <FaExclamationTriangle className="text-yellow-600 h-5 w-5" />
                <div>
                  <p className="text-sm font-medium text-yellow-900">Deadline Expired</p>
                  <p className="text-sm text-yellow-800">
                    The confirmation deadline has passed. Funds will be automatically released to the vendor.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Property Details */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Details</h3>
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
                    <p className="text-sm text-gray-500">Vendor</p>
                    <p className="font-medium text-gray-900">{escrowTransaction.sellerName}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
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
                  <FaShieldAlt className="text-gray-400 h-5 w-5" />
                  <div>
                    <p className="text-sm text-gray-500">Amount in Escrow</p>
                    <p className="font-medium text-gray-900">₦{escrowTransaction.amount.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Selection */}
          {!action && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">What would you like to do?</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setAction('confirm')}
                  className="p-6 border-2 border-green-200 bg-green-50 rounded-lg text-left hover:bg-green-100 transition-colors"
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <FaCheck className="text-green-600 h-6 w-6" />
                    <h4 className="text-lg font-semibold text-green-900">Confirm Possession</h4>
                  </div>
                  <p className="text-sm text-green-800">
                    I have received the property and it meets my expectations. Release funds to the vendor.
                  </p>
                </button>

                <button
                  onClick={() => setAction('dispute')}
                  className="p-6 border-2 border-red-200 bg-red-50 rounded-lg text-left hover:bg-red-100 transition-colors"
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <FaExclamationTriangle className="text-red-600 h-6 w-6" />
                    <h4 className="text-lg font-semibold text-red-900">File Dispute</h4>
                  </div>
                  <p className="text-sm text-red-800">
                    I have issues with the property. Request admin review and potential refund.
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* Confirmation Form */}
          {action === 'confirm' && (
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <FaCheck className="text-green-600 h-6 w-6" />
                <h3 className="text-lg font-semibold text-gray-900">Property Confirmation</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Overall Satisfaction
                  </label>
                  <select
                    value={confirmationData.satisfaction}
                    onChange={(e) => setConfirmationData(prev => ({ ...prev, satisfaction: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                  >
                    <option value="">Select satisfaction level</option>
                    {satisfactionOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Property Condition
                  </label>
                  <select
                    value={confirmationData.condition}
                    onChange={(e) => setConfirmationData(prev => ({ ...prev, condition: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                  >
                    <option value="">Select condition</option>
                    {conditionOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes
                  </label>
                  <textarea
                    value={confirmationData.notes}
                    onChange={(e) => setConfirmationData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                    placeholder="Any additional comments about the property..."
                  />
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => setAction(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={loading || !confirmationData.satisfaction || !confirmationData.condition}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Confirming...' : 'Confirm Possession'}
                </button>
              </div>
            </div>
          )}

          {/* Dispute Form */}
          {action === 'dispute' && (
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <FaExclamationTriangle className="text-red-600 h-6 w-6" />
                <h3 className="text-lg font-semibold text-gray-900">File Dispute</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Dispute
                  </label>
                  <select
                    value={disputeData.reason}
                    onChange={(e) => setDisputeData(prev => ({ ...prev, reason: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                  >
                    <option value="">Select dispute reason</option>
                    {disputeReasons.map(reason => (
                      <option key={reason.value} value={reason.value}>
                        {reason.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Detailed Description
                  </label>
                  <textarea
                    value={disputeData.description}
                    onChange={(e) => setDisputeData(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                    placeholder="Please provide detailed information about the issues you encountered..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Evidence (Photos/Documents)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <FaCamera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Upload photos or documents as evidence</p>
                    <input
                      type="file"
                      multiple
                      accept="image/*,.pdf"
                      className="mt-2"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <FaExclamationTriangle className="text-yellow-600 h-5 w-5 mt-1" />
                  <div>
                    <p className="text-sm font-medium text-yellow-900">Dispute Process</p>
                    <p className="text-sm text-yellow-800 mt-1">
                      Your dispute will be reviewed by our admin team within 24-48 hours. 
                      We will investigate the matter and make a decision on fund release or refund.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => setAction(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleDispute}
                  disabled={loading || !disputeData.reason || !disputeData.description}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Filing Dispute...' : 'File Dispute'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyConfirmation;


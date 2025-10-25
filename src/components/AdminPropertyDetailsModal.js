import React, { useState, useEffect } from 'react';
import { 
  FaTimes, 
  FaEye, 
  FaDownload, 
  FaPlay, 
  FaCheckCircle, 
  FaTimesCircle,
  FaUser,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaBed,
  FaBath,
  FaRuler,
  FaCar,
  FaImage,
  FaFileAlt,
  FaVideo,
  FaSpinner
} from 'react-icons/fa';

const AdminPropertyDetailsModal = ({ property, isOpen, onClose, onApprove, onReject }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [selectedRejectionReason, setSelectedRejectionReason] = useState('');
  const [customRejectionReason, setCustomRejectionReason] = useState('');

  // Popular rejection reasons
  const popularRejectionReasons = [
    'Incomplete property information',
    'Poor quality photos',
    'Inaccurate pricing',
    'Missing required documents',
    'Property not available for sale/rent',
    'Duplicate listing',
    'Inappropriate content',
    'Location information incorrect',
    'Property description misleading',
    'Missing contact information'
  ];

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api-kzs3jdpe7a-uc.a.run.app';

  useEffect(() => {
    if (isOpen) {
      setActiveTab('overview');
      setRejectionReason('');
      setAdminNotes('');
      setError('');
      setShowRejectionModal(false);
      setSelectedRejectionReason('');
      setCustomRejectionReason('');
    }
  }, [isOpen, property]);

  const handleApprove = async () => {
    if (!property) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      await onApprove(property.id, adminNotes);
      onClose();
    } catch (err) {
      setError('Failed to approve property. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = () => {
    setShowRejectionModal(true);
  };

  const handleRejectSubmit = async () => {
    if (!property) return;
    
    const finalRejectionReason = selectedRejectionReason === 'other' 
      ? customRejectionReason.trim()
      : selectedRejectionReason;
    
    if (!finalRejectionReason) {
      setError('Please select a reason or provide a custom reason for rejection.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      await onReject(property.id, finalRejectionReason, adminNotes);
      setShowRejectionModal(false);
      onClose();
    } catch (err) {
      setError('Failed to reject property. Please try again.');
      console.error('Rejection error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectCancel = () => {
    setShowRejectionModal(false);
    setSelectedRejectionReason('');
    setCustomRejectionReason('');
    setError('');
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(price);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'active': { color: 'bg-green-100 text-green-800', label: 'Active' },
      'pending': { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      'inactive': { color: 'bg-gray-100 text-gray-800', label: 'Inactive' },
      'sold': { color: 'bg-blue-100 text-blue-800', label: 'Sold' },
      'rented': { color: 'bg-purple-100 text-purple-800', label: 'Rented' }
    };
    
    const config = statusConfig[status] || statusConfig['pending'];
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getApprovalStatusBadge = (status) => {
    const statusConfig = {
      'approved': { color: 'bg-green-100 text-green-800', label: 'Approved for Listing' },
      'pending': { color: 'bg-yellow-100 text-yellow-800', label: 'Pending Approval' },
      'rejected': { color: 'bg-red-100 text-red-800', label: 'Rejected' }
    };
    
    const config = statusConfig[status] || statusConfig['pending'];
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getVerificationStatusBadge = (status) => {
    const statusConfig = {
      'verified': { color: 'bg-green-100 text-green-800', label: '✓ Verified' },
      'unverified': { color: 'bg-gray-100 text-gray-800', label: 'Not Verified' }
    };
    
    const config = statusConfig[status] || statusConfig['unverified'];
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.label}
      </span>
    );
  };

  if (!isOpen || !property) return null;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FaEye },
    { id: 'images', label: 'Images', icon: FaImage },
    { id: 'videos', label: 'Videos', icon: FaVideo },
    { id: 'documents', label: 'Documents', icon: FaFileAlt },
    { id: 'location', label: 'Location', icon: FaMapMarkerAlt }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-xl">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{property.title}</h2>
            <div className="flex items-center gap-4 mt-2">
              {getStatusBadge(property.status)}
              {getApprovalStatusBadge(property.approvalStatus || property.verificationStatus)}
              {property.isVerified && getVerificationStatusBadge('verified')}
              <span className="text-2xl font-bold text-blue-600">{formatPrice(property.price)}</span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Details</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <FaBed className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-600">{property.bedrooms || property.details?.bedrooms || 'N/A'} Bedrooms</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <FaBath className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-600">{property.bathrooms || property.details?.bathrooms || 'N/A'} Bathrooms</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <FaRuler className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-600">{property.area || property.details?.sqft || 'N/A'} sq ft</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <FaCar className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-600">{property.parking || property.details?.parking || 'N/A'} Parking</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Information</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="font-medium text-gray-700">Type:</span>
                      <span className="ml-2 text-gray-600 capitalize">{property.type || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Property ID:</span>
                      <span className="ml-2 text-gray-600">{property.id}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Listed:</span>
                      <span className="ml-2 text-gray-600">
                        {property.dateListed ? new Date(property.dateListed).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Last Updated:</span>
                      <span className="ml-2 text-gray-600">
                        {property.lastUpdated ? new Date(property.lastUpdated).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Description</h3>
                <p className="text-gray-600 leading-relaxed">
                  {property.description || 'No description provided.'}
                </p>
              </div>

              {/* Location */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Location</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <FaMapMarkerAlt className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-600">
                      {property.location?.address || 'Address not provided'}
                    </span>
                  </div>
                  <div className="text-gray-600">
                    {property.location?.city && `${property.location.city}, `}
                    {property.location?.state && `${property.location.state}`}
                  </div>
                </div>
              </div>

              {/* Vendor Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Vendor Information</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <FaUser className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-600">Vendor ID: {property.vendorId || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <FaCalendarAlt className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-600">
                      Member since: {property.vendorJoinDate ? new Date(property.vendorJoinDate).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'images' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Images</h3>
              {property.images && property.images.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {property.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image.url || image}
                        alt={`Property image ${index + 1}`}
                        className="w-full h-48 object-cover rounded-lg shadow-md"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Available';
                        }}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center">
                        <button className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white bg-opacity-90 p-2 rounded-full hover:bg-opacity-100">
                          <FaEye className="w-4 h-4 text-gray-700" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FaImage className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No images available for this property.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'videos' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Videos</h3>
              {property.videos && property.videos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {property.videos.map((video, index) => (
                    <div key={index} className="relative">
                      <video
                        controls
                        className="w-full h-64 object-cover rounded-lg shadow-md"
                        poster={video.thumbnail}
                      >
                        <source src={video.url || video} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FaVideo className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No videos available for this property.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'documents' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Documents</h3>
              {property.documents && property.documents.length > 0 ? (
                <div className="space-y-3">
                  {property.documents.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <FaFileAlt className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">{doc.name || `Document ${index + 1}`}</p>
                          <p className="text-sm text-gray-500">{doc.type || 'Unknown type'}</p>
                        </div>
                      </div>
                      <button className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors">
                        <FaDownload className="w-4 h-4" />
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FaFileAlt className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No documents available for this property.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'location' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Location Details</h3>
              <div className="space-y-4">
                <div>
                  <span className="font-medium text-gray-700">Full Address:</span>
                  <p className="text-gray-600 mt-1">
                    {property.location?.address || 'Address not provided'}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="font-medium text-gray-700">City:</span>
                    <p className="text-gray-600">{property.location?.city || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">State:</span>
                    <p className="text-gray-600">{property.location?.state || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Country:</span>
                    <p className="text-gray-600">{property.location?.country || 'Nigeria'}</p>
                  </div>
                </div>
                {/* Map placeholder */}
                <div className="h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <FaMapMarkerAlt className="w-8 h-8 mx-auto mb-2" />
                    <p>Interactive map would be displayed here</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer with Actions */}
        <div className="border-t p-6 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="flex-1 mr-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Notes (Optional)
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add internal notes for this property..."
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleApprove}
                disabled={isLoading}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {isLoading ? <FaSpinner className="animate-spin" /> : <FaCheckCircle />}
                Approve for Listing
              </button>
              <button
                onClick={handleReject}
                disabled={isLoading}
                className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {isLoading ? <FaSpinner className="animate-spin" /> : <FaTimesCircle />}
                Reject Listing
              </button>
            </div>
          </div>
          
        </div>
      </div>

      {/* Rejection Reason Modal */}
      {showRejectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 shadow-xl">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Select Rejection Reason
              </h3>
              
              <div className="space-y-3 mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Popular Reasons:
                </label>
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                  {popularRejectionReasons.map((reason, index) => (
                    <label key={index} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="radio"
                        name="rejectionReason"
                        value={reason}
                        checked={selectedRejectionReason === reason}
                        onChange={(e) => setSelectedRejectionReason(e.target.value)}
                        className="mr-3 text-red-600 focus:ring-red-500"
                      />
                      <span className="text-sm text-gray-700">{reason}</span>
                    </label>
                  ))}
                  <label className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="radio"
                      name="rejectionReason"
                      value="other"
                      checked={selectedRejectionReason === 'other'}
                      onChange={(e) => setSelectedRejectionReason(e.target.value)}
                      className="mr-3 text-red-600 focus:ring-red-500"
                    />
                    <span className="text-sm text-gray-700">Other (specify below)</span>
                  </label>
                </div>
              </div>

              {selectedRejectionReason === 'other' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Rejection Reason:
                  </label>
                  <textarea
                    value={customRejectionReason}
                    onChange={(e) => setCustomRejectionReason(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Please specify the reason for rejection..."
                  />
                </div>
              )}

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  onClick={handleRejectCancel}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectSubmit}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {isLoading ? <FaSpinner className="animate-spin" /> : <FaTimesCircle />}
                  {isLoading ? 'Rejecting...' : 'Reject Property'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPropertyDetailsModal;

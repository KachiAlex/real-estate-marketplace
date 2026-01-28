import React, { useState, useEffect, useCallback } from 'react';
import { 
  FaCheck, 
  FaTimes, 
  FaEye, 
  FaSpinner, 
  FaExclamationTriangle,
  FaHome,
  FaUser,
  FaMoneyBillWave,
  FaCalendar,
  FaClock,
  FaDownload,
  FaImage,
  FaMapMarkerAlt,
  FaBed,
  FaBath,
  FaRuler,
  FaSearch,
  FaFilter,
  FaInfoCircle,
  FaBuilding,
  FaCheckCircle,
  FaTimesCircle,
  FaFileAlt
} from 'react-icons/fa';
import { useProperty } from '../contexts/PropertyContext';
import { getApiBaseUrl, getApiUrl } from '../utils/apiConfig';

const normalizeDateValue = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'number') return new Date(value).toISOString();
  if (value.toDate) return value.toDate().toISOString();
  if (value.seconds) return new Date(value.seconds * 1000).toISOString();
  return null;
};

const normalizeImages = (images = []) => {
  if (!Array.isArray(images)) return [];
  return images
    .map((img) => {
      if (!img) return null;
      if (typeof img === 'string') return img;
      if (typeof img === 'object' && img.url) return img.url;
      return null;
    })
    .filter(Boolean);
};

const normalizeLocation = (property) => {
  if (property.propertyLocation && typeof property.propertyLocation === 'object') {
    return property.propertyLocation;
  }
  if (property.location && typeof property.location === 'object') {
    return property.location;
  }

  const parts = typeof property.location === 'string' ? property.location.split(',').map((p) => p.trim()) : [];
  const address = property.address || parts[0] || '';
  const city = property.city || parts[1] || '';
  const state = property.state || parts[2] || '';

  return {
    address,
    city,
    state
  };
};

const mapPropertyToVerificationRequest = (property) => {
  const status = (property.verificationStatus || property.approvalStatus || (property.isVerified ? 'approved' : 'pending') || 'pending')
    .toString()
    .toLowerCase();

  const locationDetails = normalizeLocation(property);
  const vendorName =
    property.vendorName ||
    property.owner?.name ||
    (property.owner?.firstName || property.owner?.lastName ? `${property.owner?.firstName || ''} ${property.owner?.lastName || ''}`.trim() : '') ||
    'Unknown Vendor';

  return {
    id: property.id,
    propertyId: property.id,
    vendorId: property.vendorId || property.ownerId || property.owner?.id || '',
    vendorName,
    vendorEmail: property.vendorEmail || property.ownerEmail || property.owner?.email || '',
    propertyTitle: property.title || property.name || 'Untitled Property',
    propertyDescription: property.description || property.summary || '',
    propertyPrice: property.price || property.amount || 0,
    propertyLocation: locationDetails,
    propertyType: property.type || property.propertyType || property.listingType || 'Property',
    bedrooms: property.bedrooms || property.details?.bedrooms || 0,
    bathrooms: property.bathrooms || property.details?.bathrooms || 0,
    area: property.area || property.details?.sqft || 0,
    submittedAt: normalizeDateValue(property.verificationRequestedAt || property.createdAt) || new Date().toISOString(),
    paymentCompletedAt: normalizeDateValue(property.verificationPaidAt || property.paymentCompletedAt || property.updatedAt) || null,
    status,
    verificationFee: property.verificationFee || property.fees?.verification || 0,
    images: normalizeImages(property.images),
    documents: property.documents || property.verificationDocuments || property.propertyDocuments || [],
    raw: property
  };
};

const API_BASE_URL = getApiBaseUrl();

const AdminPropertyVerification = () => {
  const { properties, fetchAdminProperties, verifyProperty } = useProperty();
  const [verificationRequests, setVerificationRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [error, setError] = useState('');
  const [verificationFee, setVerificationFee] = useState(50000);
  const [vendorListingFee, setVendorListingFee] = useState(100000);
  const [savingFee, setSavingFee] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const refreshRequests = useCallback(async () => {
    setLoadingRequests(true);
    setError('');
    try {
      await fetchAdminProperties('', '');
    } catch (err) {
      console.error('AdminPropertyVerification: Failed to fetch admin properties', err);
      setError('Failed to load verification requests. Please try again.');
    }
  }, [fetchAdminProperties]);

  useEffect(() => {
    refreshRequests();
    loadAdminSettings();
  }, [refreshRequests]);

  useEffect(() => {
    if (!properties || properties.length === 0) {
      setVerificationRequests([]);
      setLoadingRequests(false);
      return;
    }

    const mapped = properties.map(mapPropertyToVerificationRequest);
    setVerificationRequests(mapped);
    setLoadingRequests(false);
  }, [properties]);

  const loadAdminSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Admin authentication required. Using default fee settings.');
        return;
      }
      
      const response = await fetch(getApiUrl('/admin/settings'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 401) {
        setError('Admin authentication expired. Using default fee settings.');
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setVerificationFee(data.data.verificationFee || 50000);
          setVendorListingFee(data.data.vendorListingFee || 100000);
        }
      }
    } catch (error) {
      console.error('Error loading admin settings:', error);
      setError('Unable to load admin settings. Using default values.');
    }
  };

  const handlePropertyDecision = async (status) => {
    if (!selectedRequest) return;
    if (status === 'rejected' && !rejectionReason.trim() && !adminNotes.trim()) {
      setError('Please provide a rejection reason or admin notes.');
      return;
    }

    setActionLoading(true);
    setError('');

    try {
      const notes =
        status === 'rejected'
          ? [rejectionReason.trim(), adminNotes.trim()].filter(Boolean).join('. ').trim()
          : adminNotes.trim();

      const success = await verifyProperty(selectedRequest.propertyId, status, notes);

      if (!success) {
        throw new Error(`Failed to ${status} property. Please try again.`);
      }

      setShowModal(false);
      setRejectionReason('');
      setAdminNotes('');
      await refreshRequests();
    } catch (err) {
      console.error(`AdminPropertyVerification: Error ${status} property`, err);
      setError(err.message || `Failed to ${status} property. Please try again.`);
    } finally {
      setActionLoading(false);
    }
  };

  const openModal = (request) => {
    setSelectedRequest(request);
    setShowModal(true);
    setAdminNotes('');
    setRejectionReason('');
    setError('');
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return 'N/A';
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return 'Not available';
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    if (Number.isNaN(date.getTime())) return 'Not available';
    return date.toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'pending_payment': { color: 'bg-yellow-100 text-yellow-800', text: 'Pending Payment' },
      'payment_completed': { color: 'bg-blue-100 text-blue-800', text: 'Pending Review' },
      'approved': { color: 'bg-green-100 text-green-800', text: 'Approved' },
      'rejected': { color: 'bg-red-100 text-red-800', text: 'Rejected' }
    };

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', text: status };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const handleSaveVerificationFee = async () => {
    try {
      setSavingFee(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(getApiUrl('/admin/settings'), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          verificationFee: parseInt(verificationFee),
          vendorListingFee: parseInt(vendorListingFee)
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          alert('Settings updated successfully!');
        } else {
          throw new Error(data.message || 'Failed to save settings');
        }
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings: ' + error.message);
    } finally {
      setSavingFee(false);
    }
  };

  const filteredRequests = verificationRequests.filter(request => {
    const matchesSearch = 
      request.propertyTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.vendorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.vendorEmail?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || request.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  if (loadingRequests) {
    return (
      <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/60 px-4 py-8">
        <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-gray-100">
          <div className="p-6">
            <div className="flex items-center justify-center h-64">
              <FaSpinner className="animate-spin text-2xl text-blue-600" />
              <span className="ml-2">Loading verification requests...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Requests</p>
              <p className="text-3xl font-bold mt-2">{verificationRequests.length}</p>
            </div>
            <div className="bg-blue-400 bg-opacity-30 rounded-full p-3">
              <FaClock className="text-2xl" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm font-medium">Pending Review</p>
              <p className="text-3xl font-bold mt-2">
                {verificationRequests.filter(r => r.status === 'payment_completed').length}
              </p>
            </div>
            <div className="bg-yellow-400 bg-opacity-30 rounded-full p-3">
              <FaExclamationTriangle className="text-2xl" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Approved</p>
              <p className="text-3xl font-bold mt-2">
                {verificationRequests.filter(r => r.status === 'approved').length}
              </p>
            </div>
            <div className="bg-green-400 bg-opacity-30 rounded-full p-3">
              <FaCheck className="text-2xl" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Total Revenue</p>
              <p className="text-2xl font-bold mt-2">
                {formatCurrency(verificationRequests.reduce((sum, r) => sum + (r.verificationFee || 0), 0))}
              </p>
            </div>
            <div className="bg-purple-400 bg-opacity-30 rounded-full p-3">
              <FaMoneyBillWave className="text-2xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Fee Settings Card */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Platform Fee Settings</h2>
            <p className="text-sm text-gray-600 mt-1">Configure platform fees</p>
          </div>
          <div className="bg-blue-100 rounded-full p-3">
            <FaMoneyBillWave className="text-blue-600 text-xl" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Property Verification Fee (NGN)
            </label>
            <input
              type="number"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              value={verificationFee}
              onChange={(e) => setVerificationFee(e.target.value)}
              min={0}
              placeholder="Enter verification fee"
            />
            <p className="text-xs text-gray-500 mt-1">Charged when vendors request property verification</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vendor Listing Fee (NGN)
            </label>
            <input
              type="number"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              value={vendorListingFee}
              onChange={(e) => setVendorListingFee(e.target.value)}
              min={0}
              placeholder="Enter vendor listing fee"
            />
            <p className="text-xs text-gray-500 mt-1">Charged when vendors register to list properties</p>
          </div>
        </div>
        <button
          onClick={handleSaveVerificationFee}
          disabled={savingFee}
          className={`w-full md:w-auto px-6 py-3 rounded-lg text-white font-medium transition ${
            savingFee ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg'
          }`}
        >
          {savingFee ? 'Saving...' : 'Save All Fees'}
        </button>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search properties, vendors..."
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
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg flex items-center">
          <FaExclamationTriangle className="mr-3" />
          {error}
        </div>
      )}

      {filteredRequests.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="bg-gray-100 rounded-full p-6 w-24 h-24 mx-auto mb-4 flex items-center justify-center">
            <FaHome className="text-4xl text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Verification Requests</h3>
          <p className="text-gray-500">There are currently no properties pending verification.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <div key={request.id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300">
              <div className="p-6">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                  {/* Property Image and Details */}
                  <div className="lg:col-span-2">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-32 h-32 rounded-lg overflow-hidden bg-gray-200">
                          <img 
                            src={request.images?.[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=300'} 
                            alt={request.propertyTitle}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-1">{request.propertyTitle}</h3>
                            <div className="flex items-center text-sm text-gray-600 mb-2">
                              <FaMapMarkerAlt className="mr-1" />
                              {request.propertyLocation?.address}, {request.propertyLocation?.city}, {request.propertyLocation?.state}
                            </div>
                          </div>
                          {getStatusBadge(request.status)}
                        </div>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{request.propertyDescription}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className="flex items-center">
                            <FaBed className="mr-1" /> {request.bedrooms}
                          </span>
                          <span className="flex items-center">
                            <FaBath className="mr-1" /> {request.bathrooms}
                          </span>
                          <span className="flex items-center">
                            <FaRuler className="mr-1" /> {request.area} sqm
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Verification Info and Actions */}
                  <div className="border-t pt-4 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6">
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Vendor</p>
                        <p className="text-sm font-medium text-gray-900">{request.vendorName}</p>
                        <p className="text-xs text-gray-600">{request.vendorEmail}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Verification Fee</p>
                        <p className="text-lg font-bold text-green-600">{formatCurrency(request.verificationFee)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Submitted</p>
                        <p className="text-sm text-gray-900 flex items-center">
                          <FaCalendar className="mr-1" /> {formatDate(request.submittedAt)}
                        </p>
                      </div>
                      <button
                        onClick={() => openModal(request)}
                        className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center space-x-2 transition"
                      >
                        <FaEye />
                        <span>Review Details</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/60 px-4 py-8">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-gray-100">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">Property Review</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Property Details */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg">Property Information</h4>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Title</label>
                      <p className="text-sm text-gray-900">{selectedRequest.propertyTitle}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <p className="text-sm text-gray-900">{selectedRequest.propertyDescription}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Price</label>
                      <p className="text-sm text-gray-900">{formatCurrency(selectedRequest.propertyPrice)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Location</label>
                      <p className="text-sm text-gray-900">
                        {selectedRequest.propertyLocation?.address}, {selectedRequest.propertyLocation?.city}, {selectedRequest.propertyLocation?.state}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Type</label>
                      <p className="text-sm text-gray-900 capitalize">{selectedRequest.propertyType}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Bedrooms/Bathrooms</label>
                      <p className="text-sm text-gray-900">
                        {selectedRequest.bedrooms} bed, {selectedRequest.bathrooms} bath
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Area</label>
                      <p className="text-sm text-gray-900">{selectedRequest.area} sqm</p>
                    </div>
                  </div>
                </div>

                {/* Verification Details */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg">Verification Details</h4>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Request ID</label>
                      <p className="text-sm text-gray-900">{selectedRequest.id}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Verification Fee</label>
                      <p className="text-sm text-gray-900">{formatCurrency(selectedRequest.verificationFee)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Payment Date</label>
                      <p className="text-sm text-gray-900">{formatDate(selectedRequest.paymentCompletedAt)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Admin Notes */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Notes
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add any notes about this property verification..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                />
              </div>

              {/* Rejection Reason */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason (if rejecting)
                </label>
                <select
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a reason (optional)</option>
                  <option value="incomplete_documentation">Incomplete Documentation</option>
                  <option value="false_information">False Information</option>
                  <option value="poor_quality_images">Poor Quality Images</option>
                  <option value="location_not_verified">Location Not Verified</option>
                  <option value="price_inconsistency">Price Inconsistency</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handlePropertyDecision('rejected')}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {actionLoading ? (
                    <FaSpinner className="animate-spin mr-2" />
                  ) : (
                    <FaTimes className="mr-2" />
                  )}
                  Reject
                </button>
                <button
                  onClick={() => handlePropertyDecision('approved')}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {actionLoading ? (
                    <FaSpinner className="animate-spin mr-2" />
                  ) : (
                    <FaCheck className="mr-2" />
                  )}
                  Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPropertyVerification;

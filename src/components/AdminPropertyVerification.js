import React, { useState, useEffect } from 'react';
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
  FaInfoCircle
} from 'react-icons/fa';

const AdminPropertyVerification = () => {
  const [verificationRequests, setVerificationRequests] = useState([]);
  const [loading, setLoading] = useState(true);
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

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api-kzs3jdpe7a-uc.a.run.app';

  useEffect(() => {
    loadVerificationRequests();
    loadAdminSettings();
  }, []);

  const loadAdminSettings = async () => {
    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api-kzs3jdpe7a-uc.a.run.app';
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/api/admin/settings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setVerificationFee(data.data.verificationFee || 50000);
          setVendorListingFee(data.data.vendorListingFee || 100000);
        }
      }
    } catch (error) {
      console.error('Error loading admin settings:', error);
    }
  };

  const loadVerificationRequests = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Enhanced mock data with better structure
      const mockVerificationRequests = [
        {
          id: '1',
          propertyId: 'prop_001',
          vendorId: 'user_001',
          vendorName: 'John Doe',
          vendorEmail: 'john@example.com',
          propertyTitle: 'Luxury Villa in Lekki',
          propertyDescription: 'A beautiful 5-bedroom luxury villa with modern amenities, swimming pool, and garden space.',
          propertyPrice: 500000000,
          propertyLocation: {
            address: 'No. 15 Admiralty Way',
            city: 'Lekki',
            state: 'Lagos'
          },
          propertyType: 'House',
          bedrooms: 5,
          bathrooms: 4,
          area: 350,
          submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          paymentCompletedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'pending',
          verificationFee: 50000,
          images: ['https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800'],
          documents: [
            { type: 'title_deed', name: 'Title Deed', url: 'https://example.com/title.pdf' },
            { type: 'survey_plan', name: 'Survey Plan', url: 'https://example.com/survey.pdf' }
          ]
        },
        {
          id: '2',
          propertyId: 'prop_002',
          vendorId: 'user_002',
          vendorName: 'Jane Smith',
          vendorEmail: 'jane@example.com',
          propertyTitle: 'Modern Apartment in Victoria Island',
          propertyDescription: 'A sleek 3-bedroom apartment in the heart of Victoria Island with stunning ocean views.',
          propertyPrice: 120000000,
          propertyLocation: {
            address: 'Plot 25 Ozumba Mbadiwe',
            city: 'Victoria Island',
            state: 'Lagos'
          },
          propertyType: 'Apartment',
          bedrooms: 3,
          bathrooms: 2,
          area: 180,
          submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          paymentCompletedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'pending',
          verificationFee: 50000,
          images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800'],
          documents: [
            { type: 'title_deed', name: 'Title Deed', url: 'https://example.com/title2.pdf' },
            { type: 'c_of_o', name: 'C of O', url: 'https://example.com/coo.pdf' }
          ]
        }
      ];
      
      setVerificationRequests(mockVerificationRequests);
      console.log('AdminPropertyVerification: Using mock data (API unavailable)');
    } catch (err) {
      setError('Failed to load verification requests');
      console.error('Error:', err);
      setVerificationRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    setActionLoading(true);
    setError('');

    try {
      // Simulate API call with local state update
      console.log('AdminPropertyVerification: Approving property', requestId);
      
      // Update local state
      setVerificationRequests(prev => 
        prev.filter(req => req.id !== requestId)
      );
      
      setShowModal(false);
      setAdminNotes('');
      
      // Show success message
      alert('Property approved successfully! (Mock)');
      
    } catch (err) {
      setError('Failed to approve property. Please try again.');
      console.error('Error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (requestId) => {
    if (!rejectionReason.trim()) {
      setError('Please provide a rejection reason');
      return;
    }

    setActionLoading(true);
    setError('');

    try {
      // Simulate API call with local state update
      console.log('AdminPropertyVerification: Rejecting property', requestId);
      
      // Update local state
      setVerificationRequests(prev => 
        prev.filter(req => req.id !== requestId)
      );
      
      setShowModal(false);
      setRejectionReason('');
      setAdminNotes('');
      
      // Show success message
      alert('Property rejected successfully! (Mock)');
      
    } catch (err) {
      setError('Failed to reject property. Please try again.');
      console.error('Error:', err);
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
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
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
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api-kzs3jdpe7a-uc.a.run.app';
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/api/admin/settings`, {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FaSpinner className="animate-spin text-2xl text-blue-600" />
        <span className="ml-2">Loading verification requests...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                {verificationRequests.filter(r => r.status === 'pending').length}
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
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Platform Fee Settings</h2>
            <p className="text-sm text-gray-600 mt-1">Configure platform fees</p>
          </div>
          <div className="bg-blue-100 rounded-full p-3">
            <FaMoneyBillWave className="text-blue-600 text-xl" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Property Image and Details */}
                  <div className="lg:col-span-2">
                    <div className="flex items-start space-x-4">
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
                  <div className="border-t lg:border-t-0 lg:border-l pt-4 lg:pt-0 lg:pl-6">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
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

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                  onClick={() => handleReject(selectedRequest.id)}
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
                  onClick={() => handleApprove(selectedRequest.id)}
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

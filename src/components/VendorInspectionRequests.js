import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FaCalendar, FaClock, FaMapMarkerAlt, FaUser, FaPhone, FaEnvelope, FaCheckCircle, FaTimesCircle, FaCalendarAlt, FaEye } from 'react-icons/fa';
import { listInspectionRequestsByVendor, updateInspectionRequest } from '../services/inspectionService';
import toast from 'react-hot-toast';

const VendorInspectionRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [responseType, setResponseType] = useState('accept');
  const [proposedDate, setProposedDate] = useState('');
  const [proposedTime, setProposedTime] = useState('');
  const [vendorMessage, setVendorMessage] = useState('');

  useEffect(() => {
    loadInspectionRequests();
  }, [user]);

  const loadInspectionRequests = async () => {
    try {
      setLoading(true);
      const data = await listInspectionRequestsByVendor(user?.id, user?.email);
      setRequests(data);
    } catch (error) {
      console.error('Error loading inspection requests:', error);
      toast.error('Failed to load inspection requests');
    } finally {
      setLoading(false);
    }
  };

  const handleRespondToRequest = (request) => {
    setSelectedRequest(request);
    setShowResponseModal(true);
    setProposedDate(request.preferredDate);
    setProposedTime(request.preferredTime);
    setVendorMessage('');
  };

  const handleSubmitResponse = async () => {
    if (!selectedRequest) return;

    try {
      let updates = {};
      
      if (responseType === 'accept') {
        updates = {
          status: 'accepted',
          confirmedDate: selectedRequest.preferredDate,
          confirmedTime: selectedRequest.preferredTime,
          vendorMessage: vendorMessage || 'Viewing confirmed. Looking forward to showing you the property!'
        };
      } else if (responseType === 'propose') {
        if (!proposedDate || !proposedTime) {
          toast.error('Please select a proposed date and time');
          return;
        }
        updates = {
          status: 'proposed_new_time',
          proposedDate,
          proposedTime,
          vendorMessage: vendorMessage || 'I would like to propose a different time. Please let me know if this works for you.'
        };
      } else if (responseType === 'decline') {
        updates = {
          status: 'declined',
          vendorMessage: vendorMessage || 'Unfortunately, I am not available at the requested time.'
        };
      }

      const success = await updateInspectionRequest(selectedRequest.id, updates);
      
      if (success) {
        toast.success(`Request ${responseType === 'accept' ? 'accepted' : responseType === 'propose' ? 'updated with new time' : 'declined'}`);
        setShowResponseModal(false);
        setSelectedRequest(null);
        loadInspectionRequests(); // Reload requests
      } else {
        toast.error('Failed to update request');
      }
    } catch (error) {
      console.error('Error updating request:', error);
      toast.error('Failed to update request');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'pending_vendor': { color: 'bg-yellow-100 text-yellow-800', text: 'Pending Response' },
      'accepted': { color: 'bg-green-100 text-green-800', text: 'Accepted' },
      'proposed_new_time': { color: 'bg-blue-100 text-blue-800', text: 'New Time Proposed' },
      'declined': { color: 'bg-red-100 text-red-800', text: 'Declined' }
    };
    
    const badge = badges[status] || badges['pending_vendor'];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  const formatDateTime = (date, time) => {
    if (!date || !time) return 'Not specified';
    try {
      const dateObj = new Date(`${date}T${time}`);
      return dateObj.toLocaleDateString() + ' at ' + dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return `${date} at ${time}`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading inspection requests...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Property Viewing Requests</h2>
        <button
          onClick={loadInspectionRequests}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-12">
          <FaCalendar className="mx-auto text-4xl text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No viewing requests yet</h3>
          <p className="text-gray-500">When buyers request to view your properties, they will appear here.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {requests.map((request) => (
            <div key={request.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {request.propertyTitle || request.projectName}
                  </h3>
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <FaMapMarkerAlt className="mr-2" />
                    {request.propertyLocation || request.projectLocation}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <FaUser className="mr-2" />
                    {request.buyerName || request.userName}
                  </div>
                </div>
                <div className="ml-4">
                  {getStatusBadge(request.status)}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <FaCalendar className="mr-2" />
                  <span>Requested: {formatDateTime(request.preferredDate, request.preferredTime)}</span>
                </div>
                {request.confirmedDate && request.confirmedTime && (
                  <div className="flex items-center text-sm text-green-600">
                    <FaCheckCircle className="mr-2" />
                    <span>Confirmed: {formatDateTime(request.confirmedDate, request.confirmedTime)}</span>
                  </div>
                )}
                {request.proposedDate && request.proposedTime && request.status === 'proposed_new_time' && (
                  <div className="flex items-center text-sm text-blue-600">
                    <FaCalendarAlt className="mr-2" />
                    <span>Proposed: {formatDateTime(request.proposedDate, request.proposedTime)}</span>
                  </div>
                )}
              </div>

              {request.message && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Buyer's message:</strong> {request.message}
                  </p>
                </div>
              )}

              {request.vendorMessage && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Your response:</strong> {request.vendorMessage}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span className="flex items-center">
                    <FaPhone className="mr-1" />
                    {request.buyerPhone || 'Not provided'}
                  </span>
                  <span className="flex items-center">
                    <FaEnvelope className="mr-1" />
                    {request.buyerEmail || request.userEmail}
                  </span>
                </div>

                {request.status === 'pending_vendor' && (
                  <button
                    onClick={() => handleRespondToRequest(request)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Respond
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Response Modal */}
      {showResponseModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Respond to Viewing Request</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Response Type</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="accept"
                      checked={responseType === 'accept'}
                      onChange={(e) => setResponseType(e.target.value)}
                      className="mr-2"
                    />
                    Accept as requested
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="propose"
                      checked={responseType === 'propose'}
                      onChange={(e) => setResponseType(e.target.value)}
                      className="mr-2"
                    />
                    Propose different time
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="decline"
                      checked={responseType === 'decline'}
                      onChange={(e) => setResponseType(e.target.value)}
                      className="mr-2"
                    />
                    Decline request
                  </label>
                </div>
              </div>

              {responseType === 'propose' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Proposed Date</label>
                    <input
                      type="date"
                      value={proposedDate}
                      onChange={(e) => setProposedDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Proposed Time</label>
                    <input
                      type="time"
                      value={proposedTime}
                      onChange={(e) => setProposedTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message (Optional)</label>
                <textarea
                  value={vendorMessage}
                  onChange={(e) => setVendorMessage(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add a personal message..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowResponseModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitResponse}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Submit Response
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorInspectionRequests;

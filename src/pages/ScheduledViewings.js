import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaCalendar, FaMapMarkerAlt, FaPhone, FaEnvelope, FaClock, FaCheck, FaTimes, FaEye, FaEdit } from 'react-icons/fa';
import toast from 'react-hot-toast';

const ScheduledViewings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [viewingRequests, setViewingRequests] = useState([]);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedViewing, setSelectedViewing] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Load viewing requests from localStorage
    const allRequests = JSON.parse(localStorage.getItem('viewingRequests') || '[]');
    const userRequests = allRequests.filter(request => request.userId === user.id);
    setViewingRequests(userRequests);
  }, [user, navigate]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <FaClock className="text-yellow-600" />;
      case 'confirmed': return <FaCheck className="text-green-600" />;
      case 'completed': return <FaCheck className="text-blue-600" />;
      case 'cancelled': return <FaTimes className="text-red-600" />;
      default: return <FaClock className="text-gray-600" />;
    }
  };

  const handleViewProperty = (propertyId) => {
    navigate(`/property/${propertyId}`);
  };

  const handleRescheduleViewing = (viewing) => {
    setSelectedViewing(viewing);
    setShowRescheduleModal(true);
  };

  const handleConfirmReschedule = () => {
    if (!rescheduleDate || !rescheduleTime) {
      toast.error('Please select both date and time');
      return;
    }

    // Update viewing request
    const allRequests = JSON.parse(localStorage.getItem('viewingRequests') || '[]');
    const updatedRequests = allRequests.map(request => {
      if (request.id === selectedViewing.id) {
        return {
          ...request,
          preferredDate: rescheduleDate,
          preferredTime: rescheduleTime,
          status: 'pending',
          rescheduleReason: 'User requested reschedule'
        };
      }
      return request;
    });

    localStorage.setItem('viewingRequests', JSON.stringify(updatedRequests));
    
    // Update local state
    const userRequests = updatedRequests.filter(request => request.userId === user.id);
    setViewingRequests(userRequests);

    toast.success('Viewing rescheduled successfully!');
    setShowRescheduleModal(false);
    setSelectedViewing(null);
    setRescheduleDate('');
    setRescheduleTime('');
  };

  const handleCancelViewing = (viewingId) => {
    const allRequests = JSON.parse(localStorage.getItem('viewingRequests') || '[]');
    const updatedRequests = allRequests.map(request => {
      if (request.id === viewingId) {
        return { ...request, status: 'cancelled' };
      }
      return request;
    });

    localStorage.setItem('viewingRequests', JSON.stringify(updatedRequests));
    
    // Update local state
    const userRequests = updatedRequests.filter(request => request.userId === user.id);
    setViewingRequests(userRequests);

    toast.success('Viewing cancelled successfully');
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Scheduled Viewings</h1>
        <p className="text-gray-600">
          Manage your property viewing appointments and track their status
        </p>
      </div>

      {/* Viewing Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <FaClock className="text-yellow-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {viewingRequests.filter(v => v.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <FaCheck className="text-green-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Confirmed</p>
              <p className="text-2xl font-bold text-gray-900">
                {viewingRequests.filter(v => v.status === 'confirmed').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FaCalendar className="text-blue-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {viewingRequests.filter(v => v.status === 'completed').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-gray-100 rounded-lg">
              <FaCalendar className="text-gray-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Requests</p>
              <p className="text-2xl font-bold text-gray-900">{viewingRequests.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Viewing Requests List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Your Viewing Requests</h2>
        </div>

        {viewingRequests.length === 0 ? (
          <div className="p-12 text-center">
            <FaCalendar className="mx-auto text-4xl text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Scheduled Viewings</h3>
            <p className="text-gray-600 mb-6">You haven't scheduled any property viewings yet.</p>
            <button
              onClick={() => navigate('/properties')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse Properties
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {viewingRequests.map((viewing) => (
              <div key={viewing.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{viewing.propertyTitle}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(viewing.status)}`}>
                        {getStatusIcon(viewing.status)}
                        <span className="ml-1">{viewing.status.charAt(0).toUpperCase() + viewing.status.slice(1)}</span>
                      </span>
                    </div>
                    
                    <div className="flex items-center text-gray-600 mb-2">
                      <FaMapMarkerAlt className="mr-2" />
                      <span>{viewing.propertyLocation}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <p><strong>Requested:</strong> {new Date(viewing.requestedAt).toLocaleDateString()}</p>
                        {viewing.preferredDate && (
                          <p><strong>Preferred Date:</strong> {new Date(viewing.preferredDate).toLocaleDateString()}</p>
                        )}
                        {viewing.preferredTime && (
                          <p><strong>Preferred Time:</strong> {viewing.preferredTime}</p>
                        )}
                      </div>
                      <div>
                        <p><strong>Agent:</strong> {viewing.agentContact.name}</p>
                        <p><strong>Phone:</strong> {viewing.agentContact.phone}</p>
                        <p><strong>Email:</strong> {viewing.agentContact.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2 ml-6">
                    <button
                      onClick={() => handleViewProperty(viewing.propertyId)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                    >
                      <FaEye className="mr-2" />
                      View Property
                    </button>
                    
                    {viewing.status === 'pending' && (
                      <button
                        onClick={() => handleRescheduleViewing(viewing)}
                        className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center"
                      >
                        <FaEdit className="mr-2" />
                        Reschedule
                      </button>
                    )}
                    
                    {(viewing.status === 'pending' || viewing.status === 'confirmed') && (
                      <button
                        onClick={() => handleCancelViewing(viewing.id)}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center"
                      >
                        <FaTimes className="mr-2" />
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reschedule Modal */}
      {showRescheduleModal && selectedViewing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Reschedule Viewing</h3>
            <p className="text-gray-600 mb-4">Property: {selectedViewing.propertyTitle}</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Date</label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Time</label>
                <select
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Time</option>
                  <option value="09:00">9:00 AM</option>
                  <option value="10:00">10:00 AM</option>
                  <option value="11:00">11:00 AM</option>
                  <option value="12:00">12:00 PM</option>
                  <option value="13:00">1:00 PM</option>
                  <option value="14:00">2:00 PM</option>
                  <option value="15:00">3:00 PM</option>
                  <option value="16:00">4:00 PM</option>
                  <option value="17:00">5:00 PM</option>
                </select>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowRescheduleModal(false);
                  setSelectedViewing(null);
                  setRescheduleDate('');
                  setRescheduleTime('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReschedule}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Confirm Reschedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduledViewings;

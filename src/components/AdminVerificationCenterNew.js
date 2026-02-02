import React, { useEffect, useMemo, useState } from 'react';
import {
  FaShieldAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaClipboardList,
  FaClock,
  FaSpinner,
  FaExclamationTriangle
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import { getApiUrl } from '../utils/apiConfig';
import { authenticatedFetch } from '../utils/authToken';

const AdminVerificationCenter = ({ config, isAuthenticated, onRequireAdminAuth }) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'approved', 'rejected'

  // Fetch verification applications
  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await authenticatedFetch(getApiUrl('/verification/applications'));
      
      if (!response.ok) {
        throw new Error('Failed to fetch verification applications');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Backend returns data as an array directly, not nested in .applications
        const applications = Array.isArray(data.data) ? data.data : (data.data?.applications || []);
        setApplications(applications);
      } else {
        throw new Error(data.message || 'Failed to load applications');
      }
    } catch (err) {
      console.error('AdminVerificationCenter: Error fetching applications', err);
      setError(err.message || 'Failed to load verification applications');
      
      // Fallback to mock data if API fails
      setApplications([
        {
          id: 'mock-1',
          applicant: { name: 'Jane Smith', email: 'jane@example.com' },
          propertyName: 'Lekki Pearl Residence',
          propertyLocation: 'Lekki Phase 1, Lagos',
          propertyUrl: 'https://real-estate-marketplace-37544.web.app/property/lekki-pearl',
          verificationFee: 50000,
          status: 'pending',
          requestedBadgeColor: '#6366F1',
          createdAt: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchApplications();
    }
  }, [isAuthenticated]);

  // Handle application approval/rejection
  const handleApplicationAction = async (applicationId, action, badgeColor = null) => {
    try {
      const response = await authenticatedFetch(getApiUrl(`/verification/applications/${applicationId}/status`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: action,
          badgeColor: badgeColor
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} application`);
      }

      const data = await response.json();
      
      if (data.success) {
        toast.success(`Application ${action}d successfully`);
        fetchApplications(); // Refresh the list
      } else {
        throw new Error(data.message || `Failed to ${action} application`);
      }
    } catch (err) {
      console.error(`AdminVerificationCenter: Error ${action}ing application`, err);
      toast.error(err.message || `Failed to ${action} application`);
    }
  };

  // Filter applications
  const filteredApplications = useMemo(() => {
    if (filter === 'all') return applications;
    return applications.filter(app => app.status === filter);
  }, [applications, filter]);

  const statusConfig = {
    pending: {
      label: 'Pending',
      color: 'bg-yellow-100 text-yellow-800',
      Icon: FaClock
    },
    approved: {
      label: 'Approved',
      color: 'bg-green-100 text-green-800',
      Icon: FaCheckCircle
    },
    rejected: {
      label: 'Rejected',
      color: 'bg-red-100 text-red-800',
      Icon: FaTimesCircle
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center">
          <FaShieldAlt className="text-gray-400 text-4xl mx-auto mb-4" />
          <p className="text-gray-600">Admin authentication required</p>
          <button
            onClick={onRequireAdminAuth}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Authenticate as Admin
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <FaShieldAlt className="mr-2 text-blue-600" />
            Property Verification Applications
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Manage property verification requests and badge approvals
          </p>
        </div>
        
        {/* Filter Tabs */}
        <div className="flex space-x-2">
          {['all', 'pending', 'approved', 'rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              {status !== 'all' && (
                <span className="ml-2 bg-white bg-opacity-20 px-2 py-0.5 rounded-full text-xs">
                  {applications.filter(app => app.status === status).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
          <div className="text-center">
            <FaSpinner className="animate-spin text-blue-600 text-4xl mx-auto mb-4" />
            <p className="text-gray-600">Loading verification applications...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <FaExclamationTriangle className="text-red-600 mr-3" />
          <div>
            <p className="text-red-800 font-medium">Error loading applications</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Applications List */}
      {!loading && !error && (
        <div className="space-y-4">
          {filteredApplications.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <FaClipboardList className="text-gray-400 text-4xl mx-auto mb-4" />
              <p className="text-gray-600">
                {filter === 'all' 
                  ? 'No verification applications found' 
                  : `No ${filter} verification applications`}
              </p>
            </div>
          ) : (
            filteredApplications.map((application) => {
              const statusConfigItem = statusConfig[application.status] || statusConfig.pending;
              const StatusIcon = statusConfigItem.Icon;
              
              return (
                <div key={application.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    {/* Application Details */}
                    <div className="flex-1">
                      <div className="flex items-center mb-3">
                        <StatusIcon className={`mr-2 ${statusConfigItem.color.replace('bg-', 'text-').replace('100', '600')}`} />
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfigItem.color}`}>
                          {statusConfigItem.label}
                        </span>
                        <span className="ml-auto text-sm text-gray-500">
                          {formatDate(application.createdAt)}
                        </span>
                      </div>
                      
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        {application.propertyName}
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">
                            <span className="font-medium">Applicant:</span> {application.applicant?.name}
                          </p>
                          <p className="text-gray-600">
                            <span className="font-medium">Email:</span> {application.applicant?.email}
                          </p>
                          <p className="text-gray-600">
                            <span className="font-medium">Location:</span> {application.propertyLocation}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">
                            <span className="font-medium">Verification Fee:</span> ₦{application.verificationFee?.toLocaleString()}
                          </p>
                          <p className="text-gray-600">
                            <span className="font-medium">Payment Reference:</span> {application.paymentReference || 'N/A'}
                          </p>
                          <p className="text-gray-600">
                            <span className="font-medium">Payment Method:</span> {application.paymentMethod || 'N/A'}
                          </p>
                        </div>
                      </div>
                      
                      {application.propertyUrl && (
                        <div className="mt-3">
                          <a
                            href={application.propertyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm underline"
                          >
                            View Property →
                          </a>
                        </div>
                      )}
                    </div>
                    
                    {/* Actions */}
                    {application.status === 'pending' && (
                      <div className="ml-6 space-y-2">
                        <button
                          onClick={() => handleApplicationAction(application.id, 'approve', application.requestedBadgeColor)}
                          className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                        >
                          <FaCheckCircle className="inline mr-2" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleApplicationAction(application.id, 'reject')}
                          className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                        >
                          <FaTimesCircle className="inline mr-2" />
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Badge Preview */}
                  {application.status === 'approved' && application.badgeColor && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-700 mr-3">Badge Color:</span>
                        <div
                          className="w-6 h-6 rounded-full border-2 border-gray-300"
                          style={{ backgroundColor: application.badgeColor }}
                        ></div>
                        <span className="ml-2 text-sm text-gray-600">{application.badgeColor}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default AdminVerificationCenter;

import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  FaShieldAlt,
  FaMoneyBillWave,
  FaCheckCircle,
  FaTimesCircle,
  FaBrush,
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
      handleAuthFailure('Admin authentication required. Please log in again.');
      throw new Error('Admin authentication required');
    }

    const response = await authenticatedFetch(getApiUrl(path), options);

    if (response.status === 401) {
      handleAuthFailure('Admin authentication expired. Please log in again.');
      throw new Error('Admin authentication required');
    }

    return response;
  };

  const fetchApplications = async () => {
    // Prevent multiple simultaneous calls
    if (loadingApplications) {
      return;
    }
    
    setLoadingApplications(true);
    setApplicationsError('');
    try {
      if (!hasAdminAccess) {
        setApplicationsError('Admin authentication required. Showing mock applications.');
        setApplications(MOCK_APPLICATIONS);
        return;
      }

      const response = await requestWithAdminAuth('/verification/applications');
      if (!response.ok) {
        throw new Error('Unable to load verification applications');
      }
      const data = await response.json();
      setApplications(Array.isArray(data.data) ? data.data : []);
    } catch (error) {
      console.warn('AdminVerificationCenter: failed to fetch applications', error);
      setApplicationsError('Live applications unavailable, showing mock data.');
      setApplications(MOCK_APPLICATIONS);
    } finally {
      setLoadingApplications(false);
    }
  };

  useEffect(() => {
    // Only fetch when we have admin access and haven't fetched yet
    if (hasAdminAccess !== null && hasAdminAccess && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchApplications();
    } else if (hasAdminAccess === false) {
      // Set mock data immediately if no admin access
      setApplications(MOCK_APPLICATIONS);
      setApplicationsError('Admin authentication required. Showing mock applications.');
      setLoadingApplications(false);
    }
  }, [hasAdminAccess]);

  const stats = useMemo(() => {
    const pending = applications.filter((app) => app.status === 'pending').length;
    const approved = applications.filter((app) => app.status === 'approved').length;
    const rejected = applications.filter((app) => app.status === 'rejected').length;
    const revenue = applications
      .filter((app) => app.status === 'approved')
      .reduce((sum, app) => sum + (app.verificationFee || verificationFee), 0);
    return {
      total: applications.length,
      pending,
      approved,
      rejected,
      revenue
    };
  }, [applications, verificationFee]);

  const handleSaveSettings = async () => {
    try {
      setSavingSettings(true);
      const response = await requestWithAdminAuth('/admin/settings', {
        method: 'PUT',
        body: JSON.stringify({
          verificationFee: parseInt(verificationFee, 10) || 0,
          verificationBadgeColor: badgeColor
        })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to save settings');
      }
      toast.success('Verification settings updated');
      onConfigChange?.({
        verificationFee: parseInt(verificationFee, 10) || 0,
        verificationBadgeColor: badgeColor
      });
    } catch (error) {
      toast.error(error?.message || 'Unable to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleDecision = async (application, status) => {
    try {
      const notes = window.prompt(`Add notes for ${status} decision (optional):`, '') || '';
      const selectedColor = decisionColors[application.id] || badgeColor;
      const response = await requestWithAdminAuth(`/verification/applications/${application.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          adminNotes: notes,
          badgeColor: status === 'approved' ? selectedColor : undefined
        })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to update application');
      }
      toast.success(`Application ${status}`);
      setApplications((prev) => prev.map((item) => (item.id === application.id ? data.data : item)));
    } catch (error) {
      toast.error(error?.message || 'Unable to update application');
    }
  };

  const renderStatusBadge = (status) => {
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.Icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="h-3.5 w-3.5" />
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Applications</p>
              <p className="text-3xl font-semibold mt-2">{stats.total}</p>
            </div>
            <FaShieldAlt className="text-3xl" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 text-white rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm">Pending Review</p>
              <p className="text-3xl font-semibold mt-2">{stats.pending}</p>
            </div>
            <FaClock className="text-3xl" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Approved</p>
              <p className="text-3xl font-semibold mt-2">{stats.approved}</p>
            </div>
            <FaCheckCircle className="text-3xl" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm">Rejected</p>
              <p className="text-3xl font-semibold mt-2">{stats.rejected}</p>
            </div>
            <FaTimesCircle className="text-3xl" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Badge Revenue</p>
              <p className="text-3xl font-semibold mt-2">
                ₦{stats.revenue.toLocaleString('en-NG')}
              </p>
            </div>
            <FaMoneyBillWave className="text-3xl" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex flex-col gap-2 mb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Verification Settings</h3>
            <p className="text-sm text-gray-500">Set the fee and badge color applicants will pay for.</p>
          </div>
          <FaBrush className="text-blue-500 text-xl" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-gray-700">Verification Fee (NGN)</label>
            <input
              type="number"
              min={0}
              value={verificationFee}
              onChange={(event) => setVerificationFee(event.target.value)}
              className="mt-1 w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="50000"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Badge Accent Color</label>
            <div className="flex items-center gap-4 mt-2">
              <input
                type="color"
                value={badgeColor}
                onChange={(event) => setBadgeColor(event.target.value)}
                className="h-12 w-12 rounded-lg border border-gray-200 cursor-pointer"
              />
              <div>
                <p className="text-sm text-gray-500">Live preview</p>
                <div
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold text-white"
                  style={{ backgroundColor: badgeColor }}
                >
                  <FaShieldAlt /> Verified by PropertyArk
                </div>
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={handleSaveSettings}
          disabled={savingSettings}
          className={`mt-6 w-full sm:w-auto px-5 py-2.5 rounded-lg text-white font-medium transition ${
            savingSettings ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {savingSettings ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Applications</h3>
            <p className="text-sm text-gray-500">Review, approve, or reject verification applications.</p>
          </div>
          <FaClipboardList className="text-blue-500 text-xl" />
        </div>

        {applicationsError && (
          <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
            {applicationsError}
          </div>
        )}

        {loadingApplications ? (
          <div className="flex items-center justify-center py-16 text-gray-500">Loading applications...</div>
        ) : applications.length === 0 ? (
          <div className="text-center py-16 text-gray-500">No verification applications yet.</div>
        ) : (
          <div className="space-y-4">
            {applications.map((application) => (
              <div key={application.id} className="border border-gray-100 rounded-2xl p-5 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h4 className="text-lg font-semibold text-gray-900">{application.propertyName}</h4>
                      {renderStatusBadge(application.status)}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{application.propertyLocation}</p>
                    <p className="text-sm text-gray-500">
                      Applicant: {application.applicant?.name || application.applicant?.email}
                    </p>
                    {application.propertyUrl && (
                      <a
                        href={application.propertyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 text-sm"
                      >
                        View listing
                      </a>
                    )}
                  </div>
                  <div className="flex flex-col gap-3 w-full md:w-auto">
                    <div className="text-sm">
                      <p className="text-gray-500">Fee paid</p>
                      <p className="text-gray-900 font-semibold">
                        ₦{(application.verificationFee || verificationFee).toLocaleString('en-NG')}
                      </p>
                    </div>
                    {application.status === 'pending' ? (
                      <div className="flex flex-col gap-2">
                        <label className="text-xs text-gray-500">Badge color</label>
                        <input
                          type="color"
                          value={decisionColors[application.id] || application.requestedBadgeColor || badgeColor}
                          onChange={(event) =>
                            setDecisionColors((prev) => ({ ...prev, [application.id]: event.target.value }))
                          }
                          className="h-10 w-full rounded-lg border border-gray-200 cursor-pointer"
                        />
                        <div className="flex flex-col sm:flex-row gap-2">
                          <button
                            onClick={() => handleDecision(application, 'approved')}
                            className="flex-1 px-4 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleDecision(application, 'rejected')}
                            className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1 text-sm text-gray-500">
                        <p>Decision: {application.status}</p>
                        {application.adminNotes && <p>Notes: {application.adminNotes}</p>}
                        {application.badgeColor && (
                          <div className="flex items-center gap-2">
                            <span>Badge color:</span>
                            <span
                              className="inline-block h-6 w-14 rounded-full border border-gray-200"
                              style={{ backgroundColor: application.badgeColor }}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminVerificationCenter;

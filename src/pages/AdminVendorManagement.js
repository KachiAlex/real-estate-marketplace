import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { getApiUrl } from '../utils/apiConfig';
import { authenticatedFetch } from '../utils/authToken';

const AdminVendorManagement = () => {
  const { user } = useAuth();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    kycStatus: 'all',
    page: 1,
    limit: 20
  });
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showKycModal, setShowKycModal] = useState(false);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchVendors();
      fetchAnalytics();
    }
  }, [user, filters]);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: filters.page,
        limit: filters.limit,
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.kycStatus !== 'all' && { kycStatus: filters.kycStatus })
      });

      const response = await authenticatedFetch(getApiUrl(`/admin/vendors?${queryParams}`));
      if (response.ok) {
        const data = await response.json();
        setVendors(data.vendors);
      }
    } catch (error) {
      toast.error('Failed to fetch vendors');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await authenticatedFetch(getApiUrl('/admin/subscription-analytics'));
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.analytics);
      }
    } catch (error) {
      console.error('Failed to fetch analytics');
    }
  };

  const handleKycAction = async (vendorId, action, documentUpdates = [], rejectionReasons = []) => {
    try {
      const response = await authenticatedFetch(getApiUrl(`/admin/vendors/${vendorId}/kyc/verify`), {
        method: 'POST',
        body: JSON.stringify({
          action,
          documentUpdates,
          rejectionReasons
        })
      });

      if (response.ok) {
        toast.success(`KYC ${action}d successfully`);
        fetchVendors();
        setShowKycModal(false);
        setSelectedVendor(null);
      }
    } catch (error) {
      toast.error(`Failed to ${action} KYC`);
    }
  };

  const handleVendorAction = async (vendorId, action) => {
    try {
      let endpoint, method, body;
      const reason = action === 'suspend' ? prompt('Enter suspension reason:') : null;

      if (action === 'suspend') {
        endpoint = `/admin/vendors/${vendorId}/suspend`;
        method = 'POST';
        body = { reason };
      } else if (action === 'activate') {
        endpoint = `/admin/vendors/${vendorId}/activate`;
        method = 'POST';
      }

      const response = await authenticatedFetch(getApiUrl(endpoint), {
        method,
        body: JSON.stringify(body)
      });

      if (response.ok) {
        toast.success(`Vendor ${action}d successfully`);
        fetchVendors();
        fetchAnalytics();
      }
    } catch (error) {
      toast.error(`Failed to ${action} vendor`);
    }
  };

  const getStatusBadge = (status, type = 'subscription') => {
    const statusConfig = {
      subscription: {
        active: 'bg-green-100 text-green-800',
        inactive: 'bg-red-100 text-red-800',
        suspended: 'bg-yellow-100 text-yellow-800'
      },
      kyc: {
        pending: 'bg-yellow-100 text-yellow-800',
        under_review: 'bg-blue-100 text-blue-800',
        approved: 'bg-green-100 text-green-800',
        rejected: 'bg-red-100 text-red-800'
      }
    };

    return `px-2 py-1 rounded-full text-xs font-medium ${statusConfig[type][status] || 'bg-gray-100 text-gray-800'}`;
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Vendor Management</h1>
        <p className="text-gray-600">Manage vendor accounts, KYC verification, and subscriptions</p>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-gray-900">{analytics.totalVendors}</div>
            <div className="text-sm text-gray-600">Total Vendors</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-green-600">{analytics.activeSubscriptions}</div>
            <div className="text-sm text-gray-600">Active Subscriptions</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-red-600">{analytics.inactiveSubscriptions}</div>
            <div className="text-sm text-gray-600">Inactive Subscriptions</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-blue-600">₦{analytics.monthlyRevenue?.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Monthly Revenue</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subscription Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">KYC Status</label>
            <select
              value={filters.kycStatus}
              onChange={(e) => setFilters(prev => ({ ...prev, kycStatus: e.target.value, page: 1 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All KYC Status</option>
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Items per page</label>
            <select
              value={filters.limit}
              onChange={(e) => setFilters(prev => ({ ...prev, limit: parseInt(e.target.value), page: 1 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </div>
        </div>
      </div>

      {/* Vendors Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading vendors...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subscription
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    KYC Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vendors.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{vendor.name}</div>
                        <div className="text-sm text-gray-500">{vendor.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getStatusBadge(vendor.subscriptionActive ? 'active' : 'inactive', 'subscription')}>
                        {vendor.subscriptionActive ? 'Active' : 'Inactive'}
                      </span>
                      {vendor.suspensionDate && (
                        <div className="text-xs text-red-600 mt-1">
                          Suspended: {new Date(vendor.suspensionDate).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getStatusBadge(vendor.kycStatus, 'kyc')}>
                        {vendor.kycStatus.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(vendor.joinedDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedVendor(vendor);
                            setShowKycModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Review KYC
                        </button>
                        {vendor.subscriptionActive ? (
                          <button
                            onClick={() => handleVendorAction(vendor.id, 'suspend')}
                            className="text-red-600 hover:text-red-900"
                          >
                            Suspend
                          </button>
                        ) : (
                          <button
                            onClick={() => handleVendorAction(vendor.id, 'activate')}
                            className="text-green-600 hover:text-green-900"
                          >
                            Activate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* KYC Review Modal */}
      {showKycModal && selectedVendor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">KYC Review - {selectedVendor.name}</h2>
                <button
                  onClick={() => {
                    setShowKycModal(false);
                    setSelectedVendor(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Business Information</h3>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Business Name:</span> {selectedVendor.businessName}</div>
                      <div><span className="font-medium">Business Type:</span> {selectedVendor.businessType}</div>
                      <div><span className="font-medium">License Number:</span> {selectedVendor.licenseNumber}</div>
                      <div><span className="font-medium">Experience:</span> {selectedVendor.experience}</div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Contact Information</h3>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Email:</span> {selectedVendor.email}</div>
                      <div><span className="font-medium">Phone:</span> {selectedVendor.phone}</div>
                      <div><span className="font-medium">Address:</span> {selectedVendor.address}</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Documents</h3>
                  <div className="space-y-3">
                    {selectedVendor.documents?.map((doc, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">{doc.type.replace('_', ' ').toUpperCase()}</div>
                            <div className="text-sm text-gray-600">Document Number: {doc.documentNumber}</div>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            doc.status === 'verified' ? 'bg-green-100 text-green-800' :
                            doc.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {doc.status}
                          </span>
                        </div>
                        {doc.rejectionReason && (
                          <div className="mt-2 text-sm text-red-600">
                            Rejection Reason: {doc.rejectionReason}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
                <button
                  onClick={() => handleKycAction(selectedVendor.id, 'reject')}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Reject KYC
                </button>
                <button
                  onClick={() => handleKycAction(selectedVendor.id, 'approve')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Approve KYC
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminVendorManagement;

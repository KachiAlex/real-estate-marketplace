import React, { useState, useEffect } from 'react';
import { FaUsers, FaCreditCard, FaExclamationTriangle, FaCheckCircle, FaTimesCircle, FaClock, FaChartLine, FaSearch, FaFilter, FaEdit, FaBan, FaPlus } from 'react-icons/fa';
import { getApiUrl } from '../utils/apiConfig';
import { useAuth } from '../contexts/AuthContext';
import { authenticatedFetch } from '../utils/authToken';

const AdminSubscriptionDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [payments, setPayments] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [showExtendTrial, setShowExtendTrial] = useState(false);
  const [showSuspendVendor, setShowSuspendVendor] = useState(false);

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchStats();
    } else if (activeTab === 'subscriptions') {
      fetchSubscriptions();
    } else if (activeTab === 'payments') {
      fetchPayments();
    } else if (activeTab === 'plans') {
      fetchPlans();
    }
  }, [activeTab, currentPage, statusFilter, searchTerm]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch(getApiUrl('/admin/subscription/stats'));
      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 20,
        ...(statusFilter && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm })
      });

      const response = await authenticatedFetch(getApiUrl(`/admin/subscription/subscriptions?${params}`));
      if (response.ok) {
        const data = await response.json();
        setSubscriptions(data.data);
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      setError('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 20,
        ...(statusFilter && { status: statusFilter })
      });

      const response = await authenticatedFetch(getApiUrl(`/admin/subscription/payments?${params}`));
      if (response.ok) {
        const data = await response.json();
        setPayments(data.data);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      setError('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch(getApiUrl('/admin/subscription/plans'));
      if (response.ok) {
        const data = await response.json();
        setPlans(data.data);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      setError('Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  const updateSubscriptionStatus = async (subscriptionId, status, reason = '') => {
    try {
      const response = await authenticatedFetch(getApiUrl(`/admin/subscription/${subscriptionId}/status`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reason })
      });

      if (response.ok) {
        fetchSubscriptions();
        setSelectedSubscription(null);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to update subscription');
      }
    } catch (error) {
      console.error('Error updating subscription:', error);
      setError('Failed to update subscription');
    }
  };

  const extendTrial = async (subscriptionId, days, reason) => {
    try {
      const response = await authenticatedFetch(getApiUrl(`/admin/subscription/${subscriptionId}/extend-trial`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days, reason })
      });

      if (response.ok) {
        fetchSubscriptions();
        setShowExtendTrial(false);
        setSelectedSubscription(null);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to extend trial');
      }
    } catch (error) {
      console.error('Error extending trial:', error);
      setError('Failed to extend trial');
    }
  };

  const suspendVendor = async (vendorId, reason) => {
    try {
      const response = await authenticatedFetch(getApiUrl(`/admin/subscription/suspend-vendor/${vendorId}`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });

      if (response.ok) {
        fetchSubscriptions();
        setShowSuspendVendor(false);
        setSelectedSubscription(null);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to suspend vendor');
      }
    } catch (error) {
      console.error('Error suspending vendor:', error);
      setError('Failed to suspend vendor');
    }
  };

  const formatCurrency = (amount, currency = 'NGN') => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'trial':
        return <FaClock className="text-yellow-500" />;
      case 'active':
        return <FaCheckCircle className="text-green-500" />;
      case 'expired':
        return <FaExclamationTriangle className="text-red-500" />;
      case 'suspended':
        return <FaBan className="text-gray-600" />;
      case 'cancelled':
        return <FaTimesCircle className="text-gray-500" />;
      default:
        return <FaExclamationTriangle className="text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'trial':
        return 'bg-yellow-100 text-yellow-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'suspended':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900">Subscription Management</h2>
        <p className="text-gray-600">Manage vendor subscriptions and billing</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <FaExclamationTriangle className="text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            {['overview', 'subscriptions', 'payments', 'plans'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-600 text-sm font-medium">Total Subscriptions</p>
                    <p className="text-2xl font-bold text-blue-900">{stats.totalSubscriptions}</p>
                  </div>
                  <FaUsers className="text-blue-500 text-2xl" />
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-600 text-sm font-medium">Active</p>
                    <p className="text-2xl font-bold text-green-900">{stats.activeSubscriptions}</p>
                  </div>
                  <FaCheckCircle className="text-green-500 text-2xl" />
                </div>
              </div>

              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-600 text-sm font-medium">Trial</p>
                    <p className="text-2xl font-bold text-yellow-900">{stats.trialSubscriptions}</p>
                  </div>
                  <FaClock className="text-yellow-500 text-2xl" />
                </div>
              </div>

              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-600 text-sm font-medium">Monthly Revenue</p>
                    <p className="text-2xl font-bold text-purple-900">{formatCurrency(stats.monthlyRevenue)}</p>
                  </div>
                  <FaChartLine className="text-purple-500 text-2xl" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-red-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-600 text-sm font-medium">Expired</p>
                    <p className="text-xl font-bold text-red-900">{stats.expiredSubscriptions}</p>
                  </div>
                  <FaExclamationTriangle className="text-red-500 text-xl" />
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Suspended</p>
                    <p className="text-xl font-bold text-gray-900">{stats.suspendedSubscriptions}</p>
                  </div>
                  <FaBan className="text-gray-500 text-xl" />
                </div>
              </div>

              <div className="bg-orange-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-600 text-sm font-medium">Expiring Soon</p>
                    <p className="text-xl font-bold text-orange-900">{stats.expiringTrials}</p>
                  </div>
                  <FaClock className="text-orange-500 text-xl" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Subscriptions Tab */}
        {activeTab === 'subscriptions' && (
          <div className="p-6">
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search vendors..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="trial">Trial</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="suspended">Suspended</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Subscriptions Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trial End</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {subscriptions.subscriptions?.map((subscription) => (
                    <tr key={subscription.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {subscription.vendor?.firstName} {subscription.vendor?.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{subscription.vendor?.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {subscription.plan}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(subscription.status)}`}>
                          {getStatusIcon(subscription.status)}
                          <span className="ml-1 capitalize">{subscription.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(subscription.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {subscription.trialEndDate ? formatDate(subscription.trialEndDate) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => setSelectedSubscription(subscription)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          <FaEdit />
                        </button>
                        {subscription.status === 'trial' && (
                          <button
                            onClick={() => {
                              setSelectedSubscription(subscription);
                              setShowExtendTrial(true);
                            }}
                            className="text-green-600 hover:text-green-900 mr-3"
                          >
                            <FaClock />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedSubscription(subscription);
                            setShowSuspendVendor(true);
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          <FaBan />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {subscriptions.pagination && (
              <div className="mt-4 flex justify-between items-center">
                <div className="text-sm text-gray-700">
                  Showing {((subscriptions.pagination.page - 1) * subscriptions.pagination.limit) + 1} to{' '}
                  {Math.min(subscriptions.pagination.page * subscriptions.pagination.limit, subscriptions.pagination.total)} of{' '}
                  {subscriptions.pagination.total} results
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(subscriptions.pagination.pages, currentPage + 1))}
                    disabled={currentPage === subscriptions.pagination.pages}
                    className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Other tabs content would go here */}
      </div>

      {/* Modals would go here */}
    </div>
  );
};

export default AdminSubscriptionDashboard;

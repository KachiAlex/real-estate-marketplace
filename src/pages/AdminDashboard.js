import React, { useState, useEffect, useCallback } from 'react';
import { useProperty } from '../contexts/PropertyContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const AdminDashboard = () => {
  const { user } = useAuth();
  const { 
    properties, 
    loading, 
    error, 
    fetchAdminProperties, 
    verifyProperty 
  } = useProperty();
  const navigate = useNavigate();
  const location = useLocation();
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedVerificationStatus, setSelectedVerificationStatus] = useState('');
  const [verificationNotes, setVerificationNotes] = useState('');
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [activeTab, setActiveTab] = useState('properties');
  const [escrows, setEscrows] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [users, setUsers] = useState([]);
  const [settings, setSettings] = useState({ verificationFee: 50000 });
  const [savingSettings, setSavingSettings] = useState(false);

  const loadAdminData = useCallback(async () => {
    const adminStats = await fetchAdminProperties(selectedStatus, selectedVerificationStatus);
    if (adminStats) {
      setStats(adminStats);
    }
  }, [fetchAdminProperties, selectedStatus, selectedVerificationStatus]);

  useEffect(() => {
    console.log('AdminDashboard: User state:', user);
    console.log('AdminDashboard: User role:', user?.role);
    console.log('AdminDashboard: Is admin?', user?.role === 'admin');
    
    if (!user || user.role !== 'admin') {
      console.log('AdminDashboard: Redirecting to login - user:', user, 'role:', user?.role);
      navigate('/login');
      return;
    }
    loadAdminData();
  }, [user, navigate, loadAdminData]);

  // Initialize activeTab from URL once on mount
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const t = params.get('tab');
    if (t && ['properties','escrow','disputes','users','settings'].includes(t)) {
      setActiveTab(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSwitchTab = (tabId) => {
    setActiveTab(tabId);
    const params = new URLSearchParams(location.search);
    params.set('tab', tabId);
    navigate({ pathname: '/admin', search: params.toString() }, { replace: true });
  };

  // Load other admin data
  useEffect(() => {
    const load = async () => {
      try {
        const [escrowRes, usersRes, settingsRes] = await Promise.all([
          fetch('/api/admin/escrow').then(r => r.json()).catch(() => ({ success: false })),
          fetch('/api/admin/users').then(r => r.json()).catch(() => ({ success: false })),
          fetch('/api/admin/settings').then(r => r.json()).catch(() => ({ success: false }))
        ]);

        if (escrowRes?.success) {
          setEscrows(escrowRes.data || []);
          setDisputes((escrowRes.data || []).filter(e => (e.status || '').toLowerCase() === 'disputed'));
        }
        if (usersRes?.success) setUsers(usersRes.data || []);
        if (settingsRes?.success) setSettings(settingsRes.data || settings);
      } catch (_) {}
    };
    if (user && user.role === 'admin') {
      load();
    }
  }, [user, settings]);

  const handleResolveEscrow = async (escrowId, decision) => {
    try {
      const res = await fetch(`/api/admin/escrow/${escrowId}/resolve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision })
      });
      const data = await res.json();
      if (data.success) {
        const esc = await fetch('/api/admin/escrow').then(r => r.json());
        if (esc.success) {
          setEscrows(esc.data || []);
          setDisputes((esc.data || []).filter(e => (e.status || '').toLowerCase() === 'disputed'));
        }
      }
    } catch (_) {}
  };

  const handleSaveSettings = async () => {
    try {
      setSavingSettings(true);
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verificationFee: Number(settings.verificationFee || 0) })
      });
      const data = await res.json();
      if (data.success) setSettings(data.data);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleStatusFilter = (status) => {
    setSelectedStatus(status);
    fetchAdminProperties(status, selectedVerificationStatus);
  };

  const handleVerificationFilter = (verificationStatus) => {
    setSelectedVerificationStatus(verificationStatus);
    fetchAdminProperties(selectedStatus, verificationStatus);
  };

  const handleVerifyProperty = async (propertyId, verificationStatus) => {
    const success = await verifyProperty(propertyId, verificationStatus, verificationNotes);
    if (success) {
      setVerificationNotes('');
      setSelectedProperty(null);
      loadAdminData();
    }
  };

  const openVerificationModal = (property) => {
    setSelectedProperty(property);
    setVerificationNotes('');
  };

  const closeVerificationModal = () => {
    setSelectedProperty(null);
    setVerificationNotes('');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">Property verification and management</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {[
              { id: 'properties', label: 'Properties' },
              { id: 'escrow', label: 'Escrow' },
              { id: 'disputes', label: 'Disputes' },
              { id: 'users', label: 'Users' },
              { id: 'settings', label: 'Settings' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => handleSwitchTab(tab.id)}
                className={`${activeTab === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Stats Cards (properties tab only) */}
        {activeTab === 'properties' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Properties</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Review</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.pending || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.approved || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-red-100 text-red-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.rejected || 0}</p>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Filters (properties tab only) */}
        {activeTab === 'properties' && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Property Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => handleStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="for-sale">For Sale</option>
                <option value="for-rent">For Rent</option>
                <option value="for-lease">For Lease</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Verification Status</label>
              <select
                value={selectedVerificationStatus}
                onChange={(e) => handleVerificationFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Verification Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>
        )}

        {/* Properties Table */}
        {activeTab === 'properties' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Properties</h2>
          </div>
          
          {error && (
            <div className="px-6 py-4 bg-red-50 border-b border-red-200">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Listed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Verification
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {properties.map((property) => (
                  <tr key={property.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12">
                          <img
                            className="h-12 w-12 rounded-lg object-cover"
                            src={property.images[0]?.url || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=100&h=100&fit=crop'}
                            alt={property.title}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {property.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {(() => {
                              if (typeof property.location === 'string') {
                                return property.location;
                              }
                              if (property.location && typeof property.location === 'object') {
                                const address = property.location.address || '';
                                const city = property.location.city || '';
                                return `${address}${address && city ? ', ' : ''}${city}`.trim();
                              }
                              return 'Location not specified';
                            })()}
                          </div>
                          <div className="text-sm text-gray-500">
                            ${property.price.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {property.owner?.firstName} {property.owner?.lastName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {property.createdAt ? new Date(property.createdAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        property.status === 'for-sale' ? 'bg-green-100 text-green-800' :
                        property.status === 'for-rent' ? 'bg-blue-100 text-blue-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {property.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(() => {
                        const vStatus = (property.verificationStatus || 'pending').toLowerCase();
                        const badgeClass = vStatus === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : vStatus === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800';
                        const label = vStatus.charAt(0).toUpperCase() + vStatus.slice(1);
                        return (
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${badgeClass}`}>
                            {label}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {property.verificationStatus === 'pending' && (
                        <button
                          onClick={() => openVerificationModal(property)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          Review
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/property/${property.id}`)}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        )}

        {/* Escrow Tab */}
        {activeTab === 'escrow' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Escrow Transactions</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Buyer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seller</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {escrows.map(tx => (
                    <tr key={tx.id}>
                      <td className="px-6 py-4 text-sm">{tx.id}</td>
                      <td className="px-6 py-4 text-sm">{tx.propertyTitle}</td>
                      <td className="px-6 py-4 text-sm">{tx.buyerName}</td>
                      <td className="px-6 py-4 text-sm">{tx.sellerName}</td>
                      <td className="px-6 py-4 text-sm">₦{Number(tx.amount || 0).toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm">{(tx.status || '').toUpperCase()}</td>
                      <td className="px-6 py-4 text-sm space-x-2">
                        <button onClick={() => handleResolveEscrow(tx.id, 'approve')} className="text-green-600 hover:text-green-800">Approve</button>
                        <button onClick={() => handleResolveEscrow(tx.id, 'reject')} className="text-red-600 hover:text-red-800">Reject</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Disputes Tab */}
        {activeTab === 'disputes' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Disputes</h2>
              <p className="text-sm text-gray-500">Transactions requiring admin mediation</p>
            </div>
            <div className="p-6">
              {disputes.length === 0 ? (
                <p className="text-gray-600">No disputes at the moment.</p>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {disputes.map(d => (
                    <li key={d.id} className="py-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{d.propertyTitle}</p>
                        <p className="text-sm text-gray-500">Buyer: {d.buyerName} · Seller: {d.sellerName}</p>
                      </div>
                      <div className="space-x-3">
                        <button onClick={() => handleResolveEscrow(d.id, 'approve')} className="text-green-600 hover:text-green-800">Approve</button>
                        <button onClick={() => handleResolveEscrow(d.id, 'reject')} className="text-red-600 hover:text-red-800">Reject</button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Users</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map(u => (
                    <tr key={u.id}>
                      <td className="px-6 py-4 text-sm">{u.firstName} {u.lastName}</td>
                      <td className="px-6 py-4 text-sm">{u.email}</td>
                      <td className="px-6 py-4 text-sm">{u.role}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Settings</h2>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Verification Fee (NGN)</label>
                <input
                  type="number"
                  className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={settings.verificationFee}
                  onChange={(e) => setSettings(s => ({ ...s, verificationFee: e.target.value }))}
                  min={0}
                />
                <button
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                  className={`ml-3 px-4 py-2 rounded-md text-white ${savingSettings ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                  {savingSettings ? 'Saving...' : 'Save'}
                </button>
              </div>
              <div className="text-sm text-gray-500">Vendors will be charged this amount when requesting property verification.</div>
            </div>
          </div>
        )}
      </div>

      {/* Verification Modal */}
      {selectedProperty && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Verify Property: {selectedProperty.title}
              </h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Notes
                </label>
                <textarea
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add verification notes..."
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => handleVerifyProperty(selectedProperty.id, 'approved')}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleVerifyProperty(selectedProperty.id, 'rejected')}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Reject
                </button>
                <button
                  onClick={closeVerificationModal}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard; 
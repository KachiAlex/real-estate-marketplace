import React, { useState, useEffect, useCallback } from 'react';
import { useProperty } from '../contexts/PropertyContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import AdminSidebar from '../components/layout/AdminSidebar';
import BlogManagement from '../components/BlogManagement';

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
  const [vendors, setVendors] = useState([]);
  const [buyers, setBuyers] = useState([]);
  const [settings, setSettings] = useState({ verificationFee: 50000 });
  const [savingSettings, setSavingSettings] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20
  });

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
        console.log('AdminDashboard: Loading admin data...');
        
        // Try to fetch from backend API first
        const [escrowRes, usersRes, vendorsRes, buyersRes, settingsRes, disputesRes] = await Promise.all([
          fetch('/api/admin/escrow').then(r => r.json()).catch(err => {
            console.log('AdminDashboard: Escrow API failed:', err);
            return { success: false };
          }),
          fetch(`/api/admin/users?page=${pagination.currentPage}&limit=${pagination.itemsPerPage}`).then(r => r.json()).catch(err => {
            console.log('AdminDashboard: Users API failed:', err);
            return { success: false };
          }),
          fetch('/api/admin/vendors').then(r => r.json()).catch(err => {
            console.log('AdminDashboard: Vendors API failed:', err);
            return { success: false };
          }),
          fetch('/api/admin/buyers').then(r => r.json()).catch(err => {
            console.log('AdminDashboard: Buyers API failed:', err);
            return { success: false };
          }),
          fetch('/api/admin/settings').then(r => r.json()).catch(err => {
            console.log('AdminDashboard: Settings API failed:', err);
            return { success: false };
          }),
          fetch('/api/admin/disputes').then(r => r.json()).catch(err => {
            console.log('AdminDashboard: Disputes API failed:', err);
            return { success: false };
          })
        ]);

        console.log('AdminDashboard: API responses:', {
          escrowSuccess: escrowRes?.success,
          usersSuccess: usersRes?.success,
          vendorsSuccess: vendorsRes?.success,
          buyersSuccess: buyersRes?.success,
          settingsSuccess: settingsRes?.success,
          disputesSuccess: disputesRes?.success
        });

        // Set data from API responses or use fallback
        if (escrowRes?.success) {
          setEscrows(escrowRes.data || []);
          setDisputes((escrowRes.data || []).filter(e => (e.status || '').toLowerCase() === 'disputed'));
        } else {
          // Fallback mock data
          setEscrows([
            { id: '1', propertyId: '1', buyerId: '1', sellerId: '2', amount: 5000000, status: 'active', createdAt: new Date().toISOString() },
            { id: '2', propertyId: '2', buyerId: '3', sellerId: '4', amount: 7500000, status: 'disputed', createdAt: new Date().toISOString() }
          ]);
          setDisputes([
            { id: '2', propertyId: '2', buyerId: '3', sellerId: '4', amount: 7500000, status: 'disputed', createdAt: new Date().toISOString() }
          ]);
        }
        
        if (usersRes?.success) {
          setUsers(usersRes.data || []);
          if (usersRes.pagination) {
            setPagination(prev => ({
              ...prev,
              currentPage: usersRes.pagination.currentPage,
              totalPages: usersRes.pagination.totalPages,
              totalItems: usersRes.pagination.totalItems
            }));
          }
        } else {
          // Fallback mock users
          setUsers([
            { id: '1', firstName: 'John', lastName: 'Doe', email: 'john@example.com', role: 'user' },
            { id: '2', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com', role: 'user' },
            { id: '3', firstName: 'Admin', lastName: 'User', email: 'admin@example.com', role: 'admin' }
          ]);
        }
        
        if (vendorsRes?.success) {
          setVendors(vendorsRes.data || []);
        } else {
          setVendors(users.filter(u => u.role === 'user'));
        }
        
        if (buyersRes?.success) {
          setBuyers(buyersRes.data || []);
        } else {
          setBuyers(users.filter(u => u.role === 'user'));
        }
        
        if (settingsRes?.success) {
          setSettings(settingsRes.data || settings);
        }
        
        if (disputesRes?.success) {
          setDisputes(disputesRes.data || disputes);
        }
        
        console.log('AdminDashboard: Data loaded successfully');
      } catch (error) {
        console.error('AdminDashboard: Error loading admin data:', error);
      }
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

  // User management handlers
  const handleSuspendUser = async (userId) => {
    if (!window.confirm('Are you sure you want to suspend this user?')) return;
    
    try {
      const response = await fetch(`/api/admin/users/${userId}/suspend`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      
      if (data.success) {
        alert('User suspended successfully');
        loadAdminData();
      } else {
        alert('Failed to suspend user: ' + data.message);
      }
    } catch (error) {
      console.error('Error suspending user:', error);
      alert('Error suspending user');
    }
  };

  const handleActivateUser = async (userId) => {
    if (!window.confirm('Are you sure you want to activate this user?')) return;
    
    try {
      const response = await fetch(`/api/admin/users/${userId}/activate`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      
      if (data.success) {
        alert('User activated successfully');
        loadAdminData();
      } else {
        alert('Failed to activate user: ' + data.message);
      }
    } catch (error) {
      console.error('Error activating user:', error);
      alert('Error activating user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      
      if (data.success) {
        alert('User deleted successfully');
        loadAdminData();
      } else {
        alert('Failed to delete user: ' + data.message);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error deleting user');
    }
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
      <div className="flex min-h-screen bg-gray-50">
        <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className="flex-1 ml-64 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Admin Sidebar */}
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* Main Content */}
      <div className="flex-1 ml-64">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="px-6 py-6">
            <h1 className="text-3xl font-bold text-gray-900 capitalize">
              {activeTab} Management
            </h1>
            <p className="mt-2 text-gray-600">
              {activeTab === 'properties' && 'Property verification and management'}
              {activeTab === 'escrow' && 'Escrow transaction monitoring'}
              {activeTab === 'disputes' && 'Dispute resolution management'}
              {activeTab === 'users' && 'User account management'}
              {activeTab === 'blog' && 'Blog content management'}
              {activeTab === 'settings' && 'System configuration and settings'}
            </p>
          </div>
        </div>

        {/* Content Area */}
        <div className="px-6 py-8">

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
                              try {
                                if (typeof property.location === 'string') {
                                  return property.location;
                                }
                                if (property.location && typeof property.location === 'object') {
                                  const address = property.location.address || '';
                                  const city = property.location.city || '';
                                  const state = property.location.state || '';
                                  const result = [address, city, state].filter(Boolean).join(', ');
                                  return result || 'Location not specified';
                                }
                                return 'Location not specified';
                              } catch (error) {
                                console.error('Error rendering location:', error, property.location);
                                return 'Location not specified';
                              }
                            })()}
                          </div>
                          <div className="text-sm text-gray-500">
                            ${property.price.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(() => {
                        if (property.owner && typeof property.owner === 'object') {
                          const firstName = property.owner.firstName || '';
                          const lastName = property.owner.lastName || '';
                          return `${firstName} ${lastName}`.trim() || 'Unknown Owner';
                        }
                        return property.owner || 'Unknown Owner';
                      })()}
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
              <h2 className="text-lg font-medium text-gray-900">User Management</h2>
              <p className="text-sm text-gray-500 mt-1">Manage all users including buyers, vendors, and agents</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={user.avatar || 'https://picsum.photos/150/150'}
                              alt={`${user.firstName} ${user.lastName}`}
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-gray-500">ID: {user.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.email}</div>
                        <div className="text-sm text-gray-500">{user.phone || 'No phone'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                          user.role === 'user' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {user.isActive ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </button>
                        {user.role !== 'admin' && (
                          <>
                            {user.isActive ? (
                              <button
                                onClick={() => handleSuspendUser(user.id)}
                                className="text-yellow-600 hover:text-yellow-900"
                              >
                                Suspend
                              </button>
                            ) : (
                              <button
                                onClick={() => handleActivateUser(user.id)}
                                className="text-green-600 hover:text-green-900"
                              >
                                Activate
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
                    {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
                    {pagination.totalItems} results
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        if (pagination.currentPage > 1) {
                          setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }));
                          // Reload users with new page
                          loadAdminData();
                        }
                      }}
                      disabled={pagination.currentPage === 1}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        const pageNum = i + 1;
                        const isActive = pageNum === pagination.currentPage;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => {
                              setPagination(prev => ({ ...prev, currentPage: pageNum }));
                              loadAdminData();
                            }}
                            className={`px-3 py-1 text-sm border rounded-md ${
                              isActive
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={() => {
                        if (pagination.currentPage < pagination.totalPages) {
                          setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }));
                          // Reload users with new page
                          loadAdminData();
                        }
                      }}
                      disabled={pagination.currentPage === pagination.totalPages}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Blog Tab */}
        {activeTab === 'blog' && (
          <BlogManagement />
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

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                User Details: {selectedUser.firstName} {selectedUser.lastName}
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  <div className="text-sm text-gray-900">{selectedUser.firstName} {selectedUser.lastName}</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <div className="text-sm text-gray-900">{selectedUser.email}</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <div className="text-sm text-gray-900">{selectedUser.phone || 'Not provided'}</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <div className="text-sm text-gray-900">{selectedUser.role}</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <div className="text-sm text-gray-900">{selectedUser.isActive ? 'Active' : 'Suspended'}</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Joined</label>
                  <div className="text-sm text-gray-900">
                    {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : 'Unknown'}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Login</label>
                  <div className="text-sm text-gray-900">
                    {selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleDateString() : 'Unknown'}
                  </div>
                </div>
                
                {selectedUser.suspendedAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Suspended At</label>
                    <div className="text-sm text-gray-900">
                      {new Date(selectedUser.suspendedAt).toLocaleDateString()}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default AdminDashboard; 
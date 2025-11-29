import React, { useState, useEffect, useCallback } from 'react';
import { useProperty } from '../contexts/PropertyContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import AdminSidebar from '../components/layout/AdminSidebar';
import BlogManagement from '../components/BlogManagement';
import AdminPropertyVerification from '../components/AdminPropertyVerification';
import AdminPropertyDetailsModal from '../components/AdminPropertyDetailsModal';
import AdminDisputesManagement from '../components/AdminDisputesManagement';
import AdminMortgageBankVerification from '../components/AdminMortgageBankVerification';

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
  const [selectedUser, setSelectedUser] = useState(null);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [selectedPropertyForModal, setSelectedPropertyForModal] = useState(null);
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
    if (t && ['properties','verification','escrow','disputes','users','blog','mortgage-banks'].includes(t)) {
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
        console.log('AdminDashboard: Using mock data (API endpoints unavailable)');
        
        // Mock users data
        const mockUsers = [
          { id: '1', firstName: 'John', lastName: 'Doe', email: 'john@example.com', role: 'user', isVerified: true, createdAt: '2024-01-15' },
          { id: '2', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com', role: 'user', isVerified: true, createdAt: '2024-01-16' },
          { id: '3', firstName: 'Michael', lastName: 'Brown', email: 'michael@example.com', role: 'user', isVerified: true, createdAt: '2024-01-17' },
          { id: '4', firstName: 'Sarah', lastName: 'Johnson', email: 'sarah@example.com', role: 'user', isVerified: true, createdAt: '2024-01-18' },
          { id: '5', firstName: 'Admin', lastName: 'User', email: 'admin@example.com', role: 'admin', isVerified: true, createdAt: '2024-01-01' },
          { id: '6', firstName: 'Onyedikachi', lastName: 'Akoma', email: 'onyedika.akoma@gmail.com', role: 'user', isVerified: true, createdAt: '2024-01-20' }
        ];

        // Mock escrow data with full details
        const mockEscrows = [
          { 
            id: '1', 
            propertyId: '1', 
            propertyTitle: 'Luxury Villa in Lekki',
            buyerId: '1', 
            buyerName: 'John Doe',
            sellerId: '2', 
            sellerName: 'Jane Smith',
            amount: 50000000, 
            status: 'active', 
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() 
          },
          { 
            id: '2', 
            propertyId: '2', 
            propertyTitle: 'Modern Apartment in Victoria Island',
            buyerId: '3', 
            buyerName: 'Michael Brown',
            sellerId: '4', 
            sellerName: 'Sarah Johnson',
            amount: 75000000, 
            status: 'disputed', 
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() 
          },
          { 
            id: '3', 
            propertyId: '3', 
            propertyTitle: 'Penthouse in Ikoyi',
            buyerId: '6', 
            buyerName: 'Onyedikachi Akoma',
            sellerId: '1', 
            sellerName: 'John Doe',
            amount: 120000000, 
            status: 'pending', 
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() 
          }
        ];
        
        // Mock disputes data with full details
        const mockDisputes = [
          { 
            id: '2', 
            propertyId: '2', 
            propertyTitle: 'Modern Apartment in Victoria Island',
            buyerId: '3', 
            buyerName: 'Michael Brown',
            sellerId: '4', 
            sellerName: 'Sarah Johnson',
            amount: 75000000, 
            status: 'disputed', 
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() 
          }
        ];

        // Set mock data
        setEscrows(mockEscrows);
        setDisputes(mockDisputes);
        setUsers(mockUsers);
        
        // Set vendors as users with 'user' role
        setVendors(mockUsers.filter(u => u.role === 'user'));
        
        // Set buyers as users with 'user' role
        setBuyers(mockUsers.filter(u => u.role === 'user'));
        
        console.log('AdminDashboard: Data loaded successfully');
      } catch (error) {
        console.error('AdminDashboard: Error loading admin data:', error);
      }
    };
    
    if (user && user.role === 'admin') {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleResolveEscrow = async (escrowId, decision) => {
    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api-759115682573.us-central1.run.app';
      const res = await fetch(`${API_BASE_URL}/api/admin/escrow/${escrowId}/resolve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision })
      });
      const data = await res.json();
      if (data.success) {
        const esc = await fetch(`${API_BASE_URL}/api/admin/escrow`).then(r => r.json());
        if (esc.success) {
          setEscrows(esc.data || []);
          setDisputes((esc.data || []).filter(e => (e.status || '').toLowerCase() === 'disputed'));
        }
      }
    } catch (_) {}
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

  // Property modal handlers
  const openPropertyModal = (property) => {
    setSelectedPropertyForModal(property);
    setShowPropertyModal(true);
  };

  const closePropertyModal = () => {
    setSelectedPropertyForModal(null);
    setShowPropertyModal(false);
  };

  // Property approval/rejection handlers
  const handlePropertyApprove = async (propertyId, adminNotes) => {
    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api-759115682573.us-central1.run.app';
      console.log('Approving property:', propertyId, 'with notes:', adminNotes);
      
      const response = await fetch(`${API_BASE_URL}/api/properties/${propertyId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminNotes })
      });
      
      console.log('Approval response status:', response.status);
      const data = await response.json();
      console.log('Approval response data:', data);
      
      if (response.ok) {
        alert('Property approved successfully!');
        // Refresh properties list
        loadAdminData();
        // Send notification to vendor (simulated)
        await sendNotificationToVendor(propertyId, 'approved', adminNotes);
      } else {
        throw new Error(data.error || `HTTP ${response.status}: Failed to approve property`);
      }
    } catch (error) {
      console.error('Error approving property:', error);
      throw error;
    }
  };

  const handlePropertyReject = async (propertyId, rejectionReason, adminNotes) => {
    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api-759115682573.us-central1.run.app';
      console.log('Rejecting property:', propertyId, 'with reason:', rejectionReason);
      
      const response = await fetch(`${API_BASE_URL}/api/properties/${propertyId}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectionReason, adminNotes })
      });
      
      console.log('Rejection response status:', response.status);
      const data = await response.json();
      console.log('Rejection response data:', data);
      
      if (response.ok) {
        alert('Property rejected successfully!');
        // Refresh properties list
        loadAdminData();
        // Send notification to vendor
        await sendNotificationToVendor(propertyId, 'rejected', rejectionReason);
      } else {
        throw new Error(data.error || `HTTP ${response.status}: Failed to reject property`);
      }
    } catch (error) {
      console.error('Error rejecting property:', error);
      throw error;
    }
  };

  // Send notification to vendor (simulated)
  const sendNotificationToVendor = async (propertyId, action, message) => {
    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api-759115682573.us-central1.run.app';
      
      // Find the property to get vendor info
      const property = properties.find(p => p.id === propertyId);
      if (!property) return;

      const notificationData = {
        userId: property.vendorId || property.ownerId,
        type: 'property_approval',
        title: `Property ${action === 'approved' ? 'Approved for Listing' : 'Rejected'}`,
        message: action === 'approved' 
          ? `Your property "${property.title}" has been approved and is now visible on the home page for buyers to see.`
          : `Your property "${property.title}" listing was rejected: ${message}`,
        data: {
          propertyId,
          action,
          propertyTitle: property.title,
          adminNotes: message
        }
      };

      await fetch(`${API_BASE_URL}/api/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notificationData)
      });

      console.log(`Notification sent to vendor for property ${action}:`, notificationData);
    } catch (error) {
      console.error('Error sending notification to vendor:', error);
    }
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
              {activeTab === 'verification' && 'Property verification requests and approvals'}
              {activeTab === 'escrow' && 'Escrow transaction monitoring'}
              {activeTab === 'disputes' && 'Dispute resolution management'}
                             {activeTab === 'users' && 'User account management'}
               {activeTab === 'blog' && 'Blog content management'}
               {activeTab === 'mortgage-banks' && 'Mortgage bank verification and management'}
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
                <p className="text-sm font-medium text-gray-600">Pending Approval</p>
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
                <p className="text-sm font-medium text-gray-600">Approved for Listing</p>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Approval Status</label>
              <select
                value={selectedVerificationStatus}
                onChange={(e) => handleVerificationFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Approval Status</option>
                <option value="pending">Pending Approval</option>
                <option value="approved">Approved for Listing</option>
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
                    Approval Status
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
                      {(() => {
                        try {
                          const dateValue = property.createdAt || property.listedDate || property.datePosted;
                          if (!dateValue) return '-';
                          
                          const date = new Date(dateValue);
                          // Check if date is valid
                          if (isNaN(date.getTime())) return '-';
                          
                          // Format as MM/DD/YYYY or use toLocaleDateString
                          return date.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          });
                        } catch (error) {
                          console.error('Error formatting date:', error, property);
                          return '-';
                        }
                      })()}
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
                        const approvalStatus = property.approvalStatus || property.verificationStatus || 'pending';
                        const badgeClass = approvalStatus === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : approvalStatus === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800';
                        const label = approvalStatus.charAt(0).toUpperCase() + approvalStatus.slice(1);
                        return (
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${badgeClass}`}>
                            {label}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => openPropertyModal(property)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        View Details
                      </button>
                      {(property.approvalStatus || property.verificationStatus) === 'pending' && (
                        <button
                          onClick={() => openVerificationModal(property)}
                          className="text-yellow-600 hover:text-yellow-900"
                        >
                          Quick Review
                        </button>
                      )}
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
          <AdminDisputesManagement disputes={disputes} />
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

        {/* Property Verification Tab */}
        {activeTab === 'verification' && (
          <AdminPropertyVerification />
        )}

        {/* Mortgage Banks Tab */}
        {activeTab === 'mortgage-banks' && (
          <AdminMortgageBankVerification />
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

      {/* Property Details Modal */}
      <AdminPropertyDetailsModal
        property={selectedPropertyForModal}
        isOpen={showPropertyModal}
        onClose={closePropertyModal}
        onApprove={handlePropertyApprove}
        onReject={handlePropertyReject}
      />
      </div>
    </div>
  );
};

export default AdminDashboard; 
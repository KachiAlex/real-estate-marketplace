/* eslint-disable react-hooks/rules-of-hooks */
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useProperty } from '../contexts/PropertyContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import AdminSidebar, { ADMIN_MENU_ITEMS } from '../components/layout/AdminSidebar';
import BlogManagement from '../components/BlogManagement';
import AdminPropertyDetailsModal from '../components/AdminPropertyDetailsModal';
import AdminDisputesManagement from '../components/AdminDisputesManagement';
import AdminVerificationCenter from '../components/AdminVerificationCenterNew';
// Mortgage flow temporarily disabled
// import AdminMortgageBankVerification from '../components/AdminMortgageBankVerification';
import TableSkeleton from '../components/TableSkeleton';
import Breadcrumbs from '../components/Breadcrumbs';
import AdminListingsStatusChart from '../components/AdminListingsStatusChart';
import AdminEscrowVolumeChart from '../components/AdminEscrowVolumeChart';
import toast from 'react-hot-toast';
import { HiOutlineMenu, HiOutlineX } from 'react-icons/hi';
import { getApiUrl } from '../utils/apiConfig';
import { authenticatedFetch, hasAuthToken } from '../utils/authToken';

const MOCK_USERS = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '+2348012345678',
    role: 'buyer',
    status: 'active',
    isVerified: true,
    createdAt: '2024-01-15',
    lastLogin: '2024-02-02'
  },
  {
    id: '2',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@example.com',
    phone: '+2348098765432',
    role: 'vendor',
    status: 'active',
    isVerified: true,
    createdAt: '2024-01-16',
    lastLogin: '2024-02-04'
  },
  {
    id: '3',
    firstName: 'Michael',
    lastName: 'Brown',
    email: 'michael@example.com',
    phone: '+2348076543210',
    role: 'buyer',
    status: 'active',
    isVerified: false,
    createdAt: '2024-01-17',
    lastLogin: '2024-02-01'
  },
  {
    id: '4',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah@example.com',
    phone: '+2348065432198',
    role: 'vendor',
    status: 'suspended',
    isVerified: true,
    isActive: false,
    suspendedAt: '2024-01-25',
    createdAt: '2024-01-18'
  },
  {
    id: '5',
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@propertyark.com',
    phone: '+2348055555555',
    role: 'admin',
    status: 'active',
    isVerified: true,
    createdAt: '2024-01-01',
    lastLogin: '2024-02-05'
  },
  {
    id: '6',
    firstName: 'Onyedikachi',
    lastName: 'Akoma',
    email: 'onyedika.akoma@gmail.com',
    phone: '+2348044444444',
    role: 'buyer',
    status: 'active',
    isVerified: true,
    createdAt: '2024-01-20',
    lastLogin: '2024-02-03'
  }
];

const MOCK_ESCROWS = [
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

const MOCK_DISPUTES = [
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
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userStatusFilter, setUserStatusFilter] = useState('all');
  const [userVerificationFilter, setUserVerificationFilter] = useState('all');
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [selectedPropertyForModal, setSelectedPropertyForModal] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [authWarning, setAuthWarning] = useState('');
  const [adminSettings, setAdminSettings] = useState(null);
  const [loadingVerificationSettings, setLoadingVerificationSettings] = useState(false);
  const [hasAdminToken, setHasAdminToken] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const usersLoadedRef = useRef(false);

  // Early return for non-admin users
  if (!user || user.role !== 'admin') {
    console.log('AdminDashboard: Access denied - user:', user, 'role:', user?.role);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
            <p className="text-gray-600 mb-6">
              You must be logged in as an administrator to access this page. The auth experience is being rebuilt, so please return home or contact support for access.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800 font-medium mb-2">Admin Login Credentials:</p>
              <p className="text-sm text-blue-700">Email: admin@propertyark.com</p>
              <p className="text-sm text-blue-700">Password: admin123</p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const contentWidthClasses = 'w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 xl:px-16';

  const normalizedSearch = userSearch.trim().toLowerCase();
  const propertyAnalytics = useMemo(() => {
    const fallbackTotals = {
      total: properties.length,
      pending: properties.filter((p) => (p.approvalStatus || p.verificationStatus || 'pending') === 'pending').length,
      approved: properties.filter((p) => (p.approvalStatus || p.verificationStatus) === 'approved').length,
      rejected: properties.filter((p) => (p.approvalStatus || p.verificationStatus) === 'rejected').length
    };

    const total = stats.total || fallbackTotals.total || 0;
    const pending = stats.pending ?? fallbackTotals.pending;
    const approved = stats.approved ?? fallbackTotals.approved;
    const rejected = stats.rejected ?? fallbackTotals.rejected;
    const reviewed = approved + rejected;

    const approvalRate = total ? Math.round((approved / total) * 100) : 0;
    const rejectionRate = total ? Math.round((rejected / total) * 100) : 0;
    const reviewCompletion = total ? Math.round((reviewed / total) * 100) : 0;
    const pendingRate = total ? Math.round((pending / total) * 100) : 0;

    return {
      total,
      pending,
      approved,
      rejected,
      approvalRate,
      rejectionRate,
      reviewCompletion,
      pendingRate
    };
  }, [stats.total, stats.pending, stats.approved, stats.rejected, properties]);
  const filteredUsers = useMemo(() => (
    users.filter((u) => {
      const matchesSearch = !normalizedSearch ||
        `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase().includes(normalizedSearch) ||
        (u.email || '').toLowerCase().includes(normalizedSearch);
      const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
      const userStatus = (u.status || (u.isActive === false ? 'suspended' : 'active'))?.toLowerCase();
      const matchesStatus = userStatusFilter === 'all' || userStatus === userStatusFilter;
      const isVerified = Boolean(u.isVerified);
      const matchesVerification = userVerificationFilter === 'all' ||
        (userVerificationFilter === 'verified' && isVerified) ||
        (userVerificationFilter === 'unverified' && !isVerified);
      return matchesSearch && matchesRole && matchesStatus && matchesVerification;
    })
  ), [users, normalizedSearch, userRoleFilter, userStatusFilter, userVerificationFilter]);

  const disputeStats = useMemo(() => {
    const stats = {
      total: disputes.length,
      open: 0,
      awaiting_response: 0,
      under_review: 0,
      resolved: 0,
      closed: 0
    };

    disputes.forEach((dispute) => {
      const key = (dispute.status || 'open').toLowerCase();
      if (stats[key] !== undefined) {
        stats[key] += 1;
      }
    });

    return stats;
  }, [disputes]);

  const loadAdminData = useCallback(async () => {
    // Skip API calls in development mode to prevent 401 errors
    if (window.location.hostname === 'localhost') {
      console.log('AdminDashboard: Skipping admin data API call in development mode');
      return;
    }
    
    try {
      const adminStats = await fetchAdminProperties(selectedStatus, selectedVerificationStatus);
      if (adminStats) {
        setStats(adminStats);
      }
      setAuthWarning('');
    } catch (err) {
      if (err?.code === 'AUTH_REQUIRED') {
        setAuthWarning('Admin authentication required. Please log in with an admin account (e.g., admin@propertyark.com / admin123) so localStorage.token is populated before reopening the dashboard.');
        toast.error('Admin authentication required. Please log in again.');
      } else {
        toast.error(err?.message || 'Failed to load admin data');
      }
    }
  }, [fetchAdminProperties, selectedStatus, selectedVerificationStatus]);

  const loadVerificationConfig = useCallback(async () => {
    if (loadingVerificationSettings) return;
    
    // Skip API calls in development mode to prevent 401 errors
    if (window.location.hostname === 'localhost') {
      console.log('AdminDashboard: Skipping verification config API call in development mode');
      // Set default config for development
      setAdminSettings({
        verificationFee: 50000,
        verificationBadgeColor: '#10B981'
      });
      return;
    }
    
    try {
      setLoadingVerificationSettings(true);

      let mergedConfig = null;

      try {
        const configResponse = await fetch(getApiUrl('/verification/config'));
        const configPayload = await configResponse.json().catch(() => ({}));
        if (configResponse.ok && configPayload?.success && configPayload?.data) {
          mergedConfig = configPayload.data;
        }
      } catch (configError) {
        console.warn('AdminDashboard: verification config fetch failed', configError?.message || configError);
      }

      const tokenAvailable = await hasAuthToken();
      if (tokenAvailable) {
        try {
          const adminResponse = await authenticatedFetch(getApiUrl('/admin/settings'));
          const adminPayload = await adminResponse.json().catch(() => ({}));
          if (adminResponse.ok && adminPayload?.success && adminPayload?.data) {
            mergedConfig = { ...(mergedConfig || {}), ...adminPayload.data };
          } else if (adminResponse.status === 401) {
            setHasAdminToken(false);
            setAuthWarning('Admin authentication expired. Please log in again to manage verification settings.');
          }
        } catch (adminError) {
          console.warn('AdminDashboard: admin settings fetch failed', adminError?.message || adminError);
        }
      }

      if (!mergedConfig) {
        // Set default config instead of throwing error
        mergedConfig = {
          verificationFee: 50000,
          verificationBadgeColor: '#10B981'
        };
        console.warn('AdminDashboard: Using default verification settings');
      }

      setAdminSettings(mergedConfig);
    } catch (error) {
      console.warn('AdminDashboard: unable to load verification settings', error);
      // Set default config on error
      setAdminSettings({
        verificationFee: 50000,
        verificationBadgeColor: '#10B981'
      });
      toast.error(error?.message || 'Failed to load verification settings');
    } finally {
      setLoadingVerificationSettings(false);
    }
  }, [loadingVerificationSettings]);

  const loadUsersFromApi = useCallback(async ({ page = 1, limit = 100, role } = {}) => {
    if (!user || user.role !== 'admin' || loadingUsers || usersLoadedRef.current) return;
    
    // Skip API calls in development mode to prevent 401 errors
    if (window.location.hostname === 'localhost') {
      console.log('AdminDashboard: Skipping users API call in development mode');
      // Set mock data for development
      const mockUsersData = role ? MOCK_USERS.filter((u) => u.role === role) : MOCK_USERS;
      // Normalize: treat undefined isActive as true (active)
      const normalizedMockUsers = mockUsersData.map(u => ({
        ...u,
        isActive: u.isActive !== false
      }));
      setUsers(normalizedMockUsers);
      setVendors(normalizedMockUsers.filter((u) => u.role === 'vendor'));
      setBuyers(normalizedMockUsers.filter((u) => u.role === 'buyer'));
      return;
    }
    
    usersLoadedRef.current = true;
    setLoadingUsers(true);
    try {
      const tokenAvailable = await hasAuthToken();
      setHasAdminToken(Boolean(tokenAvailable));
      if (!tokenAvailable) {
        setAuthWarning('Admin authentication required. Please log in with an admin account so protected endpoints can be accessed.');
        throw new Error('Missing admin authentication');
      }

      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (role) {
        params.set('role', role);
      }
      const response = await authenticatedFetch(`${getApiUrl(`/admin/users?${params.toString()}`)}`);
      const payload = await response.json().catch(() => ({}));

      if (!response.ok || !payload?.success) {
        // Handle 401 specifically to prevent infinite retries
        if (response.status === 401) {
          setAuthWarning('Admin authentication expired. Please log in again.');
          throw new Error('Authentication expired');
        }
        const message = payload?.message || 'Failed to load users';
        throw new Error(message);
      }

      const fetchedUsers = Array.isArray(payload.data) ? payload.data : [];
      
      // Normalize user data: treat undefined isActive as true (active)
      const normalizedUsers = fetchedUsers.map(u => ({
        ...u,
        isActive: u.isActive !== false // Treat undefined/null as true (active)
      }));
      
      setUsers(normalizedUsers);
      setVendors(normalizedUsers.filter((u) => u.role === 'vendor'));
      setBuyers(normalizedUsers.filter((u) => u.role === 'buyer'));
      if (payload.pagination) {
        setPagination((prev) => ({
          ...prev,
          ...payload.pagination
        }));
      }
      setAuthWarning('');
    } catch (error) {
      console.warn('AdminDashboard: Failed to fetch users', error);
      if (!hasAdminToken) {
        setAuthWarning('Admin authentication required. Please log in with an admin account so protected endpoints can be accessed.');
      }
      toast.error(error?.message || 'Unable to load users. Showing sample data.');
      // Normalize mock data: treat undefined isActive as true (active)
      const normalizedFallback = MOCK_USERS.map(u => ({
        ...u,
        isActive: u.isActive !== false
      }));
      const roleFilteredFallback = role ? normalizedFallback.filter((u) => u.role === role) : normalizedFallback;
      setUsers(roleFilteredFallback);
      setVendors(normalizedFallback.filter((u) => u.role === 'vendor'));
      setBuyers(normalizedFallback.filter((u) => u.role === 'buyer'));
    } finally {
      setLoadingUsers(false);
    }
  }, [user, loadingUsers, hasAdminToken]);

  const getPropertyLocation = (property) => {
    try {
      if (typeof property.location === 'string') {
        return property.location || 'Location not specified';
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
  };

  const formatPropertyDate = (property) => {
    try {
      const dateValue = property.createdAt || property.listedDate || property.datePosted;
      if (!dateValue) return '-';

      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return '-';

      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error, property);
      return '-';
    }
  };

  useEffect(() => {
    console.log('AdminDashboard: User state:', user);
    console.log('AdminDashboard: User role:', user?.role);
    console.log('AdminDashboard: Is admin?', user?.role === 'admin');
    
    // Load admin data for admin users
    loadAdminData();
  }, [user, navigate, loadAdminData]);

  useEffect(() => {
    let isMounted = true;
    const verifyTokenState = async () => {
      const tokenExists = await hasAuthToken();
      if (!isMounted) return;
      setHasAdminToken(Boolean(tokenExists));
      if (!tokenExists) {
        setAuthWarning('Admin authentication required. Please log in with an admin account (e.g., admin@propertyark.com / Admin#2026!) so protected endpoints can be accessed.');
      } else {
        setAuthWarning('');
      }
    };

    verifyTokenState();

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Initialize activeTab from URL once on mount
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const t = params.get('tab');
    if (t && ['properties','verification','escrow','disputes','users','blog'].includes(t)) {
      setActiveTab(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeTab === 'verification' && user?.role === 'admin') {
      if (!adminSettings && !loadingVerificationSettings) {
        loadVerificationConfig();
      }
    }
  }, [activeTab, user, adminSettings, loadingVerificationSettings, loadVerificationConfig]);

  const handleSwitchTab = (tabId) => {
    setActiveTab(tabId);
    const params = new URLSearchParams(location.search);
    params.set('tab', tabId);
    navigate({ pathname: '/admin', search: params.toString() }, { replace: true });
    setIsSidebarOpen(false);
  };

  useEffect(() => {
    // Only load users when the tab is active and user is admin
    if (activeTab === 'users' && user?.role === 'admin') {
      const roleParam = userRoleFilter !== 'all' ? userRoleFilter : undefined;
      loadUsersFromApi({ role: roleParam });
    }
  }, [activeTab, userRoleFilter, user?.role, loadUsersFromApi]);

  // Load other admin data
  useEffect(() => {
    const load = async () => {
      try {
        console.log('AdminDashboard: Using mock data (API endpoints unavailable)');
        
        // Mock users data
        const mockUsers = [
          { id: '1', firstName: 'John', lastName: 'Doe', email: 'john@example.com', role: 'buyer', isVerified: true, createdAt: '2024-01-15' },
          { id: '2', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com', role: 'vendor', isVerified: true, createdAt: '2024-01-16' },
          { id: '3', firstName: 'Michael', lastName: 'Brown', email: 'michael@example.com', role: 'buyer', isVerified: true, createdAt: '2024-01-17' },
          { id: '4', firstName: 'Sarah', lastName: 'Johnson', email: 'sarah@example.com', role: 'vendor', isVerified: true, createdAt: '2024-01-18' },
          { id: '5', firstName: 'Admin', lastName: 'User', email: 'admin@example.com', role: 'admin', isVerified: true, createdAt: '2024-01-01' },
          { id: '6', firstName: 'Onyedikachi', lastName: 'Akoma', email: 'onyedika.akoma@gmail.com', role: 'buyer', isVerified: true, createdAt: '2024-01-20' }
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
      // Refresh properties list after a short delay to ensure Firestore update is complete
      setTimeout(() => {
        loadAdminData();
      }, 1000);
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
      console.log('Approving property:', propertyId, 'with notes:', adminNotes);
      
      // Use verifyProperty from PropertyContext which handles Firestore directly
      const success = await verifyProperty(propertyId, 'approved', adminNotes);
      
      if (success) {
        // Refresh properties list after a short delay to ensure Firestore update is complete
        setTimeout(() => {
          loadAdminData();
        }, 500);
        // Send notification to vendor (simulated)
        await sendNotificationToVendor(propertyId, 'approved', adminNotes);
      } else {
        throw new Error('Failed to approve property');
      }
    } catch (error) {
      console.error('Error approving property:', error);
      toast.error('Error approving property: ' + error.message);
      throw error;
    }
  };

  const handlePropertyReject = async (propertyId, rejectionReason, adminNotes) => {
    try {
      console.log('Rejecting property:', propertyId, 'with reason:', rejectionReason);
      
      // Use verifyProperty from PropertyContext which handles Firestore directly
      const notes = rejectionReason ? `${rejectionReason}. ${adminNotes || ''}`.trim() : adminNotes;
      const success = await verifyProperty(propertyId, 'rejected', notes);
      
      if (success) {
        // Refresh properties list after a short delay to ensure Firestore update is complete
        setTimeout(() => {
          loadAdminData();
        }, 500);
        // Send notification to vendor
        await sendNotificationToVendor(propertyId, 'rejected', rejectionReason);
      } else {
        throw new Error('Failed to reject property');
      }
    } catch (error) {
      console.error('Error rejecting property:', error);
      toast.error('Error rejecting property: ' + error.message);
      throw error;
    }
  };

  // Send notification to vendor (simulated)
  const sendNotificationToVendor = async (propertyId, action, message) => {
    try {
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

      await fetch(getApiUrl('/notifications'), {
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
        toast.success('User suspended successfully');
        loadAdminData();
      } else {
        toast.error('Failed to suspend user: ' + data.message);
      }
    } catch (error) {
      console.error('Error suspending user:', error);
      toast.error('Error suspending user');
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
        toast.success('User activated successfully');
        loadAdminData();
      } else {
        toast.error('Failed to activate user: ' + data.message);
      }
    } catch (error) {
      console.error('Error activating user:', error);
      toast.error('Error activating user');
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
        toast.success('User deleted successfully');
        loadAdminData();
      } else {
        toast.error('Failed to delete user: ' + data.message);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Error deleting user');
    }
  };

  const handleArchiveUser = (userId) => handleDeleteUser(userId);

  const handleToggleUser = (userId, isSelected) => {
    setSelectedUserIds((prev) => {
      if (isSelected) {
        return prev.includes(userId) ? prev : [...prev, userId];
      }
      return prev.filter((id) => id !== userId);
    });
  };

  const handleToggleAllUsers = (selectAll) => {
    if (selectAll) {
      setSelectedUserIds(filteredUsers.map((u) => u.id));
    } else {
      setSelectedUserIds([]);
    }
  };

  const handleBulkAction = (action) => {
    if (!selectedUserIds.length) return;
    const performAction = {
      activate: handleActivateUser,
      suspend: handleSuspendUser,
      archive: handleArchiveUser
    }[action];
    if (!performAction) return;
    selectedUserIds.forEach((userId) => performAction(userId));
    setSelectedUserIds([]);
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

  // Get breadcrumb items based on active tab
  const breadcrumbItems = [
    { label: 'Home', path: '/' },
    { label: 'Admin Dashboard', path: '/admin' },
    ...(activeTab !== 'properties' ? [{ label: activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace('-', ' '), path: `#` }] : [])
  ];

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
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row overflow-x-hidden">
      {/* Desktop Sidebar */}
      <AdminSidebar activeTab={activeTab} setActiveTab={handleSwitchTab} />

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <button
            aria-label="Close admin menu"
            className="flex-1 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
          />
          <div className="w-72 max-w-full h-full bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Admin Panel</p>
                <p className="text-sm font-semibold text-gray-900">PropertyArk</p>
              </div>
              <button
                aria-label="Close admin menu"
                className="p-2 rounded-md hover:bg-gray-100 text-gray-600"
                onClick={() => setIsSidebarOpen(false)}
              >
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {ADMIN_MENU_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSwitchTab(item.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive ? 'bg-brand-blue text-white' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="text-lg flex-shrink-0" />
                    <div className="text-left">
                      <span className="block">{item.label}</span>
                      <span className={`text-xs leading-snug ${isActive ? 'text-blue-100' : 'text-gray-500'}`}>
                        {item.description}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 w-full lg:ml-64 flex flex-col min-h-screen">
        {/* Mobile top bar */}
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between lg:hidden">
          <button
            aria-label="Open admin menu"
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-md border border-gray-200 text-gray-600"
          >
            <HiOutlineMenu className="w-5 h-5" />
          </button>
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-900">Admin Dashboard</p>
            <p className="text-xs text-gray-500 capitalize">{activeTab.replace('-', ' ')} Management</p>
          </div>
        </div>

        {/* Breadcrumbs */}
        <div className="bg-white border-b border-gray-200 hidden lg:block">
          <div className={`${contentWidthClasses} py-3`}>
            <Breadcrumbs items={breadcrumbItems} />
          </div>
        </div>

        {/* Header */}
        <div className="bg-white shadow">
          <div className={`${contentWidthClasses} py-6`}>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 capitalize">
              {activeTab} Management
            </h1>
            <p className="mt-2 text-gray-600 text-sm sm:text-base">
              {activeTab === 'properties' && 'Property verification and management'}
              {activeTab === 'verification' && 'Badge pricing, applications, and approvals'}
              {activeTab === 'escrow' && 'Escrow transaction monitoring'}
              {activeTab === 'disputes' && 'Dispute resolution management'}
              {activeTab === 'users' && 'User account management'}
              {activeTab === 'blog' && 'Blog content management'}
            </p>
          </div>
        </div>

        {/* Content Area */}
        <main className={`flex-1 w-full ${contentWidthClasses} py-6 lg:py-10 space-y-8`}>

        {/* Stats Cards (properties tab only) */}
        {activeTab === 'properties' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
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

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
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

            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
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

            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
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

        {/* Property analytics detail cards */}
        {activeTab === 'properties' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-sm font-medium text-gray-600">Review Completion</p>
              <div className="flex items-end justify-between mt-2">
                <p className="text-3xl font-semibold text-gray-900">{propertyAnalytics.reviewCompletion}%</p>
                <span className="text-xs text-gray-500">{propertyAnalytics.approved + propertyAnalytics.rejected} of {propertyAnalytics.total} reviewed</span>
              </div>
              <div className="mt-4 h-2 rounded-full bg-gray-100">
                <div
                  className="h-full bg-blue-600 rounded-full"
                  style={{ width: `${propertyAnalytics.reviewCompletion}%` }}
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-sm font-medium text-gray-600">Approval Rate</p>
              <div className="flex items-end justify-between mt-2">
                <p className="text-3xl font-semibold text-green-600">{propertyAnalytics.approvalRate}%</p>
                <span className="text-xs text-gray-500">{propertyAnalytics.approved} approved listings</span>
              </div>
              <p className="text-xs text-gray-500 mt-3">{propertyAnalytics.pending} pending · {propertyAnalytics.rejected} rejected</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-sm font-medium text-gray-600">Pending Backlog</p>
              <div className="flex items-end justify-between mt-2">
                <p className="text-3xl font-semibold text-amber-600">{propertyAnalytics.pendingRate}%</p>
                <span className="text-xs text-gray-500">{propertyAnalytics.pending} listings awaiting review</span>
              </div>
              <div className="mt-4 text-xs text-gray-500 space-y-1">
                <p>Approved today: {stats.approved || 0}</p>
                <p>Rejected today: {stats.rejected || 0}</p>
              </div>
            </div>
          </div>
        )}

        {/* Verification Tab */}
        {activeTab === 'verification' && (
          <div className="space-y-6">
            {loadingVerificationSettings && !adminSettings ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center text-gray-500">
                Loading verification settings...
              </div>
            ) : (
              <AdminVerificationCenter
                config={adminSettings}
                isAuthenticated={true} // Always true for admin users
                onRequireAdminAuth={() => {
                  setAuthWarning('Admin authentication required. Please log in again to manage verification settings.');
                }}
                onConfigChange={(updated) => setAdminSettings((prev) => ({
                  ...(prev || {}),
                  ...updated
                }))}
              />
            )}
          </div>
        )}

        {/* Disputes Tab */}
        {activeTab === 'disputes' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <p className="text-sm text-gray-500">Open Disputes</p>
                <p className="text-2xl font-semibold text-gray-900">{disputeStats.open + disputeStats.awaiting_response + disputeStats.under_review}</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <p className="text-sm text-gray-500">Resolved</p>
                <p className="text-2xl font-semibold text-green-600">{disputeStats.resolved}</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <p className="text-sm text-gray-500">Closed</p>
                <p className="text-2xl font-semibold text-gray-900">{disputeStats.closed}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <AdminDisputesManagement disputes={disputes} />
            </div>
          </div>
        )}

        {/* Property status distribution chart (properties tab only) */}
        {activeTab === 'properties' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Listings by Approval Status</h2>
            <AdminListingsStatusChart
              total={stats.total}
              pending={stats.pending}
              approved={stats.approved}
              rejected={stats.rejected}
            />
          </div>
        )}

        {/* Filters (properties tab only) */}
        {activeTab === 'properties' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
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
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-medium text-gray-900">Properties</h2>
            <span className="text-sm text-gray-500">
              Showing {properties.length} {properties.length === 1 ? 'property' : 'properties'}
            </span>
          </div>
          
          {error && (
            <div className="px-6 py-4 bg-red-50 border-b border-red-200">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="p-6">
              <TableSkeleton rows={10} columns={6} />
            </div>
          ) : properties.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              <p className="text-lg font-medium">No properties found</p>
              <p className="text-sm mt-2">Try adjusting your filters or check if properties exist in Firestore.</p>
            </div>
          ) : (
            <>
              <div className="hidden lg:block overflow-x-auto">
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
                              <div className="text-sm text-gray-500">{getPropertyLocation(property)}</div>
                              <div className="text-sm text-gray-500">
                                ₦{Number(property.price || 0).toLocaleString()}
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
                          {formatPropertyDate(property)}
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

              <div className="lg:hidden space-y-4">
                {properties.map((property) => {
                  const approvalStatus = property.approvalStatus || property.verificationStatus || 'pending';
                  const approvalClass = approvalStatus === 'approved'
                    ? 'text-green-700 bg-green-50'
                    : approvalStatus === 'rejected'
                      ? 'text-red-700 bg-red-50'
                      : 'text-yellow-700 bg-yellow-50';
                  return (
                    <div key={property.id} className="p-4 space-y-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
                      <div className="flex items-start gap-3">
                        <img
                          src={property.images[0]?.url || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=100&h=100&fit=crop'}
                          alt={property.title}
                          className="h-16 w-16 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{property.title}</p>
                          <p className="text-sm text-gray-500">{getPropertyLocation(property)}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${approvalClass}`}>
                          {approvalStatus.charAt(0).toUpperCase() + approvalStatus.slice(1)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-gray-400">Vendor</p>
                          <p className="font-medium text-gray-900">
                            {property.owner && typeof property.owner === 'object'
                              ? `${property.owner.firstName || ''} ${property.owner.lastName || ''}`.trim() || 'Unknown Owner'
                              : property.owner || 'Unknown Owner'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-gray-400">Listed</p>
                          <p className="font-medium text-gray-900">{formatPropertyDate(property)}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-gray-400">Status</p>
                          <p className="font-medium capitalize">{property.status.replace('-', ' ')}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-gray-400">Price</p>
                          <p className="font-medium text-gray-900">
                            ₦{Number(property.price || 0).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() => openPropertyModal(property)}
                          className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-brand-blue border border-brand-blue rounded-md"
                        >
                          View Details
                        </button>
                        {(property.approvalStatus || property.verificationStatus) === 'pending' && (
                          <button
                            onClick={() => openVerificationModal(property)}
                            className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-brand-blue rounded-md"
                          >
                            Quick Review
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
        )}

        {/* Escrow Tab */}
        {activeTab === 'escrow' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-lg font-medium text-gray-900">Escrow Transactions</h2>
              <p className="mt-1 text-sm text-gray-500">Monitor all escrow transactions and resolve disputes.</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-md font-semibold text-gray-900 mb-4">Escrow Volume Over Time</h3>
              <AdminEscrowVolumeChart escrows={escrows} />
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Escrow Transactions</h2>
              </div>
              <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Buyer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seller</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Update</th>
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
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {tx.updatedAt ? new Date(tx.updatedAt).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="lg:hidden space-y-4">
                {escrows.map((tx) => {
                  const statusKey = (tx.status || 'pending').toLowerCase();
                  const statusClass = statusKey === 'active'
                    ? 'bg-green-50 text-green-700'
                    : statusKey === 'disputed'
                      ? 'bg-red-50 text-red-700'
                      : 'bg-yellow-50 text-yellow-700';
                  const statusLabel = statusKey.charAt(0).toUpperCase() + statusKey.slice(1);
                  return (
                    <div key={tx.id} className="p-4 space-y-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{tx.propertyTitle}</p>
                          <p className="text-xs text-gray-500">ID: {tx.id}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusClass}`}>
                          {statusLabel}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-gray-400">Buyer</p>
                          <p className="font-medium text-gray-900">{tx.buyerName}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-gray-400">Seller</p>
                          <p className="font-medium text-gray-900">{tx.sellerName}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-gray-400">Amount</p>
                          <p className="font-medium text-gray-900">₦{Number(tx.amount || 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-gray-400">Created</p>
                          <p className="font-medium text-gray-900">
                            {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </div>

                      <div className="text-xs text-gray-500">
                        Updated {tx.updatedAt ? new Date(tx.updatedAt).toLocaleDateString() : 'recently'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Users Overview</h2>
                  <p className="text-sm text-gray-500">Manage buyer, vendor, and admin accounts in one view.</p>
                </div>
                <div className="grid grid-cols-2 sm:flex gap-2 text-sm">
                  <div className="px-3 py-2 bg-blue-50 rounded-lg text-blue-700">
                    <p className="text-xs uppercase tracking-wide text-blue-400">Active</p>
                    <p className="text-base font-semibold">{users.length}</p>
                  </div>
                  <div className="px-3 py-2 bg-emerald-50 rounded-lg text-emerald-700">
                    <p className="text-xs uppercase tracking-wide text-emerald-400">Verified</p>
                    <p className="text-base font-semibold">{users.filter(u => u.isVerified).length}</p>
                  </div>
                  <div className="px-3 py-2 bg-red-50 rounded-lg text-red-700">
                    <p className="text-xs uppercase tracking-wide text-red-400">Suspended</p>
                    <p className="text-base font-semibold">{users.filter(u => u.status === 'suspended' || u.isActive === false).length}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search name or email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  >
                    <option value="all">All Roles</option>
                    <option value="buyer">Buyer</option>
                    <option value="vendor">Vendor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={userStatusFilter}
                    onChange={(e) => setUserStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Verification</label>
                  <select
                    value={userVerificationFilter}
                    onChange={(e) => setUserVerificationFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  >
                    <option value="all">All Users</option>
                    <option value="verified">Verified</option>
                    <option value="unverified">Unverified</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">All Users</h3>
                  <p className="text-sm text-gray-500">{filteredUsers.length} users found</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    disabled={!selectedUserIds.length}
                    onClick={() => handleBulkAction('activate')}
                    className={`inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium ${selectedUserIds.length ? 'border-green-600 text-green-700 hover:bg-green-50' : 'border-gray-200 text-gray-400 cursor-not-allowed'}`}
                  >
                    Activate
                  </button>
                  <button
                    disabled={!selectedUserIds.length}
                    onClick={() => handleBulkAction('suspend')}
                    className={`inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium ${selectedUserIds.length ? 'border-amber-500 text-amber-600 hover:bg-amber-50' : 'border-gray-200 text-gray-400 cursor-not-allowed'}`}
                  >
                    Suspend
                  </button>
                  <button
                    disabled={!selectedUserIds.length}
                    onClick={() => handleBulkAction('archive')}
                    className={`inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium ${selectedUserIds.length ? 'border-red-600 text-red-600 hover:bg-red-50' : 'border-gray-200 text-gray-400 cursor-not-allowed'}`}
                  >
                    Archive
                  </button>
                  <button
                    disabled={!selectedUserIds.length}
                    onClick={() => setSelectedUserIds(filteredUsers.map(u => u.id))}
                    className={`inline-flex items-center gap-2 rounded-md border border-gray-200 px-4 py-2 text-sm font-medium ${selectedUserIds.length ? 'text-gray-600 hover:bg-gray-50' : 'text-gray-400 cursor-not-allowed'}`}
                  >
                    Select All
                  </button>
                  <button
                    disabled={!selectedUserIds.length}
                    onClick={() => setSelectedUserIds([])}
                    className={`inline-flex items-center gap-2 rounded-md border border-gray-200 px-4 py-2 text-sm font-medium ${selectedUserIds.length ? 'text-gray-600 hover:bg-gray-50' : 'text-gray-400 cursor-not-allowed'}`}
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={selectedUserIds.length === filteredUsers.length && filteredUsers.length > 0}
                          onChange={(e) => handleToggleAllUsers(e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-brand-blue focus:ring-brand-blue"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Verification</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((u) => {
                      const isSelected = selectedUserIds.includes(u.id);
                      const statusLabel = (u.status === 'suspended' || u.isActive === false) ? 'Suspended' : 'Active';
                      const statusClass = statusLabel === 'Suspended' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700';
                      const roleClass = u.role === 'admin' ? 'text-purple-600 bg-purple-50' : u.role === 'vendor' ? 'text-blue-600 bg-blue-50' : 'text-amber-600 bg-amber-50';
                      return (
                        <tr key={u.id} className={isSelected ? 'bg-blue-50/40' : undefined}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => handleToggleUser(u.id, e.target.checked)}
                              className="h-4 w-4 rounded border-gray-300 text-brand-blue focus:ring-brand-blue"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold">
                                {u.firstName?.[0]}{u.lastName?.[0]}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{u.firstName} {u.lastName}</p>
                                <p className="text-xs text-gray-500">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${roleClass}`}>
                              {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusClass}`}>
                              {statusLabel}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${u.isVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                              {u.isVerified ? 'Verified' : 'Unverified'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Unknown'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                            <button onClick={() => setSelectedUser(u)} className="text-brand-blue hover:text-brand-blue/80">View</button>
                            {statusLabel === 'Active' ? (
                              <button onClick={() => handleSuspendUser(u.id)} className="text-amber-600 hover:text-amber-700">Suspend</button>
                            ) : (
                              <button onClick={() => handleActivateUser(u.id)} className="text-green-600 hover:text-green-700">Activate</button>
                            )}
                            <button onClick={() => handleArchiveUser(u.id)} className="text-red-600 hover:text-red-700">Archive</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="lg:hidden space-y-4">
                {filteredUsers.map((u) => {
                  const isSelected = selectedUserIds.includes(u.id);
                  const badgeClass = u.status === 'suspended' || u.isActive === false ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700';
                  return (
                    <div key={u.id} className={`p-4 space-y-3 bg-white rounded-2xl border border-gray-100 shadow-sm ${isSelected ? 'ring-2 ring-brand-blue/50' : ''}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{u.firstName} {u.lastName}</p>
                          <p className="text-xs text-gray-500">{u.email}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleToggleUser(u.id, e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-brand-blue focus:ring-brand-blue"
                        />
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-600 capitalize">{u.role}</span>
                        <span className={`px-2 py-1 rounded-full ${badgeClass}`}>
                          {u.status === 'suspended' || u.isActive === false ? 'Suspended' : 'Active'}
                        </span>
                        <span className={`px-2 py-1 rounded-full ${u.isVerified ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                          {u.isVerified ? 'Verified' : 'Unverified'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 space-y-1">
                        <p>Joined: {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Unknown'}</p>
                        {u.lastLogin && <p>Last login: {new Date(u.lastLogin).toLocaleDateString()}</p>}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <button onClick={() => setSelectedUser(u)} className="px-3 py-2 text-brand-blue border border-brand-blue rounded-md">View</button>
                        {u.status === 'suspended' || u.isActive === false ? (
                          <button onClick={() => handleActivateUser(u.id)} className="px-3 py-2 text-green-700 border border-green-600 rounded-md">Activate</button>
                        ) : (
                          <button onClick={() => handleSuspendUser(u.id)} className="px-3 py-2 text-amber-600 border border-amber-500 rounded-md">Suspend</button>
                        )}
                        <button onClick={() => handleArchiveUser(u.id)} className="col-span-2 px-3 py-2 text-red-600 border border-red-500 rounded-md">Archive</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Blog Tab */}
        {activeTab === 'blog' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
            <BlogManagement />
          </div>
        )}

      </main>

      {/* Verification Modal */}
      {selectedProperty && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-gray-900/60 px-4 py-8">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 sm:p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="mt-1">
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
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-gray-900/60 px-4 py-8">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 sm:p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="mt-1 space-y-3">
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
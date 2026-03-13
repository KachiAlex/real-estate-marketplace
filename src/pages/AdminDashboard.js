/* eslint-disable react-hooks/rules-of-hooks */
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { HiOutlineMenu, HiOutlineX } from 'react-icons/hi';
import { useNavigate, useLocation } from 'react-router-dom';

import AdminDisputesManagement from '../components/AdminDisputesManagement';
import AdminEscrowVolumeChart from '../components/AdminEscrowVolumeChart';
import AdminListingsStatusChart from '../components/AdminListingsStatusChart';
import AdminPropertyDetailsModal from '../components/AdminPropertyDetailsModal';
import AdminSidebar, { ADMIN_MENU_ITEMS } from '../components/layout/AdminSidebar';
import AdminSupportTickets from './AdminSupportTickets';
import AdminVerificationCenter from '../components/AdminVerificationCenterNew';
import AdminVerificationDashboard from '../components/AdminVerificationDashboard';
import Breadcrumbs from '../components/Breadcrumbs';
import TableSkeleton from '../components/TableSkeleton';
import { useAuth } from '../contexts/AuthContext';
import { useProperty } from '../contexts/PropertyContext';
import apiClient from '../services/apiClient';
import { getApiUrl } from '../utils/apiConfig';
import { authenticatedFetch, hasAuthToken } from '../utils/authToken';
import {
  adminListBlogs,
  adminCreateBlog,
  adminUpdateBlog,
  adminUpdateBlogStatus,
  adminDeleteBlog,
  fetchBlogCategories
} from '../api/blog';

const ESCROW_STATUS_OPTIONS = ['pending', 'active', 'completed', 'cancelled', 'disputed'];
const ESCROW_RESOLUTION_OPTIONS = [
  { value: 'buyer_favor', label: "Rule in Buyer's Favor" },
  { value: 'seller_favor', label: "Rule in Seller's Favor" },
  { value: 'partial_refund', label: 'Partial Refund to Buyer' },
  { value: 'full_refund', label: 'Full Refund to Buyer' }
];

const BLOG_CATEGORY_OPTIONS = [
  'real-estate-tips',
  'market-news',
  'investment-guides',
  'property-showcase',
  'legal-advice',
  'home-improvement',
  'neighborhood-spotlight',
  'buyer-guides',
  'seller-guides',
  'rental-advice',
  'mortgage-financing',
  'property-management'
];

const BLOG_STATUS_OPTIONS = ['draft', 'published', 'archived'];

const buildInitialBlogEditorState = () => ({
  id: null,
  title: '',
  slug: '',
  category: BLOG_CATEGORY_OPTIONS[0],
  status: 'draft',
  excerpt: '',
  content: '',
  tagsInput: '',
  featuredImage: '',
  featured: false,
  allowComments: true,
  publishedAt: ''
});

const parseTagsInput = (value = '') =>
  value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);

const humanizeCategory = (slug = '') =>
  slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const formatDateForInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (num) => num.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const normalizePublishedAtInput = (value) => {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
};

const mapBlogToEditorState = (blog) => ({
  id: blog?.id || null,
  title: blog?.title || '',
  slug: blog?.slug || '',
  category: blog?.category || BLOG_CATEGORY_OPTIONS[0],
  status: blog?.status || 'draft',
  excerpt: blog?.excerpt || '',
  content: blog?.content || '',
  tagsInput: Array.isArray(blog?.tags) ? blog.tags.join(', ') : '',
  featuredImage: typeof blog?.featuredImage === 'string' ? blog.featuredImage : blog?.featuredImage?.url || '',
  featured: Boolean(blog?.featured),
  allowComments: blog?.allowComments !== undefined ? Boolean(blog.allowComments) : true,
  publishedAt: formatDateForInput(blog?.publishedAt)
});

const buildPayloadFromEditor = (editorState, authorId) => {
  if (!editorState?.title?.trim()) {
    throw new Error('Title is required');
  }
  if (!editorState?.content || editorState.content.trim().length < 100) {
    throw new Error('Content must be at least 100 characters');
  }

  const payload = {
    title: editorState.title.trim(),
    category: editorState.category,
    status: editorState.status,
    excerpt: editorState.excerpt?.trim() || undefined,
    content: editorState.content,
    tags: parseTagsInput(editorState.tagsInput),
    featuredImage: editorState.featuredImage?.trim() || undefined,
    featured: Boolean(editorState.featured),
    allowComments: Boolean(editorState.allowComments),
    authorId
  };

  const normalizedPublishedAt = normalizePublishedAtInput(editorState.publishedAt);
  if (normalizedPublishedAt) {
    payload.publishedAt = normalizedPublishedAt;
  }

  return payload;
};

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

const AdminDashboard = () => {
  const { user, logout } = useAuth();
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
  const [selectedEscrowTransaction, setSelectedEscrowTransaction] = useState(null);
  const [showEscrowActionModal, setShowEscrowActionModal] = useState(false);
  const [escrowActionType, setEscrowActionType] = useState('status');
  const [escrowStatusValue, setEscrowStatusValue] = useState('pending');
  const [escrowResolutionType, setEscrowResolutionType] = useState('buyer_favor');
  const [escrowActionNotes, setEscrowActionNotes] = useState('');
  const [escrowActionLoading, setEscrowActionLoading] = useState(false);
  const [escrowStatusFilter, setEscrowStatusFilter] = useState('all');
  const [failedPayments, setFailedPayments] = useState([]);
  const [showFailedPayments, setShowFailedPayments] = useState(false);
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
  const [statsLoading, setStatsLoading] = useState(false);
  const [escrowLoading, setEscrowLoading] = useState(false);
  const [disputeLoading, setDisputeLoading] = useState(false);
  const [escrowError, setEscrowError] = useState('');
  const [disputeError, setDisputeError] = useState('');
  const usersLoadedRef = useRef(false);
  const statsRefreshIntervalRef = useRef(null);
  const escrowsLoadedRef = useRef(false);
  const disputesLoadedRef = useRef(false);
  const [blogPosts, setBlogPosts] = useState([]);
  const [blogLoading, setBlogLoading] = useState(false);
  const [blogError, setBlogError] = useState('');
  const [blogSaving, setBlogSaving] = useState(false);
  const [blogCategoriesRemote, setBlogCategoriesRemote] = useState(BLOG_CATEGORY_OPTIONS);
  const [blogFilter, setBlogFilter] = useState('all');
  const [blogCategoryFilter, setBlogCategoryFilter] = useState('all');
  const [blogSearch, setBlogSearch] = useState('');
  const [blogEditor, setBlogEditor] = useState(buildInitialBlogEditorState());
  const [isBlogModalOpen, setIsBlogModalOpen] = useState(false);
  const [editingBlogId, setEditingBlogId] = useState(null);
  const [blogActionBusyId, setBlogActionBusyId] = useState(null);
  const isMountedRef = useRef(true);

  const [draftPost, setDraftPost] = useState({ title: '', category: 'General', status: 'draft', content: '' });
  const handleDraftChange = (field, value) => setDraftPost((p) => ({ ...p, [field]: value }));
  const resetDraftPost = () => setDraftPost({ title: '', category: 'General', status: 'draft', content: '' });
  const handleCreateBlogPost = async () => {
    try {
      setBlogSaving(true);
      const newPost = {
        id: `tmp-${Date.now()}`,
        title: draftPost.title || 'Untitled',
        excerpt: (draftPost.content || '').slice(0, 140),
        category: draftPost.category || 'General',
        status: draftPost.status || 'draft',
        publishedAt: draftPost.status === 'published' ? new Date().toISOString() : null
      };
      setBlogPosts((prev) => [newPost, ...prev]);
      resetDraftPost();
      toast.success('Blog post saved locally');
    } catch (e) {
      console.error('Create blog post failed', e);
      toast.error('Failed to create blog post');
    } finally {
      setBlogSaving(false);
    }
  };

  const handleAdminLogout = useCallback(async () => {
    try {
      await logout();
      navigate('/auth/login', { replace: true });
      toast.success('Logged out');
    } catch (error) {
      console.error('Admin logout failed', error);
      toast.error('Logout failed');
    }
  }, [logout, navigate]);

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

  const loadVerificationConfig = useCallback(async () => {
    if (loadingVerificationSettings) return;
    
    // Skip API calls in development mode to prevent 401 errors
    if (window.location.hostname === 'localhost') {
      console.log('AdminDashboard: Skipping verification config API call in development mode');
      // Set default config for development
      setAdminSettings({
        verificationFee: 50000,
        verificationBadgeColor: '#10B981',
        vendorSubscriptionFee: 50000
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
          verificationBadgeColor: '#10B981',
          vendorSubscriptionFee: 50000
        };
        console.warn('AdminDashboard: Using default verification settings');
      }

      // Ensure vendorSubscriptionFee is present
      if (typeof mergedConfig.vendorSubscriptionFee !== 'number') {
        mergedConfig.vendorSubscriptionFee = 50000;
      }
      setAdminSettings(mergedConfig);
    } catch (error) {
      console.warn('AdminDashboard: unable to load verification settings', error);
      // Set default config on error
      setAdminSettings({
        verificationFee: 50000,
        verificationBadgeColor: '#10B981',
        vendorSubscriptionFee: 50000
      });
      toast.error(error?.message || 'Failed to load verification settings');
    } finally {
      setLoadingVerificationSettings(false);
    }
  }, [loadingVerificationSettings]);

  useEffect(() => {
    loadVerificationConfig();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadVerificationConfig]);

  const loadBlogCategories = useCallback(async () => {
    try {
      const categories = await fetchBlogCategories();
      const normalized = Array.isArray(categories)
        ? categories
            .map((cat) => (typeof cat === 'string' ? cat : cat?.slug || cat?.category))
            .filter(Boolean)
        : [];
      if (normalized.length) {
        setBlogCategoriesRemote((prev) => Array.from(new Set([...(prev || []), ...normalized])));
      }
    } catch (error) {
      console.warn('AdminDashboard: Failed to load blog categories', error);
    }
  }, []);

  useEffect(() => {
    if (user?.role !== 'admin') return;
    loadBlogCategories();
  }, [user?.role, loadBlogCategories]);

  const loadBlogPosts = useCallback(async () => {
    if (!user || user.role !== 'admin') return;
    setBlogLoading(true);
    setBlogError('');
    try {
      const params = {
        limit: 100,
        sortBy: 'updatedAt',
        sortOrder: 'desc'
      };
      if (blogFilter !== 'all') params.status = blogFilter;
      if (blogCategoryFilter !== 'all') params.category = blogCategoryFilter;
      if (blogSearch.trim()) params.search = blogSearch.trim();
      const result = await adminListBlogs(params);
      if (!isMountedRef.current) return;
      setBlogPosts(Array.isArray(result?.posts) ? result.posts : []);
    } catch (error) {
      const message = error?.response?.data?.message || error.message || 'Failed to load blog posts';
      if (!isMountedRef.current) return;
      setBlogError(message);
      toast.error(message);
    } finally {
      if (isMountedRef.current) {
        setBlogLoading(false);
      }
    }
  }, [user, blogFilter, blogCategoryFilter, blogSearch]);

  useEffect(() => {
    if (user?.role !== 'admin' || activeTab !== 'blog') return;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    loadBlogPosts();
  }, [user?.role, activeTab, blogFilter, blogCategoryFilter, blogSearch]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    const allowedTabs = ['properties','verification','escrow','disputes','users','blog','support'];
    if (tabParam && allowedTabs.includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  const normalizedSearch = userSearch.trim().toLowerCase();
  const propertyAnalytics = useMemo(() => {
    // Always calculate from the actual properties array to ensure accuracy
    const total = properties.length;
    const pending = properties.filter((p) => {
      const status = (p.approvalStatus || p.verificationStatus || 'pending').toLowerCase();
      return status === 'pending';
    }).length;
    const approved = properties.filter((p) => {
      const status = (p.approvalStatus || p.verificationStatus || '').toLowerCase();
      return status === 'approved';
    }).length;
    const rejected = properties.filter((p) => {
      const status = (p.approvalStatus || p.verificationStatus || '').toLowerCase();
      return status === 'rejected';
    }).length;
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
  }, [properties]);

  const blogStats = useMemo(() => {
    return blogPosts.reduce(
      (acc, post) => {
        acc.total += 1;
        if (post.status === 'published') acc.published += 1;
        if (post.status === 'draft') acc.drafts += 1;
        if (post.status === 'scheduled' || post.status === 'archived') acc.scheduled += 1;
        return acc;
      },
      { total: 0, published: 0, drafts: 0, scheduled: 0 }
    );
  }, [blogPosts]);

  const blogCategories = useMemo(() => {
    const categories = new Set(blogCategoriesRemote || []);
    blogPosts.forEach((post) => {
      if (post.category) categories.add(post.category);
    });
    return Array.from(categories).sort();
  }, [blogPosts, blogCategoriesRemote]);

  const filteredBlogPosts = useMemo(() => {
    return blogPosts.filter((post) => {
      const matchesStatus = blogFilter === 'all' || post.status === blogFilter;
      const matchesCategory = blogCategoryFilter === 'all' || post.category === blogCategoryFilter;
      const normalizedSearch = blogSearch.trim().toLowerCase();
      const matchesSearch = !normalizedSearch ||
        post.title?.toLowerCase().includes(normalizedSearch) ||
        post.excerpt?.toLowerCase().includes(normalizedSearch);
      return matchesStatus && matchesCategory && matchesSearch;
    });
  }, [blogPosts, blogFilter, blogCategoryFilter, blogSearch]);

  const updateStatsFromProperties = useCallback(() => {
    setStats({
      total: propertyAnalytics.total,
      pending: propertyAnalytics.pending,
      approved: propertyAnalytics.approved,
      rejected: propertyAnalytics.rejected
    });
  }, [propertyAnalytics]);

  const refreshStats = useCallback(() => {
    updateStatsFromProperties();
    if (!statsRefreshIntervalRef.current) {
      statsRefreshIntervalRef.current = setInterval(updateStatsFromProperties, 60000);
    }
  }, [updateStatsFromProperties]);
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


  const loadUsersFromApi = useCallback(async ({ page = 1, limit = 100, role } = {}) => {
    if (!user || user.role !== 'admin' || usersLoadedRef.current) return;

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
      const url = `${getApiUrl(`/admin/users?${params.toString()}`)}`;
      console.log('AdminDashboard: Fetching users URL:', url);
      const response = await authenticatedFetch(url);
      const payload = await response.json().catch(() => ({}));
      console.log('AdminDashboard: users response status:', response.status, 'payload:', payload);

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
      // Mark as loaded only after a successful fetch
      usersLoadedRef.current = true;
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
  }, [user, hasAdminToken]);

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
  }, [user, navigate]);

  useEffect(() => {
  }, [loadingUsers]);

  const fetchEscrowTransactions = useCallback(async ({ page, limit, status, ...params } = {}) => {
    if (!user || user.role !== 'admin') return;
    setEscrowLoading(true);
    setEscrowError('');
    try {
      const requestedPage = page || pagination.currentPage || 1;
      const requestedLimit = limit || pagination.itemsPerPage || 20;
      const statusFilter = status || escrowStatusFilter;

      const response = await apiClient.get('/escrow', {
        params: {
          type: 'admin',
          limit: requestedLimit,
          page: requestedPage,
          ...(statusFilter !== 'all' && { status: statusFilter }),
          ...params
        }
      });

      const payload = response?.data?.data || response?.data || {};
      const list = Array.isArray(payload?.transactions)
        ? payload.transactions
        : Array.isArray(response?.data?.transactions)
          ? response.data.transactions
          : Array.isArray(payload)
            ? payload
            : [];

      setEscrows(list);

      if (payload.pagination) {
        setPagination((prev) => ({
          ...prev,
          currentPage: payload.pagination.currentPage || requestedPage,
          itemsPerPage: payload.pagination.itemsPerPage || requestedLimit,
          totalItems: payload.pagination.totalItems || prev.totalItems,
          totalPages: payload.pagination.totalPages || prev.totalPages
        }));
      } else {
        // fallback: set minimal pagination
        setPagination((prev) => ({ ...prev, currentPage: requestedPage, itemsPerPage: requestedLimit }));
      }

      escrowsLoadedRef.current = true;
    } catch (error) {
      const message = error?.response?.data?.message || error.message || 'Failed to load escrow transactions';
      setEscrowError(message);
    } finally {
      setEscrowLoading(false);
    }
  }, [user, pagination.currentPage, pagination.itemsPerPage, escrowStatusFilter]);

  const fetchAdminDisputes = useCallback(async () => {
    if (!user || user.role !== 'admin') return;
    setDisputeLoading(true);
    setDisputeError('');
    try {
      const response = await apiClient.get('/admin/disputes');
      const list = Array.isArray(response?.data?.data) ? response.data.data : [];
      setDisputes(list);
      disputesLoadedRef.current = true;
    } catch (error) {
      const message = error?.response?.data?.message || error.message || 'Failed to load disputes';
      setDisputeError(message);
    } finally {
      setDisputeLoading(false);
    }
  }, [user]);

  const fetchFailedPayments = useCallback(async () => {
    if (!user || user.role !== 'admin') return;
    try {
      const response = await apiClient.get('/admin/escrow-payments/failed', { params: { limit: 20 } });
      const payments = Array.isArray(response?.data?.data?.payments) ? response.data.data.payments : [];
      setFailedPayments(payments);
    } catch (error) {
      console.warn('Failed to load failed payments:', error?.message);
    }
  }, [user]);

  const handleEscrowStatusFilterChange = useCallback((status) => {
    setEscrowStatusFilter(status);
    fetchEscrowTransactions({ page: 1, status });
  }, [fetchEscrowTransactions]);



  useEffect(() => {
    const checkAdminToken = async () => {
      const token = await hasAuthToken();
      if (!isMountedRef.current) return;
      setHasAdminToken(Boolean(token));
      if (!token) {
        setAuthWarning('Admin authentication required. Please log in with an admin account (e.g., admin@propertyark.com / Admin#2026!) so protected endpoints can be accessed.');
      } else {
        setAuthWarning('');
      }
    };

    checkAdminToken();

    return () => {
      isMountedRef.current = false;
      if (statsRefreshIntervalRef.current) {
        clearInterval(statsRefreshIntervalRef.current);
        statsRefreshIntervalRef.current = null;
      }
    };
  }, [user]);

  useEffect(() => {
    if (user?.role !== 'admin') return;
    fetchEscrowTransactions({ page: 1 });
    fetchAdminDisputes();
    loadUsersFromApi({ page: 1, limit: 100 });
  }, [user?.role, fetchEscrowTransactions, fetchAdminDisputes, loadUsersFromApi]);

  useEffect(() => {
    if (user?.role !== 'admin') return;
    if (activeTab === 'escrow' && !escrowLoading && !escrowsLoadedRef.current) {
      fetchEscrowTransactions({ page: 1 });
      fetchFailedPayments();
    }
    if (activeTab === 'disputes' && !disputeLoading && !disputesLoadedRef.current) {
      fetchAdminDisputes();
    }
  }, [activeTab, user?.role, fetchEscrowTransactions, fetchAdminDisputes, fetchFailedPayments, escrowLoading, disputeLoading]);

  useEffect(() => {
    if (!statsLoading && user?.role === 'admin' && !statsRefreshIntervalRef.current) {
      refreshStats();
    }
  }, [statsLoading, user?.role, statsRefreshIntervalRef]);

  // ...

  const handleToggleUser = useCallback((userId, checked) => {
    setSelectedUserIds((prev) => {
      if (checked) return Array.from(new Set([...prev, userId]));
      return prev.filter((id) => id !== userId);
    });
  }, []);

  const handleToggleAllUsers = useCallback((selectAll) => {
    if (selectAll) {
      setSelectedUserIds(filteredUsers.map((u) => u.id));
    } else {
      setSelectedUserIds([]);
    }
  }, [filteredUsers]);

  const handleUserStatusChange = useCallback(async (userId, nextStatus) => {
    if (!userId || !nextStatus) return;
    try {
      await apiClient.patch(`/admin/users/${userId}/status`, { status: nextStatus });
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status: nextStatus, isActive: nextStatus === 'active' } : u)));
      toast.success(`User ${nextStatus === 'active' ? 'activated' : nextStatus === 'suspended' ? 'suspended' : 'archived'}`);
    } catch (error) {
      const message = error?.response?.data?.message || error.message || 'Failed to update user status';
      toast.error(message);
    }
  }, []);

  const handleActivateUser = useCallback((userId) => handleUserStatusChange(userId, 'active'), [handleUserStatusChange]);
  const handleSuspendUser = useCallback((userId) => handleUserStatusChange(userId, 'suspended'), [handleUserStatusChange]);
  const handleArchiveUser = useCallback((userId) => handleUserStatusChange(userId, 'archived'), [handleUserStatusChange]);

  const handleBulkAction = useCallback((action) => {
    if (!selectedUserIds.length) return;
    const performAction = {
      activate: handleActivateUser,
      suspend: handleSuspendUser,
      archive: handleArchiveUser
    }[action];
    if (!performAction) return;
    selectedUserIds.forEach((userId) => performAction(userId));
    setSelectedUserIds([]);
  }, [handleActivateUser, handleSuspendUser, handleArchiveUser, selectedUserIds]);

  const handleResolveDispute = useCallback(async ({ disputeId, resolutionType, adminNotes }) => {
    if (!disputeId) return false;
    const normalizedResolution = resolutionType === 'reject' ? 'rejected' : resolutionType;
    const status = resolutionType === 'reject' ? 'closed' : 'resolved';
    try {
      await apiClient.patch(`/admin/disputes/${disputeId}`, {
        status,
        resolutionNotes: adminNotes,
        resolution: normalizedResolution
      });
      toast.success('Dispute updated successfully');
      await fetchAdminDisputes();
      return true;
    } catch (error) {
      const message = error?.response?.data?.message || error.message || 'Failed to resolve dispute';
      toast.error(message);
      throw new Error(message);
    }
  }, [fetchAdminDisputes]);

  const handleEscrowStatusUpdate = useCallback(async ({ transactionId, status, notes }) => {
    if (!transactionId || !status) return false;
    try {
      await apiClient.put(`/escrow/${transactionId}/status`, {
        status,
        notes
      });
      toast.success('Escrow status updated');
      await fetchEscrowTransactions();
      return true;
    } catch (error) {
      const message = error?.response?.data?.message || error.message || 'Failed to update escrow status';
      toast.error(message);
      throw new Error(message);
    }
  }, [fetchEscrowTransactions]);

  const handleEscrowDisputeResolution = useCallback(async ({ transactionId, resolution, adminNotes }) => {
    if (!transactionId || !resolution) return false;
    try {
      await apiClient.put(`/escrow/${transactionId}/resolve-dispute`, {
        resolution,
        adminNotes
      });
      toast.success('Escrow dispute resolved');
      await fetchEscrowTransactions();
      return true;
    } catch (error) {
      const message = error?.response?.data?.message || error.message || 'Failed to resolve escrow dispute';
      toast.error(message);
      throw new Error(message);
    }
  }, [fetchEscrowTransactions]);

  const openEscrowActionModal = (transaction, type = 'status') => {
    setSelectedEscrowTransaction(transaction);
    setEscrowActionType(type);
    setEscrowStatusValue((transaction?.status || 'pending').toLowerCase());
    setEscrowResolutionType('buyer_favor');
    setEscrowActionNotes('');
    setShowEscrowActionModal(true);
  };

  const closeEscrowActionModal = () => {
    setShowEscrowActionModal(false);
    setSelectedEscrowTransaction(null);
    setEscrowActionNotes('');
  };

  const submitEscrowAction = async () => {
    if (!selectedEscrowTransaction) return;
    try {
      setEscrowActionLoading(true);
      if (escrowActionType === 'status') {
        if (!escrowStatusValue) {
          toast.error('Select a status to continue');
          return;
        }
        await handleEscrowStatusUpdate({
          transactionId: selectedEscrowTransaction.id,
          status: escrowStatusValue,
          notes: escrowActionNotes
        });
      } else {
        if (!escrowResolutionType) {
          toast.error('Select a resolution to continue');
          return;
        }
        if (!escrowActionNotes || escrowActionNotes.trim().length < 10) {
          toast.error('Add admin notes (at least 10 characters)');
          return;
        }
        await handleEscrowDisputeResolution({
          transactionId: selectedEscrowTransaction.id,
          resolution: escrowResolutionType,
          adminNotes: escrowActionNotes
        });
      }
      closeEscrowActionModal();
    } catch (error) {
      console.error('Escrow action failed:', error);
    } finally {
      setEscrowActionLoading(false);
    }
  };

  const handleSwitchTab = useCallback((tabId) => {
    if (!tabId) return;
    const allowedTabs = ['properties','verification','escrow','disputes','users','blog','support'];
    const nextTab = allowedTabs.includes(tabId) ? tabId : 'properties';
    setActiveTab(nextTab);
    const params = new URLSearchParams(location.search);
    params.set('tab', nextTab);
    navigate({ search: params.toString() }, { replace: true });
  }, [location.search, navigate]);

  const openPropertyModal = useCallback((property) => {
    setSelectedPropertyForModal(property);
    setShowPropertyModal(true);
  }, []);

  const closePropertyModal = useCallback(() => {
    setShowPropertyModal(false);
    setSelectedPropertyForModal(null);
  }, []);

  const handleVerifyProperty = useCallback(async (propertyId, status, notes = '') => {
    if (!propertyId) return false;
    try {
      await verifyProperty(propertyId, status, notes);
      toast.success(`Property ${status === 'approved' ? 'approved' : 'rejected'}`);
      return true;
    } catch (error) {
      toast.error(error?.message || 'Verification update failed');
      return false;
    }
  }, [verifyProperty]);

  const handlePropertyApprove = useCallback(async (propertyId, notes = '') => {
    await handleVerifyProperty(propertyId, 'approved', notes);
    closePropertyModal();
  }, [handleVerifyProperty, closePropertyModal]);

  const handlePropertyReject = useCallback(async (propertyId, reason = '', notes = '') => {
    await handleVerifyProperty(propertyId, 'rejected', `${reason}${notes ? ` - ${notes}` : ''}`);
    closePropertyModal();
  }, [handleVerifyProperty, closePropertyModal]);

  const openVerificationModal = useCallback((property) => {
    setSelectedProperty(property);
  }, []);

  const closeVerificationModal = useCallback(() => {
    setSelectedProperty(null);
    setVerificationNotes('');
  }, []);

  const handleStatusFilter = useCallback((status) => {
    setSelectedStatus(status);
    fetchAdminProperties(status, selectedVerificationStatus);
  }, [fetchAdminProperties, selectedVerificationStatus]);

  const handleVerificationFilter = useCallback((verificationStatus) => {
    setSelectedVerificationStatus(verificationStatus);
    fetchAdminProperties(selectedStatus, verificationStatus);
  }, [fetchAdminProperties, selectedStatus]);

  const handleBlogEditorChange = useCallback((field, value) => {
    setBlogEditor((prev) => ({ ...prev, [field]: value }));
  }, []);

  const openCreateBlogModal = useCallback(() => {
    setBlogEditor(buildInitialBlogEditorState());
    setEditingBlogId(null);
    setIsBlogModalOpen(true);
  }, []);

  const openEditBlogModal = useCallback((post) => {
    if (!post) return;
    setBlogEditor(mapBlogToEditorState(post));
    setEditingBlogId(post.id);
    setIsBlogModalOpen(true);
  }, []);

  const closeBlogModal = useCallback(() => {
    setIsBlogModalOpen(false);
    setEditingBlogId(null);
    setBlogEditor(buildInitialBlogEditorState());
  }, []);

  const handleBlogSubmit = useCallback(async () => {
    if (!user?.id) {
      toast.error('Admin authentication required');
      return;
    }
    try {
      setBlogSaving(true);
      const payload = buildPayloadFromEditor(blogEditor, user.id);
      if (editingBlogId) {
        await adminUpdateBlog(editingBlogId, payload);
        toast.success('Post updated');
      } else {
        await adminCreateBlog(payload);
        toast.success('Post created');
      }
      closeBlogModal();
      await loadBlogPosts();
    } catch (error) {
      const message = error?.response?.data?.message || error.message || 'Failed to save post';
      toast.error(message);
    } finally {
      setBlogSaving(false);
    }
  }, [blogEditor, editingBlogId, user?.id, closeBlogModal, loadBlogPosts]);

  const handleBlogStatusToggle = useCallback(async (post, nextStatus) => {
    if (!post?.id) return;
    const calculatedStatus = nextStatus || (post.status === 'published' ? 'draft' : 'published');
    try {
      setBlogActionBusyId(post.id);
      const updated = await adminUpdateBlogStatus(
        post.id,
        calculatedStatus,
        calculatedStatus === 'published' ? new Date().toISOString() : undefined
      );
      setBlogPosts((prev) => prev.map((p) => (p.id === post.id ? updated : p)));
      toast.success(`Post ${calculatedStatus === 'published' ? 'published' : 'moved to drafts'}`);
    } catch (error) {
      const message = error?.response?.data?.message || error.message || 'Failed to update status';
      toast.error(message);
    } finally {
      setBlogActionBusyId(null);
    }
  }, []);

  const handleDeleteBlogPost = useCallback(async (postId) => {
    if (!postId) return;
    try {
      setBlogActionBusyId(postId);
      await adminDeleteBlog(postId);
      setBlogPosts((prev) => prev.filter((post) => post.id !== postId));
      toast.success('Post deleted');
    } catch (error) {
      const message = error?.response?.data?.message || error.message || 'Failed to delete post';
      toast.error(message);
    } finally {
      setBlogActionBusyId(null);
    }
  }, []);

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
        <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleAdminLogout} />
        <div className="flex-1 ml-0 lg:ml-64 flex items-center justify-center">
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
      <AdminSidebar activeTab={activeTab} setActiveTab={handleSwitchTab} onLogout={handleAdminLogout} />

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
              {activeTab === 'blog' && 'Blog content planning and publishing'}
              {activeTab === 'support' && 'Support inquiries from buyers and vendors'}
              {/* Blog content management removed */}
            </p>
          </div>
        </div>

        {/* Content Area */}
        <main className={`flex-1 w-full ${contentWidthClasses} py-6 lg:py-10 space-y-8`}>

        {/* Stats Cards (properties tab only) */}
        {activeTab === 'properties' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Property Statistics</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Properties</p>
                  <p className="text-2xl font-semibold text-gray-900">{propertyAnalytics.total}</p>
                </div>
              </div>
            </div>

            {/* Vendor Subscription Fee Card */}
            <div className="bg-white rounded-lg shadow p-4 sm:p-6 flex flex-col justify-between">
              <div className="flex items-center mb-2">
                <div className="p-3 rounded-full bg-emerald-100 text-emerald-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 10c-4.41 0-8-1.79-8-4V6c0-2.21 3.59-4 8-4s8 1.79 8 4v8c0 2.21-3.59 4-8 4z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Vendor Subscription Fee</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    ₦{adminSettings?.vendorSubscriptionFee?.toLocaleString() || '50,000'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Current fee for vendor onboarding</p>
                  {adminSettings?.updatedAt && (
                    <p className="text-xs text-gray-400 mt-1">Last updated: {new Date(adminSettings.updatedAt).toLocaleDateString()}</p>
                  )}
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
                  <p className="text-2xl font-semibold text-gray-900">{propertyAnalytics.pending}</p>
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
                  <p className="text-2xl font-semibold text-gray-900">{propertyAnalytics.approved}</p>
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
                  <p className="text-2xl font-semibold text-gray-900">{propertyAnalytics.rejected}</p>
                </div>
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
                <p>Approved: {propertyAnalytics.approved}</p>
                <p>Rejected: {propertyAnalytics.rejected}</p>
              </div>
            </div>
          </div>
        )}

        {/* Verification Tab */}
        {activeTab === 'verification' && (
          <div className="space-y-6">
            {/* Property Verification Applications */}
            <AdminVerificationDashboard />

            {/* Verification Settings */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Verification Settings</h3>
              {loadingVerificationSettings && !adminSettings ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center text-gray-500">
                  Loading verification settings...
                </div>
              ) : (
                <AdminVerificationCenter
                  config={adminSettings}
                  isAuthenticated={hasAdminToken}
                  onRequireAdminAuth={() => {
                    setHasAdminToken(false);
                    setAuthWarning('Admin authentication required. Please log in again to manage verification settings.');
                  }}
                  onConfigChange={(updated) => setAdminSettings((prev) => ({
                    ...(prev || {}),
                    ...updated
                  }))}
                />
              )}
            </div>
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
              <AdminDisputesManagement
                disputes={disputes}
                loading={disputeLoading}
                error={disputeError}
                onResolveDispute={handleResolveDispute}
                onRefresh={fetchAdminDisputes}
              />
            </div>
          </div>
        )}

        {/* Blog Tab */}
        {activeTab === 'blog' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <p className="text-sm font-medium text-gray-600">Total Posts</p>
                <p className="mt-2 text-3xl font-semibold text-gray-900">{blogStats.total}</p>
                <p className="text-xs text-gray-500 mt-1">Across all categories</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <p className="text-sm font-medium text-gray-600">Published</p>
                <p className="mt-2 text-3xl font-semibold text-emerald-600">{blogStats.published}</p>
                <p className="text-xs text-gray-500 mt-1">Live on the blog</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <p className="text-sm font-medium text-gray-600">Drafts / Scheduled</p>
                <p className="mt-2 text-3xl font-semibold text-amber-600">{blogStats.drafts + blogStats.scheduled}</p>
                <p className="text-xs text-gray-500 mt-1">Awaiting review</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div>
                <p className="text-sm font-semibold text-brand-orange tracking-[0.3em] uppercase">Editorial Control</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-2">Manage PropertyArk stories</h3>
                <p className="text-sm text-gray-500 mt-1">Create market updates, investment guides, and announcements from one place.</p>
              </div>
              <button
                onClick={openCreateBlogModal}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-brand-blue text-white font-semibold shadow-lg shadow-brand-blue/20 hover:bg-brand-blue/90 transition"
              >
                + Compose New Post
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="grid gap-4 lg:grid-cols-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                  <input
                    type="text"
                    value={blogSearch}
                    onChange={(e) => setBlogSearch(e.target.value)}
                    placeholder="Search title or excerpt"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={blogFilter}
                    onChange={(e) => setBlogFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  >
                    <option value="all">All Posts</option>
                    {BLOG_STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={blogCategoryFilter}
                    onChange={(e) => setBlogCategoryFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  >
                    <option value="all">All Categories</option>
                    {blogCategories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setBlogSearch('');
                      setBlogFilter('all');
                      setBlogCategoryFilter('all');
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-50"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-4">
                {filteredBlogPosts.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-6 text-center text-gray-500">
                    No blog posts match the selected filters.
                  </div>
                ) : (
                  <>
                    {/* Mobile pagination controls */}
                    <div className="px-4 py-3 border-t border-gray-100 lg:hidden flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => { if (pagination.currentPage > 1) fetchEscrowTransactions({ page: pagination.currentPage - 1 }); }}
                          disabled={pagination.currentPage <= 1 || escrowLoading}
                          className="inline-flex items-center rounded-md border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Prev
                        </button>
                        <span className="text-sm text-gray-700">{pagination.currentPage}/{pagination.totalPages}</span>
                        <button
                          type="button"
                          onClick={() => { if (pagination.currentPage < pagination.totalPages) fetchEscrowTransactions({ page: pagination.currentPage + 1 }); }}
                          disabled={pagination.currentPage >= pagination.totalPages || escrowLoading}
                          className="inline-flex items-center rounded-md border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Next
                        </button>
                      </div>
                      <div>
                        <select
                          value={pagination.itemsPerPage}
                          onChange={(e) => {
                            const newSize = Number(e.target.value) || 20;
                            setPagination((prev) => ({ ...prev, itemsPerPage: newSize, currentPage: 1 }));
                            fetchEscrowTransactions({ page: 1, limit: newSize });
                          }}
                          className="border border-gray-200 rounded-md px-2 py-1 text-sm"
                        >
                          <option value={10}>10</option>
                          <option value={20}>20</option>
                          <option value={50}>50</option>
                        </select>
                      </div>
                    </div>
                    {filteredBlogPosts.map((post) => (
                    <div key={post.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
                      <div className="flex flex-wrap items-center gap-3 justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-gray-400">{post.category}</p>
                          <h3 className="text-lg font-semibold text-gray-900">{post.title}</h3>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${post.status === 'published' ? 'bg-emerald-50 text-emerald-700' : post.status === 'scheduled' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>
                          {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">{post.excerpt}</p>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                        <span>Author: {post.author}</span>
                        <span>Updated: {post.publishedAt ? new Date(post.publishedAt).toLocaleString() : '—'}</span>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={() => handleBlogStatusToggle(post.id)}
                          className="px-3 py-2 text-sm font-medium rounded-md border border-brand-blue text-brand-blue hover:bg-brand-blue/5"
                        >
                          {post.status === 'published' ? 'Move to Draft' : 'Publish'}
                        </button>
                        <button
                          onClick={() => handleDeleteBlogPost(post.id)}
                          className="px-3 py-2 text-sm font-medium rounded-md border border-red-500 text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    ))}
                  </>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Create Post</h3>
                  <p className="text-sm text-gray-500 mt-1">Draft a quick update and publish later.</p>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={draftPost.title}
                      onChange={(e) => handleDraftChange('title', e.target.value)}
                      placeholder="Post title"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <input
                      type="text"
                      value={draftPost.category}
                      onChange={(e) => handleDraftChange('category', e.target.value)}
                      placeholder="e.g. Market Trends"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={draftPost.status}
                      onChange={(e) => handleDraftChange('status', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="scheduled">Scheduled</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                    <textarea
                      rows={5}
                      value={draftPost.content}
                      onChange={(e) => handleDraftChange('content', e.target.value)}
                      placeholder="Share insights, data, or announcements..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleCreateBlogPost}
                      className="flex-1 px-4 py-2 bg-brand-blue text-white rounded-md hover:bg-brand-blue/90"
                    >
                      Save Draft
                    </button>
                    <button
                      onClick={resetDraftPost}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Property status distribution chart (properties tab only) */}
        {activeTab === 'properties' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Listings by Approval Status</h2>
            <AdminListingsStatusChart
              total={propertyAnalytics.total}
              pending={propertyAnalytics.pending}
              approved={propertyAnalytics.approved}
              rejected={propertyAnalytics.rejected}
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
                                loading="lazy"
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
                            // Check for vendorName first (new property structure)
                            if (property.vendorName) {
                              return property.vendorName;
                            }
                            // Fallback to owner object (legacy structure)
                            if (property.owner && typeof property.owner === 'object') {
                              const firstName = property.owner.firstName || '';
                              const lastName = property.owner.lastName || '';
                              const fullName = `${firstName} ${lastName}`.trim();
                              return fullName || property.owner.email || 'Unknown';
                            }
                            // Fallback to owner string or vendorId
                            return property.owner || property.vendorId || 'Unknown';
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
                          loading="lazy"
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
              <div className="px-6 py-4 border-b border-gray-200 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <h2 className="text-lg font-medium text-gray-900">Escrow Transactions</h2>
                <div className="flex gap-2 flex-wrap">
                  <select
                    value={escrowStatusFilter}
                    onChange={(e) => handleEscrowStatusFilterChange(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 bg-white"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="funded">Funded</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                    <option value="disputed">Disputed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="refunded">Refunded</option>
                  </select>
                  {failedPayments.length > 0 && (
                    <button
                      onClick={() => setShowFailedPayments(!showFailedPayments)}
                      className="inline-flex items-center rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                    >
                      Failed Payments ({failedPayments.length})
                    </button>
                  )}
                  <button
                    onClick={() => fetchEscrowTransactions({ page: pagination.currentPage })}
                    disabled={escrowLoading}
                    className="inline-flex items-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Refresh
                  </button>
                </div>
              </div>
              {escrowLoading && (
                <div className="p-6">
                  <TableSkeleton rows={4} columns={6} />
                </div>
              )}
              {!escrowLoading && escrowError && (
                <div className="p-6 text-sm text-red-600">
                  {escrowError}
                </div>
              )}
              {!escrowLoading && !escrowError && escrows.length === 0 && (
                <div className="p-6 text-sm text-gray-500">No escrow transactions found.</div>
              )}
              {!escrowLoading && !escrowError && escrows.length > 0 && (
                <>
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
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {escrows.map(tx => (
                          <tr key={tx.id}>
                            <td className="px-6 py-4 text-sm">{tx.id}</td>
                            <td className="px-6 py-4 text-sm">{tx.propertyTitle || tx.property?.title || '—'}</td>
                            <td className="px-6 py-4 text-sm">{tx.buyerName || tx.buyer?.name || '—'}</td>
                            <td className="px-6 py-4 text-sm">{tx.sellerName || tx.seller?.name || '—'}</td>
                            <td className="px-6 py-4 text-sm">₦{Number(tx.amount || 0).toLocaleString()}</td>
                            <td className="px-6 py-4 text-sm">{(tx.status || '').toUpperCase()}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {tx.updatedAt ? new Date(tx.updatedAt).toLocaleDateString() : '—'}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <div className="flex flex-wrap gap-2">
                                <button
                                  onClick={() => openEscrowActionModal(tx, 'status')}
                                  className="px-3 py-1 text-xs font-medium border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                >
                                  Update Status
                                </button>
                                {(tx.status || '').toLowerCase() === 'disputed' && (
                                  <button
                                    onClick={() => openEscrowActionModal(tx, 'resolution')}
                                    className="px-3 py-1 text-xs font-medium border border-red-300 text-red-600 rounded-md hover:bg-red-50"
                                  >
                                    Resolve Dispute
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Desktop pagination controls */}
                  <div className="px-6 py-3 border-t border-gray-100 hidden lg:flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => { if (pagination.currentPage > 1) fetchEscrowTransactions({ page: pagination.currentPage - 1 }); }}
                        disabled={pagination.currentPage <= 1 || escrowLoading}
                        className="inline-flex items-center rounded-md border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Previous
                      </button>

                      <span className="text-sm text-gray-700">Page {pagination.currentPage} of {pagination.totalPages}</span>

                      <button
                        type="button"
                        onClick={() => { if (pagination.currentPage < pagination.totalPages) fetchEscrowTransactions({ page: pagination.currentPage + 1 }); }}
                        disabled={pagination.currentPage >= pagination.totalPages || escrowLoading}
                        className="inline-flex items-center rounded-md border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600">Page size</label>
                      <select
                        value={pagination.itemsPerPage}
                        onChange={(e) => {
                          const newSize = Number(e.target.value) || 20;
                          setPagination((prev) => ({ ...prev, itemsPerPage: newSize, currentPage: 1 }));
                          fetchEscrowTransactions({ page: 1, limit: newSize });
                        }}
                        className="border border-gray-200 rounded-md px-2 py-1 text-sm"
                      >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                      </select>
                    </div>
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
                              <p className="text-sm font-semibold text-gray-900">{tx.propertyTitle || tx.property?.title || 'Escrow Transaction'}</p>
                              <p className="text-xs text-gray-500">ID: {tx.id}</p>
                            </div>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusClass}`}>
                              {statusLabel}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                            <div>
                              <p className="text-xs uppercase tracking-wide text-gray-400">Buyer</p>
                              <p className="font-medium text-gray-900">{tx.buyerName || tx.buyer?.name || '—'}</p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-wide text-gray-400">Seller</p>
                              <p className="font-medium text-gray-900">{tx.sellerName || tx.seller?.name || '—'}</p>
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
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => openEscrowActionModal(tx, 'status')}
                              className="w-full px-3 py-2 text-xs font-medium border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            >
                              Update Status
                            </button>
                            {(tx.status || '').toLowerCase() === 'disputed' && (
                              <button
                                onClick={() => openEscrowActionModal(tx, 'resolution')}
                                className="w-full px-3 py-2 text-xs font-medium border border-red-300 text-red-600 rounded-md hover:bg-red-50"
                              >
                                Resolve Dispute
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
              {!escrowLoading && !escrowError && escrows.length === 0 && (
                <div className="p-6 text-sm text-gray-500">No escrow transactions available.</div>
              )}

              {/* Failed Payments Section */}
              {showFailedPayments && failedPayments.length > 0 && (
                <div className="mt-6 p-6 bg-red-50 rounded-2xl border border-red-200">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-red-900">Failed Payment Attempts</h3>
                      <p className="text-sm text-red-700 mt-1">Total failed payments: {failedPayments.length}</p>
                    </div>
                    <button
                      onClick={() => setShowFailedPayments(false)}
                      className="text-red-600 hover:text-red-900 text-lg"
                      aria-label="Close failed payments"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full divide-y divide-red-200">
                      <thead className="bg-red-100">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-red-900 uppercase tracking-wider">Payment ID</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-red-900 uppercase tracking-wider">Amount</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-red-900 uppercase tracking-wider">Buyer</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-red-900 uppercase tracking-wider">Reason</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-red-900 uppercase tracking-wider">Date</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-red-200">
                        {failedPayments.map(payment => (
                          <tr key={payment.id} className="hover:bg-red-50">
                            <td className="px-4 py-3 text-sm font-mono text-gray-900">{payment.id.substring(0, 8)}...</td>
                            <td className="px-4 py-3 text-sm font-semibold text-red-600">₦{Number(payment.amount || 0).toLocaleString()}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{payment.buyerName || payment.user?.name || 'Unknown'}</td>
                            <td className="px-4 py-3 text-sm text-red-700">{payment.reason || payment.gateway_response || 'Unknown error'}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                              {payment.createdAt ? new Date(payment.createdAt).toLocaleDateString() : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="lg:hidden space-y-3">
                    {failedPayments.map(payment => (
                      <div key={payment.id} className="p-4 bg-white rounded-lg border border-red-200 space-y-2">
                        <div className="flex items-start justify-between">
                          <p className="text-xs font-mono text-gray-500">ID: {payment.id.substring(0, 12)}...</p>
                          <p className="text-sm font-semibold text-red-600">₦{Number(payment.amount || 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-gray-400">Buyer</p>
                          <p className="text-sm font-medium text-gray-900">{payment.buyerName || payment.user?.name || 'Unknown'}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-gray-400">Failure Reason</p>
                          <p className="text-sm text-red-700">{payment.reason || payment.gateway_response || 'Unknown error'}</p>
                        </div>
                        <div className="text-xs text-gray-500">
                          {payment.createdAt ? new Date(payment.createdAt).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {showFailedPayments && failedPayments.length === 0 && (
                <div className="mt-6 p-6 bg-green-50 rounded-2xl border border-green-200">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">✓</div>
                    <div>
                      <p className="text-lg font-semibold text-green-900">No Failed Payments</p>
                      <p className="text-sm text-green-700">All payment attempts have been successful.</p>
                    </div>
                  </div>
                </div>
              )}
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

        {/* Support Tab */}
        {activeTab === 'support' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900">Support Inbox</h2>
              <p className="text-sm text-gray-500 mt-1">Review and respond to all inquiries from buyers and vendors.</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
              <AdminSupportTickets />
            </div>
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

      {showEscrowActionModal && selectedEscrowTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 px-4 py-8">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 sm:p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {escrowActionType === 'status' ? 'Update Escrow Status' : 'Resolve Escrow Dispute'}
                  </h3>
                  <p className="text-sm text-gray-500">Transaction ID: {selectedEscrowTransaction.id}</p>
                </div>
                <button
                  onClick={closeEscrowActionModal}
                  className="p-2 rounded-md text-gray-500 hover:bg-gray-100"
                >
                  <HiOutlineX className="w-5 h-5" />
                </button>
              </div>

              {escrowActionType === 'status' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Escrow Status</label>
                  <select
                    value={escrowStatusValue}
                    onChange={(e) => setEscrowStatusValue(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-blue"
                  >
                    {ESCROW_STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Resolution</label>
                  <div className="space-y-2">
                    {ESCROW_RESOLUTION_OPTIONS.map((option) => (
                      <label key={option.value} className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="radio"
                          name="escrow-resolution"
                          value={option.value}
                          checked={escrowResolutionType === option.value}
                          onChange={(e) => setEscrowResolutionType(e.target.value)}
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {escrowActionType === 'status' ? 'Notes (optional)' : 'Admin Notes (required)'}
                </label>
                <textarea
                  value={escrowActionNotes}
                  onChange={(e) => setEscrowActionNotes(e.target.value)}
                  rows={escrowActionType === 'status' ? 3 : 4}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-blue"
                  placeholder={escrowActionType === 'status'
                    ? 'Add internal notes about this status change (optional)'
                    : 'Explain the investigation outcome and decision (min 10 characters)'}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={closeEscrowActionModal}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                  disabled={escrowActionLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={submitEscrowAction}
                  disabled={escrowActionLoading}
                  className="px-4 py-2 rounded-lg bg-brand-blue text-white hover:bg-brand-blue/90 disabled:opacity-60"
                >
                  {escrowActionLoading ? 'Processing...' : 'Confirm Action'}
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
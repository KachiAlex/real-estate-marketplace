import React, { useEffect, useState, useCallback } from 'react';
  // ...existing code...
  // Render dashboard switch for eligible users
  // ...existing code...
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import DashboardSwitch from '../components/DashboardSwitch';
import { useProperty } from '../contexts/PropertyContext';
import { useInvestment } from '../contexts/InvestmentContext';
import { useMortgage } from '../contexts/MortgageContext';
import { FaHeart, FaBell, FaQuestionCircle, FaShare, FaBed, FaBath, FaRuler, FaUser, FaCalendar, FaTag, FaHome, FaMapMarkerAlt, FaPhone, FaEnvelope, FaCheck, FaPlus, FaChartLine, FaMoneyBillWave, FaEye } from 'react-icons/fa';
import toast from 'react-hot-toast';
import PriceTrendsChart from '../components/PriceTrendsChart';
import apiClient from '../services/apiClient';

const Dashboard = () => {
  const { user, setAuthRedirect } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // If this account is vendor-only (no buyer/user role), redirect to vendor dashboard
  useEffect(() => {
    try {
      if (user && Array.isArray(user.roles) && user.roles.includes('vendor') && !user.roles.includes('user') && !user.roles.includes('buyer')) {
        navigate('/vendor/dashboard', { replace: true });
      }
    } catch (err) {
      // swallow navigation errors during tests
      console.warn('Dashboard redirect guard error', err);
    }
  }, [user, navigate]);
  const { properties, loading, toggleFavorite } = useProperty();
  const { userInvestments, getUserInvestmentSummary } = useInvestment();
  const { getUserMortgages, getPaymentSummary, getUserApplications, getApplicationsByStatus } = useMortgage();
  const [favorites, setFavorites] = useState(new Set());

  // Load favorites from localStorage
  const loadFavorites = useCallback(() => {
    if (user && user.id) {
      const key = `favorites_${user.id}`;
      const savedFavorites = JSON.parse(localStorage.getItem(key) || '[]');
      // Convert all IDs to strings for consistent comparison
      const normalizedFavorites = savedFavorites.map(id => String(id));
      setFavorites(new Set(normalizedFavorites));
      return normalizedFavorites.length;
    }
    return 0;
  }, [user]);

  // Get recent properties (first 3)
  const recentProperties = properties.slice(0, 3);

  // Initialize dashboard stats state
  const [dashboardStats, setDashboardStats] = useState({
    totalProperties: 0,
    savedProperties: 0,
    activeInquiries: 0,
    scheduledViewings: 0,
    completedViewings: 0,
    totalInvested: 0,
    activeInvestments: 0,
    escrowTransactions: 0,
    pendingPayments: 0,
    totalEarnings: 0,
    monthlyBudget: 5000000
  });

  // Function to refresh dashboard stats
  const refreshDashboardStats = useCallback(() => {
    if (!user || !user.id) {
      console.warn('refreshDashboardStats: No user available, skipping load');
      return;
    }

    // Get saved properties count from localStorage (includes mock data)
    const key = `favorites_${user.id}`;
    const savedFavorites = JSON.parse(localStorage.getItem(key) || '[]');
    const savedCount = Array.isArray(savedFavorites) ? savedFavorites.length : 0;

    // Get scheduled viewings from localStorage (matches inspection requests page logic)
    const viewingRequests = JSON.parse(localStorage.getItem('viewingRequests') || '[]');
    const userViewingRequests = viewingRequests.filter(req => 
      req.userId === user.id || req.buyerId === user.id
    );
    // Scheduled viewings: pending, pending_vendor_confirmation, accepted, confirmed, proposed_new_time
    const scheduledViewings = userViewingRequests.filter(req => {
      const status = req.status?.toLowerCase();
      return status === 'pending' || 
             status === 'pending_vendor_confirmation' || 
             status === 'accepted' ||
             status === 'confirmed' ||
             status === 'proposed_new_time';
    }).length;
    // Completed viewings: completed, viewed, declined (for historical tracking)
    const completedViewings = userViewingRequests.filter(req => {
      const status = req.status?.toLowerCase();
      return status === 'completed' || status === 'viewed' || status === 'declined';
    }).length;

    // Get active inquiries from localStorage (if exists)
    const inquiries = JSON.parse(localStorage.getItem('inquiries') || '[]');
    const userInquiries = inquiries.filter(inq => 
      inq.userId === user.id || inq.buyerId === user.id
    );
    const activeInquiries = userInquiries.filter(inq => 
      inq.status === 'new' || inq.status === 'pending' || inq.status === 'contacted'
    ).length;

    // Get escrow transactions from localStorage (matches escrow page logic)
    const escrowTransactions = JSON.parse(localStorage.getItem('escrowTransactions') || '[]');
    const userEscrowTransactions = escrowTransactions.filter(t => 
      t.buyerId === user.id || t.sellerId === user.id || t.buyerId === user.uid || t.sellerId === user.uid
    );
    // Total escrow transactions count (matches escrow page)
    const escrowCount = userEscrowTransactions.length;
    // Pending payments: pending_payment, pending, funded (awaiting completion)
    const pendingPayments = userEscrowTransactions.filter(t => {
      const status = t.status?.toLowerCase();
      return status === 'pending_payment' || status === 'pending' || status === 'funded';
    }).length;

    // Get investment data from InvestmentContext (matches investment dashboard logic)
    const investmentSummary = getUserInvestmentSummary();
    // Total invested: sum of all user investments (matches investment page calculation)
    const totalInvested = investmentSummary.totalInvested || 0;
    // Active investments: count of investments with status 'active' (matches investment dashboard)
    const activeInvestments = investmentSummary.activeInvestments || 0;
    // Total earnings: sum of totalDividendsEarned (matches investment page)
    const totalEarnings = investmentSummary.totalDividends || 0;

    // Get mortgage application data (moved outside callback)
    const mortgageApplications = getUserApplications();
    const pendingMortgageApps = getApplicationsByStatus('pending').length;
    const underReviewMortgageApps = getApplicationsByStatus('under_review').length;
    const approvedMortgageApps = getApplicationsByStatus('approved').length;

    // Get total properties count
    const totalProperties = properties.length || 0;

    setDashboardStats(prev => ({
      ...prev,
      totalProperties,
      savedProperties: savedCount,
      activeInquiries,
      scheduledViewings,
      completedViewings,
      totalInvested,
      activeInvestments,
      escrowTransactions: escrowCount,
      pendingPayments,
      totalEarnings,
      monthlyBudget: user?.monthlyBudget || 5000000,
      mortgageApplications: getUserApplications().length,
      pendingMortgageApps: getApplicationsByStatus('pending').length,
      underReviewMortgageApps: getApplicationsByStatus('under_review').length,
      approvedMortgageApps: getApplicationsByStatus('approved').length
    }));
  }, [user, properties.length, getUserInvestmentSummary, getUserApplications, getApplicationsByStatus]);

  // Listen for data changes from other components/pages
  useEffect(() => {
    if (!user) return;

    const handleFavoritesUpdate = () => {
      // Reload favorites and refresh dashboard stats
      loadFavorites();
      setTimeout(() => {
        refreshDashboardStats();
      }, 100);
    };

    const handleInquiriesUpdate = () => {
      // Refresh dashboard stats when inquiries are updated
      setTimeout(() => {
        refreshDashboardStats();
      }, 100);
    };

    const handleViewingsUpdate = () => {
      // Refresh dashboard stats when viewings are updated
      setTimeout(() => {
        refreshDashboardStats();
      }, 100);
    };

    const handleInvestmentsUpdate = () => {
      // Refresh dashboard stats when investments are updated
      setTimeout(() => {
        refreshDashboardStats();
      }, 100);
    };

    const handleEscrowUpdate = () => {
      // Refresh dashboard stats when escrow transactions are updated
      setTimeout(() => {
        refreshDashboardStats();
      }, 100);
    };

    const handleStorageChange = (e) => {
      // Listen for localStorage changes (works across tabs)
      if (user && user.id) {
        const key = `favorites_${user.id}`;
        if (e.key === key) {
          handleFavoritesUpdate();
        } else if (e.key === 'inquiries') {
          handleInquiriesUpdate();
        } else if (e.key === 'viewingRequests') {
          handleViewingsUpdate();
        } else if (e.key === `userInvestments_${user.id}`) {
          handleInvestmentsUpdate();
        } else if (e.key === 'escrowTransactions') {
          handleEscrowUpdate();
        }
      } else if (e.key === 'inquiries') {
        handleInquiriesUpdate();
      } else if (e.key === 'viewingRequests') {
        handleViewingsUpdate();
      } else if (e.key === 'escrowTransactions') {
        handleEscrowUpdate();
      }
    };

    // Listen for custom events (works in same tab)
    window.addEventListener('favoritesUpdated', handleFavoritesUpdate);
    window.addEventListener('inquiriesUpdated', handleInquiriesUpdate);
    window.addEventListener('viewingsUpdated', handleViewingsUpdate);
    window.addEventListener('investmentsUpdated', handleInvestmentsUpdate);
    window.addEventListener('escrowUpdated', handleEscrowUpdate);
    // Listen for storage events (works across tabs)
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('favoritesUpdated', handleFavoritesUpdate);
      window.removeEventListener('inquiriesUpdated', handleInquiriesUpdate);
      window.removeEventListener('viewingsUpdated', handleViewingsUpdate);
      window.removeEventListener('investmentsUpdated', handleInvestmentsUpdate);
      window.removeEventListener('escrowUpdated', handleEscrowUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [user, loadFavorites, refreshDashboardStats]);

  // Update saved properties count from localStorage (includes mock data)
  useEffect(() => {
    if (user) {
      refreshDashboardStats();
    }
  }, [user, favorites.size, refreshDashboardStats]);

  // Refresh dashboard when page becomes visible (user returns to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        // Refresh favorites and stats when user returns to the page
        loadFavorites();
        refreshDashboardStats();
      }
    };

    const handleFocus = () => {
      if (user) {
        // Refresh when window regains focus
        loadFavorites();
        refreshDashboardStats();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user, loadFavorites, refreshDashboardStats]);

  const handleViewProperty = (propertyId) => {
    navigate(`/property/${propertyId}`);
  };

  const handleViewAllProperties = () => {
    navigate('/properties');
  };

  const handleQuickAction = (action) => {
    switch(action) {
      case 'add-property':
        navigate('/add-property');
        break;
      case 'saved-properties':
        navigate('/saved-properties');
        break;
      case 'inquiries':
        navigate('/my-inquiries');
        break;
      case 'alerts':
        navigate('/alerts');
        break;
      case 'investments':
        navigate('/investments');
        break;
      case 'escrow':
        navigate('/escrow');
        break;
      default:
        toast.success(`${action} clicked!`);
    }
  };

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [viewingMessage, setViewingMessage] = useState('');

  const handleScheduleViewing = (property) => {
    if (!user) {
      toast.error('Please login to schedule viewings');
      navigate('/');
      return;
    }
    
    setSelectedProperty(property);
    setShowScheduleModal(true);
  };

  const handleConfirmScheduleViewing = () => {
    if (!selectedDate || !selectedTime) {
      toast.error('Please select both date and time');
      return;
    }

    if (!user || !user.id || !user.firstName || !user.lastName) {
      toast.error('User information incomplete. Please refresh and try again.');
      return;
    }

    // Create viewing request data
    const viewingRequest = {
      id: `viewing-${Date.now()}`,
      propertyId: selectedProperty.id,
      propertyTitle: selectedProperty.title,
      propertyLocation: selectedProperty.location,
      userId: user?.id,
      buyerId: user?.id,
      userName: `${user?.firstName || ''} ${user?.lastName || ''}`,
      userEmail: user?.email || '',
      status: 'pending_vendor_confirmation',
      requestedAt: new Date().toISOString(),
      preferredDate: selectedDate,
      preferredTime: selectedTime,
      message: viewingMessage,
      agentContact: selectedProperty.agent || {
        name: 'Property Agent',
        phone: '+234-XXX-XXXX',
        email: 'agent@example.com'
      },
      vendorResponse: null,
      confirmedDate: null,
      confirmedTime: null
    };
    
    // Store in localStorage for demo
    const existingRequests = JSON.parse(localStorage.getItem('viewingRequests') || '[]');
    existingRequests.push(viewingRequest);
    localStorage.setItem('viewingRequests', JSON.stringify(existingRequests));
    
    // Dispatch event to notify other components
    window.dispatchEvent(new CustomEvent('viewingsUpdated', {
      detail: { viewingRequest, action: 'created' }
    }));
    
    toast.success(`Viewing request sent for "${selectedProperty.title}"! The vendor will confirm or suggest an alternative time.`);
    
    // Refresh dashboard stats immediately
    refreshDashboardStats();
    
    // Reset modal
    setShowScheduleModal(false);
    setSelectedProperty(null);
    setSelectedDate('');
    setSelectedTime('');
    setViewingMessage('');
  };

  // Load dashboard stats from all sources (localStorage, contexts, backend)
  useEffect(() => {
    const loadDashboardStats = () => {
      if (!user || !user.id) {
        console.warn('loadDashboardStats: No user available, skipping load');
        return;
      }

      // Get saved properties count from localStorage (includes mock data)
      const key = `favorites_${user.id}`;
      const savedFavorites = JSON.parse(localStorage.getItem(key) || '[]');
      const savedCount = savedFavorites.length;

      // Get scheduled viewings from localStorage
      const viewingRequests = JSON.parse(localStorage.getItem('viewingRequests') || '[]');
      const userViewingRequests = viewingRequests.filter(req => 
        req.userId === user.id || req.buyerId === user.id
      );
      const scheduledViewings = userViewingRequests.filter(req => 
        req.status === 'pending' || 
        req.status === 'pending_vendor_confirmation' || 
        req.status === 'accepted' ||
        req.status === 'confirmed'
      ).length;
      const completedViewings = userViewingRequests.filter(req => 
        req.status === 'completed' || req.status === 'viewed'
      ).length;

      // Get active inquiries from localStorage (if exists)
      const inquiries = JSON.parse(localStorage.getItem('inquiries') || '[]');
      const userInquiries = inquiries.filter(inq => 
        inq.userId === user.id || inq.buyerId === user.id
      );
      const activeInquiries = userInquiries.filter(inq => 
        inq.status === 'new' || inq.status === 'pending' || inq.status === 'contacted'
      ).length;

      // Get escrow transactions from localStorage
      const escrowTransactions = JSON.parse(localStorage.getItem('escrowTransactions') || '[]');
      const userEscrowTransactions = escrowTransactions.filter(t => 
        t.buyerId === user.id || t.sellerId === user.id
      );
      const escrowCount = userEscrowTransactions.length;
      const pendingPayments = userEscrowTransactions.filter(t => 
        t.status === 'pending' || t.status === 'funded'
      ).length;

      // Get investment data from InvestmentContext
      const investmentSummary = getUserInvestmentSummary();
      const totalInvested = investmentSummary.totalInvested || 0;
      const activeInvestments = investmentSummary.activeInvestments || 0;
      const totalEarnings = investmentSummary.totalDividends || 0;

      // Get mortgage data from MortgageContext
      const mortgageSummary = getPaymentSummary();
      const mortgagePayments = mortgageSummary.totalMonthlyPayments || 0;

      // Get total properties count
      const totalProperties = properties.length || 0;

      // Try to get additional data from backend API (only if user has Firebase token)
      const fetchBackendStats = async () => {
        try {
          // Check if user has a Firebase token before attempting API call
          const { hasAuthToken } = await import('../utils/authToken');
          const hasToken = await hasAuthToken();
          
          if (!hasToken) {
            // Mock user or no Firebase token - skip API call and use local data only
            console.log('Dashboard: No Firebase token available, using local data only');
            setDashboardStats({
              totalProperties,
              savedProperties: savedCount,
              activeInquiries,
              scheduledViewings,
              completedViewings,
              totalInvested,
              activeInvestments,
              escrowTransactions: escrowCount,
              monthlyBudget: user?.monthlyBudget || 5000000,
              pendingPayments,
              totalEarnings
            });
            return;
          }

          // Use apiClient which handles token refresh + retry
          try {
            const resp = await apiClient.get('/dashboard/user');
            const data = resp.data || {};
            if (data.success) {
              const backend = data.data || {};
              const backendInvestmentSummary = backend.investments || {};
              const backendEscrowSummary = backend.escrow || {};

              setDashboardStats(prev => ({
                ...prev,
                totalProperties: backend.totalProperties ?? totalProperties,
                savedProperties: savedCount,
                activeInquiries: activeInquiries || backend.activeInquiries || 0,
                scheduledViewings: scheduledViewings || backend.scheduledViewings || 0,
                completedViewings: completedViewings || backend.completedViewings || 0,
                totalInvested: totalInvested || backendInvestmentSummary.totalInvested || 0,
                activeInvestments: activeInvestments || backendInvestmentSummary.activeInvestments || 0,
                escrowTransactions: escrowCount || backendEscrowSummary.count || 0,
                pendingPayments: pendingPayments || backendEscrowSummary.pendingPayments || 0,
                monthlyBudget: user?.monthlyBudget || 5000000,
                totalEarnings: totalEarnings || user?.totalEarnings || 0
              }));
              return;
            }
          } catch (err) {
            if (err?.response?.status === 401) {
              console.log('Dashboard: API returned 401 - using local data only');
            } else {
              console.log('Dashboard: Error fetching backend stats (using local data)', err?.message || err);
            }
          }
        } catch (error) {
          // Suppress errors for mock users
          console.log('Dashboard: Error fetching backend stats (using local data)', error.message);
        }

        // Fallback to local data only
        setDashboardStats({
          totalProperties,
          savedProperties: savedCount,
          activeInquiries,
          scheduledViewings,
          completedViewings,
          totalInvested,
          activeInvestments,
          escrowTransactions: escrowCount,
          monthlyBudget: user?.monthlyBudget || 5000000,
          pendingPayments,
          totalEarnings
        });
      };

      fetchBackendStats();
    };

    loadDashboardStats();
  }, [user, properties.length, userInvestments, getUserInvestmentSummary, getPaymentSummary]);

  // Refresh dashboard when navigating to this route (e.g., coming back from SavedProperties)
  useEffect(() => {
    if (location.pathname === '/dashboard' && user) {
      // Refresh favorites and stats when user navigates to dashboard
      loadFavorites();
      refreshDashboardStats();
    }
  }, [location.pathname, user, loadFavorites, refreshDashboardStats]);

  // Mock data for recent properties (fallback if no properties loaded)
  const mockProperties = [
    {
      id: 1,
      title: "Luxury Apartment in Victoria Island",
      price: 75000000,
      location: "Victoria Island, Lagos",
      bedrooms: 3,
      bathrooms: 2,
      area: 210,
      image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop",
      tag: "New Listing",
      tagColor: "bg-green-500",
      owner: { id: 'mock_vendor', name: 'Vendor Example', email: 'vendor@example.com' }
    },
    {
      id: 2,
      title: "Modern Family House in Lekki",
      price: 120000000,
      location: "Lekki Phase 1, Lagos",
      bedrooms: 4,
      bathrooms: 3,
      area: 350,
      image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop",
      tag: "Featured",
      tagColor: "bg-brand-orange",
      owner: { id: 'mock_vendor', name: 'Vendor Example', email: 'vendor@example.com' }
    },
    {
      id: 3,
      title: "Penthouse with Ocean View in Ikoyi",
      price: 95000000,
      location: "Ikoyi, Lagos",
      bedrooms: 2,
      bathrooms: 2,
      area: 180,
      image: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400&h=300&fit=crop",
      tag: null,
      tagColor: "",
      owner: { id: 'mock_vendor', name: 'Vendor Example', email: 'vendor@example.com' }
    }
  ];

  const recommendedProperties = [
    {
      id: 4,
      title: "Elegant Townhouse in Maitama",
      price: 85000000,
      location: "Maitama, Abuja",
      bedrooms: 3,
      bathrooms: 2,
      area: 210,
      image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop",
      tag: "Hot Deal",
      tagColor: "bg-red-500"
    },
    {
      id: 5,
      title: "Garden View Apartment in Ikeja GRA",
      price: 55000000,
      location: "Ikeja GRA, Lagos",
      bedrooms: 4,
      bathrooms: 3,
      area: 350,
      image: "https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=400&h=300&fit=crop",
      tag: "Exclusive",
      tagColor: "bg-blue-500"
    },
    {
      id: 6,
      title: "Beachfront Villa in Banana Island",
      price: 180000000,
      location: "Banana Island, Lagos",
      bedrooms: 2,
      bathrooms: 2,
      area: 180,
      image: "https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=400&h=300&fit=crop",
      tag: "Premium",
      tagColor: "bg-purple-500"
    }
  ];

  return (
    <div className="p-6">
      {/* Main Content Area */}
      <div className="w-full">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="welcome-section">
            <h1 className="text-2xl font-bold mb-2">Good Afternoon, {user?.firstName || 'Oluwaseun'}!</h1>
            <p className="text-blue-100 mb-4">
              Welcome to your dashboard. Track your property journey, manage saved listings, and explore new opportunities in the African real estate market.
            </p>
            {/* Switch to Vendor Button */}
            <div className="mb-4">
              <DashboardSwitch />
            </div>

        {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div 
                className="stats-card cursor-pointer hover:bg-blue-700 transition-colors"
                onClick={() => navigate('/saved-properties')}
                title="View saved properties"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-white">{dashboardStats.savedProperties}</div>
                    <div className="text-blue-200 text-sm">Saved Properties</div>
                  </div>
                  <FaHeart className="text-blue-300 text-xl" />
                </div>
              </div>
              
              <div 
                className="stats-card cursor-pointer hover:bg-blue-700 transition-colors"
                onClick={() => navigate('/my-inquiries')}
                title="View active inquiries"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-white">{dashboardStats.activeInquiries}</div>
                    <div className="text-blue-200 text-sm">Active Inquiries</div>
                  </div>
                  <FaBell className="text-blue-300 text-xl" />
                </div>
              </div>
              
              <div 
                className="stats-card cursor-pointer hover:bg-blue-700 transition-colors"
                onClick={() => navigate('/my-inspections')}
                title="View scheduled viewings"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-white">{dashboardStats.scheduledViewings}</div>
                    <div className="text-blue-200 text-sm">Scheduled Viewings</div>
                  </div>
                  <FaCalendar className="text-blue-300 text-xl" />
                </div>
              </div>
              
              <div 
                className="stats-card cursor-pointer hover:bg-blue-700 transition-colors"
                onClick={() => navigate('/billing-payments')}
                title="View billing and payments"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-white">{dashboardStats.totalInvested > 0 ? `₦${(dashboardStats.totalInvested / 1000000).toFixed(1)}M` : '₦0'}</div>
                    <div className="text-blue-200 text-sm">Total Invested</div>
                  </div>
                  <FaChartLine className="text-blue-300 text-xl" />
                </div>
              </div>
            </div>

            {/* Additional Analytics Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div 
                className="stats-card cursor-pointer hover:bg-blue-700 transition-colors"
                onClick={() => navigate('/investment')}
                title="View active investments"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-white">{dashboardStats.activeInvestments}</div>
                    <div className="text-blue-200 text-sm">Active Investments</div>
                  </div>
                  <FaTag className="text-blue-300 text-xl" />
                </div>
              </div>
              
              <div 
                className="stats-card cursor-pointer hover:bg-blue-700 transition-colors"
                onClick={() => navigate('/billing-payments')}
                title="View escrow transactions"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-white">{dashboardStats.escrowTransactions}</div>
                    <div className="text-blue-200 text-sm">Escrow Transactions</div>
                  </div>
                  <FaCheck className="text-blue-300 text-xl" />
                </div>
              </div>
              
              <div 
                className="stats-card cursor-pointer hover:bg-blue-700 transition-colors"
                onClick={() => navigate('/billing-payments')}
                title="View billing and payments"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-white">₦{(dashboardStats.monthlyBudget / 1000000).toFixed(1)}M</div>
                    <div className="text-blue-200 text-sm">Monthly Budget</div>
                  </div>
                  <FaMoneyBillWave className="text-blue-300 text-xl" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Market Insights & Trends */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Insights & Trends</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Property Price Trends */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-blue-900">Price Trends</h4>
                  <FaChartLine className="text-blue-600" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-700">Victoria Island</span>
                    <span className="font-semibold text-green-600">+12.5%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-700">Lekki</span>
                    <span className="font-semibold text-green-600">+8.3%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-700">Ikoyi</span>
                    <span className="font-semibold text-green-600">+15.2%</span>
                  </div>
                </div>
                <p className="text-xs text-blue-600 mt-2">Average increase this quarter</p>
              </div>

              {/* Investment Opportunities */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-green-900">Investment ROI</h4>
                  <FaTag className="text-green-600" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-green-700">Luxury Apartments</span>
                    <span className="font-semibold text-green-600">18.5%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-green-700">Commercial Properties</span>
                    <span className="font-semibold text-green-600">22.1%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-green-700">Land Development</span>
                    <span className="font-semibold text-green-600">25.3%</span>
                  </div>
                </div>
                <p className="text-xs text-green-600 mt-2">Average annual returns</p>
              </div>

              {/* Market Activity */}
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-orange-900">Market Activity</h4>
                  <FaBell className="text-orange-600" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-orange-700">New Listings</span>
                    <span className="font-semibold text-orange-600">+24</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-orange-700">Price Reductions</span>
                    <span className="font-semibold text-orange-600">-8</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-orange-700">Sold This Month</span>
                    <span className="font-semibold text-orange-600">+31</span>
                  </div>
                </div>
                <p className="text-xs text-orange-600 mt-2">Last 30 days activity</p>
              </div>
            </div>
          </div>
        </div>

        {/* Investment Portfolio Section */}
        {user && (
          <div className="mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Your Investment Portfolio</h3>
                <button
                  onClick={() => navigate('/investment')}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  View All →
                </button>
              </div>
              
              {(() => {
                const investmentSummary = getUserInvestmentSummary();
                const recentInvestments = userInvestments.slice(0, 3);
                
                return (
                  <div className="space-y-6">
                    {/* Investment Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-green-600 text-sm font-medium">Total Invested</p>
                            <p className="text-green-900 text-xl font-bold">
                              ₦{(investmentSummary.totalInvested || 0).toLocaleString()}
                            </p>
                          </div>
                          <FaChartLine className="text-green-600 text-xl" />
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-blue-600 text-sm font-medium">Dividends Earned</p>
                            <p className="text-blue-900 text-xl font-bold">
                              ₦{(investmentSummary.totalDividends || 0).toLocaleString()}
                            </p>
                          </div>
                          <FaMoneyBillWave className="text-blue-600 text-xl" />
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-purple-600 text-sm font-medium">Active Investments</p>
                            <p className="text-purple-900 text-xl font-bold">
                              {investmentSummary.activeInvestments}
                            </p>
                          </div>
                          <FaTag className="text-purple-600 text-xl" />
                        </div>
                      </div>
                    </div>

                    {/* Recent Investments */}
                    {recentInvestments.length > 0 ? (
                      <div>
                        <h4 className="text-md font-semibold text-gray-900 mb-3">Recent Investments</h4>
                        <div className="space-y-3">
                          {recentInvestments.map((investment) => (
                            <div key={investment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex-1">
                                <h5 className="font-medium text-gray-900">{investment.investmentTitle}</h5>
                                <p className="text-sm text-gray-600">
                                  Invested: ₦{(investment.amount || 0).toLocaleString()} • 
                                  Status: <span className={`capitalize ${
                                    investment.status === 'active' ? 'text-green-600' :
                                    investment.status === 'pending_approval' ? 'text-yellow-600' :
                                    investment.status === 'completed' ? 'text-blue-600' :
                                    'text-gray-600'
                                  }`}>
                                    {investment.status.replace('_', ' ')}
                                  </span>
                                </p>
                              </div>
                              <div className="flex items-center space-x-4">
                                <div className="text-right">
                                  <p className="font-semibold text-gray-900">
                                    ₦{(investment.totalDividendsEarned || 0).toLocaleString()}
                                  </p>
                                  <p className="text-sm text-gray-600">Earned</p>
                                </div>
                                {investment.propertyId && (
                                  <button
                                    onClick={() => navigate(`/property/${investment.propertyId}`)}
                                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm flex items-center space-x-1"
                                  >
                                    <FaEye className="text-xs" />
                                    <span>View Property</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FaChartLine className="text-gray-300 text-4xl mx-auto mb-3" />
                        <h4 className="text-lg font-medium text-gray-900 mb-2">No Investments Yet</h4>
                        <p className="text-gray-600 mb-4">Start building your investment portfolio today</p>
                        <button
                          onClick={() => navigate('/investment')}
                          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Explore Opportunities
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Mortgage Portfolio Section */}
        {user && (() => {
          const mortgages = getUserMortgages();
          const mortgageSummary = getPaymentSummary();
          
          if (mortgages.length > 0) {
            return (
              <div className="mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Your Mortgage Portfolio</h3>
                    <button
                      onClick={() => navigate('/mortgages')}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      View All →
                    </button>
                  </div>
                  
                  <div className="space-y-6">
                    {/* Mortgage Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-blue-600 text-sm font-medium">Active Mortgages</p>
                            <p className="text-blue-900 text-xl font-bold">{mortgageSummary.activeMortgages}</p>
                          </div>
                          <FaHome className="text-blue-600 text-xl" />
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-green-600 text-sm font-medium">Monthly Payments</p>
                            <p className="text-green-900 text-xl font-bold">₦{mortgageSummary.totalMonthlyPayments.toLocaleString()}</p>
                          </div>
                          <FaMoneyBillWave className="text-green-600 text-xl" />
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-purple-600 text-sm font-medium">Total Paid</p>
                            <p className="text-purple-900 text-xl font-bold">₦{mortgageSummary.totalPaid.toLocaleString()}</p>
                          </div>
                          <FaCheck className="text-purple-600 text-xl" />
                        </div>
                      </div>
                    </div>

                    {/* Recent Mortgages */}
                    <div>
                      <h4 className="text-md font-semibold text-gray-900 mb-3">Recent Mortgages</h4>
                      <div className="space-y-3">
                        {mortgages.slice(0, 2).map((mortgage) => (
                          <div key={mortgage.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-900">{mortgage.propertyTitle}</h5>
                              <p className="text-sm text-gray-600">
                                Monthly: ₦{mortgage.monthlyPayment.toLocaleString()} • 
                                Next Due: {new Date(mortgage.nextPaymentDate).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">
                                {mortgage.paymentsMade}/{mortgage.totalPayments}
                              </p>
                              <p className="text-sm text-gray-600">Payments</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          }
          return null;
        })()}

        {/* Continue Browsing Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Continue Browsing</h2>
            <Link to="/properties" className="text-brand-blue hover:text-blue-700 text-sm font-medium">
              View history →
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {mockProperties.map((property) => (
              <div key={property.id} className="property-card">
                <div className="relative">
                  <img
                    src={property.image}
                    alt={property.title}
                    className="property-card-image"
                  />
                  {property.tag && (
                    <div className={`absolute top-2 left-2 tag ${property.tagColor} text-white px-2 py-1 rounded text-xs font-medium`}>
                      {property.tag}
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex space-x-2">
                    <button
                      onClick={async () => {
                        const url = `${window.location.origin}/property/${property.id}`;
                        try {
                          if (navigator.share) {
                            await navigator.share({ title: property.title, text: property.title, url });
                          } else {
                            await navigator.clipboard.writeText(url);
                            toast.success('Link copied');
                          }
                        } catch (e) {}
                      }}
                      className="text-white bg-black bg-opacity-50 p-1 rounded hover:bg-opacity-70 transition-all"
                    >
                      <FaShare className="text-sm" />
                    </button>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!user) {
                          setAuthRedirect('/dashboard');
                          toast.error('Please login to save properties');
                          navigate('/');
                          return;
                        }
                        
                        try {
                          const propertyIdStr = String(property.id);
                          const result = await toggleFavorite(propertyIdStr, property);
                          if (result && result.success) {
                            const newFavorites = new Set(favorites);
                            if (result.favorited) {
                              newFavorites.add(propertyIdStr);
                              toast.success('Property saved successfully');
                            } else {
                              newFavorites.delete(propertyIdStr);
                              toast.success('Property removed from saved properties');
                            }
                            setFavorites(newFavorites);
                            
                            // Dispatch custom event to notify other components
                            window.dispatchEvent(new CustomEvent('favoritesUpdated', { 
                              detail: { propertyId: propertyIdStr, favorited: result.favorited } 
                            }));
                            
                            // Reload favorites and refresh dashboard stats immediately
                            setTimeout(() => {
                              loadFavorites();
                              refreshDashboardStats();
                            }, 100);
                          }
                        } catch (e) {
                          toast.error('Failed to save property');
                        }
                      }}
                      className={`p-1 rounded hover:bg-opacity-70 transition-all ${
                        favorites.has(String(property.id)) 
                          ? 'bg-red-500 bg-opacity-90' 
                          : 'bg-black bg-opacity-50'
                      }`}
                      title={favorites.has(String(property.id)) ? 'Remove from saved properties' : 'Save property'}
                    >
                      <FaHeart className={`text-sm transition-all ${
                        favorites.has(String(property.id)) 
                          ? 'text-red-500 fill-red-500' 
                          : 'text-white'
                      }`} />
                    </button>
                  </div>
                </div>
                
                <div className="property-card-content">
                  <div className="property-price">
                    ₦{(property.price || 0).toLocaleString()}
                  </div>
                  <h3 className="property-title">{property.title}</h3>
                  <p className="property-location">{property.location}</p>
                  
                  <div className="property-features">
                    <div className="flex items-center space-x-1">
                      <FaBed />
                      <span>{property.bedrooms || property.details?.bedrooms || 0} Bedrooms</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <FaBath />
                      <span>{property.bathrooms || property.details?.bathrooms || 0} Bathrooms</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <FaRuler />
                      <span>{property.area || property.details?.sqft || 0}m² Area</span>
                    </div>
                  </div>

                  <div className="space-y-2 mt-4">
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewProperty(property.id);
                      }}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center cursor-pointer"
                    >
                      View Details →
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleScheduleViewing(property);
                      }}
                      className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                      title={`Schedule a viewing for ${property.title}`}
                    >
                      <FaCalendar className="mr-2" />
                      Schedule Viewing
                    </button>
                  </div>
                </div>
              </div>
            ))}
                </div>
              </div>

        {/* Recommended for You Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Recommended for You</h2>
            <Link to="/properties" className="text-brand-blue hover:text-blue-700 text-sm font-medium">
              View all →
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(recentProperties.length > 0 ? recentProperties : mockProperties).map((property) => (
              <div key={property.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative">
                  <div 
                    onClick={() => handleViewProperty(property.id)}
                    className="cursor-pointer"
                  >
                  <img
                    src={property.image || property.images?.[0]?.url || 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop'}
                    alt={property.title}
                    className="w-full h-48 object-cover"
                  />
                  </div>
                  {property.tag && (
                    <div className={`absolute top-2 left-2 ${property.tagColor || 'bg-orange-500'} text-white px-2 py-1 rounded text-xs font-medium`}>
                      {property.tag}
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex space-x-2 z-10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toast.success('Property shared!');
                      }}
                      className="w-8 h-8 bg-black bg-opacity-50 rounded-full flex items-center justify-center hover:bg-opacity-75 transition-colors"
                    >
                      <FaShare className="text-white text-sm" />
                    </button>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!user) {
                          setAuthRedirect('/dashboard');
                          toast.error('Please login to save properties');
                          navigate('/');
                          return;
                        }
                        
                        try {
                          const propertyIdStr = String(property.id);
                          const result = await toggleFavorite(propertyIdStr, property);
                          if (result && result.success) {
                            const newFavorites = new Set(favorites);
                            if (result.favorited) {
                              newFavorites.add(propertyIdStr);
                              toast.success('Property saved successfully');
                            } else {
                              newFavorites.delete(propertyIdStr);
                              toast.success('Property removed from saved properties');
                            }
                            setFavorites(newFavorites);
                            
                            // Dispatch custom event to notify other components
                            window.dispatchEvent(new CustomEvent('favoritesUpdated', { 
                              detail: { propertyId: propertyIdStr, favorited: result.favorited } 
                            }));
                            
                            // Reload favorites and refresh dashboard stats immediately
                            setTimeout(() => {
                              loadFavorites();
                              refreshDashboardStats();
                            }, 100);
                          }
                        } catch (e) {
                          toast.error('Failed to save property');
                        }
                      }}
                      className={`w-8 h-8 rounded-full flex items-center justify-center hover:bg-opacity-75 transition-all ${
                        favorites.has(String(property.id)) 
                          ? 'bg-red-500 bg-opacity-90' 
                          : 'bg-black bg-opacity-50'
                      }`}
                      title={favorites.has(String(property.id)) ? 'Remove from saved properties' : 'Save property'}
                    >
                      <FaHeart className={`text-sm transition-all ${
                        favorites.has(String(property.id)) 
                          ? 'text-red-500 fill-red-500' 
                          : 'text-white'
                      }`} />
                    </button>
                  </div>
                </div>

                <div 
                  onClick={() => handleViewProperty(property.id)}
                  className="p-4 cursor-pointer"
                >
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    ₦{property.price?.toLocaleString()}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{property.title}</h3>
                  <p className="text-gray-600 text-sm mb-3">
                    {(() => {
                      if (typeof property.location === 'string') {
                        return property.location;
                      }
                      if (property.location && typeof property.location === 'object') {
                        if (property.location.address) {
                          return property.location.address;
                        }
                        const city = property.location.city || '';
                        const state = property.location.state || '';
                        return `${city}${city && state ? ', ' : ''}${state}`.trim();
                      }
                      return 'Location not specified';
                    })()}
                  </p>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center space-x-1">
                      <FaBed />
                      <span>{property.bedrooms || property.details?.bedrooms || 0} Bedrooms</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <FaBath />
                      <span>{property.bathrooms || property.details?.bathrooms || 0} Bathrooms</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <FaRuler />
                      <span>{property.area || property.details?.sqft || 0}m² Area</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewProperty(property.id);
                      }}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center cursor-pointer"
                    >
                      View Details →
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleScheduleViewing(property);
                      }}
                      className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                      title={`Schedule a viewing for ${property.title}`}
                    >
                      <FaCalendar className="mr-2" />
                      Schedule Viewing
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Market Insight Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Price Trends Chart */}
          <PriceTrendsChart />

          {/* Recent Transactions */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
              <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                <FaHome className="w-4 h-4 text-brand-blue" />
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <FaHome className="text-brand-blue" />
                  <div>
                    <p className="font-medium text-gray-900">3 Bedroom Apartment</p>
                    <p className="text-sm text-gray-600">Victoria Island, Lagos</p>
                  </div>
                </div>
                <p className="font-semibold text-gray-900">₦100M</p>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <FaHome className="text-brand-blue" />
                  <div>
                    <p className="font-medium text-gray-900">2 Bedroom Penthouse</p>
                    <p className="text-sm text-gray-600">Ikoyi, Lagos</p>
                  </div>
                </div>
                <p className="font-semibold text-gray-900">₦82M</p>
          </div>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-3">
                  <FaHome className="text-brand-blue" />
                  <div>
                    <p className="font-medium text-gray-900">4 Bedroom Duplex</p>
                    <p className="text-sm text-gray-600">Lekki Phase 1, Lagos</p>
                  </div>
                  </div>
                <p className="font-semibold text-gray-900">₦95M</p>
                  </div>
                </div>
            </div>
        </div>
      </div>

      {/* Schedule Viewing Modal */}
      {showScheduleModal && selectedProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Schedule Property Viewing</h3>
            <p className="text-gray-600 mb-4">{selectedProperty.title}</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Time</label>
                <select
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Additional Message (Optional)</label>
                <textarea
                  value={viewingMessage}
                  onChange={(e) => setViewingMessage(e.target.value)}
                  placeholder="Any specific requirements or questions..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowScheduleModal(false);
                  setSelectedProperty(null);
                  setSelectedDate('');
                  setSelectedTime('');
                  setViewingMessage('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmScheduleViewing}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Request Viewing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 
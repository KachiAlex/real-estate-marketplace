import React, { useEffect, useState, useCallback, useMemo } from 'react';
import VendorOverview from '../components/vendor/VendorOverview';
import SubscriptionDashboard from '../components/SubscriptionDashboard';
import { useAuth } from '../contexts/AuthContext-new';
import { useVendor } from '../contexts/VendorContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DashboardSwitch from '../components/DashboardSwitch';
import toast from 'react-hot-toast';
import apiClient from '../services/apiClient';
import VerificationRequestModal from '../components/VerificationRequestModal';

const TREND_LABELS = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'];
const TREND_WEIGHTS = [12, 15, 18, 20, 18, 17];

const buildTrendSeries = (total = 0) => {
  const amount = Number(total) || 0;
  if (amount <= 0) return [];
  const sumWeights = TREND_WEIGHTS.reduce((sum, w) => sum + w, 0);
  return TREND_LABELS.map((label, idx) => ({
    label,
    value: Math.max(1, Math.round((amount * TREND_WEIGHTS[idx]) / sumWeights))
  }));
};

export default function VendorDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { accessToken, currentUser } = useAuth();
  const { vendorProfile, loading: vendorLoading } = useVendor();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [verificationPromptOpen, setVerificationPromptOpen] = useState(false);
  const [verificationCandidates, setVerificationCandidates] = useState([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [selectedVerificationProperty, setSelectedVerificationProperty] = useState(null);
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
    if (!tabParam && activeTab !== 'overview') {
      setActiveTab('overview');
    }
  }, [searchParams]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams);
    if (tab === 'overview') {
      params.delete('tab');
    } else {
      params.set('tab', tab);
    }
    setSearchParams(params);
  };

  const vendorTabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'subscription', label: 'Subscription' }
  ];

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
      const res = await fetch('/api/dashboard/vendor', { headers });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || 'Failed to load vendor dashboard');
      setStats(json.data || null);
    } catch (err) {
      console.error('Vendor dashboard fetch error', err);
      setError(err.message || 'Error fetching dashboard');
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const handleAddProperty = () => navigate('/add-property');

  const fetchVerificationCandidates = useCallback(async () => {
    if (!currentUser?.id) {
      setVerificationCandidates([]);
      return;
    }

    setCandidatesLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('perPage', '100');
      if (currentUser.id) {
        params.append('vendorId', currentUser.id);
        params.append('ownerId', currentUser.id);
      }
      const response = await apiClient.get(`/properties?${params.toString()}`);
      const data = response.data?.data || [];
      const unverified = data.filter((prop) => !prop.isVerified && prop.verificationStatus !== 'pending');
      setVerificationCandidates(unverified);
    } catch (err) {
      console.error('Vendor dashboard: failed to load verification candidates', err);
      toast.error('Unable to load properties for verification. Please try again.');
      setVerificationCandidates([]);
    } finally {
      setCandidatesLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    if (verificationPromptOpen) {
      fetchVerificationCandidates();
    }
  }, [verificationPromptOpen, fetchVerificationCandidates]);

  const handleApplyForVerification = () => {
    if (!currentUser?.id) {
      toast.error('You need to be signed in as a vendor to request verification.');
      return;
    }

    setVerificationPromptOpen(true);
    if (!verificationCandidates.length) {
      fetchVerificationCandidates();
    }
  };

  const handleSelectVerificationProperty = (property) => {
    if (!property) return;
    setSelectedVerificationProperty(property);
    setVerificationPromptOpen(false);
    setVerificationModalOpen(true);
  };

  const handleCloseVerificationModal = () => {
    setVerificationModalOpen(false);
    setSelectedVerificationProperty(null);
  };

  const handleVerificationSuccess = () => {
    // Refresh stats to reflect verification changes
    fetchStats();
    fetchVerificationCandidates();
  };

  const displayStats = useMemo(() => {
    if (stats && Object.keys(stats).length) return stats;
    if (!loading && vendorProfile) {
      const totalRevenue = Number(vendorProfile.totalSales) || 0;
      const totalViews = Number(vendorProfile.totalViews ?? (vendorProfile.totalProperties || 0) * 120) || 0;
      const totalInquiries = Number(vendorProfile.totalInquiries ?? Math.max(5, Math.round(totalViews * 0.08))) || 0;
      return {
        totalProperties: vendorProfile.totalProperties || 0,
        activeListings: vendorProfile.totalProperties || 0,
        pendingListings: 0,
        soldProperties: 0,
        totalViews,
        totalInquiries,
        totalRevenue,
        conversionRate: totalViews ? (totalInquiries / totalViews) * 100 : 0,
        recentActivity: vendorProfile.recentActivity || [],
        viewsTrend: buildTrendSeries(totalViews),
        inquiriesTrend: buildTrendSeries(totalInquiries),
        revenueTrend: buildTrendSeries(totalRevenue)
      };
    }
    return stats;
  }, [stats, vendorProfile, loading]);

  return (
    <div className="container mx-auto py-8">
      <DashboardSwitch />
      <h2 className="text-2xl font-bold text-brand-blue mb-4">Vendor Dashboard</h2>
      <div className="bg-white rounded shadow p-6 mb-6">
        <div className="flex flex-wrap gap-3">
          {vendorTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
                activeTab === tab.id
                  ? 'bg-brand-blue text-white border-brand-blue'
                  : 'text-gray-600 border-gray-200 hover:border-brand-blue hover:text-brand-blue'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="bg-white rounded shadow p-6">
          {error && <div className="text-red-600 mb-4">{error}</div>}
          {/* Use backend stats when available; otherwise fall back to seeded vendorProfile for local/dev */}
          <VendorOverview
            stats={displayStats}
            loading={loading || vendorLoading}
            onAddProperty={handleAddProperty}
            onApplyForVerification={handleApplyForVerification}
            applyVerificationLoading={candidatesLoading && verificationPromptOpen}
          />
        </div>
      )}

      {activeTab === 'subscription' && (
        <div className="bg-white rounded shadow p-6">
          <SubscriptionDashboard />
        </div>
      )}

      {/* Verification property picker */}
      {verificationPromptOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Select a Property to Verify</h3>
                <p className="text-sm text-gray-500 mt-1">Choose one of your unverified listings to start the verification process.</p>
              </div>
              <button
                onClick={() => setVerificationPromptOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              {candidatesLoading ? (
                <div className="flex items-center justify-center py-10 text-gray-500">
                  <svg className="w-6 h-6 animate-spin mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Loading your listings...
                </div>
              ) : verificationCandidates.length ? (
                <div className="space-y-3">
                  {verificationCandidates.map((prop) => (
                    <button
                      key={prop.id}
                      className="w-full text-left border border-gray-200 rounded-lg p-4 hover:border-brand-blue hover:shadow transition"
                      onClick={() => handleSelectVerificationProperty(prop)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">{prop.title || 'Untitled Property'}</p>
                          <p className="text-sm text-gray-500">{prop.location?.address || 'Location not specified'}</p>
                        </div>
                        <span className="text-sm text-gray-400">{prop.status ? prop.status.toUpperCase() : '—'}</span>
                      </div>
                      <div className="mt-2 flex gap-4 text-xs text-gray-500">
                        <span>Views: {prop.views ?? 0}</span>
                        <span>Inquiries: {prop.inquiries ?? 0}</span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-500">
                  <p className="font-medium mb-2">No eligible properties found yet.</p>
                  <p className="text-sm mb-4">Add a new listing or wait for pending verifications to complete.</p>
                  <button
                    onClick={() => {
                      setVerificationPromptOpen(false);
                      handleAddProperty();
                    }}
                    className="px-4 py-2 bg-brand-blue text-white rounded-lg hover:bg-blue-700"
                  >
                    + Add Property
                  </button>
                </div>
              )}
            </div>

            <div className="p-5 border-t flex justify-end gap-3">
              <button
                onClick={() => setVerificationPromptOpen(false)}
                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <VerificationRequestModal
        property={selectedVerificationProperty}
        isOpen={verificationModalOpen}
        onClose={handleCloseVerificationModal}
        onSuccess={handleVerificationSuccess}
      />
    </div>
  );
}

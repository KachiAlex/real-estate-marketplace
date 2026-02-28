import React, { useEffect, useState, useCallback, useMemo } from 'react';
import VendorOverview from '../components/vendor/VendorOverview';
import SubscriptionDashboard from '../components/SubscriptionDashboard';
import { useAuth } from '../contexts/AuthContext-new';
import { useVendor } from '../contexts/VendorContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DashboardSwitch from '../components/DashboardSwitch';

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
  const { accessToken } = useAuth();
  const { vendorProfile, loading: vendorLoading } = useVendor();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState(initialTab);

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
          />
        </div>
      )}

      {activeTab === 'subscription' && (
        <div className="bg-white rounded shadow p-6">
          <SubscriptionDashboard />
        </div>
      )}
    </div>
  );
}

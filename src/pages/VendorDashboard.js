import React, { useEffect, useState, useCallback } from 'react';
import VendorOverview from '../components/vendor/VendorOverview';
import { useAuth } from '../contexts/AuthContext-new';
import { useVendor } from '../contexts/VendorContext';
import { useNavigate } from 'react-router-dom';
import DashboardSwitch from '../components/DashboardSwitch';

export default function VendorDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { accessToken } = useAuth();
  const { vendorProfile, loading: vendorLoading } = useVendor();
  const navigate = useNavigate();

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

  return (
    <div className="container mx-auto py-8">
      <DashboardSwitch />
      <h2 className="text-2xl font-bold text-brand-blue mb-4">Vendor Dashboard</h2>
      <div className="bg-white rounded shadow p-6">
        {error && <div className="text-red-600 mb-4">{error}</div>}
        {/* Use backend stats when available; otherwise fall back to seeded vendorProfile for local/dev */}
        <VendorOverview
          stats={(() => {
            if (stats && Object.keys(stats).length) return stats;
            if (!loading && vendorProfile) {
              return {
                totalProperties: vendorProfile.totalProperties || 0,
                activeListings: vendorProfile.totalProperties || 0,
                pendingListings: 0,
                soldProperties: 0,
                totalViews: 0,
                totalInquiries: 0,
                totalRevenue: vendorProfile.totalSales || 0,
                conversionRate: 0,
                recentActivity: []
              };
            }
            return stats;
          })()}
          loading={loading || vendorLoading}
          onAddProperty={handleAddProperty}
        />
      </div>
    </div>
  );
}

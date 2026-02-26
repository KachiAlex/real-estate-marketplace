import React from 'react';
// Placeholder for chart library (e.g., recharts, chart.js)
// import { LineChart, ... } from 'recharts';

export default function VendorOverview({ stats, loading, onAddProperty }) {
  // Example stats prop shape:
  // {
  //   activeListings, pendingListings, soldProperties, totalRevenue, totalInquiries, conversionRate,
  //   viewsTrend: [...], inquiriesTrend: [...], revenueTrend: [...],
  //   recentActivity: [...]
  // }

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Active Listings" value={stats?.activeListings} loading={loading} />
        <SummaryCard label="Pending Listings" value={stats?.pendingListings} loading={loading} />
        <SummaryCard label="Sold Properties" value={stats?.soldProperties} loading={loading} />
        <SummaryCard label="Revenue" value={stats?.totalRevenue} loading={loading} prefix="₦" />
        <SummaryCard label="Inquiries" value={stats?.totalInquiries} loading={loading} />
        <SummaryCard label="Conversion Rate" value={stats?.conversionRate?.toFixed(1) + '%'} loading={loading} />
      </div>

      {/* Trends Section (placeholder) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <TrendCard title="Views" data={stats?.viewsTrend} loading={loading} />
        <TrendCard title="Inquiries" data={stats?.inquiriesTrend} loading={loading} />
        <TrendCard title="Revenue" data={stats?.revenueTrend} loading={loading} />
      </div>

      {/* Recent Activity Feed */}
      <div className="bg-white rounded shadow p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold text-lg">Recent Activity</h3>
          <button
            className="bg-brand-blue text-white px-4 py-2 rounded hover:bg-blue-700"
            onClick={onAddProperty}
          >
            + Add Property
          </button>
        </div>
        <ul className="divide-y divide-gray-100">
          {loading ? (
            <li className="py-2 text-gray-400">Loading...</li>
          ) : stats?.recentActivity?.length ? (
            stats.recentActivity.map((item, idx) => (
              <li key={idx} className="py-2 text-sm text-gray-700">{item}</li>
            ))
          ) : (
            <li className="py-2 text-gray-400">No recent activity</li>
          )}
        </ul>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, loading, prefix }) {
  return (
    <div className="stats-card cursor-pointer hover:bg-blue-700 transition-colors p-4 rounded shadow flex flex-col justify-between min-h-[100px]">
      <div className="flex flex-col items-start">
        <div className="text-2xl font-bold text-white">
          {loading ? <span className="animate-pulse">...</span> : (prefix || '') + (value ?? 0)}
        </div>
        <div className="text-blue-200 text-sm mt-1">{label}</div>
      </div>
    </div>
  );
}

function TrendCard({ title, data, loading }) {
  // Placeholder for chart
  return (
    <div className="bg-white rounded shadow p-4">
      <div className="font-semibold mb-2">{title} Trend</div>
      {loading ? (
        <div className="h-16 bg-gray-100 animate-pulse rounded" />
      ) : (
        <div className="h-16 flex items-center justify-center text-gray-400">[Chart]</div>
      )}
    </div>
  );
}

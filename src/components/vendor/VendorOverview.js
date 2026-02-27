import React, { Suspense, useState, useMemo } from 'react';
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
        <SummaryCard label="Active Listings" value={stats?.activeListings} loading={loading} meta={stats?.totalProperties ? `${stats.totalProperties} total` : ''} />
        <SummaryCard label="Pending Listings" value={stats?.pendingListings} loading={loading} meta={stats?.pendingListings ? `${stats.pendingListings} awaiting review` : ''} />
        <SummaryCard label="Sold Properties" value={stats?.soldProperties} loading={loading} meta={stats?.soldProperties ? `${stats.soldProperties} sold` : ''} />
        <SummaryCard label="Revenue" value={stats?.totalRevenue} loading={loading} prefix="₦" meta={stats?.totalInquiries ? `${stats.totalInquiries} inquiries` : ''} />
        <SummaryCard label="Inquiries" value={stats?.totalInquiries} loading={loading} meta={stats?.totalInquiries ? `Converted ${Math.round((stats.conversionRate||0))}%` : ''} />
        <SummaryCard label="Conversion Rate" value={stats?.conversionRate?.toFixed ? stats.conversionRate.toFixed(1) + '%' : (stats?.conversionRate ?? 0) + '%'} loading={loading} meta={stats?.recentActivity?.length ? `${stats.recentActivity.length} recent actions` : ''} />
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
            <RecentActivityList items={stats.recentActivity} />
          ) : (
            <li className="py-2 text-gray-400">No recent activity</li>
          )}
        </ul>
      </div>
    </div>
  );
}

const SummaryCard = React.memo(function SummaryCard({ label, value, loading, prefix, meta }) {
  const display = loading ? '...' : (prefix || '') + (value ?? 0);
  return (
    <div className="bg-brand-blue text-white cursor-default hover:bg-blue-700 transition-colors p-4 rounded shadow flex flex-col justify-between min-h-[100px]">
      <div className="flex flex-col items-start">
        <div className="text-2xl font-bold">
          {display}
        </div>
        <div className="text-blue-100 text-sm mt-1">{label}</div>
        {meta ? <div className="text-blue-200 text-xs mt-2">{meta}</div> : null}
      </div>
    </div>
  );
});

const VendorChart = React.lazy(() => import('./VendorChart'));

const TrendCard = React.memo(function TrendCard({ title, data, loading }) {
  return (
    <div className="bg-white rounded shadow p-4">
      <div className="font-semibold mb-2">{title} Trend</div>
      {loading ? (
        <div className="h-36 bg-gray-100 animate-pulse rounded" />
      ) : (
        <div className="h-36">
          <Suspense fallback={<div className="h-36 bg-gray-50 flex items-center justify-center text-gray-300">Loading chart...</div>}>
            <VendorChart data={data} title={title} />
          </Suspense>
        </div>
      )}
    </div>
  );
});

function RecentActivityList({ items }) {
  const [limit, setLimit] = useState(10);
  const displayed = useMemo(() => items.slice(0, limit), [items, limit]);
  return (
    <>
      {displayed.map((item, idx) => (
        <li key={idx} className="py-2 text-sm text-gray-700">{item}</li>
      ))}
      {items.length > limit && (
        <li className="py-2 text-center">
          <button className="px-3 py-1 bg-gray-100 rounded text-sm" onClick={() => setLimit((l) => l + 10)}>Load more</button>
        </li>
      )}
    </>
  );
}

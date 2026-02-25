import React from 'react';

export default function VendorDashboard() {
  return (
    <div className="container mx-auto py-8">
      <h2 className="text-2xl font-bold text-brand-blue mb-4">Vendor Dashboard</h2>
      <div className="bg-white rounded shadow p-6">
        <p>Welcome, vendor! This dashboard is only accessible to users with the vendor role.</p>
        {/* Add vendor-specific widgets/components here */}
      </div>
    </div>
  );
}

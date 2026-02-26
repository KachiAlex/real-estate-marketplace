import React from 'react';

export default function VendorSubscription() {
  // Placeholder for subscription/payment flow UI
  return (
    <div className="container mx-auto py-8">
      <h2 className="text-2xl font-bold text-brand-blue mb-4">Vendor Subscription</h2>
      <div className="bg-white rounded shadow p-6">
        <p className="mb-4">Manage your subscription, view payment history, and renew your plan.</p>
        {/* TODO: Integrate Paystack payment, show subscription status/history, admin fee info, trial countdown/reminders */}
        <div className="text-gray-500">Subscription features coming soon...</div>
      </div>
    </div>
  );
}

import React from 'react';
import { Link } from 'react-router-dom';
import SubscriptionDashboard from '../components/SubscriptionDashboard';

const VendorSubscription = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Vendor Subscription</h1>
            <p className="text-gray-600 mt-1">
              Keep your listings live by tracking trial status, monthly billing, and Paystack payments from one place.
            </p>
          </div>
          <Link
            to="/dashboard"
            className="inline-flex items-center text-sm font-semibold text-brand-blue hover:text-brand-orange"
          >
            Back to dashboard
          </Link>
        </div>

        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
          <h2 className="text-2xl font-semibold mb-2">3‑Month Free Trial</h2>
          <p className="text-sm text-blue-50 max-w-3xl">
            Approved vendors enjoy 90 days of full access before the ₦50,000/month subscription kicks in. Once your trial ends, payments are
            processed securely via Paystack and reflected instantly below.
          </p>
        </div>

        <SubscriptionDashboard />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Billing essentials</h3>
            <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside">
              <li>Trial length: 90 days from vendor approval.</li>
              <li>Default rate: ₦50,000/month (admin configurable).</li>
              <li>Paystack handles all renewals and receipts.</li>
              <li>Expired subscriptions pause listings and new leads.</li>
            </ul>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Need help?</h3>
            <p className="text-sm text-gray-600">
              Our team can resend invoices, update billing contacts, or walk you through Paystack verification.
            </p>
            <div className="mt-4 text-sm text-gray-800 space-y-1">
              <p>
                Email:{' '}
                <a href="mailto:support@propertyark.com" className="text-brand-blue hover:underline">
                  support@propertyark.com
                </a>
              </p>
              <p>Phone: +234 800 000 0000</p>
              <p>Hours: 9am – 6pm WAT, Monday to Friday</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorSubscription;

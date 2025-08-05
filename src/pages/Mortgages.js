import React from 'react';

const Mortgages = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Mortgages</h1>
        <p className="text-gray-600 mb-8">Explore mortgage options and view your mortgage status.</p>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Mortgages</h2>
          <p className="text-gray-600">(Mortgage details would be listed here.)</p>
        </div>
      </div>
    </div>
  );
};

export default Mortgages;
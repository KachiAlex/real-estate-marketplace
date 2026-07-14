import React from 'react';
import { useInvestment } from '../contexts/InvestmentContext';

const Investments = () => {
  const { investments } = useInvestment();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">My Investments</h1>
        <div className="bg-white rounded-lg shadow p-6">
          {investments && investments.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {investments.map((inv) => (
                  <tr key={inv.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{inv.propertyTitle}</td>
                    <td className="px-6 py-4 whitespace-nowrap">${(inv.amount || 0).toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{inv.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{inv.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-600">You have not made any investments yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Investments;
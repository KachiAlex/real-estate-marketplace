import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useInvestment } from '../contexts/InvestmentContext';

const InvestmentDetail = () => {
  const { id } = useParams();
  const { investments } = useInvestment();
  const investment = investments?.find(inv => inv.id === id);

  if (!investment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Investment Not Found</h2>
          <Link to="/investments" className="text-blue-600 hover:text-blue-500">Back to Investments</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Investment Details</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-4">
            <span className="text-gray-500">Property:</span> <span className="font-semibold">{investment.propertyTitle}</span>
          </div>
          <div className="mb-4">
            <span className="text-gray-500">Amount Invested:</span> <span className="font-semibold">${investment.amount.toLocaleString()}</span>
          </div>
          <div className="mb-4">
            <span className="text-gray-500">Date:</span> <span className="font-semibold">{investment.date}</span>
          </div>
          <div className="mb-4">
            <span className="text-gray-500">Status:</span> <span className="font-semibold">{investment.status}</span>
          </div>
          <div className="mb-4">
            <span className="text-gray-500">Percentage Ownership:</span> <span className="font-semibold">{investment.percentage}%</span>
          </div>
          <Link to="/investments" className="text-blue-600 hover:text-blue-500">Back to Investments</Link>
        </div>
      </div>
    </div>
  );
};

export default InvestmentDetail;
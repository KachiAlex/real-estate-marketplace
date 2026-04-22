import React from 'react';
import { Link } from 'react-router-dom';
import { FaChartLine, FaUsers, FaClock } from 'react-icons/fa';
import { formatCurrency } from '../utils/currency';

/**
 * InvestmentCard Component
 * Displays investment opportunity summary with funding progress
 */
const InvestmentCard = ({ investment, onInvestClick }) => {
  if (!investment) return null;

  const {
    investmentId,
    title,
    description,
    targetAmount,
    currentAmount,
    fundingPercentage,
    expectedReturn,
    investorCount,
    riskLevel,
    image
  } = investment;

  const getRiskColor = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden">
      {/* Image */}
      <div className="relative h-48 bg-gray-200 overflow-hidden">
        {image ? (
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600">
            <FaChartLine className="text-white text-4xl" />
          </div>
        )}
        {riskLevel && (
          <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-sm font-semibold ${getRiskColor(riskLevel)}`}>
            {riskLevel}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
          {title}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {description}
        </p>

        {/* Funding Progress */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-gray-700">
              Funding Progress
            </span>
            <span className="text-sm font-bold text-blue-600">
              {fundingPercentage || 0}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(fundingPercentage || 0, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1 gap-2">
            <span className="truncate">{formatCurrency(currentAmount || 0)}</span>
            <span className="truncate">{formatCurrency(targetAmount || 0)}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4 text-center">
          <div className="bg-blue-50 rounded p-2">
            <div className="text-lg font-bold text-blue-600">
              {expectedReturn || 0}%
            </div>
            <div className="text-xs text-gray-600">Expected Return</div>
          </div>
          <div className="bg-green-50 rounded p-2">
            <div className="flex items-center justify-center text-lg font-bold text-green-600">
              <FaUsers className="mr-1" />
              {investorCount || 0}
            </div>
            <div className="text-xs text-gray-600">Investors</div>
          </div>
          <div className="bg-purple-50 rounded p-2">
            <div className="flex items-center justify-center text-lg font-bold text-purple-600">
              <FaClock className="mr-1" />
              1y
            </div>
            <div className="text-xs text-gray-600">Duration</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Link
            to={`/investments/${investmentId}`}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors text-center"
          >
            View Details
          </Link>
          <button
            onClick={() => onInvestClick?.(investment)}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Invest Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvestmentCard;

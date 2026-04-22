import React from 'react';
import { FaCheckCircle, FaTimesCircle, FaClock, FaExclamationTriangle, FaArrowRight } from 'react-icons/fa';
import { formatCurrency } from '../utils/currency';

/**
 * TransactionCard Component
 * Displays transaction details with status badge and action buttons
 */
const TransactionCard = ({ transaction, onActionClick }) => {
  if (!transaction) return null;

  const {
    transactionId,
    propertyTitle,
    amount,
    status,
    date,
    type,
    paymentMethod,
    description
  } = transaction;

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'success':
        return <FaCheckCircle className="text-green-500" />;
      case 'pending':
        return <FaClock className="text-yellow-500" />;
      case 'failed':
      case 'cancelled':
        return <FaTimesCircle className="text-red-500" />;
      case 'disputed':
        return <FaExclamationTriangle className="text-orange-500" />;
      default:
        return <FaClock className="text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'disputed':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionButtonText = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'Complete Payment';
      case 'disputed':
        return 'View Dispute';
      case 'completed':
      case 'success':
        return 'View Receipt';
      default:
        return 'View Details';
    }
  };

  const getActionButtonColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-blue-600 hover:bg-blue-700';
      case 'disputed':
        return 'bg-orange-600 hover:bg-orange-700';
      case 'completed':
      case 'success':
        return 'bg-green-600 hover:bg-green-700';
      default:
        return 'bg-gray-600 hover:bg-gray-700';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-4 border-l-4 border-gray-300">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            {propertyTitle || 'Transaction'}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            ID: {transactionId}
          </p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(status)}`}>
          {getStatusIcon(status)}
          <span className="capitalize">{status}</span>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Amount */}
        <div>
          <p className="text-xs text-gray-600 font-medium">Amount</p>
          <p className="text-lg font-bold text-gray-900 mt-1">
            {formatCurrency(amount || 0)}
          </p>
        </div>

        {/* Date */}
        <div>
          <p className="text-xs text-gray-600 font-medium">Date</p>
          <p className="text-lg font-bold text-gray-900 mt-1">
            {formatDate(date)}
          </p>
        </div>

        {/* Type */}
        {type && (
          <div>
            <p className="text-xs text-gray-600 font-medium">Type</p>
            <p className="text-sm text-gray-700 mt-1 capitalize">
              {type.replace(/_/g, ' ')}
            </p>
          </div>
        )}

        {/* Payment Method */}
        {paymentMethod && (
          <div>
            <p className="text-xs text-gray-600 font-medium">Payment Method</p>
            <p className="text-sm text-gray-700 mt-1 capitalize">
              {paymentMethod}
            </p>
          </div>
        )}
      </div>

      {/* Description */}
      {description && (
        <div className="mb-4 p-3 bg-gray-50 rounded">
          <p className="text-sm text-gray-700">
            {description}
          </p>
        </div>
      )}

      {/* Action Button */}
      <button
        onClick={() => onActionClick?.(transaction)}
        className={`w-full px-4 py-2 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${getActionButtonColor(status)}`}
      >
        {getActionButtonText(status)}
        <FaArrowRight className="text-sm" />
      </button>
    </div>
  );
};

export default TransactionCard;

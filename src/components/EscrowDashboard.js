import React, { useState, useEffect } from 'react';
import { useEscrow } from '../contexts/EscrowContext';
import { 
  FaClock, 
  FaCheck, 
  FaExclamationTriangle,
  FaDollarSign,
  FaHome,
  FaUser,
  FaCalendarAlt,
  FaShieldAlt,
  FaEye,
  FaTimes,
  FaCheckCircle,
  FaSpinner,
  FaGavel
} from 'react-icons/fa';
import PropertyConfirmation from './PropertyConfirmation';
import AdminDisputeResolution from './AdminDisputeResolution';

const EscrowDashboard = ({ userRole = 'buyer' }) => {
  const { 
    escrowTransactions, 
    getEscrowTimer, 
    checkAutoRelease,
    loading 
  } = useEscrow();
  
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showDisputeResolution, setShowDisputeResolution] = useState(false);

  useEffect(() => {
    // Check for auto-release every minute
    const interval = setInterval(() => {
      checkAutoRelease();
    }, 60000);

    return () => clearInterval(interval);
  }, [checkAutoRelease]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'funded': return 'text-blue-600 bg-blue-100';
      case 'in_escrow': return 'text-purple-600 bg-purple-100';
      case 'buyer_confirmed': return 'text-green-600 bg-green-100';
      case 'auto_released': return 'text-orange-600 bg-orange-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'disputed': return 'text-red-600 bg-red-100';
      case 'cancelled': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <FaClock className="h-4 w-4" />;
      case 'funded': return <FaDollarSign className="h-4 w-4" />;
      case 'in_escrow': return <FaShieldAlt className="h-4 w-4" />;
      case 'buyer_confirmed': return <FaCheck className="h-4 w-4" />;
      case 'auto_released': return <FaCheckCircle className="h-4 w-4" />;
      case 'completed': return <FaCheckCircle className="h-4 w-4" />;
      case 'disputed': return <FaExclamationTriangle className="h-4 w-4" />;
      case 'cancelled': return <FaTimes className="h-4 w-4" />;
      default: return <FaClock className="h-4 w-4" />;
    }
  };

  const canTakeAction = (transaction) => {
    if (userRole === 'buyer') {
      return ['in_escrow', 'funded'].includes(transaction.status);
    } else if (userRole === 'admin') {
      return transaction.status === 'disputed';
    }
    return false;
  };

  const handleActionClick = (transaction) => {
    setSelectedTransaction(transaction);
    if (userRole === 'buyer') {
      setShowConfirmation(true);
    } else if (userRole === 'admin') {
      setShowDisputeResolution(true);
    }
  };

  const filteredTransactions = escrowTransactions.filter(transaction => {
    if (userRole === 'buyer') {
      return transaction.buyerId === '1'; // Current user ID
    } else if (userRole === 'vendor') {
      return transaction.sellerId === '2'; // Current vendor ID
    } else if (userRole === 'admin') {
      return true; // Admin sees all transactions
    }
    return false;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FaSpinner className="h-8 w-8 animate-spin text-brand-blue" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Escrow Transactions</h2>
          <p className="text-gray-600 mt-1">
            {userRole === 'buyer' && 'Your property purchase transactions'}
            {userRole === 'vendor' && 'Your property sale transactions'}
            {userRole === 'admin' && 'All escrow transactions requiring attention'}
          </p>
        </div>
        <div className="text-sm text-gray-500">
          {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { 
            label: 'Active Escrows', 
            value: filteredTransactions.filter(t => ['in_escrow', 'funded'].includes(t.status)).length,
            color: 'blue'
          },
          { 
            label: 'Completed', 
            value: filteredTransactions.filter(t => ['completed', 'buyer_confirmed', 'auto_released'].includes(t.status)).length,
            color: 'green'
          },
          { 
            label: 'Disputed', 
            value: filteredTransactions.filter(t => t.status === 'disputed').length,
            color: 'red'
          },
          { 
            label: 'Total Value', 
            value: `₦${filteredTransactions.reduce((sum, t) => sum + t.amount, 0).toLocaleString()}`,
            color: 'purple'
          }
        ].map((stat, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className={`text-2xl font-bold text-${stat.color}-600 mb-1`}>
              {stat.value}
            </div>
            <div className="text-sm text-gray-600">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
        </div>
        
        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center">
            <FaShieldAlt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No escrow transactions</h3>
            <p className="text-gray-600">
              {userRole === 'buyer' && 'You haven\'t made any property purchases yet.'}
              {userRole === 'vendor' && 'You haven\'t sold any properties yet.'}
              {userRole === 'admin' && 'No transactions require attention at the moment.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredTransactions.map((transaction) => {
              const timer = getEscrowTimer(transaction.confirmationDeadline);
              const canAction = canTakeAction(transaction);
              
              const confirmationDeadline = transaction.confirmationDeadline ? new Date(transaction.confirmationDeadline) : null;
              const buyerTimelineMessage = confirmationDeadline
                ? `Buyer must confirm possession or file a dispute by ${confirmationDeadline.toLocaleDateString()} (${confirmationDeadline.toLocaleTimeString()})`
                : 'Buyer must confirm possession or file a dispute within 7 days of funding.';
              const sellerTimelineMessage = confirmationDeadline
                ? `Seller receives funds automatically after ${confirmationDeadline.toLocaleDateString()} if the buyer takes no action.`
                : 'Seller funds auto-release after the buyer window closes (7 days).';

              return (
                <div key={transaction.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            <FaHome className="h-6 w-6 text-gray-600" />
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="text-lg font-medium text-gray-900 truncate">
                              {transaction.propertyTitle}
                            </h4>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                              {getStatusIcon(transaction.status)}
                              <span className="ml-1 capitalize">{transaction.status.replace('_', ' ')}</span>
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                            <div className="flex items-center space-x-2">
                              <FaDollarSign className="h-4 w-4" />
                              <span>₦{transaction.amount.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <FaUser className="h-4 w-4" />
                              <span>
                                {userRole === 'buyer' ? transaction.sellerName : transaction.buyerName}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <FaCalendarAlt className="h-4 w-4" />
                              <span>
                                {new Date(transaction.paymentDate || transaction.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          {/* Timer for in-escrow transactions */}
                          {transaction.status === 'in_escrow' && !timer.expired && (
                            <div className="mt-3 flex items-center space-x-2 text-sm">
                              <FaClock className="h-4 w-4 text-orange-500" />
                              <span className="text-orange-600">
                                {timer.days}d {timer.hours}h {timer.minutes}m remaining
                              </span>
                            </div>
                          )}

                          {transaction.status === 'in_escrow' && timer.expired && (
                            <div className="mt-3 flex items-center space-x-2 text-sm">
                              <FaExclamationTriangle className="h-4 w-4 text-red-500" />
                              <span className="text-red-600">Confirmation deadline expired</span>
                            </div>
                          )}
                          <div className="mt-4 grid gap-3 md:grid-cols-2">
                            <div className="p-4 rounded-2xl border border-blue-100 bg-blue-50">
                              <div className="flex items-center space-x-2 text-blue-800 font-semibold">
                                <FaClock className="h-4 w-4" />
                                <span>Escrow Timeline</span>
                              </div>
                              <p className="mt-2 text-sm text-gray-700 font-medium">Buyer</p>
                              <p className="text-sm text-gray-600">{buyerTimelineMessage}</p>
                              <p className="mt-2 text-sm text-gray-700 font-medium">Seller</p>
                              <p className="text-sm text-gray-600">{sellerTimelineMessage}</p>
                            </div>
                            <div className="p-4 rounded-2xl border border-rose-100 bg-rose-50">
                              <div className="flex items-center space-x-2 text-rose-900 font-semibold">
                                <FaGavel className="h-4 w-4" />
                                <span>Dispute Guidance</span>
                              </div>
                              <ul className="mt-2 space-y-2 text-sm text-gray-700">
                                <li>
                                  <strong>Buyer:</strong> File a dispute from the confirmation modal with details/evidence before the 7-day window ends to pause fund release.
                                </li>
                                <li>
                                  <strong>Seller:</strong> You will be notified immediately if a dispute is filed—respond promptly so admins can resolve and release or refund appropriately.
                                </li>
                              </ul>
                            </div>
                          </div>

                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setSelectedTransaction(transaction)}
                        className="text-brand-blue hover:text-blue-700 text-sm font-medium"
                      >
                        <FaEye className="h-4 w-4" />
                      </button>
                      
                      {canAction && (
                        <button
                          onClick={() => handleActionClick(transaction)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            userRole === 'buyer'
                              ? 'bg-brand-blue text-white hover:bg-blue-700'
                              : 'bg-red-600 text-white hover:bg-red-700'
                          }`}
                        >
                          {userRole === 'buyer' ? 'Confirm/Dispute' : 'Resolve Dispute'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      {showConfirmation && selectedTransaction && (
        <PropertyConfirmation
          escrowTransaction={selectedTransaction}
          onClose={() => {
            setShowConfirmation(false);
            setSelectedTransaction(null);
          }}
        />
      )}

      {showDisputeResolution && selectedTransaction && (
        <AdminDisputeResolution
          escrowTransaction={selectedTransaction}
          onClose={() => {
            setShowDisputeResolution(false);
            setSelectedTransaction(null);
          }}
        />
      )}
    </div>
  );
};

export default EscrowDashboard;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaFilter, FaSort, FaEye, FaCheckCircle } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../utils/currency';
import Modal from '../components/Modal';

/**
 * EscrowTransactionsPage Component
 * Displays escrow transactions from localStorage with filtering and sorting
 */
const EscrowTransactionsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // State
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('date');
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Fetch transactions from localStorage on mount
  useEffect(() => {
    if (user) {
      try {
        const stored = localStorage.getItem('escrowTransactions');
        const txns = stored ? JSON.parse(stored) : [];
        setTransactions(txns);
      } catch (error) {
        console.error('Error loading transactions:', error);
        toast.error('Failed to load transactions');
      } finally {
        setLoading(false);
      }
    } else {
      navigate('/auth/login');
    }
  }, [user, navigate]);

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...transactions];

    // Filter by status
    if (filterStatus) {
      filtered = filtered.filter(txn => txn.status === filterStatus);
    }

    // Sort
    switch (sortBy) {
      case 'date-newest':
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'date-oldest':
        filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'amount-high':
        filtered.sort((a, b) => (b.amount || 0) - (a.amount || 0));
        break;
      case 'amount-low':
        filtered.sort((a, b) => (a.amount || 0) - (b.amount || 0));
        break;
      default:
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    setFilteredTransactions(filtered);
    setCurrentPage(1);
  }, [transactions, sortBy, filterStatus]);

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + itemsPerPage);

  const handleCompletePayment = async (transactionId) => {
    try {
      const updated = transactions.map(txn => 
        txn.transactionId === transactionId 
          ? { ...txn, status: 'completed', completedAt: new Date().toISOString() }
          : txn
      );
      setTransactions(updated);
      localStorage.setItem('escrowTransactions', JSON.stringify(updated));
      toast.success('Payment completed successfully');
      setShowDetailModal(false);
    } catch (error) {
      console.error('Error completing payment:', error);
      toast.error('Failed to complete payment');
    }
  };

  const handleViewDetails = (transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailModal(true);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please login to view your transactions</p>
          <button
            onClick={() => navigate('/auth/login')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Escrow Transactions</h1>
          <p className="text-gray-600">
            {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Filters and Sort */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaFilter className="inline mr-2" />
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaSort className="inline mr-2" />
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="date-newest">Date: Newest</option>
                <option value="date-oldest">Date: Oldest</option>
                <option value="amount-high">Amount: High to Low</option>
                <option value="amount-low">Amount: Low to High</option>
              </select>
            </div>

            {/* Reset Button */}
            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilterStatus('');
                  setSortBy('date');
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        {/* Transactions List */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : paginatedTransactions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <FaCheckCircle className="text-4xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Transactions</h3>
            <p className="text-gray-600">
              {filteredTransactions.length === 0 && transactions.length === 0
                ? "You don't have any escrow transactions yet."
                : 'No transactions match your filters.'}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {paginatedTransactions.map((transaction) => (
                <div key={transaction.transactionId} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        {transaction.propertyTitle || 'Transaction'}
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-gray-500 uppercase">Amount</p>
                          <p className="text-lg font-bold text-blue-600">
                            {formatCurrency(transaction.amount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase">Type</p>
                          <p className="text-sm text-gray-900">{transaction.type || 'Payment'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase">Date</p>
                          <p className="text-sm text-gray-900">
                            {new Date(transaction.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase">Status</p>
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            transaction.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                            transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {transaction.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleViewDetails(transaction)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View details"
                      >
                        <FaEye />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-4 py-2 rounded-lg ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedTransaction && (
        <Modal onClose={() => setShowDetailModal(false)}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Transaction Details
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Property
                </label>
                <p className="text-gray-600">
                  {selectedTransaction.propertyTitle || 'N/A'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount
                </label>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(selectedTransaction.amount)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <p className="text-gray-600">{selectedTransaction.type || 'Payment'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                  selectedTransaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  selectedTransaction.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                  selectedTransaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {selectedTransaction.status}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <p className="text-gray-600">
                  {new Date(selectedTransaction.createdAt).toLocaleString()}
                </p>
              </div>
              {selectedTransaction.reference && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reference
                  </label>
                  <p className="text-gray-600 font-mono text-sm">
                    {selectedTransaction.reference}
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowDetailModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
              >
                Close
              </button>
              {selectedTransaction.status === 'pending' && (
                <button
                  onClick={() => handleCompletePayment(selectedTransaction.transactionId)}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                >
                  Complete Payment
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default EscrowTransactionsPage;

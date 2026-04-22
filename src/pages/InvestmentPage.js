import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaFilter, FaSort, FaChartLine } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useInvestments } from '../hooks/useInvestments';
import { useAuth } from '../contexts/AuthContext';
import InvestmentCard from '../components/InvestmentCard';
import InvestModal from '../components/InvestModal';

/**
 * InvestmentPage Component
 * Displays investment opportunities with filtering, sorting, and pagination
 */
const InvestmentPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { investments, loading, pagination, fetchInvestments } = useInvestments();

  // Filter and sort state
  const [sortBy, setSortBy] = useState('expectedReturn');
  const [filterStatus, setFilterStatus] = useState('active');
  const [minReturn, setMinReturn] = useState('');
  const [maxReturn, setMaxReturn] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(9);
  const [selectedInvestment, setSelectedInvestment] = useState(null);
  const [showInvestModal, setShowInvestModal] = useState(false);

  // Fetch investments on mount and when filters change
  useEffect(() => {
    fetchInvestments({
      limit: itemsPerPage,
      offset: (currentPage - 1) * itemsPerPage,
      status: filterStatus,
      sortBy,
      minReturn: minReturn ? parseInt(minReturn) : '',
      maxReturn: maxReturn ? parseInt(maxReturn) : ''
    });
  }, [currentPage, filterStatus, sortBy, minReturn, maxReturn, itemsPerPage, fetchInvestments]);

  const handleInvestClick = (investment) => {
    if (!user) {
      toast.error('Please login to invest');
      navigate('/auth/login');
      return;
    }
    setSelectedInvestment(investment);
    setShowInvestModal(true);
  };

  const handleInvestmentSuccess = () => {
    setShowInvestModal(false);
    setSelectedInvestment(null);
    toast.success('Investment created successfully!');
    // Refresh investments list
    fetchInvestments({
      limit: itemsPerPage,
      offset: (currentPage - 1) * itemsPerPage,
      status: filterStatus,
      sortBy
    });
  };

  const totalPages = Math.ceil((pagination.total || 0) / itemsPerPage);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
            <FaChartLine className="mr-3 text-blue-600" />
            Investment Opportunities
          </h1>
          <p className="text-gray-600">
            Discover and invest in premium real estate opportunities
          </p>
        </div>

        {/* Filters and Sort */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="closed">Closed</option>
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
                <option value="expectedReturn">Expected Return</option>
                <option value="targetAmount">Target Amount</option>
                <option value="fundingPercentage">Funding Progress</option>
                <option value="createdAt">Newest</option>
              </select>
            </div>

            {/* Min Return */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Min Return %</label>
              <input
                type="number"
                value={minReturn}
                onChange={(e) => {
                  setMinReturn(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="0"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Max Return */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Max Return %</label>
              <input
                type="number"
                value={maxReturn}
                onChange={(e) => {
                  setMaxReturn(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="100"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Reset Button */}
            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilterStatus('active');
                  setSortBy('expectedReturn');
                  setMinReturn('');
                  setMaxReturn('');
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        {/* Investments Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : investments.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <FaChartLine className="text-4xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Investments Found</h3>
            <p className="text-gray-600">
              No investment opportunities match your filters. Try adjusting your search criteria.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {investments.map((investment) => (
                <InvestmentCard
                  key={investment.investmentId}
                  investment={investment}
                  onInvestClick={handleInvestClick}
                />
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
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = currentPage - 2 + i;
                  return page > 0 && page <= totalPages ? page : null;
                }).filter(Boolean).map((page) => (
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

      {/* Invest Modal */}
      {showInvestModal && selectedInvestment && (
        <InvestModal
          investment={selectedInvestment}
          onClose={() => setShowInvestModal(false)}
          onSuccess={handleInvestmentSuccess}
        />
      )}
    </div>
  );
};

export default InvestmentPage;

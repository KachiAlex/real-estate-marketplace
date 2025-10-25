import React, { useState, useEffect, useMemo } from 'react';
import { useInvestment } from '../contexts/InvestmentContext';
import { useAuth } from '../contexts/AuthContext';
import InvestmentModal from '../components/InvestmentModal';
import toast from 'react-hot-toast';
import { 
  FaSearch, 
  FaFilter, 
  FaMapMarkerAlt, 
  FaDollarSign, 
  FaPercent, 
  FaCalendarAlt, 
  FaBuilding, 
  FaShieldAlt,
  FaEye,
  FaHeart,
  FaChevronLeft,
  FaChevronRight,
  FaSortAmountDown,
  FaSortAmountUp
} from 'react-icons/fa';

const InvestmentOpportunities = () => {
  const { user } = useAuth();
  const { investments, loading, investInOpportunity } = useInvestment();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    minROI: '',
    maxROI: '',
    minAmount: '',
    maxAmount: '',
    duration: '',
    propertyType: '',
    riskLevel: '',
    location: ''
  });
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(9);
  const [selectedInvestment, setSelectedInvestment] = useState(null);
  const [showInvestmentModal, setShowInvestmentModal] = useState(false);

  // Filter and sort investments
  const filteredInvestments = useMemo(() => {
    let filtered = investments.filter(investment => {
      // Only show active and funding investments
      if (!['active', 'funding'].includes(investment.status)) return false;
      
      // Search term filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        if (!investment.title.toLowerCase().includes(searchLower) &&
            !investment.description.toLowerCase().includes(searchLower) &&
            !investment.propertyLocation.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // ROI filter
      if (filters.minROI && investment.expectedROI < parseFloat(filters.minROI)) return false;
      if (filters.maxROI && investment.expectedROI > parseFloat(filters.maxROI)) return false;

      // Amount filter
      if (filters.minAmount && investment.targetAmount < parseFloat(filters.minAmount)) return false;
      if (filters.maxAmount && investment.targetAmount > parseFloat(filters.maxAmount)) return false;

      // Duration filter
      if (filters.duration && investment.investmentDuration !== parseInt(filters.duration)) return false;

      // Property type filter
      if (filters.propertyType && investment.propertyType !== filters.propertyType) return false;

      // Risk level filter
      if (filters.riskLevel && investment.riskLevel !== filters.riskLevel) return false;

      // Location filter
      if (filters.location && !investment.propertyLocation.toLowerCase().includes(filters.location.toLowerCase())) return false;

      return true;
    });

    // Sort investments
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'expectedROI':
          aValue = a.expectedROI;
          bValue = b.expectedROI;
          break;
        case 'targetAmount':
          aValue = a.targetAmount;
          bValue = b.targetAmount;
          break;
        case 'investmentDuration':
          aValue = a.investmentDuration;
          bValue = b.investmentDuration;
          break;
        case 'createdAt':
        default:
          aValue = new Date(a.createdAt?.toDate?.() || a.createdAt);
          bValue = new Date(b.createdAt?.toDate?.() || b.createdAt);
          break;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [investments, searchTerm, filters, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredInvestments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentInvestments = filteredInvestments.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({
      minROI: '',
      maxROI: '',
      minAmount: '',
      maxAmount: '',
      duration: '',
      propertyType: '',
      riskLevel: '',
      location: ''
    });
    setSearchTerm('');
    setCurrentPage(1);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleInvestNow = (investment) => {
    if (!user) {
      toast.error('Please login to invest');
      return;
    }
    setSelectedInvestment(investment);
    setShowInvestmentModal(true);
  };

  const handleInvestmentSubmit = async (investmentData) => {
    try {
      await investInOpportunity(investmentData);
      setShowInvestmentModal(false);
      setSelectedInvestment(null);
      toast.success('Investment submitted successfully!');
    } catch (error) {
      toast.error('Failed to submit investment');
      console.error('Investment error:', error);
    }
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'funding': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Investment Opportunities</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover real estate investment opportunities backed by property collateral. 
              Invest with confidence knowing your investment is secured.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Search */}
            <div className="lg:col-span-1">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search investments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="lg:col-span-2">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <select
                  value={filters.propertyType}
                  onChange={(e) => handleFilterChange('propertyType', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Property Type</option>
                  <option value="residential">Residential</option>
                  <option value="commercial">Commercial</option>
                  <option value="industrial">Industrial</option>
                  <option value="land">Land</option>
                </select>

                <select
                  value={filters.riskLevel}
                  onChange={(e) => handleFilterChange('riskLevel', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Risk Level</option>
                  <option value="low">Low Risk</option>
                  <option value="medium">Medium Risk</option>
                  <option value="high">High Risk</option>
                </select>

                <input
                  type="number"
                  placeholder="Min ROI (%)"
                  value={filters.minROI}
                  onChange={(e) => handleFilterChange('minROI', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />

                <input
                  type="number"
                  placeholder="Max Amount (₦)"
                  value={filters.maxAmount}
                  onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {/* Second row of filters */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <input
                  type="number"
                  placeholder="Min Amount (₦)"
                  value={filters.minAmount}
                  onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />

                <input
                  type="number"
                  placeholder="Max ROI (%)"
                  value={filters.maxROI}
                  onChange={(e) => handleFilterChange('maxROI', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />

                <select
                  value={filters.duration}
                  onChange={(e) => handleFilterChange('duration', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Duration</option>
                  <option value="12">12 months</option>
                  <option value="24">24 months</option>
                  <option value="36">36 months</option>
                  <option value="48">48 months</option>
                  <option value="60">60 months</option>
                </select>

                <select
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Location</option>
                  <option value="lagos">Lagos</option>
                  <option value="abuja">Abuja</option>
                  <option value="port harcourt">Port Harcourt</option>
                  <option value="kano">Kano</option>
                  <option value="ibadan">Ibadan</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mt-4">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {filteredInvestments.length} opportunities found
              </span>
              
              {/* Clear Filters Button */}
              <button
                onClick={handleClearFilters}
                className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 border border-blue-200 rounded-md hover:bg-blue-50 transition-colors"
              >
                Clear Filters
              </button>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Sort by:</span>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field);
                  setSortOrder(order);
                }}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="createdAt-desc">Newest First</option>
                <option value="createdAt-asc">Oldest First</option>
                <option value="expectedROI-desc">Highest ROI</option>
                <option value="expectedROI-asc">Lowest ROI</option>
                <option value="targetAmount-desc">Highest Amount</option>
                <option value="targetAmount-asc">Lowest Amount</option>
                <option value="investmentDuration-asc">Shortest Duration</option>
                <option value="investmentDuration-desc">Longest Duration</option>
              </select>
            </div>
          </div>
        </div>

        {/* Investment Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {currentInvestments.map((investment) => (
            <div key={investment.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {investment.title}
                    </h3>
                    <div className="flex items-center text-sm text-gray-500 mb-2">
                      <FaMapMarkerAlt className="mr-1" />
                      {investment.propertyLocation}
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(investment.status)}`}>
                    {investment.status}
                  </span>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Target Amount</span>
                    <span className="font-semibold text-gray-900">₦{investment.targetAmount?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Expected ROI</span>
                    <span className="font-semibold text-green-600">{investment.expectedROI}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Duration</span>
                    <span className="font-semibold text-gray-900">{investment.investmentDuration} months</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Property Type</span>
                    <span className="font-semibold text-gray-900 capitalize">{investment.propertyType}</span>
                  </div>
                </div>

                <div className="mb-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskColor(investment.riskLevel)}`}>
                    <FaShieldAlt className="mr-1" />
                    {investment.riskLevel} Risk
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {investment.description}
                </p>

                <div className="flex items-center justify-between">
                  <button
                    onClick={() => handleInvestNow(investment)}
                    className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-blue-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center space-x-2"
                  >
                    <FaDollarSign className="text-sm" />
                    <span>Invest Now</span>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedInvestment(investment);
                      setShowInvestmentModal(true);
                    }}
                    className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    title="View Details"
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
          <div className="flex items-center justify-center space-x-2">
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <FaChevronLeft />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-2 border rounded-lg ${
                  currentPage === page
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <FaChevronRight />
            </button>
          </div>
        )}

        {/* Investment Modal */}
        {showInvestmentModal && selectedInvestment && (
          <InvestmentModal
            isOpen={showInvestmentModal}
            investment={selectedInvestment}
            user={user}
            onClose={() => {
              setShowInvestmentModal(false);
              setSelectedInvestment(null);
            }}
            onInvest={handleInvestmentSubmit}
          />
        )}
      </div>
    </div>
  );
};


export default InvestmentOpportunities;

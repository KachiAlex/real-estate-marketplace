import React, { useState, useEffect, useMemo } from 'react';
import { useInvestment } from '../contexts/InvestmentContext';
import { useAuth } from '../contexts/AuthContext';
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
    setSelectedInvestment(investment);
    setShowInvestmentModal(true);
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
            </div>
          </div>

          <div className="flex justify-between items-center mt-4">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {filteredInvestments.length} opportunities found
              </span>
              <button
                onClick={handleClearFilters}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Clear Filters
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Sort by:</span>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field);
                  setSortOrder(order);
                }}
                className="px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors mr-2"
                  >
                    Invest Now
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
            investment={selectedInvestment}
            onClose={() => {
              setShowInvestmentModal(false);
              setSelectedInvestment(null);
            }}
            onInvest={handleInvestNow}
          />
        )}
      </div>
    </div>
  );
};

// Investment Details Modal
const InvestmentModal = ({ investment, onClose, onInvest }) => {
  const [showInvestForm, setShowInvestForm] = useState(false);
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [investorDetails, setInvestorDetails] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    idType: '',
    idNumber: ''
  });

  const handleInvestSubmit = async (e) => {
    e.preventDefault();
    // Handle investment submission
    console.log('Investment submission:', {
      investmentId: investment.id,
      amount: parseFloat(investmentAmount),
      investorDetails
    });
    // Close modal after successful investment
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Investment Details</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <FaEye />
            </button>
          </div>

          {!showInvestForm ? (
            <div className="space-y-6">
              {/* Investment Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Investment Information</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Title:</span>
                      <p className="text-gray-900">{investment.title}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Description:</span>
                      <p className="text-gray-900">{investment.description}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Target Amount:</span>
                      <p className="text-gray-900">₦{investment.targetAmount?.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Expected ROI:</span>
                      <p className="text-gray-900">{investment.expectedROI}%</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Duration:</span>
                      <p className="text-gray-900">{investment.investmentDuration} months</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Collateral</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Location:</span>
                      <p className="text-gray-900">{investment.propertyLocation}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Property Value:</span>
                      <p className="text-gray-900">₦{investment.propertyValue?.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Property Type:</span>
                      <p className="text-gray-900 capitalize">{investment.propertyType}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Collateral Details:</span>
                      <p className="text-gray-900">{investment.collateralDetails}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Terms and Conditions */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Terms & Conditions</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-700 whitespace-pre-line">{investment.terms}</p>
                </div>
              </div>

              {/* Investment Performance */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Investment Performance</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <p className="text-sm text-gray-600">Total Raised</p>
                    <p className="text-2xl font-bold text-gray-900">₦{investment.totalRaised?.toLocaleString() || '0'}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <p className="text-sm text-gray-600">Investors</p>
                    <p className="text-2xl font-bold text-gray-900">{investment.investors?.length || 0}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <p className="text-sm text-gray-600">Progress</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {Math.round(((investment.totalRaised || 0) / investment.targetAmount) * 100)}%
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => setShowInvestForm(true)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Invest Now
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Make Investment</h3>
              <form onSubmit={handleInvestSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Investment Amount (₦)</label>
                  <input
                    type="number"
                    value={investmentAmount}
                    onChange={(e) => setInvestmentAmount(e.target.value)}
                    min={investment.minimumInvestment}
                    max={investment.targetAmount}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum: ₦{investment.minimumInvestment?.toLocaleString()}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={investorDetails.fullName}
                      onChange={(e) => setInvestorDetails({...investorDetails, fullName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={investorDetails.email}
                      onChange={(e) => setInvestorDetails({...investorDetails, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={investorDetails.phone}
                      onChange={(e) => setInvestorDetails({...investorDetails, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ID Type</label>
                    <select
                      value={investorDetails.idType}
                      onChange={(e) => setInvestorDetails({...investorDetails, idType: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select ID Type</option>
                      <option value="national_id">National ID</option>
                      <option value="passport">Passport</option>
                      <option value="drivers_license">Driver's License</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ID Number</label>
                  <input
                    type="text"
                    value={investorDetails.idNumber}
                    onChange={(e) => setInvestorDetails({...investorDetails, idNumber: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <textarea
                    value={investorDetails.address}
                    onChange={(e) => setInvestorDetails({...investorDetails, address: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowInvestForm(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Proceed to Payment
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvestmentOpportunities;

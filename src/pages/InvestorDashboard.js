import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaChartLine, FaDollarSign, FaBuilding, FaPercentage, FaEye } from 'react-icons/fa';
import toast from 'react-hot-toast';
import getApiUrl from '../utils/apiConfig';

const InvestorDashboard = () => {
  const { user } = useAuth();
  const [investmentOpportunities, setInvestmentOpportunities] = useState([]);
  const [userInvestments, setUserInvestments] = useState([]);
  const [portfolioSummary, setPortfolioSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('portfolio');

  const API_BASE_URL = getApiUrl();

  useEffect(() => {
    fetchData();
  }, [user?.id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('InvestorDashboard: Fetching data for user:', user?.id);
      console.log('InvestorDashboard: API_BASE_URL:', API_BASE_URL);
      
      // Fetch investment opportunities
      const opportunitiesResponse = await fetch(getApiUrl('/investments'));
      const opportunitiesData = await opportunitiesResponse.json();
      console.log('InvestorDashboard: Opportunities response:', opportunitiesData);
      
      if (opportunitiesData.success) {
        setInvestmentOpportunities(opportunitiesData.data);
      }

      // Fetch user investments
      const userInvestmentsResponse = await fetch(getApiUrl(`/user/investments?userId=${user?.id}`));
      const userInvestmentsData = await userInvestmentsResponse.json();
      console.log('InvestorDashboard: User investments response:', userInvestmentsData);
      
      if (userInvestmentsData.success) {
        setUserInvestments(userInvestmentsData.data);
        setPortfolioSummary(userInvestmentsData.summary);
      }
    } catch (error) {
      console.error('Error fetching investment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvest = async (investmentId, amount) => {
    try {
      const response = await fetch(getApiUrl(`/investments/${investmentId}/invest`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.id,
          amount: parseInt(amount)
        })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Investment successful!');
        fetchData(); // Refresh data
      } else {
        toast.error(data.message || 'Investment failed');
      }
    } catch (error) {
      console.error('Error making investment:', error);
      toast.error('Investment failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your investment portfolio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Landvest Investor Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.firstName}! Manage your real estate investments</p>
        </div>

        {/* Portfolio Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FaDollarSign className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Invested</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${portfolioSummary.totalInvested?.toLocaleString() || '0'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <FaChartLine className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Dividends</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${portfolioSummary.totalDividendsEarned?.toLocaleString() || '0'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FaPercentage className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Return</p>
                <p className="text-2xl font-bold text-gray-900">
                  {portfolioSummary.totalReturn?.toFixed(2) || '0'}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <FaBuilding className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Investments</p>
                <p className="text-2xl font-bold text-gray-900">
                  {portfolioSummary.activeInvestments || '0'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-lg mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('portfolio')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'portfolio'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                My Portfolio
              </button>
              <button
                onClick={() => setActiveTab('opportunities')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'opportunities'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Investment Opportunities
              </button>
              <button
                onClick={() => setActiveTab('dividends')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'dividends'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Dividends
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Portfolio Tab */}
            {activeTab === 'portfolio' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">My Investment Portfolio</h3>
                {userInvestments.length > 0 ? (
                  <div className="space-y-4">
                    {userInvestments.map((investment) => (
                      <div key={investment.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">{investment.investmentTitle}</h4>
                            <p className="text-sm text-gray-600">Invested: ${investment.amount.toLocaleString()}</p>
                            <p className="text-sm text-gray-600">Shares: {investment.shares}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-green-600">
                              +${investment.totalDividendsEarned.toLocaleString()} earned
                            </p>
                            <p className="text-sm text-gray-600">
                              ${investment.expectedMonthlyDividend.toFixed(0)}/month expected
                            </p>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              investment.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {investment.status}
                            </span>
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500">Investment Date</p>
                              <p className="font-medium">{new Date(investment.investmentDate).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Last Dividend</p>
                              <p className="font-medium">
                                {investment.lastDividendDate 
                                  ? new Date(investment.lastDividendDate).toLocaleDateString()
                                  : 'Not yet paid'
                                }
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">Total Return</p>
                              <p className="font-medium text-green-600">{investment.totalReturn.toFixed(2)}%</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FaBuilding className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No investments yet</h3>
                    <p className="text-gray-600 mb-4">Start building your real estate portfolio today</p>
                    <button
                      onClick={() => setActiveTab('opportunities')}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Browse Opportunities
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Opportunities Tab */}
            {activeTab === 'opportunities' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Investment Opportunities</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {investmentOpportunities.map((opportunity) => (
                    <div key={opportunity.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">{opportunity.title}</h4>
                          <p className="text-sm text-gray-600">{opportunity.type} • {opportunity.location.city}</p>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          opportunity.status === 'fundraising' ? 'bg-blue-100 text-blue-800' :
                          opportunity.status === 'active' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {opportunity.status}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-4">{opportunity.description}</p>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                        <div>
                          <p className="text-gray-500">Total Amount</p>
                          <p className="font-medium">${opportunity.totalAmount.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Minimum Investment</p>
                          <p className="font-medium">${opportunity.minimumInvestment.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Expected Return</p>
                          <p className="font-medium text-green-600">{opportunity.expectedReturn}%</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Dividend Rate</p>
                          <p className="font-medium text-blue-600">{opportunity.dividendRate}%</p>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progress</span>
                          <span>{Math.round((opportunity.raisedAmount / opportunity.totalAmount) * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(opportunity.raisedAmount / opportunity.totalAmount) * 100}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          ${opportunity.raisedAmount.toLocaleString()} raised of ${opportunity.totalAmount.toLocaleString()}
                        </p>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleInvest(opportunity.id, opportunity.minimumInvestment)}
                          disabled={opportunity.status !== 'fundraising'}
                          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                          Invest ${opportunity.minimumInvestment.toLocaleString()}
                        </button>
                        <Link
                          to={`/investment/${opportunity.id}`}
                          className="bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          <FaEye className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dividends Tab */}
            {activeTab === 'dividends' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Dividend History</h3>
                <div className="space-y-4">
                  {userInvestments.map((investment) => (
                    <div key={investment.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-semibold text-gray-900">{investment.investmentTitle}</h4>
                        <span className="text-green-600 font-semibold">
                          +${investment.totalDividendsEarned.toLocaleString()} total
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Monthly Expected</p>
                          <p className="font-medium">${investment.expectedMonthlyDividend.toFixed(0)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Last Payment</p>
                          <p className="font-medium">
                            {investment.lastDividendDate 
                              ? new Date(investment.lastDividendDate).toLocaleDateString()
                              : 'Not yet paid'
                            }
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Investment Amount</p>
                          <p className="font-medium">${investment.amount.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Return Rate</p>
                          <p className="font-medium text-green-600">{investment.totalReturn.toFixed(2)}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestorDashboard; 
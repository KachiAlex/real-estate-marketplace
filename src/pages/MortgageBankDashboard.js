import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaBuilding, FaFileAlt, FaChartLine, FaUsers, FaCheckCircle, FaTimesCircle, FaClock, FaPlus } from 'react-icons/fa';
import toast from 'react-hot-toast';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api-759115682573.us-central1.run.app';

const MortgageBankDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [bank, setBank] = useState(null);
  const [statistics, setStatistics] = useState({
    totalApplications: 0,
    pendingApplications: 0,
    approvedApplications: 0,
    rejectedApplications: 0
  });
  const [applications, setApplications] = useState([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    minLoanAmount: '',
    maxLoanAmount: '',
    minDownPaymentPercent: '',
    maxLoanTerm: '',
    interestRate: '',
    interestRateType: 'fixed',
    eligibilityCriteria: {
      minMonthlyIncome: '',
      minCreditScore: '',
      employmentDuration: ''
    }
  });

  useEffect(() => {
    if (user && user.role === 'mortgage_bank') {
      loadBankData();
    } else {
      toast.error('Access denied. Mortgage bank account required.');
      navigate('/');
    }
  }, [user, navigate]);

  const loadBankData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Get bank profile
      const response = await axios.get(`${API_BASE_URL}/api/mortgage-banks`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success && response.data.data.length > 0) {
        // Find bank associated with current user
        const userBank = response.data.data.find(
          b => b.userAccount?._id === user.id || b.userAccount?.id === user.id
        );
        
        if (userBank) {
          setBank(userBank);
          await loadApplications(userBank);
        } else {
          toast.error('Bank profile not found');
        }
      }
    } catch (error) {
      console.error('Error loading bank data:', error);
      toast.error('Failed to load bank data');
    } finally {
      setLoading(false);
    }
  };

  const loadApplications = async (currentBank) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/mortgages`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const apps = response.data.data || [];
        setApplications(apps);
        setStatistics({
          totalApplications: apps.length,
          pendingApplications: apps.filter(a => a.status === 'pending' || a.status === 'under_review' || a.status === 'needs_more_info').length,
          approvedApplications: apps.filter(a => a.status === 'approved').length,
          rejectedApplications: apps.filter(a => a.status === 'rejected').length
        });
      }
    } catch (error) {
      console.error('Error loading mortgage applications:', error);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    
    if (!bank) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/api/mortgage-banks/${bank._id}/products`,
        {
          name: newProduct.name,
          description: newProduct.description,
          minLoanAmount: parseFloat(newProduct.minLoanAmount),
          maxLoanAmount: parseFloat(newProduct.maxLoanAmount),
          minDownPaymentPercent: parseFloat(newProduct.minDownPaymentPercent),
          maxLoanTerm: parseFloat(newProduct.maxLoanTerm),
          interestRate: parseFloat(newProduct.interestRate),
          interestRateType: newProduct.interestRateType,
          eligibilityCriteria: {
            minMonthlyIncome: parseFloat(newProduct.eligibilityCriteria.minMonthlyIncome) || 0,
            minCreditScore: parseFloat(newProduct.eligibilityCriteria.minCreditScore) || 0,
            employmentDuration: parseFloat(newProduct.eligibilityCriteria.employmentDuration) || 0
          }
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success('Mortgage product added successfully!');
        setShowProductModal(false);
        setNewProduct({
          name: '',
          description: '',
          minLoanAmount: '',
          maxLoanAmount: '',
          minDownPaymentPercent: '',
          maxLoanTerm: '',
          interestRate: '',
          interestRateType: 'fixed',
          eligibilityCriteria: {
            minMonthlyIncome: '',
            minCreditScore: '',
            employmentDuration: ''
          }
        });
        loadBankData();
      }
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error(error.response?.data?.message || 'Failed to add product');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!bank) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FaBuilding className="text-6xl text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Bank Profile Not Found</h2>
          <p className="text-gray-600 mb-4">Your bank profile could not be loaded.</p>
          <button
            onClick={() => navigate('/mortgage-bank/register')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Register Bank
          </button>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{bank.name}</h1>
              <p className="text-gray-600 mt-1">{bank.fullAddress || `${bank.address?.city}, ${bank.address?.state}`}</p>
              <div className="mt-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(bank.verificationStatus)}`}>
                  {bank.verificationStatus === 'approved' ? (
                    <><FaCheckCircle className="mr-1" /> Approved</>
                  ) : bank.verificationStatus === 'pending' ? (
                    <><FaClock className="mr-1" /> Pending Verification</>
                  ) : (
                    <><FaTimesCircle className="mr-1" /> Rejected</>
                  )}
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowProductModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FaPlus className="mr-2" />
              Add Product
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Applications</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{statistics.totalApplications}</p>
              </div>
              <FaFileAlt className="text-blue-600 text-2xl" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Pending</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{statistics.pendingApplications}</p>
              </div>
              <FaClock className="text-yellow-600 text-2xl" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Approved</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{statistics.approvedApplications}</p>
              </div>
              <FaCheckCircle className="text-green-600 text-2xl" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Rejected</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{statistics.rejectedApplications}</p>
              </div>
              <FaTimesCircle className="text-red-600 text-2xl" />
            </div>
          </div>
        </div>

        {/* Mortgage Products */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Mortgage Products</h2>
          
          {bank.mortgageProducts && bank.mortgageProducts.length > 0 ? (
            <div className="space-y-4">
              {bank.mortgageProducts.filter(p => p.isActive).map((product, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{product.name}</h3>
                      {product.description && (
                        <p className="text-sm text-gray-600 mt-1">{product.description}</p>
                      )}
                      <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Loan Range:</span>
                          <p className="font-medium">₦{product.minLoanAmount?.toLocaleString()} - ₦{product.maxLoanAmount?.toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Down Payment:</span>
                          <p className="font-medium">{product.minDownPaymentPercent}%</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Term:</span>
                          <p className="font-medium">{product.maxLoanTerm} years</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Interest Rate:</span>
                          <p className="font-medium">{product.interestRate}% ({product.interestRateType})</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FaFileAlt className="text-4xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No mortgage products yet. Add your first product to get started.</p>
            </div>
          )}
        </div>

        {/* Applications Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Applications</h2>
          {applications.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              <p>No mortgage applications yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.slice(0, 5).map((app) => (
                <div key={app._id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {app.property?.title || 'Property'} - ₦{app.requestedAmount.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      Applicant: {app.buyer?.firstName} {app.buyer?.lastName} ({app.buyer?.email})
                    </p>
                    <p className="text-xs text-gray-500">
                      Status: <span className="font-medium capitalize">{app.status.replace('_', ' ')}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Add Mortgage Product</h2>
            <form onSubmit={handleAddProduct}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Standard 20-Year Fixed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows="3"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Min Loan Amount (₦) *</label>
                    <input
                      type="number"
                      required
                      value={newProduct.minLoanAmount}
                      onChange={(e) => setNewProduct({ ...newProduct, minLoanAmount: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Loan Amount (₦) *</label>
                    <input
                      type="number"
                      required
                      value={newProduct.maxLoanAmount}
                      onChange={(e) => setNewProduct({ ...newProduct, maxLoanAmount: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Down Payment % *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      max="100"
                      value={newProduct.minDownPaymentPercent}
                      onChange={(e) => setNewProduct({ ...newProduct, minDownPaymentPercent: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Loan Term (years) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="30"
                      value={newProduct.maxLoanTerm}
                      onChange={(e) => setNewProduct({ ...newProduct, maxLoanTerm: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Interest Rate (%) *</label>
                    <input
                      type="number"
                      required
                      step="0.1"
                      value={newProduct.interestRate}
                      onChange={(e) => setNewProduct({ ...newProduct, interestRate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rate Type *</label>
                    <select
                      value={newProduct.interestRateType}
                      onChange={(e) => setNewProduct({ ...newProduct, interestRateType: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="fixed">Fixed</option>
                      <option value="variable">Variable</option>
                      <option value="adjustable">Adjustable</option>
                    </select>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-medium text-gray-900 mb-3">Eligibility Criteria (Optional)</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Min Monthly Income (₦)</label>
                      <input
                        type="number"
                        value={newProduct.eligibilityCriteria.minMonthlyIncome}
                        onChange={(e) => setNewProduct({
                          ...newProduct,
                          eligibilityCriteria: {
                            ...newProduct.eligibilityCriteria,
                            minMonthlyIncome: e.target.value
                          }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Min Credit Score</label>
                      <input
                        type="number"
                        min="0"
                        max="1000"
                        value={newProduct.eligibilityCriteria.minCreditScore}
                        onChange={(e) => setNewProduct({
                          ...newProduct,
                          eligibilityCriteria: {
                            ...newProduct.eligibilityCriteria,
                            minCreditScore: e.target.value
                          }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Employment Duration (months)</label>
                      <input
                        type="number"
                        value={newProduct.eligibilityCriteria.employmentDuration}
                        onChange={(e) => setNewProduct({
                          ...newProduct,
                          eligibilityCriteria: {
                            ...newProduct.eligibilityCriteria,
                            employmentDuration: e.target.value
                          }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6 space-x-3">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MortgageBankDashboard;


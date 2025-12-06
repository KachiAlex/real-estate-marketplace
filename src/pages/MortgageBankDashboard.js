import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaBuilding, FaFileAlt, FaChartLine, FaUsers, FaCheckCircle, FaTimesCircle, FaClock, FaPlus, FaEye, FaDownload, FaTimes } from 'react-icons/fa';
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
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [previewDocument, setPreviewDocument] = useState(null);
  const [reviewDecision, setReviewDecision] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewConditions, setReviewConditions] = useState(['']);
  const [reviewLoanTerms, setReviewLoanTerms] = useState({
    approvedAmount: '',
    interestRate: '',
    loanTermYears: '',
    monthlyPayment: ''
  });
  const [isReviewing, setIsReviewing] = useState(false);
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

  // Add condition input
  const addCondition = () => {
    setReviewConditions([...reviewConditions, '']);
  };

  // Remove condition input
  const removeCondition = (index) => {
    setReviewConditions(reviewConditions.filter((_, i) => i !== index));
  };

  // Update condition value
  const updateCondition = (index, value) => {
    const updated = [...reviewConditions];
    updated[index] = value;
    setReviewConditions(updated);
  };

  // Reset review form
  const resetReviewForm = () => {
    setReviewDecision('');
    setReviewNotes('');
    setReviewConditions(['']);
    setReviewLoanTerms({
      approvedAmount: '',
      interestRate: '',
      loanTermYears: '',
      monthlyPayment: ''
    });
  };

  // Handle application review submission
  const handleReviewApplication = async () => {
    if (!selectedApplication || !reviewDecision) {
      toast.error('Please select a decision');
      return;
    }

    if (reviewDecision === 'approved' && (!reviewLoanTerms.approvedAmount || !reviewLoanTerms.interestRate || !reviewLoanTerms.loanTermYears)) {
      toast.error('Please fill in all loan terms for approval');
      return;
    }

    setIsReviewing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_BASE_URL}/api/mortgages/${selectedApplication._id}/review`,
        {
          decision: reviewDecision,
          notes: reviewNotes.trim() || undefined,
          conditions: reviewConditions.filter(c => c.trim()).length > 0 ? reviewConditions.filter(c => c.trim()) : undefined,
          loanTerms: reviewDecision === 'approved' ? {
            approvedAmount: parseFloat(reviewLoanTerms.approvedAmount),
            interestRate: parseFloat(reviewLoanTerms.interestRate),
            loanTermYears: parseFloat(reviewLoanTerms.loanTermYears),
            monthlyPayment: reviewLoanTerms.monthlyPayment ? parseFloat(reviewLoanTerms.monthlyPayment) : undefined
          } : undefined
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        toast.success(`Application ${reviewDecision} successfully!`);
        resetReviewForm();
        // Reload applications
        await loadApplications(bank);
        // Close modal after a short delay
        setTimeout(() => {
          setShowApplicationModal(false);
          setSelectedApplication(null);
        }, 1500);
      }
    } catch (error) {
      console.error('Error reviewing application:', error);
      toast.error(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setIsReviewing(false);
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
                <div 
                  key={app._id} 
                  className="border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    setSelectedApplication(app);
                    setShowApplicationModal(true);
                  }}
                >
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">
                      {app.property?.title || 'Property'} - ₦{app.requestedAmount.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      Applicant: {app.buyer?.firstName} {app.buyer?.lastName} ({app.buyer?.email})
                    </p>
                    <p className="text-xs text-gray-500">
                      Status: <span className="font-medium capitalize">{app.status.replace('_', ' ')}</span>
                      {app.documents && app.documents.length > 0 && (
                        <span className="ml-2 text-blue-600">
                          • {app.documents.length} document{app.documents.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedApplication(app);
                      setShowApplicationModal(true);
                    }}
                    className="ml-4 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    View Details
                  </button>
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

      {/* Application Details Modal */}
      {showApplicationModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Application Details</h2>
              <button
                onClick={() => {
                  setShowApplicationModal(false);
                  setSelectedApplication(null);
                  setPreviewDocument(null);
                  resetReviewForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Application Overview */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Application Overview</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Application ID</p>
                    <p className="font-medium">{selectedApplication._id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <span className={`inline-block px-2 py-1 rounded text-sm font-medium ${getStatusBadge(selectedApplication.status)}`}>
                      {selectedApplication.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Property</p>
                    <p className="font-medium">{selectedApplication.property?.title || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Loan Amount</p>
                    <p className="font-medium">₦{selectedApplication.requestedAmount?.toLocaleString() || '0'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Down Payment</p>
                    <p className="font-medium">₦{selectedApplication.downPayment?.toLocaleString() || '0'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Interest Rate</p>
                    <p className="font-medium">{selectedApplication.interestRate || '0'}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Loan Term</p>
                    <p className="font-medium">{selectedApplication.loanTermYears || '0'} years</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Monthly Payment</p>
                    <p className="font-medium">₦{selectedApplication.estimatedMonthlyPayment?.toLocaleString() || '0'}</p>
                  </div>
                </div>
              </div>

              {/* Applicant Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Applicant Information</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-medium">{selectedApplication.buyer?.firstName || ''} {selectedApplication.buyer?.lastName || ''}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium">{selectedApplication.buyer?.email || 'N/A'}</p>
                    </div>
                    {selectedApplication.employmentDetails && (
                      <>
                        <div>
                          <p className="text-sm text-gray-600">Employment Type</p>
                          <p className="font-medium capitalize">{selectedApplication.employmentDetails.type || 'N/A'}</p>
                        </div>
                        {selectedApplication.employmentDetails.monthlyIncome && (
                          <div>
                            <p className="text-sm text-gray-600">Monthly Income</p>
                            <p className="font-medium">₦{selectedApplication.employmentDetails.monthlyIncome.toLocaleString()}</p>
                          </div>
                        )}
                        {selectedApplication.employmentDetails.employerName && (
                          <div>
                            <p className="text-sm text-gray-600">Employer</p>
                            <p className="font-medium">{selectedApplication.employmentDetails.employerName}</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Documents Section */}
              {selectedApplication.documents && selectedApplication.documents.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Documents ({selectedApplication.documents.length})</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedApplication.documents.map((doc, index) => {
                      const isImage = doc.url && (doc.url.match(/\.(jpg|jpeg|png|gif|webp)$/i) || doc.type?.toLowerCase().includes('image'));
                      const isPDF = doc.url && (doc.url.match(/\.pdf$/i) || doc.type?.toLowerCase().includes('pdf'));
                      
                      return (
                        <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">{doc.name || `Document ${index + 1}`}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {doc.type && <span className="capitalize">{doc.type.replace('_', ' ')}</span>}
                                {doc.uploadedAt && (
                                  <span className="ml-2">
                                    • {new Date(doc.uploadedAt).toLocaleDateString()}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                          
                          {/* Preview for images */}
                          {isImage && doc.url && (
                            <div className="mb-3">
                              <img
                                src={doc.url}
                                alt={doc.name || 'Document'}
                                className="w-full h-32 object-cover rounded border border-gray-200 cursor-pointer hover:opacity-90"
                                onClick={() => setPreviewDocument(doc)}
                              />
                            </div>
                          )}

                          {/* PDF preview indicator */}
                          {isPDF && doc.url && (
                            <div className="mb-3 bg-gray-100 rounded p-4 text-center">
                              <FaFileAlt className="text-4xl text-red-500 mx-auto mb-2" />
                              <p className="text-sm text-gray-600">PDF Document</p>
                            </div>
                          )}

                          {/* Action buttons */}
                          <div className="flex gap-2">
                            {(isImage || isPDF) && (
                              <button
                                onClick={() => setPreviewDocument(doc)}
                                className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center justify-center gap-2"
                              >
                                <FaEye />
                                Preview
                              </button>
                            )}
                            <a
                              href={doc.url}
                              download={doc.name || 'document'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm flex items-center justify-center gap-2"
                            >
                              <FaDownload />
                              Download
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {(!selectedApplication.documents || selectedApplication.documents.length === 0) && (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <FaFileAlt className="text-4xl text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-600">No documents uploaded for this application</p>
                </div>
              )}

              {/* Bank Review Section - Only show for pending/under_review/needs_more_info */}
              {(selectedApplication.status === 'pending' || 
                selectedApplication.status === 'under_review' || 
                selectedApplication.status === 'needs_more_info') && (
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Application</h3>
                  
                  {/* Decision Selection */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Decision <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setReviewDecision('approved');
                          // Pre-fill loan terms from application
                          if (selectedApplication.requestedAmount && !reviewLoanTerms.approvedAmount) {
                            setReviewLoanTerms({
                              approvedAmount: selectedApplication.requestedAmount.toString(),
                              interestRate: selectedApplication.interestRate?.toString() || '',
                              loanTermYears: selectedApplication.loanTermYears?.toString() || '',
                              monthlyPayment: selectedApplication.estimatedMonthlyPayment?.toString() || ''
                            });
                          }
                        }}
                        className={`px-4 py-3 rounded-lg border-2 transition-colors ${
                          reviewDecision === 'approved'
                            ? 'border-green-600 bg-green-50 text-green-700'
                            : 'border-gray-300 hover:border-green-400 text-gray-700'
                        }`}
                      >
                        <FaCheckCircle className="mx-auto mb-1" />
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => setReviewDecision('rejected')}
                        className={`px-4 py-3 rounded-lg border-2 transition-colors ${
                          reviewDecision === 'rejected'
                            ? 'border-red-600 bg-red-50 text-red-700'
                            : 'border-gray-300 hover:border-red-400 text-gray-700'
                        }`}
                      >
                        <FaTimesCircle className="mx-auto mb-1" />
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => setReviewDecision('needs_more_info')}
                        className={`px-4 py-3 rounded-lg border-2 transition-colors ${
                          reviewDecision === 'needs_more_info'
                            ? 'border-yellow-600 bg-yellow-50 text-yellow-700'
                            : 'border-gray-300 hover:border-yellow-400 text-gray-700'
                        }`}
                      >
                        <FaClock className="mx-auto mb-1" />
                        Request Info
                      </button>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Review Notes
                    </label>
                    <textarea
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your review notes, feedback, or additional comments..."
                    />
                  </div>

                  {/* Conditions - Show for approved or needs_more_info */}
                  {(reviewDecision === 'approved' || reviewDecision === 'needs_more_info') && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Conditions {reviewDecision === 'approved' ? '(Optional)' : '(Required)'}
                      </label>
                      <div className="space-y-2">
                        {reviewConditions.map((condition, index) => (
                          <div key={index} className="flex gap-2">
                            <input
                              type="text"
                              value={condition}
                              onChange={(e) => updateCondition(index, e.target.value)}
                              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder={`Condition ${index + 1} (e.g., Provide property insurance, Complete credit check...)`}
                            />
                            {reviewConditions.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeCondition(index)}
                                className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                              >
                                <FaTimes />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={addCondition}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          + Add Another Condition
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Loan Terms - Only for approved */}
                  {reviewDecision === 'approved' && (
                    <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-green-900 mb-3">Approved Loan Terms</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Approved Amount <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            value={reviewLoanTerms.approvedAmount}
                            onChange={(e) => setReviewLoanTerms({ ...reviewLoanTerms, approvedAmount: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            placeholder="Amount in NGN"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Interest Rate (%) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={reviewLoanTerms.interestRate}
                            onChange={(e) => setReviewLoanTerms({ ...reviewLoanTerms, interestRate: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            placeholder="e.g., 18.5"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Loan Term (Years) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            value={reviewLoanTerms.loanTermYears}
                            onChange={(e) => setReviewLoanTerms({ ...reviewLoanTerms, loanTermYears: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            placeholder="e.g., 25"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Monthly Payment (Optional)
                          </label>
                          <input
                            type="number"
                            value={reviewLoanTerms.monthlyPayment}
                            onChange={(e) => setReviewLoanTerms({ ...reviewLoanTerms, monthlyPayment: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            placeholder="Auto-calculated if empty"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Previous Review (if exists) */}
                  {selectedApplication.bankReview && (
                    <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-blue-900 mb-2">Previous Review</h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium">Decision:</span>{' '}
                          <span className="capitalize">{selectedApplication.bankReview.decision || 'N/A'}</span>
                        </div>
                        {selectedApplication.bankReview.notes && (
                          <div>
                            <span className="font-medium">Notes:</span>{' '}
                            <span>{selectedApplication.bankReview.notes}</span>
                          </div>
                        )}
                        {selectedApplication.bankReview.conditions && selectedApplication.bankReview.conditions.length > 0 && (
                          <div>
                            <span className="font-medium">Conditions:</span>
                            <ul className="list-disc list-inside mt-1 ml-2">
                              {selectedApplication.bankReview.conditions.map((cond, idx) => (
                                <li key={idx}>{cond}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {selectedApplication.bankReview.reviewedAt && (
                          <div>
                            <span className="font-medium">Reviewed At:</span>{' '}
                            <span>{new Date(selectedApplication.bankReview.reviewedAt).toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Submit Review Button */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => {
                        resetReviewForm();
                      }}
                      className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                      disabled={isReviewing}
                    >
                      Reset
                    </button>
                    <button
                      type="button"
                      onClick={handleReviewApplication}
                      disabled={isReviewing || !reviewDecision}
                      className={`px-6 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                        reviewDecision === 'approved'
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : reviewDecision === 'rejected'
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : reviewDecision === 'needs_more_info'
                          ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                          : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      }`}
                    >
                      {isReviewing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          {reviewDecision === 'approved' && <FaCheckCircle />}
                          {reviewDecision === 'rejected' && <FaTimesCircle />}
                          {reviewDecision === 'needs_more_info' && <FaClock />}
                          <span>Submit Review</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {previewDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-[60]">
          <div className="relative max-w-6xl w-full max-h-full">
            <button
              onClick={() => setPreviewDocument(null)}
              className="absolute top-4 right-4 p-2 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-all z-10"
            >
              <FaTimes className="text-gray-700 text-xl" />
            </button>
            
            {previewDocument.url && (
              <>
                {previewDocument.url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                  <img
                    src={previewDocument.url}
                    alt={previewDocument.name || 'Preview'}
                    className="max-w-full max-h-[90vh] object-contain mx-auto rounded-lg"
                  />
                ) : previewDocument.url.match(/\.pdf$/i) ? (
                  <iframe
                    src={previewDocument.url}
                    className="w-full h-[90vh] border-0 rounded-lg bg-white"
                    title={previewDocument.name || 'PDF Preview'}
                  />
                ) : (
                  <div className="bg-white rounded-lg p-8 max-w-md mx-auto">
                    <FaFileAlt className="text-gray-400 text-6xl mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 text-center mb-2">{previewDocument.name || 'Document'}</h3>
                    <p className="text-sm text-gray-500 text-center mb-4">
                      Preview not available for this file type
                    </p>
                    <a
                      href={previewDocument.url}
                      download={previewDocument.name}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <FaDownload className="inline mr-2" />
                      Download File
                    </a>
                  </div>
                )}
              </>
            )}
            
            {previewDocument.name && (
              <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-50 text-white p-3 rounded-lg text-center">
                <p className="text-sm font-medium">{previewDocument.name}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MortgageBankDashboard;


import React, { useState, useEffect } from 'react';
import { useInvestment } from '../contexts/InvestmentContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  FaChartLine, 
  FaDollarSign, 
  FaUsers, 
  FaFileContract, 
  FaUpload, 
  FaCheck, 
  FaClock, 
  FaExclamationTriangle,
  FaBuilding,
  FaPercent,
  FaCalendarAlt,
  FaEye,
  FaEdit,
  FaTrash
} from 'react-icons/fa';

const InvestmentCompanyDashboard = () => {
  const { user } = useAuth();
  const { 
    investments, 
    loading, 
    isInvestmentCompany, 
    createInvestment, 
    updateInvestmentStatus,
    uploadPropertyDeed 
  } = useInvestment();
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState(null);
  const [stats, setStats] = useState({
    totalInvestments: 0,
    totalRaised: 0,
    activeInvestors: 0,
    pendingApprovals: 0
  });

  useEffect(() => {
    if (investments.length > 0) {
      const companyInvestments = investments.filter(inv => inv.companyId === user?.uid);
      const totalRaised = companyInvestments.reduce((sum, inv) => sum + (inv.totalRaised || 0), 0);
      const activeInvestors = companyInvestments.reduce((sum, inv) => sum + (inv.investors?.length || 0), 0);
      const pendingApprovals = companyInvestments.filter(inv => inv.status === 'pending_approval').length;

      setStats({
        totalInvestments: companyInvestments.length,
        totalRaised,
        activeInvestors,
        pendingApprovals
      });
    }
  }, [investments, user]);

  const handleCreateInvestment = async (investmentData) => {
    const result = await createInvestment(investmentData);
    if (result.success) {
      setShowCreateForm(false);
      // Show success message
    }
  };

  const handleUploadDeed = async (investmentId, deedFile) => {
    const result = await uploadPropertyDeed(investmentId, {
      fileName: deedFile.name,
      fileSize: deedFile.size,
      fileType: deedFile.type
    });
    
    if (result.success) {
      // Show success message
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending_approval': return 'bg-yellow-100 text-yellow-800';
      case 'funding': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'defaulted': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <FaCheck className="text-green-500" />;
      case 'pending_approval': return <FaClock className="text-yellow-500" />;
      case 'funding': return <FaDollarSign className="text-blue-500" />;
      case 'completed': return <FaCheck className="text-gray-500" />;
      case 'defaulted': return <FaExclamationTriangle className="text-red-500" />;
      default: return <FaClock className="text-gray-500" />;
    }
  };

  if (!isInvestmentCompany) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <FaBuilding className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Investment Company Access Required</h2>
          <p className="text-gray-600">You need investment company privileges to access this dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Investment Company Dashboard</h1>
        <p className="text-gray-600">Manage your investment opportunities and track performance</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FaChartLine className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Investments</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalInvestments}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <FaDollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Raised</p>
              <p className="text-2xl font-bold text-gray-900">₦{stats.totalRaised.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <FaUsers className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Investors</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeInvestors}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <FaClock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingApprovals}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mb-8">
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <FaChartLine className="mr-2" />
          Create New Investment Opportunity
        </button>
      </div>

      {/* Investments Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Investment Opportunities</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Investment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Target Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Raised
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ROI
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {investments
                .filter(inv => inv.companyId === user?.uid)
                .map((investment) => (
                <tr key={investment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {investment.title}
                      </div>
                      <div className="text-sm text-gray-500">
                        {investment.propertyLocation}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₦{investment.targetAmount?.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₦{investment.totalRaised?.toLocaleString() || '0'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {investment.expectedROI}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(investment.status)}`}>
                      {getStatusIcon(investment.status)}
                      <span className="ml-1">{investment.status.replace('_', ' ')}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedInvestment(investment)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <FaEye />
                      </button>
                      <button
                        className="text-gray-600 hover:text-gray-900"
                        title="Edit"
                      >
                        <FaEdit />
                      </button>
                      {investment.status === 'active' && (
                        <button
                          onClick={() => handleUploadDeed(investment.id, null)}
                          className="text-green-600 hover:text-green-900"
                          title="Upload Property Deed"
                        >
                          <FaUpload />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Investment Modal */}
      {showCreateForm && (
        <CreateInvestmentModal
          onClose={() => setShowCreateForm(false)}
          onSubmit={handleCreateInvestment}
        />
      )}

      {/* Investment Details Modal */}
      {selectedInvestment && (
        <InvestmentDetailsModal
          investment={selectedInvestment}
          onClose={() => setSelectedInvestment(null)}
          onUploadDeed={handleUploadDeed}
        />
      )}
    </div>
  );
};

// Create Investment Modal Component
const CreateInvestmentModal = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetAmount: '',
    minimumInvestment: '',
    expectedROI: '',
    investmentDuration: '',
    propertyLocation: '',
    propertyValue: '',
    propertyType: '',
    riskLevel: 'medium',
    terms: '',
    collateralDetails: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      targetAmount: parseFloat(formData.targetAmount),
      minimumInvestment: parseFloat(formData.minimumInvestment),
      expectedROI: parseFloat(formData.expectedROI),
      investmentDuration: parseInt(formData.investmentDuration),
      propertyValue: parseFloat(formData.propertyValue)
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Create Investment Opportunity</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FaTrash />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Investment Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Amount (₦)</label>
              <input
                type="number"
                value={formData.targetAmount}
                onChange={(e) => setFormData({...formData, targetAmount: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Investment (₦)</label>
              <input
                type="number"
                value={formData.minimumInvestment}
                onChange={(e) => setFormData({...formData, minimumInvestment: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expected ROI (%)</label>
              <input
                type="number"
                step="0.1"
                value={formData.expectedROI}
                onChange={(e) => setFormData({...formData, expectedROI: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Investment Duration (months)</label>
              <input
                type="number"
                value={formData.investmentDuration}
                onChange={(e) => setFormData({...formData, investmentDuration: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Property Location</label>
              <input
                type="text"
                value={formData.propertyLocation}
                onChange={(e) => setFormData({...formData, propertyLocation: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Property Value (₦)</label>
              <input
                type="number"
                value={formData.propertyValue}
                onChange={(e) => setFormData({...formData, propertyValue: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
              <select
                value={formData.propertyType}
                onChange={(e) => setFormData({...formData, propertyType: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select Property Type</option>
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="industrial">Industrial</option>
                <option value="land">Land</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Collateral Details</label>
            <textarea
              value={formData.collateralDetails}
              onChange={(e) => setFormData({...formData, collateralDetails: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe the property collateral and its details..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Terms & Conditions</label>
            <textarea
              value={formData.terms}
              onChange={(e) => setFormData({...formData, terms: e.target.value})}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Investment terms, conditions, and agreements..."
              required
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Investment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Investment Details Modal Component
const InvestmentDetailsModal = ({ investment, onClose, onUploadDeed }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Investment Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FaTrash />
          </button>
        </div>

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
                <p className="text-gray-900">{investment.propertyType}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Collateral Details:</span>
                <p className="text-gray-900">{investment.collateralDetails}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Investment Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total Raised</p>
              <p className="text-2xl font-bold text-gray-900">₦{investment.totalRaised?.toLocaleString() || '0'}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Investors</p>
              <p className="text-2xl font-bold text-gray-900">{investment.investors?.length || 0}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Progress</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(((investment.totalRaised || 0) / investment.targetAmount) * 100)}%
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Close
          </button>
          {investment.status === 'active' && (
            <button
              onClick={() => onUploadDeed(investment.id, null)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Upload Property Deed
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvestmentCompanyDashboard;

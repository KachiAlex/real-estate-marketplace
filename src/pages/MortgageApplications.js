import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useMortgage } from '../contexts/MortgageContext';
import { 
  FaFileAlt, 
  FaClock, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaInfoCircle,
  FaEye,
  FaFilter,
  FaHome,
  FaBuilding
} from 'react-icons/fa';
import toast from 'react-hot-toast';

const MortgageApplications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { 
    getUserApplications, 
    getApplicationsByStatus, 
    refreshApplications,
    applicationsLoading 
  } = useMortgage();
  
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    loadApplications();
  }, [user, selectedStatus]);

  const loadApplications = async () => {
    await refreshApplications();
    const allApplications = getUserApplications();
    
    if (selectedStatus === 'all') {
      setApplications(allApplications);
    } else {
      setApplications(getApplicationsByStatus(selectedStatus));
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { 
        variant: 'bg-yellow-100 text-yellow-800', 
        icon: FaClock, 
        text: 'Pending' 
      },
      under_review: { 
        variant: 'bg-blue-100 text-blue-800', 
        icon: FaInfoCircle, 
        text: 'Under Review' 
      },
      approved: { 
        variant: 'bg-green-100 text-green-800', 
        icon: FaCheckCircle, 
        text: 'Approved' 
      },
      rejected: { 
        variant: 'bg-red-100 text-red-800', 
        icon: FaTimesCircle, 
        text: 'Rejected' 
      },
      needs_more_info: { 
        variant: 'bg-orange-100 text-orange-800', 
        icon: FaInfoCircle, 
        text: 'Needs More Info' 
      },
      withdrawn: { 
        variant: 'bg-gray-100 text-gray-800', 
        icon: FaFileAlt, 
        text: 'Withdrawn' 
      },
      prequalification_requested: { 
        variant: 'bg-purple-100 text-purple-800', 
        icon: FaInfoCircle, 
        text: 'Prequalification Requested' 
      }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.variant}`}>
        <Icon className="mr-1" />
        {config.text}
      </span>
    );
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

  const handleViewDetails = (applicationId) => {
    navigate(`/mortgages/applications/${applicationId}`);
  };

  if (!user) {
    return null;
  }

  const statusCounts = {
    all: getUserApplications().length,
    pending: getApplicationsByStatus('pending').length,
    under_review: getApplicationsByStatus('under_review').length,
    approved: getApplicationsByStatus('approved').length,
    rejected: getApplicationsByStatus('rejected').length,
    needs_more_info: getApplicationsByStatus('needs_more_info').length,
    prequalification_requested: getApplicationsByStatus('prequalification_requested').length
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Mortgage Applications</h1>
              <p className="mt-2 text-gray-600">
                Track the status of your mortgage applications and prequalification requests
              </p>
            </div>
            <button
              onClick={() => navigate('/mortgage')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <FaFileAlt />
              <span>New Application</span>
            </button>
          </div>
        </div>

        {/* Status Filters */}
        <div className="mb-6 bg-white rounded-lg shadow p-4">
          <div className="flex items-center space-x-2 mb-4">
            <FaFilter className="text-gray-500" />
            <h3 className="text-sm font-medium text-gray-700">Filter by Status</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'All' },
              { key: 'pending', label: 'Pending' },
              { key: 'under_review', label: 'Under Review' },
              { key: 'approved', label: 'Approved' },
              { key: 'rejected', label: 'Rejected' },
              { key: 'needs_more_info', label: 'Needs Info' },
              { key: 'prequalification_requested', label: 'Prequalification' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setSelectedStatus(key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedStatus === key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {label} ({statusCounts[key] || 0})
              </button>
            ))}
          </div>
        </div>

        {/* Applications List */}
        {applicationsLoading ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading applications...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <FaFileAlt className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No applications found</h3>
            <p className="mt-2 text-gray-600">
              {selectedStatus === 'all' 
                ? "You haven't submitted any mortgage applications yet."
                : `No applications with status "${selectedStatus}" found.`
              }
            </p>
            <button
              onClick={() => navigate('/mortgage')}
              className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Apply for Mortgage
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((application) => (
              <div
                key={application._id || application.id}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      {application.property ? (
                        <>
                          <FaBuilding className="text-blue-600" />
                          <h3 className="text-lg font-semibold text-gray-900">
                            {application.property?.title || 'Property Mortgage'}
                          </h3>
                        </>
                      ) : (
                        <>
                          <FaHome className="text-purple-600" />
                          <h3 className="text-lg font-semibold text-gray-900">
                            Pre-qualification Request
                          </h3>
                        </>
                      )}
                      {getStatusBadge(application.status)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Requested Amount</p>
                        <p className="text-lg font-semibold text-gray-900">
                          ₦{application.requestedAmount?.toLocaleString() || '0'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Down Payment</p>
                        <p className="text-lg font-semibold text-gray-900">
                          ₦{application.downPayment?.toLocaleString() || '0'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Monthly Payment</p>
                        <p className="text-lg font-semibold text-gray-900">
                          ₦{application.estimatedMonthlyPayment?.toLocaleString() || 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Loan Term</p>
                        <p className="text-sm font-medium text-gray-700">
                          {application.loanTermYears} years
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Interest Rate</p>
                        <p className="text-sm font-medium text-gray-700">
                          {application.interestRate}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Mortgage Bank</p>
                        <p className="text-sm font-medium text-gray-700">
                          {application.mortgageBank?.name || 'N/A'}
                        </p>
                      </div>
                    </div>

                    {application.property && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-500">Property Location</p>
                        <p className="text-sm font-medium text-gray-700">
                          {application.property?.location || 'N/A'}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Submitted: {formatDate(application.createdAt)}</span>
                      {application.updatedAt && application.updatedAt !== application.createdAt && (
                        <span>Updated: {formatDate(application.updatedAt)}</span>
                      )}
                    </div>

                    {application.bankReview?.notes && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm font-medium text-blue-900 mb-1">Bank Review Notes:</p>
                        <p className="text-sm text-blue-800">{application.bankReview.notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="ml-4">
                    <button
                      onClick={() => handleViewDetails(application._id || application.id)}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <FaEye />
                      <span>View Details</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MortgageApplications;


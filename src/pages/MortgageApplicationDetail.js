import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useMortgage } from '../contexts/MortgageContext';
import { 
  FaArrowLeft,
  FaFileAlt, 
  FaClock, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaInfoCircle,
  FaBuilding,
  FaHome,
  FaDollarSign,
  FaCalendar,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaDownload
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import axios from 'axios';
import { getApiUrl } from '../utils/apiConfig';

const MortgageApplicationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getApplicationById, refreshApplications } = useMortgage();
  
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    loadApplication();
  }, [id, user]);

  const loadApplication = async () => {
    try {
      setLoading(true);
      setError(null);

      // First try to get from context
      let app = getApplicationById(id);
      
      // If not in context, fetch from API
      if (!app) {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication required');
        }

        const response = await axios.get(getApiUrl(`/mortgages/${id}`), {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (response.data && response.data.success) {
          app = response.data.data;
        } else {
          throw new Error('Application not found');
        }
      }

      setApplication(app);
    } catch (err) {
      console.error('Error loading application:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load application');
      toast.error('Failed to load application details');
    } finally {
      setLoading(false);
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
      <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${config.variant}`}>
        <Icon className="mr-2" />
        {config.text}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading application details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <FaTimesCircle className="mx-auto h-12 w-12 text-red-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Application Not Found</h3>
            <p className="mt-2 text-gray-600">{error || 'The application you are looking for does not exist.'}</p>
            <button
              onClick={() => navigate('/mortgages/applications')}
              className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Applications
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/mortgages/applications')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <FaArrowLeft className="mr-2" />
            Back to Applications
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Application Details</h1>
              <p className="mt-2 text-gray-600">
                Application ID: {application._id || application.id}
              </p>
            </div>
            {getStatusBadge(application.status)}
          </div>
        </div>

        <div className="space-y-6">
          {/* Application Overview */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Application Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">Requested Amount</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₦{application.requestedAmount?.toLocaleString() || '0'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Down Payment</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₦{application.downPayment?.toLocaleString() || '0'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Estimated Monthly Payment</p>
                <p className="text-xl font-semibold text-gray-900">
                  ₦{application.estimatedMonthlyPayment?.toLocaleString() || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Loan Term</p>
                <p className="text-xl font-semibold text-gray-900">
                  {application.loanTermYears} years
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Interest Rate</p>
                <p className="text-xl font-semibold text-gray-900">
                  {application.interestRate}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Mortgage Bank</p>
                <p className="text-xl font-semibold text-gray-900">
                  {application.mortgageBank?.name || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Property Information */}
          {application.property && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-4">
                <FaBuilding className="text-blue-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">Property Information</h2>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Property Title</p>
                  <p className="text-lg font-medium text-gray-900">
                    {application.property?.title || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="text-lg font-medium text-gray-900">
                    {application.property?.location || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Property Price</p>
                  <p className="text-lg font-medium text-gray-900">
                    ₦{application.property?.price?.toLocaleString() || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Employment Details */}
          {application.employmentDetails && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-4">
                <FaUser className="text-blue-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">Employment Details</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Employment Type</p>
                  <p className="text-lg font-medium text-gray-900">
                    {application.employmentDetails.type?.replace('_', ' ').toUpperCase() || 'N/A'}
                  </p>
                </div>
                {application.employmentDetails.type === 'employed' ? (
                  <>
                    <div>
                      <p className="text-sm text-gray-500">Employer Name</p>
                      <p className="text-lg font-medium text-gray-900">
                        {application.employmentDetails.employerName || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Job Title</p>
                      <p className="text-lg font-medium text-gray-900">
                        {application.employmentDetails.jobTitle || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Years of Employment</p>
                      <p className="text-lg font-medium text-gray-900">
                        {application.employmentDetails.yearsOfEmployment || 'N/A'}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-sm text-gray-500">Business Name</p>
                      <p className="text-lg font-medium text-gray-900">
                        {application.employmentDetails.businessName || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Business Type</p>
                      <p className="text-lg font-medium text-gray-900">
                        {application.employmentDetails.businessType || 'N/A'}
                      </p>
                    </div>
                  </>
                )}
                <div>
                  <p className="text-sm text-gray-500">Monthly Income</p>
                  <p className="text-lg font-medium text-gray-900">
                    ₦{application.employmentDetails.monthlyIncome?.toLocaleString() || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Bank Review */}
          {application.bankReview && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-4">
                <FaInfoCircle className="text-blue-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">Bank Review</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Decision</p>
                  <p className="text-lg font-medium text-gray-900 capitalize">
                    {application.bankReview.decision || 'N/A'}
                  </p>
                </div>
                {application.bankReview.notes && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Review Notes</p>
                    <p className="text-lg text-gray-900 bg-gray-50 p-4 rounded-lg">
                      {application.bankReview.notes}
                    </p>
                  </div>
                )}
                {application.bankReview.conditions && application.bankReview.conditions.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Conditions</p>
                    <ul className="list-disc list-inside space-y-1">
                      {application.bankReview.conditions.map((condition, index) => (
                        <li key={index} className="text-gray-900">{condition}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {application.bankReview.loanTerms && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-blue-900 mb-2">Approved Loan Terms</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-blue-700">Approved Amount</p>
                        <p className="font-semibold text-blue-900">
                          ₦{application.bankReview.loanTerms.approvedAmount?.toLocaleString() || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-blue-700">Interest Rate</p>
                        <p className="font-semibold text-blue-900">
                          {application.bankReview.loanTerms.interestRate || 'N/A'}%
                        </p>
                      </div>
                      <div>
                        <p className="text-blue-700">Loan Term</p>
                        <p className="font-semibold text-blue-900">
                          {application.bankReview.loanTerms.loanTermYears || 'N/A'} years
                        </p>
                      </div>
                      <div>
                        <p className="text-blue-700">Monthly Payment</p>
                        <p className="font-semibold text-blue-900">
                          ₦{application.bankReview.loanTerms.monthlyPayment?.toLocaleString() || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {application.bankReview.reviewedAt && (
                  <div>
                    <p className="text-sm text-gray-500">Reviewed At</p>
                    <p className="text-sm text-gray-900">
                      {formatDate(application.bankReview.reviewedAt)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Documents */}
          {application.documents && application.documents.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <FaFileAlt className="text-blue-600 mr-2" />
                  <h2 className="text-xl font-semibold text-gray-900">Documents</h2>
                </div>
              </div>
              <div className="space-y-2">
                {application.documents.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FaFileAlt className="text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{doc.name || `Document ${index + 1}`}</p>
                        <p className="text-xs text-gray-500">
                          {doc.type || 'Document'} • {formatDate(doc.uploadedAt)}
                        </p>
                      </div>
                    </div>
                    {doc.url && (
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <FaDownload />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <FaCalendar className="text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Application Timeline</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-full bg-green-100">
                  <FaCheckCircle className="text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Application Submitted</p>
                  <p className="text-xs text-gray-500">{formatDate(application.createdAt)}</p>
                </div>
              </div>
              {application.updatedAt && application.updatedAt !== application.createdAt && (
                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-full bg-blue-100">
                    <FaInfoCircle className="text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Last Updated</p>
                    <p className="text-xs text-gray-500">{formatDate(application.updatedAt)}</p>
                  </div>
                </div>
              )}
              {application.bankReview?.reviewedAt && (
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-full ${
                    application.bankReview.decision === 'approved' ? 'bg-green-100' :
                    application.bankReview.decision === 'rejected' ? 'bg-red-100' :
                    'bg-yellow-100'
                  }`}>
                    {application.bankReview.decision === 'approved' ? (
                      <FaCheckCircle className="text-green-600" />
                    ) : application.bankReview.decision === 'rejected' ? (
                      <FaTimesCircle className="text-red-600" />
                    ) : (
                      <FaInfoCircle className="text-yellow-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      Bank Review: {application.bankReview.decision?.toUpperCase() || 'N/A'}
                    </p>
                    <p className="text-xs text-gray-500">{formatDate(application.bankReview.reviewedAt)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MortgageApplicationDetail;


import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaFileAlt, FaPhone, FaEnvelope, FaClock, FaCheck, FaTimes, FaEye, FaDownload, FaEdit, FaHome } from 'react-icons/fa';
import toast from 'react-hot-toast';

const MortgageApplications = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mortgageApplications, setMortgageApplications] = useState([]);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Load mortgage applications from localStorage
    const allApplications = JSON.parse(localStorage.getItem('mortgageApplications') || '[]');
    const userApplications = allApplications.filter(app => app.userId === user.id);
    setMortgageApplications(userApplications);
  }, [user, navigate]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending_review': return 'bg-yellow-100 text-yellow-800';
      case 'under_review': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending_review': return <FaClock className="text-yellow-600" />;
      case 'under_review': return <FaEye className="text-blue-600" />;
      case 'approved': return <FaCheck className="text-green-600" />;
      case 'rejected': return <FaTimes className="text-red-600" />;
      case 'completed': return <FaCheck className="text-purple-600" />;
      default: return <FaClock className="text-gray-600" />;
    }
  };

  const handleViewProperty = (propertyId) => {
    navigate(`/property/${propertyId}`);
  };

  const handleViewApplication = (application) => {
    setSelectedApplication(application);
    setShowApplicationModal(true);
  };

  const handleViewDocuments = (application) => {
    setSelectedApplication(application);
    setShowDocumentsModal(true);
  };

  const handleDownloadDocument = (docType) => {
    if (!selectedApplication) return;
    
    // Generate document content
    const docContent = generateMortgageDocument(docType, selectedApplication);
    downloadDocument(docContent, `${docType}-${selectedApplication.id}.html`);
    toast.success(`${docType} downloaded successfully!`);
  };

  const generateMortgageDocument = (docType, application) => {
    const currentDate = new Date().toLocaleDateString();
    
    switch (docType) {
      case 'Application Summary':
        return `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Mortgage Application Summary</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; }
              .section { margin: 20px 0; }
              .label { font-weight: bold; }
              .value { margin-left: 10px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Mortgage Application Summary</h1>
              <p>Application ID: ${application.id}</p>
              <p>Date: ${currentDate}</p>
            </div>
            
            <div class="section">
              <h2>Property Information</h2>
              <p><span class="label">Property:</span><span class="value">${application.propertyTitle}</span></p>
              <p><span class="label">Location:</span><span class="value">${application.propertyLocation}</span></p>
              <p><span class="label">Property Price:</span><span class="value">₦${application.propertyPrice.toLocaleString()}</span></p>
            </div>
            
            <div class="section">
              <h2>Loan Details</h2>
              <p><span class="label">Requested Amount:</span><span class="value">₦${application.requestedAmount.toLocaleString()}</span></p>
              <p><span class="label">Down Payment:</span><span class="value">₦${application.downPayment.toLocaleString()}</span></p>
              <p><span class="label">Interest Rate:</span><span class="value">${application.interestRate}</span></p>
              <p><span class="label">Loan Term:</span><span class="value">${application.loanTerm}</span></p>
              <p><span class="label">Monthly Payment:</span><span class="value">₦${application.monthlyPayment.toLocaleString()}</span></p>
            </div>
            
            <div class="section">
              <h2>Applicant Information</h2>
              <p><span class="label">Name:</span><span class="value">${application.userName}</span></p>
              <p><span class="label">Email:</span><span class="value">${application.userEmail}</span></p>
            </div>
            
            <div class="section">
              <h2>Status</h2>
              <p><span class="label">Current Status:</span><span class="value">${application.status.replace('_', ' ').toUpperCase()}</span></p>
              <p><span class="label">Applied Date:</span><span class="value">${new Date(application.requestedAt).toLocaleDateString()}</span></p>
            </div>
          </body>
          </html>
        `;
      
      case 'Required Documents':
        return `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Required Documents Checklist</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; }
              .checklist { margin: 20px 0; }
              .item { margin: 10px 0; padding: 10px; border: 1px solid #ddd; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Required Documents Checklist</h1>
              <p>Mortgage Application: ${application.id}</p>
            </div>
            
            <div class="checklist">
              <h2>Please submit the following documents:</h2>
              ${application.documentsRequired.map(doc => `<div class="item">☐ ${doc}</div>`).join('')}
            </div>
            
            <p><strong>Contact Information:</strong></p>
            <p>Mortgage Specialist: ${application.agentContact.name}</p>
            <p>Phone: ${application.agentContact.phone}</p>
            <p>Email: ${application.agentContact.email}</p>
          </body>
          </html>
        `;
      
      default:
        return `<html><body><h1>Document not available</h1></body></html>`;
    }
  };

  const downloadDocument = (content, filename) => {
    const blob = new Blob([content], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mortgage Applications</h1>
        <p className="text-gray-600">
          Track and manage your mortgage applications
        </p>
      </div>

      {/* Application Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <FaClock className="text-yellow-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Review</p>
              <p className="text-2xl font-bold text-gray-900">
                {mortgageApplications.filter(app => app.status === 'pending_review').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FaEye className="text-blue-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Under Review</p>
              <p className="text-2xl font-bold text-gray-900">
                {mortgageApplications.filter(app => app.status === 'under_review').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <FaCheck className="text-green-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-gray-900">
                {mortgageApplications.filter(app => app.status === 'approved').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-gray-100 rounded-lg">
              <FaFileAlt className="text-gray-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Applications</p>
              <p className="text-2xl font-bold text-gray-900">{mortgageApplications.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Applications List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Your Mortgage Applications</h2>
        </div>

        {mortgageApplications.length === 0 ? (
          <div className="p-12 text-center">
            <FaFileAlt className="mx-auto text-4xl text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Mortgage Applications</h3>
            <p className="text-gray-600 mb-6">You haven't applied for any mortgages yet.</p>
            <button
              onClick={() => navigate('/mortgage')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Apply for Mortgage
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {mortgageApplications.map((application) => (
              <div key={application.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{application.propertyTitle}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                        {getStatusIcon(application.status)}
                        <span className="ml-1">{application.status.replace('_', ' ').toUpperCase()}</span>
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                      <div>
                        <p><strong>Property Price:</strong> ₦{application.propertyPrice.toLocaleString()}</p>
                        <p><strong>Loan Amount:</strong> ₦{application.requestedAmount.toLocaleString()}</p>
                        <p><strong>Down Payment:</strong> ₦{application.downPayment.toLocaleString()}</p>
                      </div>
                      <div>
                        <p><strong>Interest Rate:</strong> {application.interestRate}</p>
                        <p><strong>Monthly Payment:</strong> ₦{application.monthlyPayment.toLocaleString()}</p>
                        <p><strong>Applied:</strong> {new Date(application.requestedAt).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="flex items-center text-gray-600">
                      <FaHome className="mr-2" />
                      <span>{application.propertyLocation}</span>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2 ml-6">
                    <button
                      onClick={() => handleViewProperty(application.propertyId)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                    >
                      <FaEye className="mr-2" />
                      View Property
                    </button>
                    
                    <button
                      onClick={() => handleViewApplication(application)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
                    >
                      <FaFileAlt className="mr-2" />
                      View Details
                    </button>
                    
                    <button
                      onClick={() => handleViewDocuments(application)}
                      className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center"
                    >
                      <FaDownload className="mr-2" />
                      Documents
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Application Details Modal */}
      {showApplicationModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Application Details</h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Property Information</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p><strong>Property:</strong> {selectedApplication.propertyTitle}</p>
                  <p><strong>Location:</strong> {selectedApplication.propertyLocation}</p>
                  <p><strong>Property Price:</strong> ₦{selectedApplication.propertyPrice.toLocaleString()}</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Loan Details</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p><strong>Requested Amount:</strong> ₦{selectedApplication.requestedAmount.toLocaleString()}</p>
                  <p><strong>Down Payment:</strong> ₦{selectedApplication.downPayment.toLocaleString()}</p>
                  <p><strong>Interest Rate:</strong> {selectedApplication.interestRate}</p>
                  <p><strong>Loan Term:</strong> {selectedApplication.loanTerm}</p>
                  <p><strong>Monthly Payment:</strong> ₦{selectedApplication.monthlyPayment.toLocaleString()}</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Contact Information</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p><strong>Mortgage Specialist:</strong> {selectedApplication.agentContact.name}</p>
                  <p><strong>Phone:</strong> {selectedApplication.agentContact.phone}</p>
                  <p><strong>Email:</strong> {selectedApplication.agentContact.email}</p>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowApplicationModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Documents Modal */}
      {showDocumentsModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Download Documents</h3>
            
            <div className="space-y-3">
              <button
                onClick={() => handleDownloadDocument('Application Summary')}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                <FaDownload className="mr-2" />
                Application Summary
              </button>
              
              <button
                onClick={() => handleDownloadDocument('Required Documents')}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
              >
                <FaDownload className="mr-2" />
                Required Documents Checklist
              </button>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowDocumentsModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MortgageApplications;

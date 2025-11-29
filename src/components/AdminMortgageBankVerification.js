import React, { useState, useEffect } from 'react';
import { FaBuilding, FaCheckCircle, FaTimesCircle, FaClock, FaEye, FaFileAlt } from 'react-icons/fa';
import toast from 'react-hot-toast';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api-759115682573.us-central1.run.app';

const AdminMortgageBankVerification = () => {
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBank, setSelectedBank] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadBanks();
  }, [filterStatus]);

  const loadBanks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const url = filterStatus === 'all' 
        ? `${API_BASE_URL}/api/admin/mortgage-banks`
        : `${API_BASE_URL}/api/admin/mortgage-banks?status=${filterStatus}`;

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setBanks(response.data.data);
      }
    } catch (error) {
      console.error('Error loading banks:', error);
      toast.error('Failed to load mortgage banks');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (bankId, status) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_BASE_URL}/api/admin/mortgage-banks/${bankId}/verify`,
        {
          verificationStatus: status,
          verificationNotes: verificationNotes
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success(`Bank ${status === 'approved' ? 'approved' : 'rejected'} successfully`);
        setShowModal(false);
        setSelectedBank(null);
        setVerificationNotes('');
        loadBanks();
      }
    } catch (error) {
      console.error('Error verifying bank:', error);
      toast.error(error.response?.data?.message || 'Failed to verify bank');
    }
  };

  const openModal = (bank) => {
    setSelectedBank(bank);
    setVerificationNotes(bank.verificationNotes || '');
    setShowModal(true);
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Mortgage Bank Verification</h2>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <p className="text-gray-600">Review and verify mortgage bank registrations</p>
      </div>

      {/* Banks List */}
      {banks.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FaBuilding className="text-6xl text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Banks Found</h3>
          <p className="text-gray-600">No mortgage banks match the current filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {banks.map((bank) => (
            <div key={bank._id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{bank.name}</h3>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(bank.verificationStatus)}`}>
                      {bank.verificationStatus === 'pending' && <FaClock className="mr-1" />}
                      {bank.verificationStatus === 'approved' && <FaCheckCircle className="mr-1" />}
                      {bank.verificationStatus === 'rejected' && <FaTimesCircle className="mr-1" />}
                      {bank.verificationStatus.charAt(0).toUpperCase() + bank.verificationStatus.slice(1)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                    <div>
                      <p className="text-gray-600">Registration Number</p>
                      <p className="font-medium text-gray-900">{bank.registrationNumber}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Email</p>
                      <p className="font-medium text-gray-900">{bank.email}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Phone</p>
                      <p className="font-medium text-gray-900">{bank.phone}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Location</p>
                      <p className="font-medium text-gray-900">
                        {bank.address?.city}, {bank.address?.state}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-gray-600 text-sm mb-1">Contact Person</p>
                    <p className="font-medium text-gray-900">
                      {bank.contactPerson?.firstName} {bank.contactPerson?.lastName} - {bank.contactPerson?.position}
                    </p>
                    <p className="text-sm text-gray-600">{bank.contactPerson?.email} | {bank.contactPerson?.phone}</p>
                  </div>

                  {bank.documents && bank.documents.length > 0 && (
                    <div className="mt-4">
                      <p className="text-gray-600 text-sm mb-2">Documents</p>
                      <div className="flex flex-wrap gap-2">
                        {bank.documents.map((doc, index) => (
                          <a
                            key={index}
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                          >
                            <FaFileAlt className="mr-2" />
                            {doc.name}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {bank.verifiedBy && (
                    <div className="mt-4 text-sm text-gray-600">
                      <p>Verified by: {bank.verifiedBy?.firstName} {bank.verifiedBy?.lastName}</p>
                      <p>Verified at: {new Date(bank.verifiedAt).toLocaleString()}</p>
                    </div>
                  )}
                </div>

                <div className="ml-4">
                  <button
                    onClick={() => openModal(bank)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <FaEye className="mr-2" />
                    Review
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Verification Modal */}
      {showModal && selectedBank && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Review Mortgage Bank</h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Bank Information</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                  <p><span className="font-medium">Name:</span> {selectedBank.name}</p>
                  <p><span className="font-medium">Registration:</span> {selectedBank.registrationNumber}</p>
                  <p><span className="font-medium">Email:</span> {selectedBank.email}</p>
                  <p><span className="font-medium">Phone:</span> {selectedBank.phone}</p>
                  <p><span className="font-medium">Address:</span> {selectedBank.fullAddress || `${selectedBank.address?.street}, ${selectedBank.address?.city}, ${selectedBank.address?.state}`}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Contact Person</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                  <p><span className="font-medium">Name:</span> {selectedBank.contactPerson?.firstName} {selectedBank.contactPerson?.lastName}</p>
                  <p><span className="font-medium">Position:</span> {selectedBank.contactPerson?.position}</p>
                  <p><span className="font-medium">Email:</span> {selectedBank.contactPerson?.email}</p>
                  <p><span className="font-medium">Phone:</span> {selectedBank.contactPerson?.phone}</p>
                </div>
              </div>

              {selectedBank.documents && selectedBank.documents.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Documents</h3>
                  <div className="space-y-2">
                    {selectedBank.documents.map((doc, index) => (
                      <a
                        key={index}
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                      >
                        <FaFileAlt className="mr-3 text-gray-600" />
                        <div>
                          <p className="font-medium text-gray-900">{doc.name}</p>
                          <p className="text-sm text-gray-600">{doc.type}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Notes
                </label>
                <textarea
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="4"
                  placeholder="Add notes about your verification decision..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedBank(null);
                  setVerificationNotes('');
                }}
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleVerify(selectedBank._id, 'rejected')}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <FaTimesCircle className="inline mr-2" />
                Reject
              </button>
              <button
                onClick={() => handleVerify(selectedBank._id, 'approved')}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <FaCheckCircle className="inline mr-2" />
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMortgageBankVerification;


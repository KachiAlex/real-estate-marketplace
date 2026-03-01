import React, { useState, useEffect } from 'react';
import { FaCheckCircle, FaTimesCircle, FaClock, FaEye, FaTimes, FaSpinner } from 'react-icons/fa';
import toast from 'react-hot-toast';
import apiClient from '../services/apiClient';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  approved: 'bg-green-100 text-green-800 border-green-300',
  rejected: 'bg-red-100 text-red-800 border-red-300'
};

const STATUS_ICONS = {
  pending: <FaClock className="text-yellow-600" />,
  approved: <FaCheckCircle className="text-green-600" />,
  rejected: <FaTimesCircle className="text-red-600" />
};

const AdminVerificationDashboard = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewData, setReviewData] = useState({ status: '', adminNotes: '', badgeColor: '#10B981' });
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchApplications();
  }, [statusFilter]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const params = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const response = await apiClient.get(`/verification/applications${params}`);
      setApplications(response.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch verification applications:', error);
      toast.error('Failed to load verification applications');
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewClick = (app) => {
    setSelectedApp(app);
    setReviewData({
      status: app.status || 'pending',
      adminNotes: app.notes || '',
      badgeColor: app.preferredBadgeColor || '#10B981'
    });
    setReviewModalOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedApp?.id) {
      toast.error('Application ID missing');
      return;
    }

    if (!reviewData.status) {
      toast.error('Please select an approval status');
      return;
    }

    setSubmitting(true);
    try {
      const response = await apiClient.patch(
        `/verification/applications/${selectedApp.id}/status`,
        {
          status: reviewData.status,
          adminNotes: reviewData.adminNotes,
          badgeColor: reviewData.badgeColor
        }
      );

      if (response.data?.success) {
        toast.success(`Application ${reviewData.status} successfully!`);
        setReviewModalOpen(false);
        setSelectedApp(null);
        await fetchApplications();
      } else {
        throw new Error(response.data?.message || 'Failed to update application');
      }
    } catch (error) {
      console.error('Failed to submit review:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to submit review';
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredApplications = statusFilter === 'all' 
    ? applications 
    : applications.filter(app => app.status === statusFilter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Property Verification Applications</h2>
          <p className="text-gray-600 mt-1">Review and approve property verification requests</p>
        </div>
        <div className="text-sm text-gray-600">
          Total: <span className="font-semibold">{applications.length}</span>
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'pending', 'approved', 'rejected'].map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              statusFilter === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
            {status !== 'all' && (
              <span className="ml-2">
                ({applications.filter(app => app.status === status).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">
            <FaSpinner className="animate-spin text-2xl mx-auto mb-2" />
            Loading applications...
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            No verification applications found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Property</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Vendor</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Payment</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Submitted</th>
                  <th className="px-6 py-3 text-center font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredApplications.map((app) => (
                  <tr key={app.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{app.propertyName || 'N/A'}</p>
                        <p className="text-xs text-gray-500 mt-1">{app.propertyLocation || 'N/A'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {app.vendor?.firstName} {app.vendor?.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{app.vendor?.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${STATUS_COLORS[app.status] || 'bg-gray-100 text-gray-800'}`}>
                        {STATUS_ICONS[app.status]}
                        {app.status?.charAt(0).toUpperCase() + app.status?.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        app.paymentStatus === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {app.paymentStatus?.charAt(0).toUpperCase() + app.paymentStatus?.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleReviewClick(app)}
                        className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        <FaEye className="text-sm" />
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewModalOpen && selectedApp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex items-center justify-between">
              <h3 className="text-xl font-bold">Review Verification Application</h3>
              <button
                onClick={() => setReviewModalOpen(false)}
                className="p-1 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
              >
                <FaTimes />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Property Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Property Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Property Name</p>
                    <p className="font-medium text-gray-900">{selectedApp.propertyName}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Location</p>
                    <p className="font-medium text-gray-900">{selectedApp.propertyLocation}</p>
                  </div>
                </div>
              </div>

              {/* Vendor Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Vendor Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Name</p>
                    <p className="font-medium text-gray-900">
                      {selectedApp.vendor?.firstName} {selectedApp.vendor?.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">{selectedApp.vendor?.email}</p>
                  </div>
                </div>
              </div>

              {/* Payment Status */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Payment Status:</span>{' '}
                  <span className={selectedApp.paymentStatus === 'completed' ? 'text-green-600 font-medium' : 'text-yellow-600 font-medium'}>
                    {selectedApp.paymentStatus?.charAt(0).toUpperCase() + selectedApp.paymentStatus?.slice(1)}
                  </span>
                </p>
              </div>

              {/* Vendor Notes */}
              {selectedApp.notes && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Vendor Message</h4>
                  <p className="text-sm text-gray-700">{selectedApp.notes}</p>
                </div>
              )}

              {/* Review Form */}
              <div className="space-y-4 border-t pt-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Decision
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {['pending', 'approved', 'rejected'].map(status => (
                      <button
                        key={status}
                        onClick={() => setReviewData(prev => ({ ...prev, status }))}
                        className={`px-4 py-3 rounded-lg font-medium transition-all ${
                          reviewData.status === status
                            ? 'ring-2 ring-offset-2 ring-blue-500 ' + (
                              status === 'approved' ? 'bg-green-100 text-green-800' :
                              status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            )
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {status === 'approved' && <FaCheckCircle className="inline mr-2" />}
                        {status === 'rejected' && <FaTimesCircle className="inline mr-2" />}
                        {status === 'pending' && <FaClock className="inline mr-2" />}
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {reviewData.status === 'approved' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Badge Color
                    </label>
                    <div className="flex gap-3">
                      {['#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B'].map((color) => (
                        <button
                          key={color}
                          onClick={() => setReviewData(prev => ({ ...prev, badgeColor: color }))}
                          className={`w-10 h-10 rounded-full border-2 transition-all ${
                            reviewData.badgeColor === color ? 'border-gray-900 scale-110' : 'border-gray-300'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Notes
                  </label>
                  <textarea
                    value={reviewData.adminNotes}
                    onChange={(e) => setReviewData(prev => ({ ...prev, adminNotes: e.target.value }))}
                    placeholder="Add notes about this verification decision..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={4}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 border-t pt-6">
                <button
                  onClick={() => setReviewModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitReview}
                  disabled={submitting || !reviewData.status}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Review'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminVerificationDashboard;

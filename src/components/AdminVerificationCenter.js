import React, { useEffect, useMemo, useState } from 'react';
import {
  FaShieldAlt,
  FaMoneyBillWave,
  FaCheckCircle,
  FaTimesCircle,
  FaBrush,
  FaClipboardList,
  FaPaperPlane,
  FaClock
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import { getApiUrl } from '../utils/apiConfig';

const MOCK_APPLICATIONS = [
  {
    id: 'mock-1',
    applicant: { name: 'Jane Smith', email: 'jane@example.com' },
    propertyName: 'Lekki Pearl Residence',
    propertyLocation: 'Lekki Phase 1, Lagos',
    propertyUrl: 'https://real-estate-marketplace-37544.web.app/property/lekki-pearl',
    verificationFee: 50000,
    status: 'pending',
    requestedBadgeColor: '#6366F1',
    createdAt: new Date().toISOString()
  },
  {
    id: 'mock-2',
    applicant: { name: 'Adeolu Adewale', email: 'adeolu@example.com' },
    propertyName: 'Banana Island Heights',
    propertyLocation: 'Ikoyi, Lagos',
    propertyUrl: 'https://real-estate-marketplace-37544.web.app/property/banana-island-heights',
    verificationFee: 50000,
    status: 'approved',
    requestedBadgeColor: '#10B981',
    badgeColor: '#10B981',
    createdAt: new Date(Date.now() - 86400000).toISOString()
  }
];

const statusConfig = {
  pending: {
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-800',
    Icon: FaClock
  },
  approved: {
    label: 'Approved',
    color: 'bg-green-100 text-green-800',
    Icon: FaCheckCircle
  },
  rejected: {
    label: 'Rejected',
    color: 'bg-red-100 text-red-800',
    Icon: FaTimesCircle
  }
};

const AdminVerificationCenter = ({ config, onConfigChange }) => {
  const [verificationFee, setVerificationFee] = useState(config?.verificationFee || 50000);
  const [badgeColor, setBadgeColor] = useState(config?.verificationBadgeColor || '#10B981');
  const [savingSettings, setSavingSettings] = useState(false);
  const [applications, setApplications] = useState([]);
  const [loadingApplications, setLoadingApplications] = useState(true);
  const [applicationsError, setApplicationsError] = useState('');
  const [formValues, setFormValues] = useState({
    propertyName: '',
    propertyUrl: '',
    propertyLocation: '',
    message: ''
  });
  const [submittingForm, setSubmittingForm] = useState(false);
  const [decisionColors, setDecisionColors] = useState({});

  useEffect(() => {
    setVerificationFee(config?.verificationFee || 50000);
    setBadgeColor(config?.verificationBadgeColor || '#10B981');
  }, [config?.verificationFee, config?.verificationBadgeColor]);

  const fetchApplications = async () => {
    setLoadingApplications(true);
    setApplicationsError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setApplications(MOCK_APPLICATIONS);
        setLoadingApplications(false);
        return;
      }
      const response = await fetch(getApiUrl('/verification/applications'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Unable to load verification applications');
      }
      const data = await response.json();
      setApplications(Array.isArray(data.data) ? data.data : []);
    } catch (error) {
      console.warn('AdminVerificationCenter: failed to fetch applications', error);
      setApplicationsError('Live applications unavailable, showing mock data.');
      setApplications(MOCK_APPLICATIONS);
    } finally {
      setLoadingApplications(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const stats = useMemo(() => {
    const pending = applications.filter((app) => app.status === 'pending').length;
    const approved = applications.filter((app) => app.status === 'approved').length;
    const revenue = applications
      .filter((app) => app.status === 'approved')
      .reduce((sum, app) => sum + (app.verificationFee || verificationFee), 0);
    return {
      total: applications.length,
      pending,
      approved,
      revenue
    };
  }, [applications, verificationFee]);

  const handleSaveSettings = async () => {
    try {
      setSavingSettings(true);
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Missing admin token');
        return;
      }
      const response = await fetch(getApiUrl('/admin/settings'), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          verificationFee: parseInt(verificationFee, 10) || 0,
          verificationBadgeColor: badgeColor
        })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to save settings');
      }
      toast.success('Verification settings updated');
      onConfigChange?.({
        verificationFee: parseInt(verificationFee, 10) || 0,
        verificationBadgeColor: badgeColor
      });
    } catch (error) {
      toast.error(error?.message || 'Unable to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleApplicationSubmit = async (event) => {
    event?.preventDefault();
    if (!formValues.propertyName || !formValues.propertyLocation) {
      toast.error('Property name and location are required');
      return;
    }
    try {
      setSubmittingForm(true);
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please sign in before submitting');
        return;
      }
      const response = await fetch(getApiUrl('/verification/applications'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          propertyName: formValues.propertyName,
          propertyUrl: formValues.propertyUrl,
          propertyLocation: formValues.propertyLocation,
          message: formValues.message || 'Requesting verification badge',
          preferredBadgeColor: badgeColor
        })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to submit application');
      }
      toast.success('Application submitted');
      setFormValues({ propertyName: '', propertyUrl: '', propertyLocation: '', message: '' });
      setApplications((prev) => [data.data, ...prev]);
    } catch (error) {
      toast.error(error?.message || 'Failed to submit application');
    } finally {
      setSubmittingForm(false);
    }
  };

  const handleDecision = async (application, status) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Missing admin token');
        return;
      }
      const notes = window.prompt(`Add notes for ${status} decision (optional):`, '') || '';
      const selectedColor = decisionColors[application.id] || badgeColor;
      const response = await fetch(getApiUrl(`/verification/applications/${application.id}/status`), {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status,
          adminNotes: notes,
          badgeColor: status === 'approved' ? selectedColor : undefined
        })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to update application');
      }
      toast.success(`Application ${status}`);
      setApplications((prev) => prev.map((item) => (item.id === application.id ? data.data : item)));
    } catch (error) {
      toast.error(error?.message || 'Unable to update application');
    }
  };

  const renderStatusBadge = (status) => {
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.Icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="h-3.5 w-3.5" />
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Applications</p>
              <p className="text-3xl font-semibold mt-2">{stats.total}</p>
            </div>
            <FaShieldAlt className="text-3xl" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 text-white rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm">Pending Review</p>
              <p className="text-3xl font-semibold mt-2">{stats.pending}</p>
            </div>
            <FaClock className="text-3xl" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Approved</p>
              <p className="text-3xl font-semibold mt-2">{stats.approved}</p>
            </div>
            <FaCheckCircle className="text-3xl" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Badge Revenue</p>
              <p className="text-3xl font-semibold mt-2">
                ₦{stats.revenue.toLocaleString('en-NG')}
              </p>
            </div>
            <FaMoneyBillWave className="text-3xl" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Verification Settings</h3>
              <p className="text-sm text-gray-500">Set the fee and badge color applicants will pay for.</p>
            </div>
            <FaBrush className="text-blue-500 text-xl" />
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Verification Fee (NGN)</label>
              <input
                type="number"
                min={0}
                value={verificationFee}
                onChange={(event) => setVerificationFee(event.target.value)}
                className="mt-1 w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="50000"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Badge Accent Color</label>
              <div className="flex items-center gap-4 mt-2">
                <input
                  type="color"
                  value={badgeColor}
                  onChange={(event) => setBadgeColor(event.target.value)}
                  className="h-12 w-12 rounded-lg border border-gray-200 cursor-pointer"
                />
                <div>
                  <p className="text-sm text-gray-500">Live preview</p>
                  <div
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold text-white"
                    style={{ backgroundColor: badgeColor }}
                  >
                    <FaShieldAlt /> Verified by PropertyArk
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={handleSaveSettings}
              disabled={savingSettings}
              className={`w-full md:w-auto px-5 py-2.5 rounded-lg text-white font-medium transition ${
                savingSettings ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {savingSettings ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Application Portal</h3>
              <p className="text-sm text-gray-500">Use this form to simulate what vendors submit.</p>
            </div>
            <FaPaperPlane className="text-blue-500 text-xl" />
          </div>
          <form className="space-y-4" onSubmit={handleApplicationSubmit}>
            <div>
              <label className="text-sm font-medium text-gray-700">Property Name *</label>
              <input
                type="text"
                value={formValues.propertyName}
                onChange={(event) => setFormValues((prev) => ({ ...prev, propertyName: event.target.value }))}
                className="mt-1 w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. Pearl Towers Ikoyi"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Property Location *</label>
              <input
                type="text"
                value={formValues.propertyLocation}
                onChange={(event) => setFormValues((prev) => ({ ...prev, propertyLocation: event.target.value }))}
                className="mt-1 w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Lekki Phase 1, Lagos"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Listing URL (optional)</label>
              <input
                type="url"
                value={formValues.propertyUrl}
                onChange={(event) => setFormValues((prev) => ({ ...prev, propertyUrl: event.target.value }))}
                className="mt-1 w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://propertyark.com/property/..."
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Message</label>
              <textarea
                value={formValues.message}
                onChange={(event) => setFormValues((prev) => ({ ...prev, message: event.target.value }))}
                className="mt-1 w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Share extra context or compliance documents"
              />
            </div>
            <button
              type="submit"
              disabled={submittingForm}
              className={`w-full px-5 py-2.5 rounded-lg text-white font-medium transition flex items-center justify-center gap-2 ${
                submittingForm ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {submittingForm ? 'Submitting...' : 'Submit Verification Request'}
            </button>
          </form>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Applications</h3>
            <p className="text-sm text-gray-500">Review, approve, or reject verification applications.</p>
          </div>
          <FaClipboardList className="text-blue-500 text-xl" />
        </div>

        {applicationsError && (
          <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
            {applicationsError}
          </div>
        )}

        {loadingApplications ? (
          <div className="flex items-center justify-center py-16 text-gray-500">Loading applications...</div>
        ) : applications.length === 0 ? (
          <div className="text-center py-16 text-gray-500">No verification applications yet.</div>
        ) : (
          <div className="space-y-4">
            {applications.map((application) => (
              <div key={application.id} className="border border-gray-100 rounded-2xl p-5 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h4 className="text-lg font-semibold text-gray-900">{application.propertyName}</h4>
                      {renderStatusBadge(application.status)}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{application.propertyLocation}</p>
                    <p className="text-sm text-gray-500">
                      Applicant: {application.applicant?.name || application.applicant?.email}
                    </p>
                    {application.propertyUrl && (
                      <a
                        href={application.propertyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 text-sm"
                      >
                        View listing
                      </a>
                    )}
                  </div>
                  <div className="flex flex-col gap-3 w-full md:w-auto">
                    <div className="text-sm">
                      <p className="text-gray-500">Fee paid</p>
                      <p className="text-gray-900 font-semibold">
                        ₦{(application.verificationFee || verificationFee).toLocaleString('en-NG')}
                      </p>
                    </div>
                    {application.status === 'pending' ? (
                      <div className="flex flex-col gap-2">
                        <label className="text-xs text-gray-500">Badge color</label>
                        <input
                          type="color"
                          value={decisionColors[application.id] || application.requestedBadgeColor || badgeColor}
                          onChange={(event) =>
                            setDecisionColors((prev) => ({ ...prev, [application.id]: event.target.value }))
                          }
                          className="h-10 w-full rounded-lg border border-gray-200 cursor-pointer"
                        />
                        <div className="flex flex-col sm:flex-row gap-2">
                          <button
                            onClick={() => handleDecision(application, 'approved')}
                            className="flex-1 px-4 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleDecision(application, 'rejected')}
                            className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1 text-sm text-gray-500">
                        <p>Decision: {application.status}</p>
                        {application.adminNotes && <p>Notes: {application.adminNotes}</p>}
                        {application.badgeColor && (
                          <div className="flex items-center gap-2">
                            <span>Badge color:</span>
                            <span
                              className="inline-block h-6 w-14 rounded-full border border-gray-200"
                              style={{ backgroundColor: application.badgeColor }}
                            />
                          </div>
                        )}
                      </div>
                    )}
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

export default AdminVerificationCenter;

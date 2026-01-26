import React, { useEffect, useMemo, useState } from 'react';
import { FaCheckCircle, FaSpinner, FaExclamationTriangle, FaShieldAlt } from 'react-icons/fa';
import { getApiUrl } from '../utils/apiConfig';
import { useAuth } from '../contexts/AuthContext';

const PropertyVerification = ({ property, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [configLoading, setConfigLoading] = useState(true);
  const [configError, setConfigError] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [config, setConfig] = useState(null);
  const [formValues, setFormValues] = useState({
    propertyName: '',
    propertyUrl: '',
    propertyLocation: '',
    message: '',
    preferredBadgeColor: ''
  });

  const verificationFee = useMemo(() => {
    if (config?.verificationFee) {
      return Number(config.verificationFee);
    }
    return 50000;
  }, [config?.verificationFee]);

  const badgePreviewColor = formValues.preferredBadgeColor || config?.verificationBadgeColor || '#10B981';

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setConfigLoading(true);
        const response = await fetch(getApiUrl('/verification/config'));
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Unable to load verification configuration');
        }
        setConfig(data.data);
        setFormValues((prev) => ({
          ...prev,
          preferredBadgeColor: data.data?.verificationBadgeColor || prev.preferredBadgeColor
        }));
      } catch (err) {
        console.warn('PropertyVerification: failed to load config', err);
        setConfigError(err?.message || 'Failed to load verification configuration');
      } finally {
        setConfigLoading(false);
      }
    };

    fetchConfig();
  }, []);

  useEffect(() => {
    if (!property) return;
    const derivedLocation = (() => {
      const location = property.location;
      if (!location) return '';
      if (typeof location === 'string') return location;
      const parts = [location.address, location.city, location.state].filter(Boolean);
      return parts.join(', ');
    })();

    setFormValues((prev) => ({
      ...prev,
      propertyName: property.title || property.name || prev.propertyName,
      propertyUrl: property.shareUrl || property.listingUrl || prev.propertyUrl,
      propertyLocation: derivedLocation || prev.propertyLocation
    }));
  }, [property]);

  const handleRequestVerification = async (event) => {
    event?.preventDefault();
    const storedToken = localStorage.getItem('token');
    const fallbackEmail = user?.email;

    if (!user && !storedToken) {
      setError('Please sign in as a vendor/agent before requesting verification.');
      return;
    }

    if (!formValues.propertyName || !formValues.propertyLocation) {
      setError('Property name and location are required.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const token = user?.token || storedToken;
      const headers = {
        'Content-Type': 'application/json'
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      } else if (fallbackEmail) {
        headers['X-Mock-User-Email'] = fallbackEmail;
      }

      const response = await fetch(getApiUrl('/verification/applications'), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          propertyId: property?.id,
          propertyName: formValues.propertyName,
          propertyUrl: formValues.propertyUrl,
          propertyLocation: formValues.propertyLocation,
          message: formValues.message || 'Kindly verify this property so it can display the PropertyArk verified badge.',
          preferredBadgeColor: formValues.preferredBadgeColor || config?.verificationBadgeColor
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to submit verification request');
      }

      setSuccessMessage('Verification request submitted successfully! Our admin team will review it soon.');
      onSuccess?.('Verification request submitted successfully!');
    } catch (err) {
      console.error('PropertyVerification: submit error', err);
      setError(err?.message || 'Failed to submit verification request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Property Verification</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              <div className="flex items-center">
                <FaExclamationTriangle className="mr-2" />
                {error}
              </div>
            </div>
          )}

          <div className="space-y-6">
            {/* Property Details */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-2">{property.title}</h3>
              <p className="text-gray-600 mb-2">{property.description}</p>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-2xl font-bold text-green-600">
                  {formatCurrency(property.price)}
                </span>
                <span className="text-sm text-gray-500">
                  {formValues.propertyLocation || 'Location not specified'}
                </span>
              </div>
            </div>

            {configLoading ? (
              <div className="bg-white border border-gray-200 rounded-lg p-6 text-center text-gray-500">
                Loading verification configuration...
              </div>
            ) : (
              <form className="space-y-5" onSubmit={handleRequestVerification}>
                <div className="bg-blue-50 p-4 rounded-lg flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <FaCheckCircle className="text-blue-500 text-3xl" />
                    <div>
                      <h3 className="text-lg font-semibold">Boost trust with a Verified badge</h3>
                      <p className="text-sm text-blue-900/80">
                        The badge highlights that your property has passed PropertyArk compliance checks.
                      </p>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 flex flex-col gap-2 border border-blue-100">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Verification Fee:</span>
                      <span className="text-2xl font-bold text-green-600">{formatCurrency(verificationFee)}</span>
                    </div>
                    <p className="text-xs text-gray-500">One-time fee. Includes badge issuance & compliance review.</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Property name *</label>
                  <input
                    type="text"
                    value={formValues.propertyName}
                    onChange={(event) => setFormValues((prev) => ({ ...prev, propertyName: event.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Pearl Towers Ikoyi"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Listing URL</label>
                  <input
                    type="url"
                    value={formValues.propertyUrl}
                    onChange={(event) => setFormValues((prev) => ({ ...prev, propertyUrl: event.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://propertyark.com/property/..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Property location *</label>
                  <input
                    type="text"
                    value={formValues.propertyLocation}
                    onChange={(event) => setFormValues((prev) => ({ ...prev, propertyLocation: event.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Lekki Phase 1, Lagos"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message to compliance team</label>
                  <textarea
                    rows={4}
                    value={formValues.message}
                    onChange={(event) => setFormValues((prev) => ({ ...prev, message: event.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Share any approvals, CAC documents or highlights here"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Preferred badge color</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="color"
                      value={badgePreviewColor}
                      onChange={(event) => setFormValues((prev) => ({ ...prev, preferredBadgeColor: event.target.value }))}
                      className="h-12 w-16 rounded-md border border-gray-200 cursor-pointer"
                    />
                    <div className="text-sm text-gray-600">
                      <p>Preview:</p>
                      <div
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-white font-medium"
                        style={{ backgroundColor: badgePreviewColor }}
                      >
                        <FaShieldAlt /> PropertyArk Verified
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      Submitting request...
                    </>
                  ) : (
                    `Pay ${formatCurrency(verificationFee)} & Submit`
                  )}
                </button>
              </form>
            )}

            {successMessage && (
              <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
                {successMessage}
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyVerification;

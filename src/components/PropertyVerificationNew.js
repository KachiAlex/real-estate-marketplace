import React, { useState, useEffect, useMemo } from 'react';
import { FaTimes, FaCheckCircle, FaExclamationTriangle, FaSpinner, FaShieldAlt, FaMoneyBillWave, FaCreditCard } from 'react-icons/fa';
import { getApiUrl } from '../utils/apiConfig';
import { useAuth } from '../contexts/AuthContext';
import { authenticatedFetch, getAuthToken } from '../utils/authToken';
import SimplePaymentModal from './SimplePaymentModal';

const PropertyVerification = ({ property, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [paymentData, setPaymentData] = useState(null); // Store payment data
  const [submitting, setSubmitting] = useState(false); // Track submission state
  const [config, setConfig] = useState(null);
  const [configLoading, setConfigLoading] = useState(true);
  
  const [formValues, setFormValues] = useState({
    propertyName: '',
    propertyUrl: '',
    propertyLocation: '',
    message: '',
    preferredBadgeColor: '#10B981'
  });

  // Initialize form with property data
  useEffect(() => {
    if (!property) return;
    
    const derivedLocation = (() => {
      const location = property.location;
      if (!location) return '';
      if (typeof location === 'string') return location;
      const parts = [location.address, location.city, location.state].filter(Boolean);
      return parts.join(', ');
    })();

    // Generate property URL automatically
    const generatePropertyUrl = () => {
      if (property?.shareUrl || property?.listingUrl) {
        return property.shareUrl || property.listingUrl;
      }
      
      // Generate URL from property data
      const baseUrl = 'https://real-estate-marketplace-37544.web.app';
      const propertyId = property?.id || property?._id;
      const propertyTitle = property?.title || property?.name || 'property';
      
      if (propertyId) {
        // Create a clean URL-friendly slug from title
        const slug = propertyTitle
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        
        return `${baseUrl}/property/${propertyId}/${slug}`;
      }
      
      return `${baseUrl}/properties`;
    };

    setFormValues(prev => ({
      ...prev,
      propertyName: property.title || property.name || prev.propertyName,
      propertyUrl: generatePropertyUrl(),
      propertyLocation: derivedLocation || prev.propertyLocation
    }));
  }, [property]);

  // Fetch verification config
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
        setFormValues(prev => ({
          ...prev,
          preferredBadgeColor: data.data?.verificationBadgeColor || prev.preferredBadgeColor
        }));
      } catch (err) {
        console.warn('PropertyVerification: failed to load config', err);
        // Use default config if fetch fails
        setConfig({
          verificationFee: 50000,
          currency: 'NGN',
          supportedDocuments: ['title_deed', 'survey_plan', 'building_approval', 'tax_clearance'],
          processingTime: '3-5 business days'
        });
      } finally {
        setConfigLoading(false);
      }
    };

    fetchConfig();
  }, []);

  const verificationFee = useMemo(() => {
    return config?.verificationFee || 50000;
  }, [config?.verificationFee]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePaymentSuccess = async (paymentData) => {
    console.log('PropertyVerification: Payment successful', paymentData);
    setPaymentComplete(true);
    setSuccessMessage('✅ Payment completed successfully! Please review your details and submit the verification request.');
    setPaymentData(paymentData); // Store payment data for submission
  };

  const handleVerificationSubmit = async () => {
    if (!paymentData) {
      setError('No payment data found. Please complete payment first.');
      return;
    }

    if (!user || (!user.id && !user.uid)) {
      setError('Please login to submit verification request');
      return;
    }

    setSubmitting(true);
    setError('');
    

    try {
      // DEBUG: Check token before sending
      const token = await getAuthToken();
      console.log('DEBUG: Verification submission', {
        hasToken: !!token,
        tokenLength: token?.length,
        userEmail: user?.email,
        userId: user?.uid
      });

      // Backend expects verificationPaymentId, not paymentReference
      const applicationData = {
        propertyId: property?.id,
        propertyName: formValues.propertyName || property?.title,
        propertyUrl: formValues.propertyUrl || property?.propertyUrl,
        propertyLocation: formValues.propertyLocation || property?.location,
        message: formValues.message,
        preferredBadgeColor: formValues.preferredBadgeColor,
        verificationPaymentId: paymentData.reference,
        paymentAmount: paymentData.amount,
        paymentStatus: 'completed'
      };

      const response = await authenticatedFetch(getApiUrl('/verification/applications'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(applicationData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('PropertyVerification: Application submitted successfully', result);
        
        // Update property status in local state to reflect verification requested
        if (property?.id) {
          const verificationStatus = JSON.parse(localStorage.getItem('propertyVerificationStatus') || '{}');
          verificationStatus[property.id] = {
            status: 'requested',
            requestedAt: new Date().toISOString(),
            applicationId: result.data?.applicationId
          };
          localStorage.setItem('propertyVerificationStatus', JSON.stringify(verificationStatus));
        }
        
        if (onSuccess) {
          onSuccess({
            ...result,
            propertyId: property?.id,
            status: 'requested'
          });
        }
        
        setSuccessMessage('✅ Verification request submitted successfully! Your property is now under review.');
        
        // Close modal after showing success message
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to submit verification application');
      }
    } catch (error) {
      console.error('PropertyVerification: Error submitting application', error);
      setError(error.message || 'Failed to submit verification application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentError = (error) => {
    console.error('PropertyVerification: Payment failed', error);
    setError('Payment failed. Please try again.');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formValues.propertyName || !formValues.propertyUrl || !formValues.propertyLocation) {
      setError('Please fill in all required fields');
      return;
    }

    // Show payment modal
    setShowPaymentModal(true);
    setError('');
  };

  const badgePreviewColor = formValues.preferredBadgeColor || '#10B981';

  if (configLoading) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 text-center">
            <FaSpinner className="animate-spin text-blue-600 text-4xl mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Loading Verification</h3>
            <p className="text-gray-600">Please wait...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
          
          <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold flex items-center">
                    <FaShieldAlt className="mr-2" />
                    Property Verification
                  </h3>
                  <p className="text-blue-100 text-sm mt-1">
                    Get your property verified with the PropertyArk trust badge
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="text-white hover:text-blue-200 transition-colors"
                >
                  <FaTimes size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {successMessage ? (
                <div className="text-center py-8">
                  <FaCheckCircle className="text-green-600 text-5xl mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Success!</h3>
                  <p className="text-gray-600 mb-6">{successMessage}</p>
                  
                  {/* Show submission button after payment is complete */}
                  {paymentComplete && !submitting && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-medium text-blue-900 mb-2">Review Your Details</h4>
                        <div className="text-left space-y-2 text-sm text-blue-800">
                          <p><strong>Property:</strong> {formValues.propertyName}</p>
                          <p><strong>Location:</strong> {formValues.propertyLocation}</p>
                          <p><strong>Payment Reference:</strong> {paymentData?.reference}</p>
                          <p><strong>Amount:</strong> ₦{paymentData?.amount?.toLocaleString()}</p>
                        </div>
                      </div>
                      
                      <div className="flex space-x-3 justify-center">
                        <button
                          onClick={handleVerificationSubmit}
                          className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center"
                        >
                          <FaCheckCircle className="mr-2" />
                          Submit Verification Request
                        </button>
                        
                        <button
                          onClick={() => setShowPaymentModal(false)}
                          className="px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Show loading state during submission */}
                  {submitting && (
                    <div className="flex items-center justify-center">
                      <FaSpinner className="animate-spin text-blue-600 text-2xl mr-3" />
                      <span className="text-gray-600">Submitting verification request...</span>
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Error Message */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
                      <FaExclamationTriangle className="text-red-600 mr-3" />
                      <span className="text-red-800">{error}</span>
                    </div>
                  )}

                  {/* Property Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Property Name *
                      </label>
                      <input
                        type="text"
                        name="propertyName"
                        value={formValues.propertyName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Property URL *
                      </label>
                      <input
                        type="url"
                        name="propertyUrl"
                        value={formValues.propertyUrl}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                        placeholder="https://..."
                        readOnly
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        ✅ Auto-generated from property details
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Property Location *
                    </label>
                    <input
                      type="text"
                      name="propertyLocation"
                      value={formValues.propertyLocation}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="City, State"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Additional Message
                    </label>
                    <textarea
                      name="message"
                      value={formValues.message}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Any additional information about the property..."
                    />
                  </div>

                  {/* Badge Color Preview */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Verification Badge Color
                    </label>
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-8 h-8 rounded-full border-2 border-gray-300"
                        style={{ backgroundColor: badgePreviewColor }}
                      ></div>
                      <span className="text-sm text-gray-600">Preview of your verification badge</span>
                    </div>
                  </div>

                  {/* Fee Information */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold text-gray-900">Verification Fee</h4>
                        <p className="text-sm text-gray-600">One-time payment for property verification</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">₦{verificationFee.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">Processing time: {config?.processingTime || '3-5 business days'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {loading ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <FaCreditCard className="mr-2" />
                        Pay ₦{verificationFee.toLocaleString()} for Verification
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Simple Payment Modal */}
      <SimplePaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        amount={verificationFee}
        propertyTitle={formValues.propertyName}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentError={handlePaymentError}
      />
    </>
  );
};

export default PropertyVerification;

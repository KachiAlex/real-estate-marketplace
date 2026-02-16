import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { getApiUrl } from '../utils/apiConfig';
import { authenticatedFetch } from '../utils/authToken';

const VendorOnboardingWizard = () => {
  const { user, isVendorOnboarded, isVendorSubscriptionActive } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    businessInfo: {
      businessName: '',
      businessType: '',
      licenseNumber: '',
      isAgent: true,
      isPropertyOwner: false,
      experience: '',
      specializations: [],
      contactInfo: {
        phone: '',
        address: ''
      }
    },
    kycDocuments: [],
    paymentComplete: false
  });

  const steps = [
    { title: 'Business Information', description: 'Tell us about your business' },
    { title: 'KYC Documents', description: 'Upload required documents' },
    { title: 'Review & Payment', description: 'Review and complete subscription' }
  ];

  useEffect(() => {
    // Check for vendor registration intent from signup flow
    const vendorIntent = sessionStorage.getItem('vendorRegistrationIntent');
    if (vendorIntent) {
      try {
        const intentData = JSON.parse(vendorIntent);
        setFormData(prev => ({
          ...prev,
          businessInfo: {
            ...prev.businessInfo,
            businessName: intentData.businessName || '',
            businessType: intentData.businessType || ''
          }
        }));
        // Clear the intent after using it
        sessionStorage.removeItem('vendorRegistrationIntent');
      } catch (error) {
        console.error('Error parsing vendor registration intent:', error);
      }
    }

    if (isVendorOnboarded && isVendorSubscriptionActive) {
      navigate('/vendor/dashboard', { replace: true });
    }
  }, [isVendorOnboarded, isVendorSubscriptionActive, navigate]);

  const handleBusinessInfoSubmit = async () => {
    setLoading(true);
    try {
      // First register as vendor if not already
      if (!user?.roles?.includes('vendor')) {
        await authenticatedFetch(getApiUrl('/vendor/register'), {
          method: 'POST'
        });
      }

      // Submit business info
      const response = await authenticatedFetch(getApiUrl('/vendor/kyc/submit'), {
        method: 'POST',
        body: JSON.stringify({
          businessInfo: formData.businessInfo
        })
      });

      if (response.ok) {
        setCurrentStep(1);
        toast.success('Business information saved successfully');
      }
    } catch (error) {
      toast.error('Failed to save business information');
    } finally {
      setLoading(false);
    }
  };

  const handleKycSubmit = async () => {
    setLoading(true);
    try {
      const response = await authenticatedFetch(getApiUrl('/vendor/kyc/submit'), {
        method: 'POST',
        body: JSON.stringify({
          documents: formData.kycDocuments
        })
      });

      if (response.ok) {
        setCurrentStep(2);
        toast.success('KYC documents submitted successfully');
      }
    } catch (error) {
      toast.error('Failed to submit KYC documents');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    // Initialize Paystack payment
    setLoading(true);
    try {
      // This would integrate with Paystack
      // For now, simulate payment completion
      const response = await authenticatedFetch(getApiUrl('/vendor/subscribe'), {
        method: 'POST',
        body: JSON.stringify({
          paymentReference: `REF_${Date.now()}`,
          paymentMethod: 'paystack'
        })
      });

      if (response.ok) {
        setFormData(prev => ({ ...prev, paymentComplete: true }));
        toast.success('Subscription activated successfully!');
        setTimeout(() => {
          navigate('/vendor/dashboard');
        }, 2000);
      }
    } catch (error) {
      toast.error('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (section, data) => {
    setFormData(prev => ({
      ...prev,
      [section]: { ...prev[section], ...data }
    }));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <BusinessInfoStep
            data={formData.businessInfo}
            onChange={(data) => updateFormData('businessInfo', data)}
            onSubmit={handleBusinessInfoSubmit}
            loading={loading}
          />
        );
      case 1:
        return (
          <KycDocumentsStep
            data={formData.kycDocuments}
            onChange={(data) => updateFormData('kycDocuments', data)}
            onSubmit={handleKycSubmit}
            loading={loading}
            setCurrentStep={setCurrentStep}
          />
        );
      case 2:
        return (
          <ReviewPaymentStep
            formData={formData}
            onPayment={handlePayment}
            loading={loading}
            paymentComplete={formData.paymentComplete}
            setCurrentStep={setCurrentStep}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Vendor Onboarding</h1>
          <p className="text-gray-600">Complete your registration to start selling properties</p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            {steps.map((step, index) => (
              <React.Fragment key={index}>
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  index <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {index < currentStep ? '✓' : index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-1 ${
                    index < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="flex justify-center mt-4">
            {steps.map((step, index) => (
              <div key={index} className="text-center mx-8">
                <div className={`text-sm font-medium ${
                  index <= currentStep ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {step.title}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {step.description}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          {renderStepContent()}
        </div>
      </div>
    </div>
  );
};

// Business Info Step Component
const BusinessInfoStep = ({ data, onChange, onSubmit, loading }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Business Name *
          </label>
          <input
            type="text"
            required
            value={data.businessName}
            onChange={(e) => onChange({ businessName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 !text-black"
            placeholder="Enter your business name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Business Type *
          </label>
          <select
            required
            value={data.businessType}
            onChange={(e) => onChange({ businessType: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 !text-black"
          >
            <option value="">Select business type</option>
            <option value="real_estate_agent">Real Estate Agent</option>
            <option value="property_developer">Property Developer</option>
            <option value="property_manager">Property Manager</option>
            <option value="real_estate_broker">Real Estate Broker</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            License Number
          </label>
          <input
            type="text"
            value={data.licenseNumber}
            onChange={(e) => onChange({ licenseNumber: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 !text-black"
            placeholder="Enter your license number"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Years of Experience
          </label>
          <select
            value={data.experience}
            onChange={(e) => onChange({ experience: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 !text-black"
          >
            <option value="">Select experience</option>
            <option value="0-2">0-2 years</option>
            <option value="3-5">3-5 years</option>
            <option value="6-10">6-10 years</option>
            <option value="10+">10+ years</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Specializations
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {['Residential', 'Commercial', 'Luxury', 'Investment', 'Rental', 'Land'].map(spec => (
            <label key={spec} className="flex items-center">
              <input
                type="checkbox"
                checked={data.specializations.includes(spec)}
                onChange={(e) => {
                  const specs = e.target.checked
                    ? [...data.specializations, spec]
                    : data.specializations.filter(s => s !== spec);
                  onChange({ specializations: specs });
                }}
                className="mr-2"
              />
              {spec}
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number *
          </label>
          <input
            type="tel"
            required
            value={data.contactInfo.phone}
            onChange={(e) => onChange({
              contactInfo: { ...data.contactInfo, phone: e.target.value }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 !text-black"
            placeholder="+234 XXX XXX XXXX"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Business Address *
          </label>
          <input
            type="text"
            required
            value={data.contactInfo.address}
            onChange={(e) => onChange({
              contactInfo: { ...data.contactInfo, address: e.target.value }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 !text-black"
            placeholder="Enter your business address"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Continue to KYC'}
        </button>
      </div>
    </form>
  );
};

// KYC Documents Step Component
const KycDocumentsStep = ({ data, onChange, onSubmit, loading, setCurrentStep }) => {
  const requiredDocuments = [
    { type: 'nin', name: 'National Identity Number (NIN)', required: true },
    { type: 'business_license', name: 'Business License/Registration', required: true },
    { type: 'address_proof', name: 'Proof of Address', required: false }
  ];

  const handleFileUpload = (type, file) => {
    // In a real implementation, upload to cloud storage
    const documentNumber = type === 'nin' ? 'NIN123456789' : 'DOC123456'; // Mock

    const newDoc = {
      type,
      documentNumber,
      fileUrl: URL.createObjectURL(file), // Mock URL
      status: 'pending',
      uploadedAt: new Date().toISOString()
    };

    const updatedDocs = data.filter(d => d.type !== type).concat(newDoc);
    onChange(updatedDocs);
  };

  const isStepComplete = requiredDocuments
    .filter(doc => doc.required)
    .every(doc => data.some(d => d.type === doc.type));

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Required Documents</h3>
        <p className="text-gray-600">Please upload the following documents for verification</p>
      </div>

      {requiredDocuments.map(doc => (
        <div key={doc.type} className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="font-medium text-gray-900">{doc.name}</h4>
              <p className="text-sm text-gray-600">
                {doc.required ? 'Required' : 'Optional'}
              </p>
            </div>
            {data.find(d => d.type === doc.type) ? (
              <span className="text-green-600 font-medium">✓ Uploaded</span>
            ) : (
              <span className="text-red-600 font-medium">Not uploaded</span>
            )}
          </div>

          <input
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => e.target.files[0] && handleFileUpload(doc.type, e.target.files[0])}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      ))}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Important Notes:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• All documents will be reviewed by our admin team</li>
          <li>• Verification typically takes 1-3 business days</li>
          <li>• You'll receive an email notification once reviewed</li>
          <li>• Ensure all documents are clear and legible</li>
        </ul>
      </div>

      <div className="flex justify-between">
        <button
          onClick={() => setCurrentStep(0)} // eslint-disable-line no-undef
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          Back
        </button>
        <button
          onClick={onSubmit}
          disabled={loading || !isStepComplete}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Submitting...' : 'Submit for Review'}
        </button>
      </div>
    </div>
  );
};

// Review & Payment Step Component
const ReviewPaymentStep = ({ formData, onPayment, loading, paymentComplete, setCurrentStep }) => {
  if (paymentComplete) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl text-green-600">✓</span>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Onboarding Complete!</h3>
        <p className="text-gray-600 mb-4">
          Your vendor account has been activated successfully.
        </p>
        <p className="text-sm text-gray-500">
          Redirecting to your vendor dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Review Business Info */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Business Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div><span className="font-medium">Business Name:</span> {formData.businessInfo.businessName}</div>
          <div><span className="font-medium">Business Type:</span> {formData.businessInfo.businessType}</div>
          <div><span className="font-medium">License Number:</span> {formData.businessInfo.licenseNumber}</div>
          <div><span className="font-medium">Experience:</span> {formData.businessInfo.experience}</div>
          <div><span className="font-medium">Phone:</span> {formData.businessInfo.contactInfo.phone}</div>
          <div><span className="font-medium">Address:</span> {formData.businessInfo.contactInfo.address}</div>
        </div>
      </div>

      {/* Review Documents */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Submitted Documents</h3>
        <div className="space-y-2">
          {formData.kycDocuments.map((doc, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <span>{doc.type.replace('_', ' ').toUpperCase()}</span>
              <span className="text-green-600">✓ Submitted</span>
            </div>
          ))}
        </div>
      </div>

      {/* Subscription Details */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Subscription Details</h3>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium">Monthly Subscription Fee</span>
            <span className="text-xl font-bold text-blue-600">₦50,000</span>
          </div>
          <p className="text-sm text-blue-800">
            • Monthly billing cycle
            • Access to all vendor features
            • Property listing capabilities
            • Customer support
          </p>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-medium text-yellow-900 mb-2">Payment Information:</h4>
        <p className="text-sm text-yellow-800">
          Your subscription will be billed monthly. You can cancel anytime, but payments are non-refundable.
          Late payments may result in account suspension.
        </p>
      </div>

      <div className="flex justify-between">
        <button
          onClick={() => setCurrentStep(1)} // eslint-disable-line no-undef
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          Back
        </button>
        <button
          onClick={onPayment}
          disabled={loading}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Processing Payment...' : 'Pay & Complete Onboarding'}
        </button>
      </div>
    </div>
  );
};

export default VendorOnboardingWizard;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { FaBuilding, FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaFileUpload, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api-kzs3jdpe7a-uc.a.run.app';

const MortgageBankRegister = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  
  // Bank Information
  const [formData, setFormData] = useState({
    name: '',
    registrationNumber: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: 'Nigeria',
      zipCode: ''
    },
    contactPerson: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      position: ''
    },
    userAccount: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: ''
    }
  });

  const [documents, setDocuments] = useState([]);
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleDocumentUpload = (e) => {
    const files = Array.from(e.target.files);
    
    // For now, we'll store file metadata
    // In production, files should be uploaded to cloud storage first
    const newDocuments = files.map(file => ({
      type: file.name.includes('license') ? 'license' : 
            file.name.includes('registration') ? 'registration' :
            file.name.includes('tax') ? 'tax_certificate' : 'other',
      name: file.name,
      size: file.size,
      file: file  // Store file object for later upload
    }));
    
    setDocuments(prev => [...prev, ...newDocuments]);
    toast.success(`${files.length} document(s) added`);
  };

  const removeDocument = (index) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
    toast.success('Document removed');
  };

  const validateStep1 = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'Bank name is required';
    if (!formData.registrationNumber.trim()) newErrors.registrationNumber = 'Registration number is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.address.street.trim()) newErrors['address.street'] = 'Street address is required';
    if (!formData.address.city.trim()) newErrors['address.city'] = 'City is required';
    if (!formData.address.state.trim()) newErrors['address.state'] = 'State is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    
    if (!formData.contactPerson.firstName.trim()) newErrors['contactPerson.firstName'] = 'First name is required';
    if (!formData.contactPerson.lastName.trim()) newErrors['contactPerson.lastName'] = 'Last name is required';
    if (!formData.contactPerson.email.trim()) newErrors['contactPerson.email'] = 'Email is required';
    if (!formData.contactPerson.phone.trim()) newErrors['contactPerson.phone'] = 'Phone number is required';
    if (!formData.contactPerson.position.trim()) newErrors['contactPerson.position'] = 'Position is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors = {};
    
    if (!formData.userAccount.firstName.trim()) newErrors['userAccount.firstName'] = 'First name is required';
    if (!formData.userAccount.lastName.trim()) newErrors['userAccount.lastName'] = 'Last name is required';
    if (!formData.userAccount.email.trim()) newErrors['userAccount.email'] = 'Email is required';
    if (!formData.userAccount.password) newErrors['userAccount.password'] = 'Password is required';
    if (formData.userAccount.password.length < 6) newErrors['userAccount.password'] = 'Password must be at least 6 characters';
    if (formData.userAccount.password !== formData.userAccount.confirmPassword) {
      newErrors['userAccount.confirmPassword'] = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep3()) {
      return;
    }

    if (documents.length === 0) {
      toast.error('Please upload at least one document');
      return;
    }

    setLoading(true);

    try {
      // Upload documents first (in production, use cloud storage)
      const uploadedDocuments = await Promise.all(
        documents.map(async (doc) => {
          // For now, create a mock URL
          // In production, upload to cloud storage and get real URL
          return {
            type: doc.type,
            name: doc.name,
            url: `https://example.com/documents/${doc.name}`, // Mock URL
            uploadedAt: new Date().toISOString()
          };
        })
      );

      // Prepare registration data
      const registrationData = {
        name: formData.name,
        registrationNumber: formData.registrationNumber,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        contactPerson: formData.contactPerson,
        userAccount: {
          firstName: formData.userAccount.firstName,
          lastName: formData.userAccount.lastName,
          email: formData.userAccount.email,
          password: formData.userAccount.password
        },
        documents: uploadedDocuments
      };

      const response = await axios.post(
        `${API_BASE_URL}/api/mortgage-banks/register`,
        registrationData
      );

      if (response.data.success) {
        toast.success('Registration submitted successfully! Please wait for admin verification.');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        toast.error(response.data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(
        error.response?.data?.message || 
        error.response?.data?.errors?.[0]?.message || 
        'Error submitting registration. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <FaBuilding className="text-blue-600 text-2xl" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Mortgage Bank Registration</h1>
            <p className="text-gray-600">Register your mortgage bank to start receiving loan applications</p>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {[1, 2, 3].map((stepNum) => (
                <React.Fragment key={stepNum}>
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                        step >= stepNum
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {step > stepNum ? <FaCheckCircle /> : stepNum}
                    </div>
                    <span className="mt-2 text-sm text-gray-600">
                      {stepNum === 1 ? 'Bank Info' : stepNum === 2 ? 'Contact' : 'Account'}
                    </span>
                  </div>
                  {stepNum < 3 && (
                    <div
                      className={`flex-1 h-1 mx-2 ${
                        step > stepNum ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Form Steps */}
          <form onSubmit={handleSubmit}>
            {/* Step 1: Bank Information */}
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Bank Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bank Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="e.g., First Bank Mortgage"
                    />
                    {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Registration Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="registrationNumber"
                      value={formData.registrationNumber}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.registrationNumber ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="RC123456"
                    />
                    {errors.registrationNumber && <p className="mt-1 text-sm text-red-600">{errors.registrationNumber}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="bank@example.com"
                    />
                    {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.phone ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="+234 800 123 4567"
                    />
                    {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Street Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="address.street"
                      value={formData.address.street}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors['address.street'] ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="123 Main Street"
                    />
                    {errors['address.street'] && <p className="mt-1 text-sm text-red-600">{errors['address.street']}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="address.city"
                      value={formData.address.city}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors['address.city'] ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Lagos"
                    />
                    {errors['address.city'] && <p className="mt-1 text-sm text-red-600">{errors['address.city']}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="address.state"
                      value={formData.address.state}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors['address.state'] ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Lagos State"
                    />
                    {errors['address.state'] && <p className="mt-1 text-sm text-red-600">{errors['address.state']}</p>}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Contact Person */}
            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Person Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="contactPerson.firstName"
                      value={formData.contactPerson.firstName}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors['contactPerson.firstName'] ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors['contactPerson.firstName'] && <p className="mt-1 text-sm text-red-600">{errors['contactPerson.firstName']}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="contactPerson.lastName"
                      value={formData.contactPerson.lastName}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors['contactPerson.lastName'] ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors['contactPerson.lastName'] && <p className="mt-1 text-sm text-red-600">{errors['contactPerson.lastName']}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="contactPerson.email"
                      value={formData.contactPerson.email}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors['contactPerson.email'] ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors['contactPerson.email'] && <p className="mt-1 text-sm text-red-600">{errors['contactPerson.email']}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="contactPerson.phone"
                      value={formData.contactPerson.phone}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors['contactPerson.phone'] ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors['contactPerson.phone'] && <p className="mt-1 text-sm text-red-600">{errors['contactPerson.phone']}</p>}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Position <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="contactPerson.position"
                      value={formData.contactPerson.position}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors['contactPerson.position'] ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="e.g., Managing Director"
                    />
                    {errors['contactPerson.position'] && <p className="mt-1 text-sm text-red-600">{errors['contactPerson.position']}</p>}
                  </div>
                </div>

                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: User Account & Documents */}
            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">User Account & Documents</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="userAccount.firstName"
                      value={formData.userAccount.firstName}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors['userAccount.firstName'] ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors['userAccount.firstName'] && <p className="mt-1 text-sm text-red-600">{errors['userAccount.firstName']}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="userAccount.lastName"
                      value={formData.userAccount.lastName}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors['userAccount.lastName'] ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors['userAccount.lastName'] && <p className="mt-1 text-sm text-red-600">{errors['userAccount.lastName']}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="userAccount.email"
                      value={formData.userAccount.email}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors['userAccount.email'] ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors['userAccount.email'] && <p className="mt-1 text-sm text-red-600">{errors['userAccount.email']}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      name="userAccount.password"
                      value={formData.userAccount.password}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors['userAccount.password'] ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors['userAccount.password'] && <p className="mt-1 text-sm text-red-600">{errors['userAccount.password']}</p>}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      name="userAccount.confirmPassword"
                      value={formData.userAccount.confirmPassword}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors['userAccount.confirmPassword'] ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors['userAccount.confirmPassword'] && <p className="mt-1 text-sm text-red-600">{errors['userAccount.confirmPassword']}</p>}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Documents <span className="text-red-500">*</span>
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <FaFileUpload className="mx-auto text-4xl text-gray-400 mb-4" />
                      <input
                        type="file"
                        id="documents"
                        multiple
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={handleDocumentUpload}
                        className="hidden"
                      />
                      <label
                        htmlFor="documents"
                        className="cursor-pointer inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                      >
                        Upload Documents
                      </label>
                      <p className="mt-2 text-sm text-gray-500">
                        Upload license, registration certificate, tax certificate, etc.
                      </p>
                    </div>

                    {documents.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {documents.map((doc, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-700">{doc.name}</span>
                            <button
                              type="button"
                              onClick={() => removeDocument(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <FaTimesCircle />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Submitting...' : 'Submit Registration'}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default MortgageBankRegister;


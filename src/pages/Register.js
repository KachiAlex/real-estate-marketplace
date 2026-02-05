import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext-new';
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaHome, FaBuilding, FaShoppingCart } from 'react-icons/fa';
import { handleRoleSelection } from '../services/authFlow';
import VendorRegistrationPayment from '../components/VendorRegistrationPayment';
import RoleSelectionModal from '../components/auth/RoleSelectionModal';

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    userType: 'buyer', // Default to buyer
    businessName: '',
    businessType: 'Real Estate Agent',
    phone: '',
    experience: '1-2 years',
    vendorCategory: 'agent', // 'agent' or 'property_owner'
    agentLocation: 'Lagos', // For agents only
    agreeToTerms: false,
    agreeToPrivacy: false,
    captcha: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [captchaQuestion, setCaptchaQuestion] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState(0);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [pendingVendorData, setPendingVendorData] = useState(null);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const { register, setUser, registerAsVendor } = useAuth();
  const navigate = useNavigate();

  // Generate captcha question
  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const operations = ['+', '-', '*'];
    const operation = operations[Math.floor(Math.random() * operations.length)];
    
    let question = '';
    let answer = 0;
    
    switch (operation) {
      case '+':
        question = `${num1} + ${num2}`;
        answer = num1 + num2;
        break;
      case '-':
        question = `${num1} - ${num2}`;
        answer = num1 - num2;
        break;
      case '*':
        question = `${num1} × ${num2}`;
        answer = num1 * num2;
        break;
    }
    
    setCaptchaQuestion(question);
    setCaptchaAnswer(answer);
  };

  // Generate captcha on component mount
  React.useEffect(() => {
    generateCaptcha();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.firstName) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!formData.lastName) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Terms and Privacy validation
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the Terms of Use';
    }
    
    if (!formData.agreeToPrivacy) {
      newErrors.agreeToPrivacy = 'You must agree to the Privacy Policy';
    }

    // Captcha validation
    if (!formData.captcha) {
      newErrors.captcha = 'Please solve the captcha';
    } else if (parseInt(formData.captcha) !== captchaAnswer) {
      newErrors.captcha = 'Incorrect answer. Please try again.';
    }

    // Vendor-specific validation
    if (formData.userType === 'vendor') {
      if (!formData.businessName) {
        newErrors.businessName = 'Business name is required';
      }
      if (!formData.phone) {
        newErrors.phone = 'Phone number is required';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle role selection using centralized flow
  const handleRoleSelectionClick = async (selectedRole) => {
    await handleRoleSelection(
      selectedRole,
      loggedInUser,
      setUser,
      null, // switchRole not needed for registration
      navigate,
      setShowRoleSelection
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    // If vendor registration, create user account first, then show payment
    if (formData.userType === 'vendor') {
      try {
        // First, register as a regular user (buyer role)
        const userData = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          roles: ['buyer'], // Start as buyer
          activeRole: 'buyer'
        };
        
        const result = await register(userData);
        if (result.success) {
          // Store vendor data for after payment
          setPendingVendorData({
            businessName: formData.businessName,
            businessType: formData.businessType,
            phone: formData.phone,
            experience: formData.experience,
            vendorCategory: formData.vendorCategory,
            agentLocation: formData.agentLocation
          });
          setShowPayment(true);
        } else {
          setErrors({ general: result.message || 'Registration failed. Please try again.' });
          generateCaptcha();
        }
      } catch (error) {
        setErrors({ general: error.message || 'Registration failed. Please try again.' });
        generateCaptcha();
      } finally {
        setLoading(false);
      }
      return;
    }
    
    // For non-vendor registration, proceed normally
    setLoading(true);
    try {
      const userData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        roles: [formData.userType],
        activeRole: formData.userType
      };
      
      const result = await register(userData);
      if (result.success) {
        // Reset form and regenerate captcha
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          confirmPassword: '',
          userType: 'buyer',
          businessName: '',
          businessType: 'Real Estate Agent',
          phone: '',
          experience: '1-2 years',
          vendorCategory: 'agent',
          agentLocation: 'Lagos',
          agreeToTerms: false,
          agreeToPrivacy: false,
          captcha: ''
        });
        generateCaptcha();
        
        if (result.redirectUrl) {
          navigate(result.redirectUrl);
        } else {
          navigate('/dashboard');
        }
      } else {
        setErrors({ general: result.message || 'Registration failed. Please try again.' });
        generateCaptcha();
      }
    } catch (error) {
      setErrors({ general: error.message || 'Registration failed. Please try again.' });
      generateCaptcha();
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentData) => {
    // Complete vendor registration after payment - update user to vendor role
    setLoading(true);
    try {
      // Use registerAsVendor to add vendor role and data
      const vendorData = {
        businessName: pendingVendorData.businessName,
        businessType: pendingVendorData.businessType,
        phone: pendingVendorData.phone,
        experience: pendingVendorData.experience,
        vendorCategory: pendingVendorData.vendorCategory,
        agentLocation: pendingVendorData.agentLocation,
        registeredAt: new Date().toISOString(),
        status: 'active',
        paymentReference: paymentData?.reference || paymentData?.transactionId
      };
      
      const result = await registerAsVendor(vendorData);
      if (result.success) {
        setShowPayment(false);
        setPendingVendorData(null);
        // Reset form
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          confirmPassword: '',
          userType: 'buyer',
          businessName: '',
          businessType: 'Real Estate Agent',
          phone: '',
          experience: '1-2 years',
          vendorCategory: 'agent',
          agentLocation: 'Lagos',
          agreeToTerms: false,
          agreeToPrivacy: false,
          captcha: ''
        });
        generateCaptcha();
        
        // Navigation will happen in registerAsVendor
      } else {
        setErrors({ general: result.error || 'Failed to complete vendor registration. Please contact support.' });
      }
    } catch (error) {
      setErrors({ general: error.message || 'Failed to complete vendor registration. Please contact support.' });
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentCancel = () => {
    setShowPayment(false);
    setPendingVendorData(null);
  };

  // Show payment component if vendor registration and payment is required
  if (showPayment && pendingVendorData) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center px-4 sm:px-6 lg:px-8" style={{ top: 0, left: 0, right: 0, bottom: 0, zIndex: 10 }}>
        <VendorRegistrationPayment
          vendorData={pendingVendorData}
          onPaymentSuccess={handlePaymentSuccess}
          onCancel={handlePaymentCancel}
        />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center px-4 sm:px-6 lg:px-8" style={{ top: 0, left: 0, right: 0, bottom: 0, zIndex: 10 }}>
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center space-x-2 mb-8 group">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-105">
              <FaHome className="text-white text-xl" />
            </div>
            <div>
              <span className="text-2xl font-bold gradient-text">RealEstate</span>
              <div className="text-sm text-gray-500 font-medium">Premium Properties</div>
            </div>
          </Link>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Create Your Account
          </h2>
          <p className="text-gray-600">
            Join thousands of satisfied customers
          </p>
        </div>

        {/* User Type Selection */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
            Choose Your Account Type
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, userType: 'buyer' }))}
              className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                formData.userType === 'buyer'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex flex-col items-center space-y-2">
                <FaShoppingCart className={`text-2xl ${formData.userType === 'buyer' ? 'text-blue-600' : 'text-gray-400'}`} />
                <span className="font-medium">Buyer</span>
                <span className="text-xs text-gray-600 text-center">
                  Find and purchase properties
                </span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, userType: 'vendor' }))}
              className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                formData.userType === 'vendor'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex flex-col items-center space-y-2">
                <FaBuilding className={`text-2xl ${formData.userType === 'vendor' ? 'text-blue-600' : 'text-gray-400'}`} />
                <span className="font-medium">Vendor</span>
                <span className="text-xs text-gray-600 text-center">
                  List and sell properties
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Register Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {errors.general && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 text-sm font-medium">{errors.general}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-semibold text-gray-700 mb-2">
                  First Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaUser className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    autoComplete="given-name"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-4 border-2 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ${
                      errors.firstName ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
                    }`}
                    placeholder="First name"
                  />
                </div>
                {errors.firstName && (
                  <p className="mt-2 text-sm text-red-600">{errors.firstName}</p>
                )}
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-semibold text-gray-700 mb-2">
                  Last Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaUser className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    autoComplete="family-name"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-4 border-2 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ${
                      errors.lastName ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
                    }`}
                    placeholder="Last name"
                  />
                </div>
                {errors.lastName && (
                  <p className="mt-2 text-sm text-red-600">{errors.lastName}</p>
                )}
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-4 border-2 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ${
                    errors.email ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
                  }`}
                  placeholder="Enter your email"
                />
              </div>
              {errors.email && (
                <p className="mt-2 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-12 py-4 border-2 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ${
                    errors.password ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
                  }`}
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <FaEyeSlash className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  ) : (
                    <FaEye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-12 py-4 border-2 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ${
                    errors.confirmPassword ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
                  }`}
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <FaEyeSlash className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  ) : (
                    <FaEye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-2 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Captcha Field */}
            <div>
              <label htmlFor="captcha" className="block text-sm font-semibold text-gray-700 mb-2">
                Security Verification
              </label>
              <div className="flex items-center space-x-3">
                <div className="flex-1 bg-gray-100 px-4 py-3 rounded-xl border-2 border-gray-200 text-center">
                  <span className="text-lg font-mono text-gray-700">
                    {captchaQuestion} = ?
                  </span>
                </div>
                <button
                  type="button"
                  onClick={generateCaptcha}
                  className="px-3 py-3 bg-gray-200 hover:bg-gray-300 rounded-xl transition-colors"
                  title="Generate new question"
                >
                  ↻
                </button>
              </div>
              <input
                id="captcha"
                name="captcha"
                type="number"
                required
                value={formData.captcha}
                onChange={handleChange}
                className={`w-full mt-3 px-4 py-3 border-2 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ${
                  errors.captcha ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
                }`}
                placeholder="Enter your answer"
              />
              {errors.captcha && (
                <p className="mt-2 text-sm text-red-600">{errors.captcha}</p>
              )}
            </div>

            {/* Terms and Privacy Checkboxes */}
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <input
                  id="agreeToTerms"
                  name="agreeToTerms"
                  type="checkbox"
                  checked={formData.agreeToTerms}
                  onChange={(e) => setFormData(prev => ({ ...prev, agreeToTerms: e.target.checked }))}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="agreeToTerms" className="text-sm text-gray-700">
                  I agree to the{' '}
                  <button
                    type="button"
                    onClick={() => setShowTermsModal(true)}
                    className="text-blue-600 hover:text-blue-800 underline font-medium"
                  >
                    Terms of Use
                  </button>
                </label>
              </div>
              {errors.agreeToTerms && (
                <p className="text-sm text-red-600">{errors.agreeToTerms}</p>
              )}

              <div className="flex items-start space-x-3">
                <input
                  id="agreeToPrivacy"
                  name="agreeToPrivacy"
                  type="checkbox"
                  checked={formData.agreeToPrivacy}
                  onChange={(e) => setFormData(prev => ({ ...prev, agreeToPrivacy: e.target.checked }))}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="agreeToPrivacy" className="text-sm text-gray-700">
                  I agree to the{' '}
                  <button
                    type="button"
                    onClick={() => setShowPrivacyModal(true)}
                    className="text-blue-600 hover:text-blue-800 underline font-medium"
                  >
                    Privacy Policy
                  </button>
                </label>
              </div>
              {errors.agreeToPrivacy && (
                <p className="text-sm text-red-600">{errors.agreeToPrivacy}</p>
              )}
            </div>

            {/* Vendor-Specific Fields */}
            {formData.userType === 'vendor' && (
              <div className="space-y-6 border-t border-gray-200 pt-6">
                <div className="flex items-center space-x-2 mb-4">
                  <FaBuilding className="text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Business Information</h3>
                </div>

                {/* Business Name */}
                <div>
                  <label htmlFor="businessName" className="block text-sm font-semibold text-gray-700 mb-2">
                    Business Name *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaBuilding className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="businessName"
                      name="businessName"
                      type="text"
                      required
                      value={formData.businessName}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-4 border-2 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ${
                        errors.businessName ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
                      }`}
                      placeholder="Enter your business name"
                    />
                  </div>
                  {errors.businessName && (
                    <p className="mt-2 text-sm text-red-600">{errors.businessName}</p>
                  )}
                </div>

                {/* Business Type */}
                <div>
                  <label htmlFor="businessType" className="block text-sm font-semibold text-gray-700 mb-2">
                    Business Type
                  </label>
                  <select
                    id="businessType"
                    name="businessType"
                    value={formData.businessType}
                    onChange={handleChange}
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                  >
                    <option value="Real Estate Agent">Real Estate Agent</option>
                    <option value="Real Estate Agency">Real Estate Agency</option>
                    <option value="Property Developer">Property Developer</option>
                    <option value="Property Management">Property Management</option>
                    <option value="Investment Company">Investment Company</option>
                    <option value="Individual Property Owner">Individual Property Owner</option>
                  </select>
                </div>

                {/* Vendor Category */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Are you a:
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="relative">
                      <input
                        type="radio"
                        name="vendorCategory"
                        value="agent"
                        checked={formData.vendorCategory === 'agent'}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <div className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
                        formData.vendorCategory === 'agent' 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
                        <div className="flex items-center space-x-3">
                          <FaBuilding className={`text-lg ${formData.vendorCategory === 'agent' ? 'text-blue-600' : 'text-gray-400'}`} />
                          <div>
                            <h4 className="font-medium text-gray-900">Real Estate Agent</h4>
                            <p className="text-sm text-gray-500">Help clients buy/sell/rent properties</p>
                          </div>
                        </div>
                      </div>
                    </label>
                    <label className="relative">
                      <input
                        type="radio"
                        name="vendorCategory"
                        value="property_owner"
                        checked={formData.vendorCategory === 'property_owner'}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <div className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
                        formData.vendorCategory === 'property_owner' 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
                        <div className="flex items-center space-x-3">
                          <FaHome className={`text-lg ${formData.vendorCategory === 'property_owner' ? 'text-blue-600' : 'text-gray-400'}`} />
                          <div>
                            <h4 className="font-medium text-gray-900">Property Owner</h4>
                            <p className="text-sm text-gray-500">List and manage your own properties</p>
                          </div>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Agent Location (only for agents) */}
                {formData.vendorCategory === 'agent' && (
                  <div>
                    <label htmlFor="agentLocation" className="block text-sm font-semibold text-gray-700 mb-2">
                      Primary Location
                    </label>
                    <select
                      id="agentLocation"
                      name="agentLocation"
                      value={formData.agentLocation}
                      onChange={handleChange}
                      className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                    >
                      <option value="Lagos">Lagos</option>
                      <option value="Abuja">Abuja</option>
                      <option value="Rivers">Rivers</option>
                      <option value="Kano">Kano</option>
                      <option value="Ogun">Ogun</option>
                      <option value="Kaduna">Kaduna</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                )}

                {/* Phone Number */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-400">+234</span>
                    </div>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-4 py-4 border-2 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ${
                        errors.phone ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
                      }`}
                      placeholder="XXX XXX XXXX"
                    />
                  </div>
                  {errors.phone && (
                    <p className="mt-2 text-sm text-red-600">{errors.phone}</p>
                  )}
                </div>

                {/* Experience */}
                <div>
                  <label htmlFor="experience" className="block text-sm font-semibold text-gray-700 mb-2">
                    Years of Experience
                  </label>
                  <select
                    id="experience"
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                  >
                    <option value="Less than 1 year">Less than 1 year</option>
                    <option value="1-2 years">1-2 years</option>
                    <option value="3-5 years">3-5 years</option>
                    <option value="6-10 years">6-10 years</option>
                    <option value="10+ years">10+ years</option>
                  </select>
                </div>

                {/* Vendor Benefits Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Vendor Benefits:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• List unlimited properties</li>
                    <li>• Access to buyer leads</li>
                    <li>• Secure escrow payments</li>
                    <li>• Professional support</li>
                    <li>• Marketing tools</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-lg font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    {formData.userType === 'vendor' ? 'Creating vendor account...' : 'Creating account...'}
                  </div>
                ) : (
                  formData.userType === 'vendor' ? 'Create Vendor Account' : 'Create Account'
                )}
              </button>
            </div>
          </form>

        </div>

      {/* Terms of Use Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Terms of Use</h3>
                <button
                  onClick={() => setShowTermsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="max-h-96 overflow-y-auto text-sm text-gray-700 space-y-4">
                <p><strong>Last Updated:</strong> {new Date().toLocaleDateString()}</p>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">1. Acceptance of Terms</h4>
                  <p>By accessing and using PropertyArk, you accept and agree to be bound by the terms and provision of this agreement.</p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">2. Use License</h4>
                  <p>Permission is granted to temporarily use PropertyArk for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.</p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">3. User Accounts</h4>
                  <p>You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.</p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">4. Property Listings</h4>
                  <p>All property information is provided by vendors and users. We do not guarantee the accuracy, completeness, or reliability of any property information.</p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">5. Payment Terms</h4>
                  <p>All transactions are processed through secure payment gateways. We reserve the right to change our fees at any time.</p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">6. Limitation of Liability</h4>
                  <p>In no event shall PropertyArk, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages.</p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">7. Governing Law</h4>
                  <p>These terms shall be interpreted and governed by the laws of Nigeria.</p>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowTermsModal(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Policy Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Privacy Policy</h3>
                <button
                  onClick={() => setShowPrivacyModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="max-h-96 overflow-y-auto text-sm text-gray-700 space-y-4">
                <p><strong>Last Updated:</strong> {new Date().toLocaleDateString()}</p>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">1. Information We Collect</h4>
                  <p>We collect information you provide directly to us, such as when you create an account, list a property, or contact us for support.</p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">2. How We Use Your Information</h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li>To provide, maintain, and improve our services</li>
                    <li>To process transactions and send related information</li>
                    <li>To send technical notices and support messages</li>
                    <li>To respond to your comments and questions</li>
                    <li>To develop new services and features</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">3. Information Sharing</h4>
                  <p>We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy.</p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">4. Data Security</h4>
                  <p>We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">5. Cookies and Tracking</h4>
                  <p>We use cookies and similar tracking technologies to enhance your experience on our platform and analyze usage patterns.</p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">6. Your Rights</h4>
                  <p>You have the right to access, update, or delete your personal information. You may also opt out of certain communications from us.</p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">7. Contact Us</h4>
                  <p>If you have any questions about this Privacy Policy, please contact us at privacy@propertyark.com</p>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowPrivacyModal(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

        {/* Role Selection Modal */}
        {showRoleSelection && loggedInUser && (
          <RoleSelectionModal
            user={loggedInUser}
            onRoleSelect={handleRoleSelectionClick}
            onClose={() => setShowRoleSelection(false)}
          />
        )}
      </div>
    </div>
  );
};

export default Register; 



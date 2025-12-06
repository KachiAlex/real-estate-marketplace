import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaBriefcase, FaPhone, FaEnvelope, FaUser, FaFileAlt, FaCheckCircle } from 'react-icons/fa';
import toast from 'react-hot-toast';

const ProfessionalServicesEnquiry = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const serviceType = searchParams.get('service') || '';

  const [form, setForm] = useState({
    fullName: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.displayName || '',
    email: user?.email || '',
    phone: '',
    serviceType: serviceType || '',
    company: '',
    message: '',
    preferredContactMethod: 'email'
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update service type when URL parameter changes
  useEffect(() => {
    if (serviceType) {
      setForm(prev => ({ ...prev, serviceType }));
    }
  }, [serviceType]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulate API call - replace with actual API call later
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Save to localStorage for demo purposes
      const enquiries = JSON.parse(localStorage.getItem('professionalServicesEnquiries') || '[]');
      enquiries.push({
        ...form,
        id: Date.now().toString(),
        submittedAt: new Date().toISOString(),
        userId: user?.id || null
      });
      localStorage.setItem('professionalServicesEnquiries', JSON.stringify(enquiries));

      setSubmitted(true);
      toast.success('Your enquiry has been submitted successfully! We will contact you soon.');

      // Reset form after 3 seconds
      setTimeout(() => {
        setSubmitted(false);
        setForm({
          fullName: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.displayName || '',
          email: user?.email || '',
          phone: '',
          serviceType: serviceType || '',
          company: '',
          message: '',
          preferredContactMethod: 'email'
        });
      }, 3000);
    } catch (error) {
      toast.error('Failed to submit enquiry. Please try again.');
      console.error('Error submitting enquiry:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const serviceOptions = [
    'Legal Services',
    'Account & Book Keeping',
    'Business Office for consultation'
  ];

  const contactMethods = [
    { value: 'email', label: 'Email', icon: FaEnvelope },
    { value: 'phone', label: 'Phone', icon: FaPhone },
    { value: 'both', label: 'Both', icon: FaBriefcase }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <FaBriefcase className="text-blue-600 text-2xl" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Professional Services Enquiry</h1>
          <p className="text-gray-600">
            Get in touch with our professional services team
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
          {submitted ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaCheckCircle className="text-green-600 text-4xl" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Thank You!</h3>
              <p className="text-lg text-gray-600 mb-6">
                Your enquiry has been submitted successfully.
              </p>
              <p className="text-gray-600 mb-8">
                Our team will review your request and contact you within 24-48 hours via your preferred contact method.
              </p>
              <button
                onClick={() => navigate('/')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Return to Home
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Service Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="serviceType"
                  value={form.serviceType}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a service</option>
                  {serviceOptions.map((service) => (
                    <option key={service} value={service}>
                      {service}
                    </option>
                  ))}
                </select>
                {serviceType && (
                  <p className="mt-2 text-sm text-gray-500">
                    <FaFileAlt className="inline mr-1" />
                    Pre-selected based on your selection
                  </p>
                )}
              </div>

              {/* Personal Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="fullName"
                      value={form.fullName}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your email address"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your phone number"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company/Organization (Optional)
                  </label>
                  <input
                    type="text"
                    name="company"
                    value={form.company}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your company name"
                  />
                </div>
              </div>

              {/* Preferred Contact Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Preferred Contact Method <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {contactMethods.map((method) => {
                    const Icon = method.icon;
                    return (
                      <label
                        key={method.value}
                        className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          form.preferredContactMethod === method.value
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="preferredContactMethod"
                          value={method.value}
                          checked={form.preferredContactMethod === method.value}
                          onChange={handleChange}
                          className="sr-only"
                        />
                        <Icon className={`mr-3 ${
                          form.preferredContactMethod === method.value ? 'text-blue-600' : 'text-gray-400'
                        }`} />
                        <span className={`font-medium ${
                          form.preferredContactMethod === method.value ? 'text-blue-600' : 'text-gray-700'
                        }`}>
                          {method.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tell us about your requirements <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Please provide details about your professional service needs, timeline, and any specific requirements..."
                  required
                />
                <p className="mt-2 text-sm text-gray-500">
                  The more details you provide, the better we can assist you.
                </p>
              </div>

              {/* Privacy Agreement */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="privacy"
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    required
                  />
                  <label htmlFor="privacy" className="text-sm text-gray-600">
                    I agree to the <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a> and{' '}
                    <a href="#" className="text-blue-600 hover:underline">Terms of Service</a>.
                    I consent to being contacted by PropertyArk regarding my professional services enquiry.
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Enquiry'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Additional Information */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">What happens next?</h3>
          <ul className="space-y-2 text-gray-600">
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>Our team will review your enquiry within 24 hours</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>We'll contact you via your preferred method within 24-48 hours</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>We'll discuss your requirements and provide a customized solution</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>You'll receive a detailed proposal tailored to your needs</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalServicesEnquiry;


import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext-new';
import AuthLayout from '../../components/layout/AuthLayout';
import StaticHeroBanner from '../../components/StaticHeroBanner';
import toast from 'react-hot-toast';

const VendorRegisterPage = () => {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    businessName: '',
    businessType: '',
    agreeToTerms: false
  });
  const [error, setError] = useState('');

  const handleChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Validation
    if (!form.firstName || !form.lastName || !form.email || !form.password || !form.confirmPassword) {
      setError('All personal fields are required.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords must match.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (!form.businessName || !form.businessType) {
      setError('Business information is required for vendor registration.');
      return;
    }
    if (!form.agreeToTerms) {
      setError('You must agree to the terms and conditions.');
      return;
    }

    try {
      setError('');

      // Register as regular user first
      const user = await register(
        form.email.trim(),
        form.password,
        form.firstName.trim(),
        form.lastName.trim(),
        form.phone.trim()
      );

      // Store vendor intent for post-registration flow
      sessionStorage.setItem('vendorRegistrationIntent', JSON.stringify({
        businessName: form.businessName,
        businessType: form.businessType
      }));

      toast.success('Account created! Redirecting to vendor setup...');

      // Navigate to vendor onboarding
      navigate('/vendor/onboarding-wizard', { replace: true });

    } catch (submitError) {
      setError(submitError.message || 'Unable to register at this time.');
    }
  };

  const businessTypes = [
    'Real Estate Agent',
    'Property Developer',
    'Property Manager',
    'Real Estate Consultant',
    'Broker',
    'Other'
  ];

  return (
    <>
      <StaticHeroBanner />
      <AuthLayout
        title="Become a Vendor"
        description="Join our network of professional real estate vendors. List properties, manage clients, and grow your business."
        footer="Already have an account? Sign in and upgrade to vendor status."
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-2xl border border-red-400/70 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Personal Information</h3>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm text-slate-200">
                <span className="font-medium">First name</span>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={handleChange('firstName')}
                  className="mt-2 w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/50 focus:border-white focus:outline-none focus:ring-2 focus:ring-amber-400/70"
                  placeholder="Jane"
                  required
                />
              </label>
              <label className="text-sm text-slate-200">
                <span className="font-medium">Last name</span>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={handleChange('lastName')}
                  className="mt-2 w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/50 focus:border-white focus:outline-none focus:ring-2 focus:ring-amber-400/70"
                  placeholder="Doe"
                  required
                />
              </label>
            </div>

            <label className="text-sm text-slate-200">
              <span className="font-medium">Email</span>
              <input
                type="email"
                value={form.email}
                onChange={handleChange('email')}
                className="mt-2 w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/50 focus:border-white focus:outline-none focus:ring-2 focus:ring-amber-400/70"
                placeholder="jane@example.com"
                required
              />
            </label>

            <label className="text-sm text-slate-200">
              <span className="font-medium">Phone</span>
              <input
                type="tel"
                value={form.phone}
                onChange={handleChange('phone')}
                className="mt-2 w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/50 focus:border-white focus:outline-none focus:ring-2 focus:ring-amber-400/70"
                placeholder="+1 (555) 123-4567"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm text-slate-200">
                <span className="font-medium">Password</span>
                <input
                  type="password"
                  value={form.password}
                  onChange={handleChange('password')}
                  className="mt-2 w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/50 focus:border-white focus:outline-none focus:ring-2 focus:ring-amber-400/70"
                  placeholder="••••••••"
                  required
                />
              </label>
              <label className="text-sm text-slate-200">
                <span className="font-medium">Confirm Password</span>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={handleChange('confirmPassword')}
                  className="mt-2 w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/50 focus:border-white focus:outline-none focus:ring-2 focus:ring-amber-400/70"
                  placeholder="••••••••"
                  required
                />
              </label>
            </div>
          </div>

          {/* Business Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Business Information</h3>

            <label className="text-sm text-slate-200">
              <span className="font-medium">Business Name</span>
              <input
                type="text"
                value={form.businessName}
                onChange={handleChange('businessName')}
                className="mt-2 w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/50 focus:border-white focus:outline-none focus:ring-2 focus:ring-amber-400/70"
                placeholder="ABC Real Estate"
                required
              />
            </label>

            <label className="text-sm text-slate-200">
              <span className="font-medium">Business Type</span>
              <select
                value={form.businessType}
                onChange={handleChange('businessType')}
                className="mt-2 w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/50 focus:border-white focus:outline-none focus:ring-2 focus:ring-amber-400/70"
                required
              >
                <option value="">Select business type</option>
                {businessTypes.map(type => (
                  <option key={type} value={type} className="text-gray-900">{type}</option>
                ))}
              </select>
            </label>
          </div>

          {/* Terms and Conditions */}
          <div className="space-y-4">
            <label className="flex items-start space-x-3">
              <input
                type="checkbox"
                checked={form.agreeToTerms}
                onChange={handleChange('agreeToTerms')}
                className="mt-1 h-4 w-4 rounded border-white/20 bg-white/10 text-amber-400 focus:ring-amber-400 focus:ring-offset-0"
                required
              />
              <span className="text-sm text-slate-200">
                I agree to the{' '}
                <Link to="/terms" className="text-amber-400 hover:text-amber-300 underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-amber-400 hover:text-amber-300 underline">
                  Privacy Policy
                </Link>
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-amber-400 px-4 py-3 font-semibold text-gray-900 hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Account...' : 'Create Vendor Account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-200">
            Already have an account?{' '}
            <Link to="/auth/login" className="text-amber-400 hover:text-amber-300 underline">
              Sign in
            </Link>
          </p>
          <p className="mt-2 text-sm text-slate-400">
            Want to browse properties first?{' '}
            <Link to="/auth/register" className="text-amber-400 hover:text-amber-300 underline">
              Sign up as buyer
            </Link>
          </p>
        </div>
      </AuthLayout>
    </>
  );
};

export default VendorRegisterPage;
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AuthLayout from '../../components/layout/AuthLayout';
import { getApiUrl } from '../../utils/apiConfig';
import toast from 'react-hot-toast';

/**
 * PasswordResetPage Component
 * Handles password reset with token from email link
 */
const PasswordResetPage = ({ isModal = false, onClose }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Parse token from URL on mount
  useEffect(() => {
    const resetToken = searchParams.get('token');
    if (!resetToken) {
      setError('Invalid or missing reset token. Please request a new password reset link.');
      setStatus('error');
    } else {
      setToken(resetToken);
    }
  }, [searchParams]);

  // Calculate password strength
  useEffect(() => {
    if (!password) {
      setPasswordStrength(0);
      return;
    }

    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*]/.test(password)) strength++;

    setPasswordStrength(Math.min(strength, 4));
  }, [password]);

  const getStrengthLabel = () => {
    switch (passwordStrength) {
      case 0:
        return '';
      case 1:
        return 'Weak';
      case 2:
        return 'Fair';
      case 3:
        return 'Good';
      case 4:
        return 'Strong';
      default:
        return '';
    }
  };

  const getStrengthColor = () => {
    switch (passwordStrength) {
      case 1:
        return 'bg-red-500';
      case 2:
        return 'bg-yellow-500';
      case 3:
        return 'bg-blue-500';
      case 4:
        return 'bg-green-500';
      default:
        return 'bg-gray-300';
    }
  };

  const validatePassword = () => {
    if (!password) {
      setError('Password is required.');
      return false;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return false;
    }

    if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) {
      setError('Password must contain both uppercase and lowercase letters.');
      return false;
    }

    if (!/\d/.test(password)) {
      setError('Password must contain at least one number.');
      return false;
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      setError('Password must contain at least one special character (!@#$%^&* etc).');
      return false;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!validatePassword()) {
      return;
    }

    setError('');
    setStatus('loading');

    try {
      const response = await fetch(getApiUrl('/auth/reset-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          newPassword: password
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to reset password.');
      }

      setStatus('success');
      toast.success('Password reset successfully! Redirecting to login...');
      
      setTimeout(() => {
        navigate('/auth/login');
      }, 2000);
    } catch (err) {
      console.error('Password reset error:', err);
      setError(err.message || 'Unexpected error.');
      setStatus('idle');
    }
  };

  if (status === 'error') {
    return (
      <AuthLayout
        title="Reset Failed"
        description="There was an issue with your password reset link."
        isModal={isModal}
        onClose={onClose}
      >
        <div className="space-y-5">
          <div className="rounded-2xl border border-red-400/70 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
          <button
            onClick={() => navigate('/auth/forgot-password')}
            className="w-full rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-3 text-center text-base font-semibold text-slate-900 shadow-lg shadow-orange-500/40 transition hover:brightness-110"
          >
            Request New Reset Link
          </button>
        </div>
      </AuthLayout>
    );
  }

  if (status === 'success') {
    return (
      <AuthLayout
        title="Password Reset Successful"
        description="Your password has been reset. You can now login with your new password."
        isModal={isModal}
        onClose={onClose}
      >
        <div className="space-y-5">
          <div className="rounded-2xl border border-green-400/70 bg-green-500/10 px-4 py-3 text-sm text-green-200">
            Password reset successfully! Redirecting to login...
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset your password"
      description="Enter your new password to regain access to your PropertyArk account."
      isModal={isModal}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-2xl border border-red-400/70 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {/* New Password */}
        <label className="text-sm text-slate-200">
          <span className="font-medium">New Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/50 focus:border-white focus:outline-none focus:ring-2 focus:ring-amber-400/70"
            placeholder="Enter new password"
          />
          {password && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-300">Password strength</span>
                <span className="text-xs text-slate-300">{getStrengthLabel()}</span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full ${getStrengthColor()} transition-all duration-300`}
                  style={{ width: `${(passwordStrength / 4) * 100}%` }}
                />
              </div>
            </div>
          )}
        </label>

        {/* Confirm Password */}
        <label className="text-sm text-slate-200">
          <span className="font-medium">Confirm Password</span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/50 focus:border-white focus:outline-none focus:ring-2 focus:ring-amber-400/70"
            placeholder="Confirm new password"
          />
        </label>

        {/* Password Requirements */}
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-300">
          <p className="font-medium mb-2">Password requirements:</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>At least 8 characters</li>
            <li>Mix of uppercase and lowercase letters</li>
            <li>At least one number</li>
            <li>At least one special character (!@#$%^&* etc)</li>
          </ul>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={status === 'loading' || !password || !confirmPassword}
          className="w-full rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-3 text-center text-base font-semibold text-slate-900 shadow-lg shadow-orange-500/40 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {status === 'loading' ? 'Resetting password…' : 'Reset Password'}
        </button>

        {/* Back to Login */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => navigate('/auth/login')}
            className="text-sm text-amber-300 hover:text-amber-200"
          >
            Back to sign in
          </button>
        </div>
      </form>
    </AuthLayout>
  );
};

export default PasswordResetPage;

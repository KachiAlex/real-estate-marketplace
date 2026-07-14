import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AuthLayout from '../../components/layout/AuthLayout';
import toast from 'react-hot-toast';
import { getApiUrl } from '../../utils/apiConfig';
import { validatePasswordStrength, PASSWORD_REQUIREMENTS } from '../../utils/passwordPolicy';

const PasswordStrengthIndicator = ({ passwordStrength }) => {
  if (!passwordStrength) return null;

  const { requirements } = passwordStrength;
  const requirementsList = PASSWORD_REQUIREMENTS.map(({ key, label }) => ({
    label,
    met: Boolean(requirements[key])
  }));

  return (
    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        Password Requirements:
      </p>
      <ul className="space-y-2">
        {requirementsList.map((req, idx) => (
          <li key={idx} className="flex items-center text-sm">
            <svg
              className={`w-4 h-4 mr-2 ${req.met ? 'text-green-600' : 'text-gray-400'}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className={req.met ? 'text-green-700 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}>
              {req.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(null);

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    } else {
      setError('Invalid reset link. Please request a new password reset.');
    }
  }, [searchParams]);

  useEffect(() => {
    if (newPassword) {
      setPasswordStrength(validatePasswordStrength(newPassword));
    } else {
      setPasswordStrength(null);
    }
  }, [newPassword]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!newPassword || !confirmPassword) {
      setError('Both password fields are required.');
      return;
    }

    const { isStrong } = validatePasswordStrength(newPassword);
    if (!isStrong) {
      setError('Password does not meet strength requirements.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError('');
    setStatus('loading');

    try {
      const response = await fetch(getApiUrl('/auth/reset-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token: token.trim(), 
          newPassword: newPassword.trim() 
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to reset password.');
      }

      setStatus('success');
      toast.success('Password reset successfully! You can now login with your new password.');
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (err) {
      console.error('Reset password error:', err);
      setError(err.message || 'Unexpected error.');
      setStatus('idle');
    }
  };

  if (status === 'success') {
    return (
      <AuthLayout
        title="Password Reset Successful"
        description="Your password has been reset successfully. Redirecting to login..."
      >
        <div className="text-center">
          <div className="mb-4 text-green-600">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Password Reset Successful!
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            You will be redirected to the login page shortly...
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset Password"
      description="Enter your new password below to complete the reset process."
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 0 8 8 0 0116 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0v4a1 1 0 102 0zm3 1a1 1 0 100-2 0v4a1 1 0 102 0v4a1 1 0 102 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  {error}
                </h3>
              </div>
            </div>
          </div>
        )}

        <div>
          <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            New Password
          </label>
          <input
            id="new-password"
            name="new-password"
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
            placeholder="Enter new password"
            disabled={status === 'loading'}
            data-testid="new-password-input"
          />
          <PasswordStrengthIndicator passwordStrength={passwordStrength} />
        </div>

        <div>
          <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Confirm Password
          </label>
          <input
            id="confirm-password"
            name="confirm-password"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
            placeholder="Confirm new password"
            disabled={status === 'loading'}
            data-testid="confirm-password-input"
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={status === 'loading'}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="reset-password-button"
          >
            {status === 'loading' ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Resetting Password...
              </>
            ) : (
              'Reset Password'
            )}
          </button>
        </div>

        <div className="text-center">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="font-medium text-orange-600 hover:text-orange-500 dark:text-orange-400"
            data-testid="back-to-login-button"
          >
            Back to Login
          </button>
        </div>
      </form>
    </AuthLayout>
  );
};

export default ResetPasswordPage;

import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { FaLock, FaEye, FaEyeSlash, FaCheckCircle } from 'react-icons/fa';
import { confirmPasswordReset, verifyPasswordResetCode, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import toast from 'react-hot-toast';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [actionCode, setActionCode] = useState(null);
  const [email, setEmail] = useState('');

  // Get action code from URL query params (Firebase Auth uses 'oobCode' and 'mode')
  const oobCode = searchParams.get('oobCode');
  const mode = searchParams.get('mode');

  useEffect(() => {
    // Skip if already showing success or loading (prevents re-verification during reset)
    if (success || loading) {
      return;
    }

    // Check if password was already successfully reset (stored in sessionStorage)
    const resetCompleted = sessionStorage.getItem('passwordResetCompleted');
    if (resetCompleted === 'true') {
      // Password already reset, clear the flag and redirect to login using hard redirect
      sessionStorage.removeItem('passwordResetCompleted');
      window.location.href = `${window.location.origin}/login`;
      return;
    }

    // Validate that we have the required Firebase Auth parameters
    if (!oobCode || mode !== 'resetPassword') {
      // If no valid parameters, redirect to login (not forgot-password)
      // This handles cases where user navigates here after successful reset
      navigate('/login', { replace: true });
      return;
    }

    // Verify the password reset code is valid
    const verifyCode = async () => {
      setValidating(true);
      try {
        const verifiedEmail = await verifyPasswordResetCode(auth, oobCode);
        setActionCode(oobCode);
        setEmail(verifiedEmail);
        setValidating(false);
      } catch (error) {
        console.error('Password reset code verification error:', error);
        let errorMessage = 'Invalid or expired reset link.';
        
        switch (error.code) {
          case 'auth/expired-action-code':
            errorMessage = 'The password reset link has expired. Please request a new one.';
            // Redirect to forgot-password to request a new link
            setTimeout(() => {
              navigate('/forgot-password', { replace: true });
            }, 2000);
            break;
          case 'auth/invalid-action-code':
            errorMessage = 'Invalid reset link. This link may have already been used. Redirecting to login...';
            // If invalid, likely already used - check sessionStorage first
            const wasCompleted = sessionStorage.getItem('passwordResetCompleted');
            if (wasCompleted === 'true') {
              // Was already completed, redirect to login using hard redirect
              sessionStorage.removeItem('passwordResetCompleted');
              window.location.href = `${window.location.origin}/login`;
            } else {
              // Never completed, redirect to login (don't go to forgot-password)
              setTimeout(() => {
                window.location.href = `${window.location.origin}/login`;
              }, 2000);
            }
            break;
          case 'auth/user-disabled':
            errorMessage = 'This account has been disabled. Please contact support.';
            setTimeout(() => {
              navigate('/login', { replace: true });
            }, 2000);
            break;
          default:
            // For other errors, redirect to login
            setTimeout(() => {
              navigate('/login', { replace: true });
            }, 2000);
        }
        
        toast.error(errorMessage);
        setValidating(false);
      }
    };

    verifyCode();
  }, [oobCode, mode, navigate, success, loading]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    } else if (formData.password.length > 128) {
      newErrors.password = 'Password is too long (maximum 128 characters)';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!actionCode) {
      toast.error('Invalid reset link. Please request a new one.');
      // Check if password was already reset
      const wasReset = sessionStorage.getItem('passwordResetCompleted');
      if (wasReset === 'true') {
        sessionStorage.removeItem('passwordResetCompleted');
        window.location.href = `${window.location.origin}/login`;
      } else {
        navigate('/forgot-password');
      }
      return;
    }

    setLoading(true);
    try {
      // Step 1: Confirm password reset using Firebase Auth
      await confirmPasswordReset(auth, actionCode, formData.password);
      console.log('Firebase password reset confirmed successfully');
      
      // Step 2: Verify the new password works by attempting to sign in
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, formData.password);
        const firebaseToken = await userCredential.user.getIdToken();
        console.log('Password verified - login successful with new password');
        
        // Sign out immediately after verification (we just need to confirm it works)
        await auth.signOut();
        
        // Step 3: Sync password to backend database
        let syncSuccess = false;
        try {
          const apiBaseUrl = process.env.REACT_APP_API_URL || 'https://api-759115682573.us-central1.run.app/api';
          const syncResponse = await fetch(`${apiBaseUrl}/auth/sync-password`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              email: email,
              newPassword: formData.password
            })
          });
          
          if (!syncResponse.ok) {
            const errorData = await syncResponse.json().catch(() => ({}));
            console.warn('Failed to sync password to backend:', errorData.message || 'Unknown error');
            // Don't fail the whole operation - Firebase reset was successful
            toast.error('Password reset successful, but backend sync failed. You can still login with Firebase.');
          } else {
            const syncData = await syncResponse.json();
            console.log('Password successfully synced to backend database:', syncData);
            syncSuccess = true;
          }
        } catch (syncError) {
          console.warn('Error syncing password to backend:', syncError.message);
          // Don't fail the whole operation - Firebase reset was successful
          toast.error('Password reset successful, but backend sync failed. You can still login with Firebase.');
        }
        
        // Mark password reset as completed in sessionStorage FIRST
        sessionStorage.setItem('passwordResetCompleted', 'true');
        
        toast.success('Password reset successfully! Redirecting to login...');
        
        // Immediately redirect to login using full URL to ensure it works
        // This completely clears the URL and prevents any React Router interference
        // Use setTimeout(0) to ensure toast is shown before redirect
        setTimeout(() => {
          const baseUrl = window.location.origin;
          window.location.href = `${baseUrl}/login`;
        }, 100);
      } catch (signInError) {
        console.error('Failed to verify new password with login:', signInError);
        // If we can't sign in with the new password, something went wrong
        throw new Error('Password reset failed. The new password could not be verified. Please try again.');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      
      let errorMessage = 'An error occurred. Please try again.';
      
      switch (error.code) {
        case 'auth/weak-password':
          errorMessage = 'Password is too weak. Please choose a stronger password (at least 6 characters).';
          break;
        case 'auth/expired-action-code':
          errorMessage = 'The password reset link has expired. Please request a new one.';
          setTimeout(() => {
            navigate('/forgot-password');
          }, 2000);
          break;
        case 'auth/invalid-action-code':
          errorMessage = 'Invalid reset link. This link may have already been used. Redirecting to login...';
          // Check if password was already reset
          const alreadyReset = sessionStorage.getItem('passwordResetCompleted');
          if (alreadyReset === 'true') {
            sessionStorage.removeItem('passwordResetCompleted');
            navigate('/login', { replace: true });
          } else {
            // Never reset, so redirect to login (not forgot-password)
            setTimeout(() => {
              navigate('/login', { replace: true });
            }, 2000);
          }
          break;
        case 'auth/invalid-credential':
          errorMessage = 'Unable to verify the new password. Please try again.';
          break;
        default:
          errorMessage = error.message || 'Failed to reset password. Please try again.';
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <FaCheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Password Reset Successful!</h2>
            <p className="text-gray-600 mb-6">
              Your password has been reset successfully. You can now log in with your new password using your email: <strong>{email}</strong>
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Redirecting to login page...
            </p>
            <button
              onClick={() => navigate('/login', { replace: true })}
              className="inline-block bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Continue to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (validating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying Reset Link</h2>
            <p className="text-gray-600">Please wait while we verify your password reset link...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!actionCode || !email) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Reset Password</h2>
          <p className="text-gray-600">
            Enter your new password below.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaLock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value });
                  if (errors.password) setErrors({ ...errors, password: '' });
                }}
                className={`block w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.password ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter new password"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaLock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => {
                  setFormData({ ...formData, confirmPassword: e.target.value });
                  if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
                }}
                className={`block w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Confirm new password"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;


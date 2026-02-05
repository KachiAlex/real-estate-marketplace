import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext-new';
import { getGoogleUserInfo } from '../config/googleOAuth';
import toast from 'react-hot-toast';

const LoginNew = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const googleButtonRef = useRef(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    confirmPassword: ''
  });

  const { login, register, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Render Google Sign-In button when component mounts
  useEffect(() => {
    if (googleButtonRef.current && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
          callback: handleGoogleSignIn
        });

        window.google.accounts.id.renderButton(
          googleButtonRef.current,
          {
            type: 'standard',
            size: 'large',
            text: 'signin_with',
            locale: 'en_US',
            theme: 'outline',
            width: '100%'
          }
        );
      } catch (error) {
        console.warn('Failed to render Google button:', error);
      }
    }
  }, [handleGoogleSignIn]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // Login
        if (!formData.email || !formData.password) {
          toast.error('Email and password are required');
          return;
        }

        await login(formData.email, formData.password);
        const from = location.state?.from?.pathname || '/dashboard';
        navigate(from);
      } else {
        // Register
        if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
          toast.error('Please fill in all required fields');
          return;
        }

        if (formData.password !== formData.confirmPassword) {
          toast.error('Passwords do not match');
          return;
        }

        if (formData.password.length < 6) {
          toast.error('Password must be at least 6 characters');
          return;
        }

        await register(
          formData.email,
          formData.password,
          formData.firstName,
          formData.lastName,
          formData.phone
        );

        // Clear form
        setFormData({
          email: '',
          password: '',
          firstName: '',
          lastName: '',
          phone: '',
          confirmPassword: ''
        });
        setIsLogin(true);
        toast.success('Registration successful! Please log in.');
      }
    } catch (error) {
      console.error(`${isLogin ? 'Login' : 'Registration'} error:`, error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phone: '',
      confirmPassword: ''
    });
  };

  // Handle Google Sign-In callback
  const handleGoogleSignIn = useCallback(async (response) => {
    try {
      setLoading(true);
      if (!response.credential) {
        toast.error('No credentials received from Google');
        return;
      }

      // Get user info from token
      const userInfo = getGoogleUserInfo(response.credential);
      if (!userInfo) {
        toast.error('Failed to decode Google token');
        return;
      }

      // Send token to backend for JWT exchange
      await signInWithGoogle(response.credential);

      // Navigate to dashboard
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from);
    } catch (error) {
      console.error('Google sign-in error:', error);
      toast.error(error.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  }, [signInWithGoogle, navigate, location]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  name="firstName"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  disabled={loading}
                />
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  disabled={loading}
                />
              </div>
              <input
                type="tel"
                name="phone"
                placeholder="Phone (optional)"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                disabled={loading}
              />
            </>
          )}

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            disabled={loading}
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            disabled={loading}
            required
          />

          {!isLogin && (
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              disabled={loading}
              required
            />
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
          >
            {loading ? 'Loading...' : isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        {/* Divider */}
        <div className="mt-6 mb-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>
        </div>

        {/* Google Sign-In Button */}
        {process.env.REACT_APP_GOOGLE_CLIENT_ID && (
          <div
            ref={googleButtonRef}
            className="mb-6"
            style={{ display: 'flex', justifyContent: 'center' }}
          />
        )}

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              onClick={toggleMode}
              disabled={loading}
              className="text-blue-600 hover:text-blue-700 font-bold disabled:opacity-50"
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>

        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-gray-700">
          <p className="font-semibold mb-2">Test Account:</p>
          <p><strong>Email:</strong> test@example.com</p>
          <p><strong>Password:</strong> test123</p>
          <p className="text-xs text-gray-500 mt-2">Or create a new account / sign in with Google</p>
        </div>
      </div>
    </div>
  );
};

export default LoginNew;

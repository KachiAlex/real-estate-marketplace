import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaGoogle, FaFacebook, FaHome, FaBuilding, FaShoppingCart } from 'react-icons/fa';
import toast from 'react-hot-toast';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const { login, switchRole, setUser } = useAuth();
  const navigate = useNavigate();

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
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setErrors({});

    try {
      console.log('Login: Attempting login with:', { email: formData.email, password: '***' });
      const result = await login(formData.email, formData.password);
      console.log('Login: Login result:', result);
      
      if (result.success) {
        console.log('Login: Login successful, checking user roles...');
        
        // Check if user has multiple roles
        if (result.user && result.user.roles && result.user.roles.length > 1) {
          console.log('Login: User has multiple roles, showing role selection');
          setLoggedInUser(result.user);
          setShowRoleSelection(true);
        } else {
          // Single role or no roles, proceed normally
          if (result.redirectUrl) {
            console.log('Login: Redirecting to:', result.redirectUrl);
            navigate(result.redirectUrl);
          } else {
            console.log('Login: No redirect URL, going to dashboard');
            navigate('/dashboard');
          }
        }
      } else {
        console.log('Login: Login failed:', result.message);
        setErrors({ general: result.message });
      }
    } catch (error) {
      console.error('Login: Error during login:', error);
      setErrors({ general: 'Login failed' });
    } finally {
      setLoading(false);
    }
  };

  // Handle role selection
  const handleRoleSelection = async (selectedRole) => {
    try {
      console.log('Login: Role selection clicked:', selectedRole);
      
      // Update the user's active role locally first
      const updatedUser = { ...loggedInUser, activeRole: selectedRole };
      
      // Update localStorage
      localStorage.setItem('activeRole', selectedRole);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      
      // Update AuthContext state
      setUser(updatedUser);
      
      console.log('Login: Updated user with active role:', updatedUser);
      
      // Show success message
      toast.success(`Switched to ${selectedRole} dashboard`);
      
      // Close the modal
      setShowRoleSelection(false);
      
      // Navigate directly using React Router
      const dashboardPath = selectedRole === 'vendor' ? '/vendor/dashboard' : '/dashboard';
      console.log('Login: Navigating to:', dashboardPath);
      
      // Use setTimeout to ensure state updates are processed
      setTimeout(() => {
        navigate(dashboardPath);
      }, 100);
      
    } catch (error) {
      console.error('Error in role selection:', error);
    }
  };

  // Test function to check localStorage
  const testLocalStorage = () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    console.log('Login: localStorage test - Token:', !!token, 'User:', !!user);
    if (user) {
      console.log('Login: User data:', JSON.parse(user));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
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
            Welcome Back
          </h2>
          <p className="text-gray-600">
            Sign in to your account to continue
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {errors.general && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 text-sm font-medium">{errors.general}</p>
            </div>
          )}

                      <form onSubmit={handleSubmit} className="space-y-6">
              {errors.general && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                  {errors.general}
                </div>
              )}

              {/* Test button for debugging */}
              <button
                type="button"
                onClick={testLocalStorage}
                className="w-full bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Test localStorage (Check Console)
              </button>

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
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-12 py-4 border-2 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ${
                    errors.password ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
                  }`}
                  placeholder="Enter your password"
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

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link to="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                  Forgot your password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-lg font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Signing in...
                  </div>
                ) : (
                  'Sign In'
                )}
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>
          </div>

          {/* Social Login Buttons */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button className="w-full inline-flex justify-center py-3 px-4 border border-gray-300 rounded-xl shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-all duration-300 transform hover:-translate-y-1">
              <FaGoogle className="text-red-500 mr-2" />
              Google
            </button>
            <button className="w-full inline-flex justify-center py-3 px-4 border border-gray-300 rounded-xl shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-all duration-300 transform hover:-translate-y-1">
              <FaFacebook className="text-blue-600 mr-2" />
              Facebook
            </button>
          </div>

          {/* Sign Up Link */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-500 transition-colors">
                Sign up here
              </Link>
            </p>
          </div>
        </div>

        {/* Role Selection Modal */}
        {showRoleSelection && loggedInUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full p-8">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Choose Your Dashboard
                </h3>
                <p className="text-gray-600">
                  You have access to multiple account types. Which would you like to use?
                </p>
              </div>
              
              <div className="space-y-4">
                {loggedInUser.roles.includes('buyer') && (
                  <button
                    onClick={() => handleRoleSelection('buyer')}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-300 group"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                        <FaShoppingCart className="text-blue-600 text-xl" />
                      </div>
                      <div className="text-left">
                        <h4 className="font-semibold text-gray-900">Buyer Dashboard</h4>
                        <p className="text-sm text-gray-600">Browse and purchase properties</p>
                      </div>
                    </div>
                  </button>
                )}
                
                {loggedInUser.roles.includes('vendor') && (
                  <button
                    onClick={() => handleRoleSelection('vendor')}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-300 group"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                        <FaBuilding className="text-green-600 text-xl" />
                      </div>
                      <div className="text-left">
                        <h4 className="font-semibold text-gray-900">Vendor Dashboard</h4>
                        <p className="text-sm text-gray-600">Manage and list properties</p>
                      </div>
                    </div>
                  </button>
                )}
              </div>
              
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">
                  You can switch between dashboards anytime from the header menu
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login; 
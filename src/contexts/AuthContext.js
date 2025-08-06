import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://real-estate-marketplace-1-k8jp.onrender.com';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Start with loading true
  const [error, setError] = useState(null);

  // Check if user is logged in on app start
  useEffect(() => {
    console.log('AuthContext: Checking for stored user data...');
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    console.log('AuthContext: Token found:', !!token);
    console.log('AuthContext: User data found:', !!userData);
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        console.log('AuthContext: Setting user from localStorage:', parsedUser);
        setUser(parsedUser);
      } catch (err) {
        console.error('AuthContext: Error parsing user data:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    } else {
      console.log('AuthContext: No stored user data found');
    }
    
    setLoading(false);
  }, []);

  // Login function
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      console.log('AuthContext: Sending login request with data:', { email, password: '***' });
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      console.log('AuthContext: Login response status:', response.status);
      const data = await response.json();
      console.log('AuthContext: Login response data:', data);
      
      if (data.success) {
        console.log('AuthContext: Login successful, setting user:', data.user);
        setUser(data.user);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        return { success: true, user: data.user };
      } else {
        setError(data.message || 'Login failed');
        return { success: false, message: data.message };
      }
    } catch (err) {
      setError('Login failed');
      console.error('AuthContext: Error during login:', err);
      return { success: false, message: 'Login failed' };
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      console.log('AuthContext: Sending registration request with data:', userData);
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      console.log('AuthContext: Registration response status:', response.status);
      const data = await response.json();
      console.log('AuthContext: Registration response data:', data);
      
      if (data.success) {
        console.log('AuthContext: Registration successful, setting user:', data.user);
        setUser(data.user);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        return { success: true, user: data.user };
      } else {
        setError(data.message || 'Registration failed');
        return { success: false, message: data.message };
      }
    } catch (err) {
      setError('Registration failed');
      console.error('AuthContext: Error during registration:', err);
      return { success: false, message: 'Registration failed' };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    console.log('AuthContext: Logging out user');
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  // Get user profile
  const getUserProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      
      if (data.success) {
        setUser(data.data);
        localStorage.setItem('user', JSON.stringify(data.data));
        return data.data;
      } else {
        setError(data.message || 'Failed to fetch profile');
        return null;
      }
    } catch (err) {
      setError('Failed to fetch profile');
      console.error('Error fetching profile:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    getUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 
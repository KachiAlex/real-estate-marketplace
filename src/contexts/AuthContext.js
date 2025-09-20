import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

// Mock users for authentication
const mockUsers = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    password: 'password123',
    role: 'user',
    roles: ['buyer', 'vendor'], // User can be both buyer and vendor
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: '2',
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin',
    roles: ['admin', 'buyer', 'vendor'], // Admin can access all roles
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: '3',
    firstName: 'Onyedikachi',
    lastName: 'Akoma',
    email: 'onyedika.akoma@gmail.com',
    password: 'dikaoliver2660',
    role: 'user',
    roles: ['buyer', 'vendor'], // User can be both buyer and vendor
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face'
  }
];

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [redirectUrl, setRedirectUrl] = useState(null);
  const [activeRole, setActiveRole] = useState('buyer'); // Default role

  // Check for existing session and redirect URL on load
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    const savedRedirectUrl = localStorage.getItem('authRedirectUrl');
    const savedActiveRole = localStorage.getItem('activeRole');
    
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('currentUser');
      }
    }
    
    if (savedRedirectUrl) {
      setRedirectUrl(savedRedirectUrl);
    }
    
    if (savedActiveRole) {
      setActiveRole(savedActiveRole);
    }
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    
    try {
      const foundUser = mockUsers.find(u => u.email === email && u.password === password);
      
      if (!foundUser) {
        throw new Error('Invalid email or password');
      }

      const { password: _, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword);
      localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
      
      // Handle redirect after login
      const redirectTo = redirectUrl || localStorage.getItem('authRedirectUrl');
      console.log('AuthContext: Login successful, checking redirect...');
      console.log('AuthContext: redirectUrl state:', redirectUrl);
      console.log('AuthContext: localStorage authRedirectUrl:', localStorage.getItem('authRedirectUrl'));
      console.log('AuthContext: final redirectTo:', redirectTo);
      
      if (redirectTo) {
        setRedirectUrl(null);
        localStorage.removeItem('authRedirectUrl');
      }
      
      toast.success('Login successful!');
      return { success: true, user: userWithoutPassword, redirectUrl: redirectTo };
    } catch (error) {
      setError(error.message);
      toast.error(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      const { firstName, lastName, email, password } = userData;
      
      // Check if user already exists
      const existingUser = mockUsers.find(u => u.email === email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      const newUser = {
        id: Date.now().toString(),
        firstName,
        lastName,
        email,
        role: 'user',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
      };

      // Add to mock users (in real app, this would be saved to database)
      mockUsers.push({ ...newUser, password });
      
      const { password: _, ...userWithoutPassword } = newUser;
      setUser(userWithoutPassword);
      localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
      
      // Handle redirect after registration
      const redirectTo = redirectUrl || localStorage.getItem('authRedirectUrl');
      if (redirectTo) {
        setRedirectUrl(null);
        localStorage.removeItem('authRedirectUrl');
      }
      
      toast.success('Registration successful!');
      return { success: true, user: userWithoutPassword, redirectUrl: redirectTo };
    } catch (error) {
      setError(error.message);
      toast.error(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      localStorage.removeItem('currentUser');
      toast.success('Logged out successfully');
      return { success: true };
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Error logging out');
      return { success: false, error: error.message };
    }
  };

  const updateUserProfile = async (updates) => {
    try {
      if (!user) throw new Error('User must be logged in');
      
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      
      toast.success('Profile updated successfully!');
      return { success: true, user: updatedUser };
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
      return { success: false, error: error.message };
    }
  };

  const setAuthRedirect = (url) => {
    setRedirectUrl(url);
    localStorage.setItem('authRedirectUrl', url);
  };

  const clearAuthRedirect = () => {
    setRedirectUrl(null);
    localStorage.removeItem('authRedirectUrl');
  };

  // Role switching functions
  const switchRole = async (newRole) => {
    console.log('Switching role to:', newRole);
    
    if (!user) {
      toast.error('Please login to switch roles');
      return { success: false, error: 'User not logged in', requiresLogin: true };
    }
    
    // Check if user has the requested role
    if (!user.roles || !user.roles.includes(newRole)) {
      if (newRole === 'vendor') {
        // For vendor role, show registration prompt instead of error
        console.log('User does not have vendor role, prompting for vendor registration');
        return { success: false, error: 'Vendor registration required', requiresVendorRegistration: true };
      } else {
        toast.error(`You don't have access to ${newRole} role`);
        return { success: false, error: `Access denied for ${newRole} role` };
      }
    }
    
    try {
      setActiveRole(newRole);
      localStorage.setItem('activeRole', newRole);
      
      // Update user object with active role
      const updatedUser = { ...user, activeRole: newRole };
      setUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      
      toast.success(`Switched to ${newRole} dashboard`);
      
      // Navigate to appropriate dashboard
      if (newRole === 'vendor') {
        window.location.href = '/vendor/dashboard';
      } else if (newRole === 'buyer') {
        window.location.href = '/dashboard';
      } else if (newRole === 'admin') {
        window.location.href = '/admin/dashboard';
      }
      
      return { success: true, role: newRole };
    } catch (error) {
      console.error('Error switching role:', error);
      toast.error('Failed to switch role');
      return { success: false, error: error.message };
    }
  };

  // Role checking functions
  const isBuyer = () => {
    return activeRole === 'buyer' && user?.roles?.includes('buyer');
  };

  const isVendor = () => {
    return activeRole === 'vendor' && user?.roles?.includes('vendor');
  };

  const isAdmin = () => {
    return activeRole === 'admin' && user?.roles?.includes('admin');
  };

  // Vendor registration function
  const registerAsVendor = async (vendorData = {}) => {
    console.log('Registering user as vendor:', vendorData);
    
    if (!user) {
      toast.error('Please login to register as vendor');
      return { success: false, error: 'User not logged in' };
    }
    
    try {
      // Update user with vendor role and data
      const updatedRoles = user.roles ? [...user.roles, 'vendor'] : ['buyer', 'vendor'];
      const updatedUser = {
        ...user,
        roles: updatedRoles,
        activeRole: 'vendor',
        vendorData: {
          ...vendorData,
          registeredAt: new Date().toISOString(),
          status: 'active'
        }
      };
      
      // Update state and localStorage
      setUser(updatedUser);
      setActiveRole('vendor');
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      localStorage.setItem('activeRole', 'vendor');
      
      toast.success('Successfully registered as vendor!');
      
      // Navigate to vendor dashboard
      setTimeout(() => {
        window.location.href = '/vendor/dashboard';
      }, 1000);
      
      return { success: true, user: updatedUser };
    } catch (error) {
      console.error('Error registering as vendor:', error);
      toast.error('Failed to register as vendor');
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    loading,
    error,
    redirectUrl,
    activeRole,
    login,
    register,
    logout,
    updateUserProfile,
    setAuthRedirect,
    clearAuthRedirect,
    switchRole,
    isBuyer,
    isVendor,
    isAdmin,
    registerAsVendor
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../config/firebase';
import { 
  onAuthStateChanged, 
  signInAnonymously, 
  signInWithPopup, 
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  updateProfile
} from 'firebase/auth';
import toast from 'react-hot-toast';

// Mock users for authentication - includes all vendor accounts from documentation
const mockUsers = [
  // Property Owners
  {
    id: 'user_001',
    firstName: 'Adebayo',
    lastName: 'Oluwaseun',
    email: 'adebayo.oluwaseun@gmail.com',
    password: 'password123',
    role: 'user',
    roles: ['buyer', 'vendor'],
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: 'user_002',
    firstName: 'Chioma',
    lastName: 'Nwosu',
    email: 'chioma.nwosu@yahoo.com',
    password: 'password123',
    role: 'user',
    roles: ['buyer', 'vendor'],
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: 'user_003',
    firstName: 'Emmanuel',
    lastName: 'Adeyemi',
    email: 'emmanuel.adeyemi@hotmail.com',
    password: 'password123',
    role: 'user',
    roles: ['buyer', 'vendor'],
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: 'user_004',
    firstName: 'Fatima',
    lastName: 'Ibrahim',
    email: 'fatima.ibrahim@gmail.com',
    password: 'password123',
    role: 'user',
    roles: ['buyer', 'vendor'],
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: 'user_005',
    firstName: 'Oluwaseun',
    lastName: 'Akoma',
    email: 'oluwaseun.akoma@gmail.com',
    password: 'password123',
    role: 'vendor',
    roles: ['buyer', 'vendor'],
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: 'user_006',
    firstName: 'Blessing',
    lastName: 'Okafor',
    email: 'blessing.okafor@outlook.com',
    password: 'password123',
    role: 'user',
    roles: ['buyer', 'vendor'],
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: 'user_007',
    firstName: 'Ibrahim',
    lastName: 'Musa',
    email: 'ibrahim.musa@gmail.com',
    password: 'password123',
    role: 'user',
    roles: ['buyer', 'vendor'],
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: 'user_008',
    firstName: 'Grace',
    lastName: 'Eze',
    email: 'grace.eze@yahoo.com',
    password: 'password123',
    role: 'user',
    roles: ['buyer', 'vendor'],
    avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: 'user_009',
    firstName: 'Kemi',
    lastName: 'Adebayo',
    email: 'kemi.adebayo@gmail.com',
    password: 'password123',
    role: 'user',
    roles: ['buyer', 'vendor'],
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: 'user_010',
    firstName: 'Tunde',
    lastName: 'Ogunlana',
    email: 'tunde.ogunlana@hotmail.com',
    password: 'password123',
    role: 'user',
    roles: ['buyer', 'vendor'],
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: 'user_011',
    firstName: 'Onyedikachi',
    lastName: 'Akoma',
    email: 'onyedika.akoma@gmail.com',
    password: 'dikaoliver2660',
    role: 'user',
    roles: ['buyer', 'vendor'],
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
  },
  // Vendor Accounts
  {
    id: 'agent_001',
    firstName: 'Emeka',
    lastName: 'Okafor',
    email: 'emeka.okafor@lagosagents.com',
    password: 'agent123',
    role: 'vendor',
    roles: ['vendor'],
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: 'agent_002',
    firstName: 'Fatima',
    lastName: 'Ibrahim',
    email: 'fatima.ibrahim@abujaagents.com',
    password: 'agent123',
    role: 'vendor',
    roles: ['vendor'],
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: 'agent_003',
    firstName: 'Chidi',
    lastName: 'Nwankwo',
    email: 'chidi.nwankwo@riversagents.com',
    password: 'agent123',
    role: 'vendor',
    roles: ['vendor'],
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: 'owner_001',
    firstName: 'Aisha',
    lastName: 'Mohammed',
    email: 'aisha.mohammed@propertyowner.com',
    password: 'owner123',
    role: 'vendor',
    roles: ['vendor'],
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
  },
  // Admin Account
  {
    id: 'admin_001',
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@kikiestate.com',
    password: 'admin123',
    role: 'admin',
    roles: ['admin', 'buyer', 'vendor'],
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
  },
  // Legacy test accounts
  {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    password: 'password123',
    role: 'user',
    roles: ['buyer', 'vendor'],
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: '2',
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin',
    roles: ['admin', 'buyer', 'vendor'],
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [redirectUrl, setRedirectUrl] = useState(null);
  const [activeRole, setActiveRole] = useState('buyer'); // Default role
  const [firebaseAuthReady, setFirebaseAuthReady] = useState(false);

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
    // Mark hydration complete; onAuthStateChanged will also flip loading to false
    setLoading(false);
  }, []);

  // Ensure Firebase Auth is initialized (anonymous sign-in) so Firestore rules see request.auth != null
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      try {
        // Check if we already have a saved user from localStorage
        const savedUser = localStorage.getItem('currentUser');
        
        if (savedUser) {
          // User already logged in via mock authentication
          try {
            const userData = JSON.parse(savedUser);
            setUser(userData);
            setFirebaseAuthReady(true);
            setLoading(false);
            return; // Don't create guest user
          } catch (error) {
            console.error('Error parsing saved user:', error);
            localStorage.removeItem('currentUser');
          }
        }
        
        // No saved user - check Firebase auth
        if (!fbUser) {
          await signInAnonymously(auth);
          return; // wait for next auth state change where user exists
        }
        
        // We have a Firebase user (anonymous or real)
        setFirebaseAuthReady(true);

        // Only create guest if we truly have no saved user
        if (!savedUser) {
          const synthesized = {
            id: fbUser.uid,
            firstName: 'Guest',
            lastName: 'User',
            email: fbUser.email || 'anonymous@guest.local',
            role: 'user',
            roles: ['buyer'],
            activeRole: 'buyer',
            avatar: 'https://picsum.photos/150/150'
          };
          setUser(synthesized);
          localStorage.setItem('currentUser', JSON.stringify(synthesized));
          localStorage.setItem('activeRole', 'buyer');
        }
        // Auth is ready at this point
        setLoading(false);
      } catch (e) {
        console.warn('Anonymous sign-in failed:', e?.message || e);
        setLoading(false);
      }
    });
    return () => unsub();
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
      console.log('AuthContext: Login successful for user:', userWithoutPassword);
      console.log('AuthContext: User role:', userWithoutPassword.role);
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
      // Attempt to sync any locally stored inspection requests now that user is logged in
      try {
        const { syncLocalInspectionRequests } = await import('../services/inspectionService');
        await syncLocalInspectionRequests();
      } catch (e) {
        console.warn('Inspection requests sync skipped or failed:', e?.message || e);
      }
      // Register FCM token after login
      try {
        const { registerFcmToken } = await import('../services/messagingService');
        const token = await registerFcmToken(process.env.REACT_APP_FIREBASE_VAPID_KEY);
        if (token) {
          const { db } = await import('../config/firebase');
          const { doc, setDoc, arrayUnion } = await import('firebase/firestore');
          await setDoc(doc(db, 'userFcmTokens', userWithoutPassword.id), { tokens: arrayUnion(token) }, { merge: true });
        }
      } catch (e) {
        console.warn('FCM registration skipped or failed:', e?.message || e);
      }
      return { success: true, user: userWithoutPassword, redirectUrl: redirectTo };
    } catch (error) {
      setError(error.message);
      toast.error(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Google Sign-In function
  const signInWithGoogle = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const result = await signInWithPopup(auth, provider);
      const fbUser = result.user;
      
      // Extract name from displayName
      const nameParts = fbUser.displayName?.split(' ') || [];
      const firstName = nameParts[0] || 'User';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      // Create user object
      const googleUser = {
        id: fbUser.uid,
        firstName,
        lastName,
        email: fbUser.email,
        role: 'user',
        roles: ['buyer', 'vendor'],
        activeRole: 'buyer',
        avatar: fbUser.photoURL || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        provider: 'google'
      };
      
      // Check if this email exists in mock users
      const existingMockUser = mockUsers.find(u => u.email === fbUser.email);
      if (existingMockUser) {
        // Use existing user's roles and role
        googleUser.role = existingMockUser.role;
        googleUser.roles = existingMockUser.roles;
        
        // Update profile with Google data
        if (fbUser.photoURL) {
          await updateProfile(fbUser, { photoURL: fbUser.photoURL });
        }
      }
      
      setUser(googleUser);
      localStorage.setItem('currentUser', JSON.stringify(googleUser));
      localStorage.setItem('activeRole', googleUser.activeRole);
      
      // Handle redirect after login
      const redirectTo = redirectUrl || localStorage.getItem('authRedirectUrl');
      if (redirectTo) {
        setRedirectUrl(null);
        localStorage.removeItem('authRedirectUrl');
      }
      
      toast.success('Signed in with Google successfully!');
      
      // Register FCM token after login
      try {
        const { registerFcmToken } = await import('../services/messagingService');
        const token = await registerFcmToken(process.env.REACT_APP_FIREBASE_VAPID_KEY);
        if (token) {
          const { db } = await import('../config/firebase');
          const { doc, setDoc, arrayUnion } = await import('firebase/firestore');
          await setDoc(doc(db, 'userFcmTokens', googleUser.id), { tokens: arrayUnion(token) }, { merge: true });
        }
      } catch (e) {
        console.warn('FCM registration skipped or failed:', e?.message || e);
      }
      
      return { success: true, user: googleUser, redirectUrl: redirectTo };
    } catch (error) {
      console.error('Google sign-in error:', error);
      setError(error.message);
      toast.error(error.message || 'Failed to sign in with Google');
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
    firebaseAuthReady,
    login,
    signInWithGoogle,
    register,
    logout,
    updateUserProfile,
    setAuthRedirect,
    clearAuthRedirect,
    switchRole,
    isBuyer,
    isVendor,
    isAdmin,
    registerAsVendor,
    setUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
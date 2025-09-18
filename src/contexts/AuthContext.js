import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

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

  // Check if user is logged in on app start
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get additional user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          const userData = userDoc.exists() ? userDoc.data() : null;
          
          const userWithData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            roles: userData?.roles || ['buyer'],
            activeRole: userData?.activeRole || 'buyer',
            ...userData
          };
          
          setUser(userWithData);
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUser(firebaseUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const register = async (userData) => {
    try {
      setError(null);
      setLoading(true);

      const { email, password, firstName, lastName } = userData;
      
      // Create user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update profile with display name
      await updateProfile(user, {
        displayName: `${firstName} ${lastName}`
      });

      // Create user document in Firestore
      const userDocData = {
        uid: user.uid,
        email: user.email,
        firstName,
        lastName,
        displayName: `${firstName} ${lastName}`,
        roles: ['buyer'],
        activeRole: 'buyer',
        avatar: `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=1e40af&color=fff`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', user.uid), userDocData);

      setUser(userDocData);
      return { success: true, user: userDocData };
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Get additional user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.exists() ? userDoc.data() : null;

      const userWithData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        roles: userData?.roles || ['buyer'],
        activeRole: userData?.activeRole || 'buyer',
        ...userData
      };

      setUser(userWithData);
      return { success: true, user: userWithData };
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await signOut(auth);
      setUser(null);
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  const updateUserProfile = async (updates) => {
    try {
      if (!user) throw new Error('No user logged in');

      setError(null);
      
      // Update Firebase Auth profile if needed
      if (updates.displayName || updates.photoURL) {
        await updateProfile(auth.currentUser, {
          displayName: updates.displayName || user.displayName,
          photoURL: updates.photoURL || user.photoURL
        });
      }

      // Update Firestore document
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // Update local state
      setUser(prev => ({
        ...prev,
        ...updates,
        updatedAt: new Date().toISOString()
      }));

      return { success: true };
    } catch (error) {
      console.error('Profile update error:', error);
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  // Role helpers and switching
  const isBuyer = user?.activeRole === 'buyer';
  const isVendor = user?.activeRole === 'vendor';

  const switchRole = async (nextRole) => {
    if (!user) throw new Error('No user logged in');
    if (!user.roles?.includes(nextRole)) {
      throw new Error('Role not assigned to this account');
    }
    if (user.activeRole === nextRole) return { success: true };
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, { activeRole: nextRole, updatedAt: new Date().toISOString() });
    setUser(prev => ({ ...prev, activeRole: nextRole }));
    return { success: true };
  };

  const value = {
    user,
    loading,
    error,
    register,
    login,
    logout,
    updateUserProfile,
    isBuyer,
    isVendor,
    switchRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
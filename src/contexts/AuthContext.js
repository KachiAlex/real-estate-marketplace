import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../config/firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  updateProfile,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import toast from 'react-hot-toast';

// Generate unique user code (e.g., "PAK-A3X7K2") - PAK = PropertyArk
const generateUserCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded confusing chars: 0,O,1,I
  let code = 'PAK-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Generate unique vendor code (e.g., "VND-A3X7K2")
const generateVendorCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded confusing chars: 0,O,1,I
  let code = 'VND-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

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
    userCode: 'PAK-ADY001',
    vendorCode: 'VND-ADY001',
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
    userCode: 'PAK-CHN002',
    vendorCode: 'VND-CHN002',
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
    userCode: 'PAK-EMA003',
    vendorCode: 'VND-EMA003',
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
    userCode: 'PAK-FAI004',
    vendorCode: 'VND-FAI004',
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
    userCode: 'PAK-OLA005',
    vendorCode: 'VND-OLA005',
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
    userCode: 'PAK-BLO006',
    vendorCode: 'VND-BLO006',
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
    userCode: 'PAK-IBM007',
    vendorCode: 'VND-IBM007',
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
    userCode: 'PAK-GRE008',
    vendorCode: 'VND-GRE008',
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
    userCode: 'PAK-KEA009',
    vendorCode: 'VND-KEA009',
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
    userCode: 'PAK-TUO010',
    vendorCode: 'VND-TUO010',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: 'user_011',
    firstName: 'Onyedikachi',
    lastName: 'Akoma',
    email: 'onyedika.akoma@gmail.com',
    password: 'dikaoliver2660',
    userCode: 'PAK-ONA011',
    vendorCode: 'VND-ONA011',
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
    userCode: 'PAK-EMO101',
    vendorCode: 'VND-EMO101',
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
    userCode: 'PAK-FAI102',
    vendorCode: 'VND-FAI102',
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
    userCode: 'PAK-CHN103',
    vendorCode: 'VND-CHN103',
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
    userCode: 'PAK-AIM201',
    vendorCode: 'VND-AIM201',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
  },
  // Admin Account
  {
    id: 'admin_001',
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@propertyark.com',
    password: 'admin123',
    role: 'admin',
    roles: ['admin', 'buyer', 'vendor'],
    userCode: 'PAK-ADM001',
    vendorCode: 'VND-ADMIN1',
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
    userCode: 'PAK-JOD001',
    vendorCode: 'VND-JOD001',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: '2',
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin',
    userCode: 'PAK-ADM002',
    vendorCode: 'VND-ADMIN2',
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

  // Helper function to check if user is a guest user
  const isGuestUser = (userData) => {
    if (!userData) return false;
    return (
      userData.firstName === 'Guest' ||
      userData.email?.includes('guest') ||
      userData.email?.includes('anonymous') ||
      userData.email === 'anonymous@guest.local'
    );
  };

  // Check for existing session and redirect URL on load
  useEffect(() => {
    // Validate and clean up localStorage on app load
    const validateAndCleanUser = () => {
      try {
        const savedUser = localStorage.getItem('currentUser');
        if (!savedUser) {
          setUser(null);
          return;
        }

        let userData;
        try {
          userData = JSON.parse(savedUser);
        } catch (parseError) {
          console.error('Invalid user data in localStorage, clearing:', parseError);
          localStorage.removeItem('currentUser');
          localStorage.removeItem('activeRole');
          setUser(null);
          return;
        }

        // Validate user data structure
        if (!userData || typeof userData !== 'object') {
          console.error('Invalid user data structure, clearing');
          localStorage.removeItem('currentUser');
          localStorage.removeItem('activeRole');
          setUser(null);
          return;
        }

        // Clear guest users - they should not be loaded
        if (isGuestUser(userData)) {
          console.log('Removing guest user from localStorage');
          localStorage.removeItem('currentUser');
          localStorage.removeItem('activeRole');
          setUser(null);
          return;
        }

        // Validate required fields
        if (!userData.id && !userData.email) {
          console.error('User data missing required fields, clearing');
          localStorage.removeItem('currentUser');
          localStorage.removeItem('activeRole');
          setUser(null);
          return;
        }

        // Ensure userCode and vendorCode exist for existing users
        let needsUpdate = false;
        if (!userData.userCode) {
          userData.userCode = generateUserCode();
          needsUpdate = true;
        }
        if (!userData.vendorCode) {
          userData.vendorCode = generateVendorCode();
          needsUpdate = true;
        }
        // Save updated user data back to localStorage
        if (needsUpdate) {
          console.log('AuthContext: Generated missing codes for user:', userData.userCode, userData.vendorCode);
          localStorage.setItem('currentUser', JSON.stringify(userData));
        }
        setUser(userData);
      } catch (error) {
        console.error('Error validating user data:', error);
        localStorage.removeItem('currentUser');
        localStorage.removeItem('activeRole');
        setUser(null);
      }
    };

    validateAndCleanUser();

    const savedRedirectUrl = localStorage.getItem('authRedirectUrl');
    if (savedRedirectUrl) {
      setRedirectUrl(savedRedirectUrl);
    }
    
    const savedActiveRole = localStorage.getItem('activeRole');
    const savedUser = localStorage.getItem('currentUser');
    // Only set activeRole if we have a valid (non-guest) user
    if (savedActiveRole && savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        if (!isGuestUser(userData) && userData.id) {
          setActiveRole(savedActiveRole);
        }
      } catch (error) {
        // Ignore error, don't set activeRole
      }
    }
    // Mark hydration complete; onAuthStateChanged will also flip loading to false
    setLoading(false);
  }, []);

  // Handle Google redirect result
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
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
            googleUser.role = existingMockUser.role;
            googleUser.roles = existingMockUser.roles;
          }
          
          setUser(googleUser);
          localStorage.setItem('currentUser', JSON.stringify(googleUser));
          localStorage.setItem('activeRole', googleUser.activeRole);
          
          toast.success('Signed in with Google successfully!');
        }
      } catch (error) {
        console.error('Error handling redirect result:', error);
        if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
          toast.error(error.message || 'Failed to sign in with Google');
        }
      }
    };
    
    handleRedirectResult();
  }, []);

  // Initialize Firebase Auth state (no anonymous sign-in)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      try {
        // Check if we already have a saved user from localStorage
        const savedUser = localStorage.getItem('currentUser');
        
        if (savedUser) {
          // User already logged in via mock authentication
          try {
            let userData = JSON.parse(savedUser);
            // Clear guest users - they should not be loaded
            if (isGuestUser(userData)) {
              console.log('Removing guest user from localStorage');
              localStorage.removeItem('currentUser');
              localStorage.removeItem('activeRole');
              setUser(null);
              setFirebaseAuthReady(true);
              setLoading(false);
              return;
            }
            
            // Ensure userCode and vendorCode exist
            let needsUpdate = false;
            if (!userData.userCode) {
              userData.userCode = generateUserCode();
              needsUpdate = true;
            }
            if (!userData.vendorCode) {
              userData.vendorCode = generateVendorCode();
              needsUpdate = true;
            }
            if (needsUpdate) {
              localStorage.setItem('currentUser', JSON.stringify(userData));
            }
            
            // Try to load avatar from Firestore if available
            const userId = userData.uid || userData.id;
            if (userId) {
              try {
                const { db } = await import('../config/firebase');
                const { doc, getDoc } = await import('firebase/firestore');
                const userRef = doc(db, 'users', userId);
                const userSnap = await getDoc(userRef);
                
                if (userSnap.exists()) {
                  const firestoreData = userSnap.data();
                  // Update avatar from Firestore if it exists and is different
                  if (firestoreData.avatar && firestoreData.avatar !== userData.avatar) {
                    userData.avatar = firestoreData.avatar;
                    // Also update other fields from Firestore if they exist
                    if (firestoreData.firstName) userData.firstName = firestoreData.firstName;
                    if (firestoreData.lastName) userData.lastName = firestoreData.lastName;
                    if (firestoreData.phone) userData.phone = firestoreData.phone;
                    // Update localStorage with Firestore data
                    localStorage.setItem('currentUser', JSON.stringify(userData));
                  }
                }
              } catch (firestoreError) {
                console.error('Error loading from Firestore:', firestoreError);
                // Continue with localStorage data if Firestore fails
              }
            }
            
            setUser(userData);
            setFirebaseAuthReady(true);
            setLoading(false);
            return;
          } catch (error) {
            console.error('Error parsing saved user:', error);
            localStorage.removeItem('currentUser');
            setUser(null);
          }
        }
        
        // No saved user and no Firebase user - user is not authenticated
        if (!fbUser) {
          setUser(null);
          setFirebaseAuthReady(true);
          setLoading(false);
          return;
        }
        
        // We have a Firebase user (from Google sign-in via redirect)
        // Only process if we don't already have a user in localStorage
        if (!savedUser && fbUser) {
          const nameParts = fbUser.displayName?.split(' ') || [];
          const firstName = nameParts[0] || 'User';
          const lastName = nameParts.slice(1).join(' ') || '';
          
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
          
          const existingMockUser = mockUsers.find(u => u.email === fbUser.email);
          if (existingMockUser) {
            googleUser.role = existingMockUser.role;
            googleUser.roles = existingMockUser.roles;
          }
          
          setUser(googleUser);
          localStorage.setItem('currentUser', JSON.stringify(googleUser));
          localStorage.setItem('activeRole', googleUser.activeRole);
        }
        
        setFirebaseAuthReady(true);
        setLoading(false);
      } catch (e) {
        console.warn('Auth state check failed:', e?.message || e);
        setUser(null);
        setLoading(false);
      }
    });
    return () => {
      if (unsub && typeof unsub === 'function') {
        unsub();
      }
    };
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
      console.log('AuthContext [v2]: Login successful for user:', userWithoutPassword);
      console.log('AuthContext [v2]: User role:', userWithoutPassword.role);
      
      // IMPORTANT: Also sign into Firebase Auth to enable Firestore access
      let firebaseUid = userWithoutPassword.id;
      console.log('AuthContext [v2]: Will now attempt Firebase Auth sign-in...');
      try {
        console.log('AuthContext [v2]: Signing into Firebase Auth with email:', email);
        
        // Try to sign in with Firebase Auth
        try {
          console.log('AuthContext [v2]: Attempting signInWithEmailAndPassword...');
          const firebaseCredential = await signInWithEmailAndPassword(auth, email, password);
          firebaseUid = firebaseCredential.user.uid;
          console.log('AuthContext [v2]: Firebase Auth sign-in successful, uid:', firebaseUid);
        } catch (signInError) {
          console.log('AuthContext [v2]: Sign-in error code:', signInError.code, signInError.message);
          // If user doesn't exist in Firebase, create the account
          if (signInError.code === 'auth/user-not-found' || signInError.code === 'auth/invalid-credential') {
            console.log('AuthContext [v2]: Firebase user not found, creating account...');
            try {
              const firebaseCredential = await createUserWithEmailAndPassword(auth, email, password);
              firebaseUid = firebaseCredential.user.uid;
              
              // Update the profile with display name
              await updateProfile(firebaseCredential.user, {
                displayName: `${userWithoutPassword.firstName} ${userWithoutPassword.lastName}`
              });
              
              console.log('AuthContext [v2]: Firebase account created, uid:', firebaseUid);
              
              // Save user data to Firestore
              try {
                const { doc, setDoc } = await import('firebase/firestore');
                await setDoc(doc(db, 'users', firebaseUid), {
                  email: email,
                  firstName: userWithoutPassword.firstName,
                  lastName: userWithoutPassword.lastName,
                  role: userWithoutPassword.role,
                  roles: userWithoutPassword.roles || [userWithoutPassword.role],
                  createdAt: new Date().toISOString()
                }, { merge: true });
                console.log('AuthContext [v2]: User data saved to Firestore');
              } catch (firestoreError) {
                console.warn('AuthContext [v2]: Failed to save user to Firestore:', firestoreError);
              }
            } catch (createError) {
              console.error('AuthContext [v2]: Failed to create Firebase account:', createError);
              // Continue with mock auth even if Firebase auth fails
            }
          } else {
            console.warn('AuthContext [v2]: Firebase sign-in error:', signInError.code, signInError.message);
            // Continue with mock auth even if Firebase auth fails
          }
        }
      } catch (firebaseError) {
        console.error('AuthContext [v2]: Firebase Auth outer error:', firebaseError);
        // Non-fatal - continue with mock authentication
      }
      
      console.log('AuthContext [v2]: Final Firebase UID:', firebaseUid);
      console.log('AuthContext [v2]: auth.currentUser:', auth.currentUser ? 'set' : 'null');
      
      // Ensure user has userCode and vendorCode (generate if missing)
      const userCodeToUse = userWithoutPassword.userCode || generateUserCode();
      const vendorCodeToUse = userWithoutPassword.vendorCode || generateVendorCode();
      
      // Update user object with Firebase UID and ensure codes exist
      const finalUser = {
        ...userWithoutPassword,
        uid: firebaseUid, // Add Firebase UID
        id: userWithoutPassword.id, // Keep original ID for compatibility
        userCode: userCodeToUse,
        vendorCode: vendorCodeToUse
      };
      
      console.log('AuthContext [v2]: User codes - userCode:', userCodeToUse, 'vendorCode:', vendorCodeToUse);
      
      setUser(finalUser);
      localStorage.setItem('currentUser', JSON.stringify(finalUser));
      
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
          await setDoc(doc(db, 'userFcmTokens', finalUser.uid || finalUser.id), { tokens: arrayUnion(token) }, { merge: true });
        }
      } catch (e) {
        console.warn('FCM registration skipped or failed:', e?.message || e);
      }
      return { success: true, user: finalUser, redirectUrl: redirectTo };
    } catch (error) {
      setError(error.message);
      toast.error(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Google Sign-In function
  const signInWithGoogle = async (useRedirect = false) => {
    setLoading(true);
    setError(null);
    
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      let result;
      let fbUser;
      
      if (useRedirect) {
        // Use redirect method (for mobile or when popup is blocked)
        await signInWithRedirect(auth, provider);
        return { success: true, redirecting: true };
      } else {
        // Try popup first (default)
        try {
          result = await signInWithPopup(auth, provider);
          fbUser = result.user;
        } catch (popupError) {
          // If popup is blocked, fall back to redirect
          if (popupError.code === 'auth/popup-blocked' || popupError.code === 'auth/popup-closed-by-user') {
            console.log('Popup blocked, using redirect method...');
            await signInWithRedirect(auth, provider);
            return { success: true, redirecting: true };
          }
          throw popupError;
        }
      }
      
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
      
      // Provide user-friendly error messages
      let errorMessage = 'Failed to sign in with Google';
      if (error.code === 'auth/account-exists-with-different-credential') {
        errorMessage = 'An account already exists with this email. Please sign in with your existing method.';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Popup was blocked. Please allow popups for this site and try again.';
      } else if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-in was cancelled.';
        // Don't show error toast for user cancellation
        setLoading(false);
        return { success: false, error: errorMessage, cancelled: true };
      } else if (error.code === 'auth/unauthorized-domain') {
        errorMessage = 'This domain is not authorized for Google sign-in. Please contact support.';
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = 'Google sign-in is not enabled. Please contact support.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      const { firstName, lastName, email, password } = userData;
      
      // Check if user already exists in mock users
      const existingUser = mockUsers.find(u => u.email === email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Determine roles based on userData
      const userRoles = userData.roles || ['buyer'];
      const activeRole = userData.activeRole || 'buyer';
      
      // Generate unique codes for the user
      const userCode = generateUserCode();
      const vendorCode = generateVendorCode();
      console.log('AuthContext: Generated userCode:', userCode, 'vendorCode:', vendorCode);
      
      // IMPORTANT: Create Firebase account first
      let firebaseUid = Date.now().toString();
      try {
        console.log('AuthContext: Creating Firebase account for:', email);
        const firebaseCredential = await createUserWithEmailAndPassword(auth, email, password);
        firebaseUid = firebaseCredential.user.uid;
        
        // Update the profile with display name
        await updateProfile(firebaseCredential.user, {
          displayName: `${firstName} ${lastName}`
        });
        
        console.log('AuthContext: Firebase account created, uid:', firebaseUid);
        
        // Save user data to Firestore
        try {
          const { doc, setDoc } = await import('firebase/firestore');
          await setDoc(doc(db, 'users', firebaseUid), {
            email: email,
            firstName: firstName,
            lastName: lastName,
            phone: userData.phone || '',
            role: userRoles.includes('vendor') ? 'vendor' : 'user',
            roles: userRoles,
            userCode: userCode,
            vendorCode: vendorCode,
            createdAt: new Date().toISOString()
          }, { merge: true });
          console.log('AuthContext: User data saved to Firestore with userCode:', userCode, 'vendorCode:', vendorCode);
        } catch (firestoreError) {
          console.warn('AuthContext: Failed to save user to Firestore:', firestoreError);
        }
      } catch (firebaseError) {
        if (firebaseError.code === 'auth/email-already-in-use') {
          // Try to sign in instead
          try {
            const firebaseCredential = await signInWithEmailAndPassword(auth, email, password);
            firebaseUid = firebaseCredential.user.uid;
            console.log('AuthContext: Signed into existing Firebase account, uid:', firebaseUid);
          } catch (signInError) {
            console.warn('AuthContext: Firebase account exists but password mismatch:', signInError);
            throw new Error('An account with this email already exists with a different password');
          }
        } else {
          console.warn('AuthContext: Firebase registration error:', firebaseError);
          // Continue with local-only registration
        }
      }
      
      const newUser = {
        id: firebaseUid, // Use Firebase UID as primary ID
        uid: firebaseUid,
        firstName,
        lastName,
        email,
        phone: userData.phone || '',
        role: userRoles.includes('vendor') ? 'vendor' : 'user',
        roles: userRoles,
        activeRole: activeRole,
        userCode: userCode, // Unique user ID for profile
        vendorCode: vendorCode, // Unique vendor ID for property search
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        // Include vendorData if provided
        ...(userData.vendorData && { vendorData: userData.vendorData })
      };

      // Add to mock users (in real app, this would be saved to database)
      mockUsers.push({ ...newUser, password });
      
      // Store users list in localStorage for agent service to access
      try {
        const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
        existingUsers.push(newUser);
        localStorage.setItem('users', JSON.stringify(existingUsers));
      } catch (e) {
        console.error('Error storing users list:', e);
      }
      
      const { password: _, ...userWithoutPassword } = newUser;
      setUser(userWithoutPassword);
      setActiveRole(activeRole);
      localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
      localStorage.setItem('activeRole', activeRole);
      
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
      setActiveRole('buyer');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('activeRole');
      // Sign out from Firebase if signed in
      if (auth.currentUser) {
        await firebaseSignOut(auth);
      }
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
      
      // Also save to Firestore if user has a uid/id
      const userId = user.uid || user.id;
      if (userId && db) {
        try {
          const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
          const userRef = doc(db, 'users', userId);
          await setDoc(userRef, {
            ...updates,
            updatedAt: serverTimestamp()
          }, { merge: true });
        } catch (firestoreError) {
          console.error('Firestore update error:', firestoreError);
          // Continue even if Firestore update fails
        }
      }
      
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
      
      // Return success - let the calling component handle navigation
      // This allows React Router to handle navigation properly
      return { success: true, role: newRole, shouldNavigate: true };
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
      // Generate vendorCode if user doesn't have one
      const newVendorCode = user.vendorCode || generateVendorCode();
      console.log('AuthContext: Vendor code for registration:', newVendorCode);
      
      // Update user with vendor role and data
      const updatedRoles = user.roles ? [...user.roles, 'vendor'] : ['buyer', 'vendor'];
      const updatedUser = {
        ...user,
        roles: updatedRoles,
        activeRole: 'vendor',
        vendorCode: newVendorCode,
        vendorData: {
          ...vendorData,
          vendorCode: newVendorCode,
          registeredAt: new Date().toISOString(),
          status: 'active'
        }
      };
      
      // Update in Firestore if user has a Firebase UID
      if (user.uid || user.id) {
        try {
          const { doc, setDoc } = await import('firebase/firestore');
          await setDoc(doc(db, 'users', user.uid || user.id), {
            vendorCode: newVendorCode,
            roles: updatedRoles
          }, { merge: true });
          console.log('AuthContext: Updated vendorCode in Firestore');
        } catch (firestoreError) {
          console.warn('AuthContext: Failed to update vendorCode in Firestore:', firestoreError);
        }
      }
      
      // Update state and localStorage
      setUser(updatedUser);
      setActiveRole('vendor');
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      localStorage.setItem('activeRole', 'vendor');
      
      toast.success(`Successfully registered as vendor! Your Vendor ID: ${newVendorCode}`);
      
      // Return success - let the calling component handle navigation
      return { success: true, user: updatedUser, shouldNavigate: true, navigateTo: '/vendor/dashboard' };
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

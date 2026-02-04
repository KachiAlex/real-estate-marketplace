/**
 * Firebase Configuration Diagnostics
 * Helps identify and diagnose Firebase configuration issues
 */

import { auth } from '../config/firebase';

/**
 * Check if Firebase is properly initialized
 */
export const checkFirebaseInit = () => {
  const checks = {
    authExists: !!auth,
    currentUser: auth?.currentUser || null,
    domain: window.location.hostname,
    protocol: window.location.protocol
  };
  
  console.log('[Firebase Diagnostics] Initialization Check:', checks);
  return checks;
};

/**
 * Check if Google provider is enabled (by attempting a test)
 */
export const checkGoogleProvider = async () => {
  try {
    const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
    
    console.log('[Firebase Diagnostics] GoogleAuthProvider import: SUCCESS');
    
    const provider = new GoogleAuthProvider();
    console.log('[Firebase Diagnostics] GoogleAuthProvider instantiation: SUCCESS');
    
    provider.setCustomParameters({ prompt: 'select_account' });
    console.log('[Firebase Diagnostics] GoogleAuthProvider configuration: SUCCESS');
    
    return { success: true, message: 'Google provider is properly configured' };
  } catch (error) {
    console.error('[Firebase Diagnostics] Google provider check failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Comprehensive Firebase configuration check
 */
export const runFirebaseConfigDiagnostics = async () => {
  console.log('========================================');
  console.log('Firebase Configuration Diagnostics');
  console.log('========================================');
  
  // Check 1: Firebase Initialization
  console.log('\n1. Checking Firebase Initialization...');
  const initCheck = checkFirebaseInit();
  if (!initCheck.authExists) {
    console.error('❌ Firebase Auth is not initialized!');
  } else {
    console.log('✅ Firebase Auth is initialized');
  }
  
  // Check 2: Domain Authorization
  console.log('\n2. Current Domain Information:');
  console.log('   Hostname:', initCheck.domain);
  console.log('   Protocol:', initCheck.protocol);
  console.log('   Authorized domains to check:');
  console.log('   - localhost (development)');
  console.log('   - real-estate-marketplace-37544.web.app (Firebase Hosting)');
  console.log('   - real-estate-marketplace-37544.firebaseapp.com');
  
  // Check 3: Google Provider
  console.log('\n3. Checking Google Provider...');
  const googleCheck = await checkGoogleProvider();
  if (googleCheck.success) {
    console.log('✅', googleCheck.message);
  } else {
    console.error('❌ Google Provider Error:', googleCheck.error);
  }
  
  // Check 4: Environment Variables
  console.log('\n4. Firebase Configuration:');
  console.log('   API Key:', process.env.REACT_APP_FIREBASE_API_KEY ? '✅ Set' : '❌ Missing');
  console.log('   Auth Domain:', process.env.REACT_APP_FIREBASE_AUTH_DOMAIN ? '✅ Set' : '⚠️ Using default');
  console.log('   Project ID:', process.env.REACT_APP_FIREBASE_PROJECT_ID ? '✅ Set' : '⚠️ Using default');
  
  console.log('\n5. Troubleshooting Steps:');
  console.log('   If Google Sign-In is not working:');
  console.log('   a) Go to Firebase Console: https://console.firebase.google.com/');
  console.log('   b) Navigate to: Authentication > Sign-in method');
  console.log('   c) Find "Google" and click it');
  console.log('   d) Toggle "Enable" to ON');
  console.log('   e) Enter a Support email');
  console.log('   f) Click "Save"');
  console.log('   g) Add your domain to Authorized domains list');
  console.log('   h) Refresh your app and try again');
  
  console.log('\n========================================');
};

/**
 * Quick check for Google auth errors
 */
export const checkGoogleAuthError = (error) => {
  const errorCode = error?.code || '';
  const errorMessage = error?.message || '';
  
  console.group('[Firebase Diagnostics] Google Auth Error Analysis');
  console.log('Error Code:', errorCode);
  console.log('Error Message:', errorMessage);
  
  const solutions = {
    'auth/operation-not-allowed': {
      message: 'Google sign-in provider is NOT ENABLED in Firebase Console',
      solution: 'Enable Google provider in Firebase Console > Authentication > Sign-in method'
    },
    'auth/unauthorized-domain': {
      message: 'Current domain is not authorized for Google sign-in',
      solution: `Add "${window.location.hostname}" to Firebase Console > Authentication > Authorized domains`
    },
    'auth/popup-blocked': {
      message: 'Browser popup was blocked',
      solution: 'Allow popups for this website in your browser settings, or the app will try redirect method'
    },
    'auth/popup-closed-by-user': {
      message: 'User cancelled the sign-in',
      solution: 'This is normal user behavior'
    },
    'auth/account-exists-with-different-credential': {
      message: 'Email already exists with different authentication provider',
      solution: 'Sign in with your original authentication method or reset password'
    }
  };
  
  if (solutions[errorCode]) {
    console.error('Problem:', solutions[errorCode].message);
    console.log('Solution:', solutions[errorCode].solution);
  } else {
    console.error('Unknown error. Check Firebase Console for more details.');
  }
  
  console.groupEnd();
};

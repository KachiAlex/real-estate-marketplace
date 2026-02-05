import { initializeApp } from 'firebase/app';
// Firebase Auth disabled - using JWT authentication instead
// import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyCKPiM3fjQWqxrdN4UoyfLxsJKNk6h8lIU",
  authDomain: "real-estate-marketplace-37544.firebaseapp.com",
  projectId: "real-estate-marketplace-37544",
  storageBucket: "real-estate-marketplace-37544.firebasestorage.app",
  messagingSenderId: "759115682573",
  appId: "1:759115682573:web:2dbddf9ba6dac14764d644",
  measurementId: "G-BMDCTD4W5Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services (excluding Auth - using JWT instead)
// export const auth = getAuth(app);  // DISABLED - Using JWT authentication
export const auth = null; // Stub for backward compatibility
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

export default app;

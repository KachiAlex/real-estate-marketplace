// Render backend API configuration
// This replaces Firebase with direct API calls to the Render backend

export const apiConfig = {
  baseURL: process.env.REACT_APP_API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://propertyark-backend.onrender.com/api',
  timeout: 10000,
};

// Stub exports for backward compatibility (if any code still references these)
export const auth = {
  currentUser: null,
  onAuthStateChanged: () => () => {},
};

export const storage = {
  ref: () => ({
    child: () => ({
      put: async () => ({}),
    }),
  }),
};

export const db = {};

export default {
  auth,
  storage,
  db,
  apiConfig,
};

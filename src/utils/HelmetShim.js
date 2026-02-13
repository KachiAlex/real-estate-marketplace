import React from 'react';

// Lightweight shim for react-helmet-async to avoid adding it as a build-time
// dependency. Exports minimal `HelmetProvider` and `Helmet` so the app can
// render without server-side head management.

export function HelmetProvider({ children }) {
  return React.createElement(React.Fragment, null, children);
}

export function Helmet() {
  return null;
}

export default { HelmetProvider, Helmet };

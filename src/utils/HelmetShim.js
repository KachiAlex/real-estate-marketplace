import React from 'react';

export function HelmetProvider({ children }) {
  return React.createElement(React.Fragment, null, children);
}

export function Helmet() {
  return null;
}

export default { HelmetProvider, Helmet };
import React from 'react';

// Lightweight shim for react-helmet-async to avoid build-time dependency
// Provides `HelmetProvider` and `Helmet` as no-op components that render children
// and allow the app to compile when the real package is unavailable.

export const HelmetProvider = ({ children }) => React.Children.only(children);

export const Helmet = ({ children }) => {
  // If meta tags are required server-side, replace with react-helmet-async implementation.
  return null;
};

export default Helmet;

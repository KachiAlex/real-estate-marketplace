// Helmet Shim - Provides a no-op implementation for server-side rendering compatibility
// In browser environments, this is a pass-through that doesn't modify the DOM

export const Helmet = ({ children }) => children;

export const HelmetProvider = ({ children }) => children;

export default Helmet;

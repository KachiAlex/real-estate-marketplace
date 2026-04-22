const isLocalhost = (value) => {
  if (!value || typeof value !== 'string') return false;
  const lower = value.toLowerCase();
  return lower.includes('localhost') || lower.includes('127.0.0.1');
};

const DEFAULT_API_BASE_URL = (() => {
  if (typeof window !== 'undefined' && isLocalhost(window.location?.hostname)) {
    return 'http://localhost:5001';
  }
  return '/api'; // Same-origin Vercel serverless functions
})();

export const getApiBaseUrl = () => DEFAULT_API_BASE_URL;

export const getApiUrl = (path = '') => {
  const base = DEFAULT_API_BASE_URL;
  if (!path) return base;
  if (path.startsWith('http')) return path;
  if (path.startsWith('/api')) return path;
  if (path.startsWith('/')) return `${base}${path}`;
  return `${base}/${path}`;
};

export default getApiBaseUrl;

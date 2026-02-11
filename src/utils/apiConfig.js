const DEFAULT_API_BASE_URL = process.env.REACT_APP_API_URL || 'https://real-estate-marketplace-1-k8jp.onrender.com';

const isLocalhost = (value) => {
  if (!value || typeof value !== 'string') return false;
  const lower = value.toLowerCase();
  return lower.includes('localhost') || lower.includes('127.0.0.1');
};

const normalizeBaseUrl = (base) => {
  if (!base) return DEFAULT_API_BASE_URL;
  let normalized = base.trim();
  if (normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }
  if (normalized.endsWith('/api')) {
    normalized = normalized.slice(0, -4);
  }
  if (!normalized) return DEFAULT_API_BASE_URL;

  // If a localhost base URL is injected into a production build, ignore it.
  if (isLocalhost(normalized) && typeof window !== 'undefined') {
    const host = window.location?.hostname || '';
    if (host && !isLocalhost(host)) {
      return DEFAULT_API_BASE_URL;
    }
  }

  return normalized || DEFAULT_API_BASE_URL;
};

export const getApiBaseUrl = () => {
  // Normalize any injected base (remove trailing slash or trailing /api)
  const envBase = process.env.REACT_APP_API_URL || DEFAULT_API_BASE_URL;
  return normalizeBaseUrl(envBase);
};

export const getApiUrl = (path = '') => {
  const base = getApiBaseUrl();
  const fullUrl = !path ? `${base}/api` :
    path.startsWith('http') ? path :
    path.startsWith('/api') ? `${base}${path}` :
    path.startsWith('/') ? `${base}/api${path}` :
    `${base}/api/${path}`;
  
  return fullUrl;
};

export default getApiBaseUrl;

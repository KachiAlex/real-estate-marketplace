const DEFAULT_API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  process.env.API_BASE_URL ||
  'https://real-estate-marketplace-1-k8jp.onrender.com';

const isLocalhost = (value) => {
  if (!value || typeof value !== 'string') return false;
  const lower = value.toLowerCase();
  return lower.includes('localhost') || lower.includes('127.0.0.1');
};

const normalizeBaseUrl = (base) => {
  if (!base) return DEFAULT_API_BASE_URL;
  let normalized = base.trim();
  if (normalized.endsWith('/')) normalized = normalized.slice(0, -1);
  if (normalized.endsWith('/api')) normalized = normalized.slice(0, -4);
  if (!normalized) return DEFAULT_API_BASE_URL;

  if (isLocalhost(normalized) && typeof window !== 'undefined') {
    const host = window.location?.hostname || '';
    if (host && !isLocalhost(host)) {
      return DEFAULT_API_BASE_URL;
    }
  }

  return normalized;
};

export const getApiBaseUrl = () => normalizeBaseUrl(process.env.REACT_APP_API_URL || DEFAULT_API_BASE_URL);

export const getApiUrl = (path = '') => {
  const base = getApiBaseUrl();
  if (!path) return `${base}/api`;
  if (path.startsWith('http')) return path;
  if (path.startsWith('/api')) return `${base}${path}`;
  if (path.startsWith('/')) return `${base}/api${path}`;
  return `${base}/api/${path}`;
};

export default getApiBaseUrl;

const DEFAULT_API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  process.env.API_BASE_URL ||
  'https://real-estate-marketplace-1-k8jp.onrender.com';

const normalizeBaseUrl = (base) => {
  if (!base) return DEFAULT_API_BASE_URL;

  let normalized = String(base).trim();
  if (normalized.endsWith('/')) normalized = normalized.slice(0, -1);
  if (normalized.endsWith('/api')) normalized = normalized.slice(0, -4);

  return normalized || DEFAULT_API_BASE_URL;
};

export const getApiBaseUrl = (preferredBase) => normalizeBaseUrl(preferredBase || DEFAULT_API_BASE_URL);

export const getApiUrl = (path = '', preferredBase) => {
  const base = getApiBaseUrl(preferredBase);
  if (!path) return `${base}/api`;
  if (path.startsWith('http')) return path;
  if (path.startsWith('/api')) return `${base}${path}`;
  if (path.startsWith('/')) return `${base}/api${path}`;
  return `${base}/api/${path}`;
};

export default getApiBaseUrl;

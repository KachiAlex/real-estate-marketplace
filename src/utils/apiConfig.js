const DEFAULT_API_BASE_URL = 'https://api-kzs3jdpe7a-uc.a.run.app'; // Deployed Firebase Functions

const normalizeBaseUrl = (base) => {
  if (!base) return DEFAULT_API_BASE_URL;
  let normalized = base.trim();
  if (normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }
  if (normalized.endsWith('/api')) {
    normalized = normalized.slice(0, -4);
  }
  return normalized || DEFAULT_API_BASE_URL;
};

export const getApiBaseUrl = () => {
  // Always use the deployed Firebase Functions API
  return DEFAULT_API_BASE_URL;
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

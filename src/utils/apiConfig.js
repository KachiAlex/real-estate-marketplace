const DEFAULT_API_BASE_URL = 'https://api-kzs3jdpe7a-uc-759115682573.us-central1.run.app';

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
  return normalizeBaseUrl(
    process.env.REACT_APP_API_URL ||
      process.env.REACT_APP_API_BASE_URL ||
      DEFAULT_API_BASE_URL
  );
};

export const getApiUrl = (path = '') => {
  const base = getApiBaseUrl();
  if (!path) return `${base}/api`;

  if (path.startsWith('http')) {
    return path;
  }

  if (path.startsWith('/api')) {
    return `${base}${path}`;
  }

  if (path.startsWith('/')) {
    return `${base}/api${path}`;
  }

  return `${base}/api/${path}`;
};

export default getApiBaseUrl;

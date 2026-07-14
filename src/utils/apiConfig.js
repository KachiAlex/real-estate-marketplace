const DEFAULT_API_BASE_URL = 'https://propertyark.africa';

const PSEUDO_NATIVE_HOST_MARKERS = [
  'appassets.',
  'capacitorapp.',
  'capacitor.local',
  'ionic.local',
  'ms-appx',
  'ms-appx-web'
];

const isPseudoNativeHost = (value = '') => {
  if (!value) return false;
  const lower = value.toLowerCase();
  return PSEUDO_NATIVE_HOST_MARKERS.some((marker) => lower === marker || lower.includes(marker));
};

const isLocalhost = (value) => {
  if (!value || typeof value !== 'string') return false;
  const lower = value.toLowerCase();
  if (lower.includes('localhost') || lower.includes('127.0.0.1') || lower.includes('::1')) {
    return true;
  }
  return isPseudoNativeHost(lower);
};

const isPseudoNativeOrigin = (origin = '') => {
  const lower = origin.toLowerCase();
  return (
    lower.startsWith('file://') ||
    lower.startsWith('capacitor://') ||
    lower.startsWith('capacitor-native://') ||
    lower.startsWith('ionic://') ||
    lower.startsWith('app://') ||
    lower.startsWith('ms-appx://') ||
    lower.startsWith('ms-appx-web://')
  );
};

const resolveDefaultBaseUrl = () => {
  // ALWAYS use the hardcoded production backend URL for native/Capacitor apps.
  // Capacitor WebView origins can be file://, capacitor://, or http://localhost —
  // none of those can reach the backend. The only valid API target is the
  // deployed production URL.
  if (typeof window !== 'undefined' && window.location?.origin) {
    const origin = window.location.origin;
    const host = window.location.hostname || '';
    // In a native/Capacitor/WebView context the origin is never a real API origin
    if (
      isPseudoNativeOrigin(origin) ||
      origin.startsWith('http://localhost') ||
      origin.startsWith('https://localhost') ||
      isLocalhost(host)
    ) {
      return DEFAULT_API_BASE_URL;
    }
    if (!isLocalhost(host)) {
      return origin;
    }
  }

  return process.env.REACT_APP_API_URL || process.env.API_BASE_URL || DEFAULT_API_BASE_URL;
};

const normalizeBaseUrl = (base) => {
  if (!base) return resolveDefaultBaseUrl();

  let normalized = String(base).trim();
  if (normalized.endsWith('/')) normalized = normalized.slice(0, -1);
  if (normalized.endsWith('/api')) normalized = normalized.slice(0, -4);

  // If configured to use Render, override to use same origin for Vercel
  if (normalized.includes('onrender.com') && typeof window !== 'undefined') {
    const host = window.location?.hostname || '';
    if (host && !isLocalhost(host)) {
      console.warn('⚠️ API URL configured for Render, but backend is on Vercel. Using same origin instead.');
      return resolveDefaultBaseUrl();
    }
  }

  if (isLocalhost(normalized) && typeof window !== 'undefined') {
    const host = window.location?.hostname || '';
    if (host && !isLocalhost(host)) {
      return resolveDefaultBaseUrl();
    }
  }

  return normalized || resolveDefaultBaseUrl();
};

export const getApiBaseUrl = (preferredBase) => normalizeBaseUrl(preferredBase || resolveDefaultBaseUrl());

export const getApiUrl = (path = '', preferredBase) => {
  const base = getApiBaseUrl(preferredBase);
  if (!path) return `${base}/api`;
  if (path.startsWith('http')) return path;
  if (path.startsWith('/api')) return `${base}${path}`;
  if (path.startsWith('/')) return `${base}/api${path}`;
  return `${base}/api/${path}`;
};

export default getApiBaseUrl;

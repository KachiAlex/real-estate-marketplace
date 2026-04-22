// Runtime guards for environment and feature detection

export const registerRuntimeGuards = () => {
  // Register global error handlers and runtime guards
  if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
    });
  }
};

export const isProduction = () => process.env.NODE_ENV === 'production';

export const isDevelopment = () => process.env.NODE_ENV === 'development';

export const isBrowser = () => typeof window !== 'undefined';

export const isSSR = () => typeof window === 'undefined';

export const hasLocalStorage = () => {
  try {
    const test = '__localStorage_test__';
    window.localStorage.setItem(test, test);
    window.localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
};

export const hasSessionStorage = () => {
  try {
    const test = '__sessionStorage_test__';
    window.sessionStorage.setItem(test, test);
    window.sessionStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
};

export default {
  isProduction,
  isDevelopment,
  isBrowser,
  isSSR,
  hasLocalStorage,
  hasSessionStorage,
};

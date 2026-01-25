const CHUNK_RELOAD_KEY = 'real-estate-chunk-reload';

const unregisterLegacyServiceWorkers = () => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
  const shouldKeepSw = process.env.REACT_APP_ENABLE_SERVICE_WORKER === 'true';
  if (shouldKeepSw) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker.getRegistrations?.()
      .then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister().catch(() => {});
        });
      })
      .catch(() => {});
  });
};

const isChunkLoadError = (message = '') => {
  if (typeof message !== 'string') return false;
  return message.includes('ChunkLoadError') || /Loading chunk [\w-]+ failed/i.test(message);
};

const attemptChunkRecovery = () => {
  if (typeof window === 'undefined') return;
  if (sessionStorage.getItem(CHUNK_RELOAD_KEY)) {
    return;
  }

  sessionStorage.setItem(CHUNK_RELOAD_KEY, '1');

  const reloadPage = () => window.location.reload();

  if (window.caches?.keys) {
    caches.keys()
      .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      .catch(() => {})
      .finally(reloadPage);
  } else {
    reloadPage();
  }
};

const registerChunkErrorHandler = () => {
  if (typeof window === 'undefined') return;

  const handler = (message) => {
    if (isChunkLoadError(message)) {
      attemptChunkRecovery();
    }
  };

  window.addEventListener('error', (event) => handler(event?.message));
  window.addEventListener('unhandledrejection', (event) => {
    handler(event?.reason?.message || event?.reason);
  });

  window.addEventListener('load', () => {
    sessionStorage.removeItem(CHUNK_RELOAD_KEY);
  });
};

export const registerRuntimeGuards = () => {
  if (typeof window === 'undefined') return;

  unregisterLegacyServiceWorkers();
  registerChunkErrorHandler();
};

export default registerRuntimeGuards;

const CHUNK_RELOAD_KEY = 'real-estate-chunk-reload';

// Runtime shim: ensure a global `user` binding exists so legacy/rolled-back
// code that references an undeclared `user` identifier doesn't throw
// ReferenceError at runtime. Use indirect eval to create a global var.
if (typeof window !== 'undefined') {
  try {
    if (!window.user) window.user = null;
    // Indirect eval runs in global scope — creates a global var binding.
    try { (0, eval)('var user = window.user;'); } catch (e) { /* ignore */ }
  } catch (e) {
    // Best-effort shim; do not break startup if something goes wrong
  }
}

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

export const isChunkLoadError = (message = '') => {
  if (typeof message !== 'string') return false;
  return message.includes('ChunkLoadError') || /Loading chunk [\w-]+ failed/i.test(message);
};

export const attemptChunkRecovery = () => {
  if (typeof window === 'undefined') return;
  if (sessionStorage.getItem(CHUNK_RELOAD_KEY)) {
    return;
  }

  sessionStorage.setItem(CHUNK_RELOAD_KEY, '1');

  const reloadPage = () => window.location.reload();

  // Unregister service workers first to avoid stale SW serving old assets
  if (navigator.serviceWorker && navigator.serviceWorker.getRegistrations) {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((r) => {
        try { r.unregister(); } catch (e) { /* ignore */ }
      });
    }).catch(() => {});
  }

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

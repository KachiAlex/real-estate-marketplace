// Ensure global `user` binding exists before any app modules initialize
import './setupGlobalUser';

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import { HelmetProvider } from './utils/HelmetShim';
import './index.css';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { Toaster } from 'react-hot-toast';
import { initializeCapacitor, setupCapacitorErrorHandler } from './capacitor-init.js';
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';
import { initializeAnalytics, reportWebVital } from './utils/analytics';

console.log('[Mobile] index.js loaded');

const Router = typeof window !== 'undefined' && (window.location.protocol === 'capacitor:' || window.location.protocol === 'file:')
  ? HashRouter
  : BrowserRouter;

// Set up Capacitor error handlers immediately
setupCapacitorErrorHandler();

// Defer runtime guards to prevent blocking initialization
setTimeout(() => {
  try {
    import('./utils/runtimeGuards').then(({ registerRuntimeGuards }) => registerRuntimeGuards());
  } catch (error) {
    console.error('Failed to register runtime guards:', error);
  }
}, 100);

// Global error handler for uncaught errors
window.addEventListener('error', (event) => {
  // Detect chunk load failures caused by stale cached assets and attempt recovery
  const msg = String(event?.message || '').toLowerCase();
  const errName = event?.error?.name;
  if (errName === 'ChunkLoadError' || msg.includes('loading chunk')) {
    console.warn('Detected chunk load failure (possible stale cache). Reloading page to recover.');
    try {
      // Force a reload to fetch the latest assets
      window.location.reload();
    } catch (reloadErr) {
      console.error('Reload failed after chunk load error:', reloadErr);
    }
    return;
  }

  console.error('Uncaught global error:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error
  });
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  // Handle cases where dynamic import chunk fails
  const reason = event?.reason;
  if (reason && (reason.name === 'ChunkLoadError' || (String(reason.message || '').toLowerCase().includes('loading chunk')))) {
    console.warn('Unhandled rejection due to chunk load failure — reloading to recover');
    try { window.location.reload(); } catch (e) { /* ignore */ }
    return;
  }
  console.error('Unhandled promise rejection:', {
    reason: event.reason,
    promise: event.promise
  });
});

/**
 * Initialize Capacitor and render the React app
 * Capacitor must be initialized before React renders to ensure the native bridge is ready
 */
async function initializeAndRender() {
  try {
    console.log('[Mobile] initializeAndRender() start', {
      location: window.location.href,
      userAgent: window.navigator.userAgent
    });
    // CRITICAL: Wait for Capacitor to be ready before doing anything
    // This ensures the native bridge is fully initialized
    if (typeof Capacitor !== 'undefined' && Capacitor.ready) {
      console.log('[App] Waiting for Capacitor to be ready...');
      await Capacitor.ready();
      console.log('[App] Capacitor is ready');
    }

    // Initialize Capacitor plugins with timeout to prevent hanging
    const initTimeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Capacitor initialization timeout')), 5000)
    );

    try {
      await Promise.race([initializeCapacitor(), initTimeout]);
      console.log('[App] Capacitor initialization completed, rendering React app');
    } catch (error) {
      if (error.message === 'Capacitor initialization timeout') {
        console.warn('[App] Capacitor initialization timed out, continuing with React render');
      } else {
        console.error('[App] Capacitor initialization failed, but continuing with React render:', error);
      }
      // Don't throw - allow app to continue even if Capacitor initialization fails
      // This ensures the app works in web mode if Capacitor is not available
    }
  } catch (error) {
    console.error('[App] Error during Capacitor setup:', error);
    // Continue anyway
  }

  // Check if root element exists
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('[App] Root element not found! Creating fallback root element.');
    const fallbackRoot = document.createElement('div');
    fallbackRoot.id = 'root';
    document.body.appendChild(fallbackRoot);
  }

  // Render React app after Capacitor is initialized
  console.log('[Mobile] Creating React root');
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <HelmetProvider>
          <Router>
            <App />
          </Router>
        </HelmetProvider>
        <Toaster position="top-right" reverseOrder={false} />
      </ErrorBoundary>
    </React.StrictMode>
  );
}

initializeAnalytics();
getCLS(reportWebVital);
getFID(reportWebVital);
getFCP(reportWebVital);
getLCP(reportWebVital);
getTTFB(reportWebVital);

// Start the initialization and rendering process
initializeAndRender();

// Ensure global `user` binding exists before any app modules initialize
import './setupGlobalUser';

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from './utils/HelmetShim';
import './index.css';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { registerRuntimeGuards } from './utils/runtimeGuards';

registerRuntimeGuards();

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

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <HelmetProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </HelmetProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

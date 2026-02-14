// Aggressive global guard for 'D' to prevent ReferenceError before any imports
if (typeof window !== 'undefined') {
  if (!window.D) window.D = null;
  try { (0, eval)('var D = window.D;'); } catch (e) { /* ignore */ }
}
// Ensure runtime guards for global variables (user, D, etc) are set before any app modules initialize
import { registerRuntimeGuards } from './utils/runtimeGuards';
registerRuntimeGuards();
// ...existing code...
import './setupGlobalUser';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from './utils/HelmetShim';
import './index.css';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';

// Global error handler for uncaught errors
window.addEventListener('error', (event) => {
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

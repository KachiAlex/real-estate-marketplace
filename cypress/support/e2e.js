// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';
// Enable file upload support for tests
import 'cypress-file-upload';

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Hide fetch/XHR requests from command log
Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from
  // failing the test on uncaught exceptions
  // You may want to handle specific errors differently
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false;
  }
  return true;
});

// Workaround: hide webpack-dev-server client overlay that can cover the AUT
// and block interactions inside Cypress runner. This only runs in tests.
Cypress.on('window:before:load', (win) => {
  try {
    const style = win.document.createElement('style');
    style.setAttribute('data-cy-hide-wds-overlay', 'true');
    style.innerHTML = `#webpack-dev-server-client-overlay { display: none !important; pointer-events: none !important; z-index: 0 !important; }`;
    win.document.head.appendChild(style);
  } catch (e) {
    // ignore
  }
});


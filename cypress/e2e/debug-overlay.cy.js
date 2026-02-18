describe('Dev server overlay debug', () => {
  it('captures webpack-dev-server overlay text if present and logs console errors', () => {
    cy.visit('/', {
      onBeforeLoad(win) {
        // capture console.error and window.onerror in the AUT
        const origConsoleError = win.console.error.bind(win.console);
        win.console.error = function (...args) {
          // forward messages to Cypress runner log
          // eslint-disable-next-line no-undef
          Cypress && Cypress.log && Cypress.log({ name: 'AUT.console.error', message: args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ') });
          origConsoleError(...args);
        };

        win.onerror = function (msg, url, line, col, err) {
          Cypress && Cypress.log && Cypress.log({ name: 'AUT.window.onerror', message: `${msg} @ ${url}:${line}:${col}` });
        };
      }
    });

    // Wait briefly for HMR overlay to appear if present
    cy.wait(1000);

    cy.get('iframe#webpack-dev-server-client-overlay', { timeout: 5000 }).then($iframes => {
      if ($iframes.length === 0) {
        cy.log('NO_OVERLAY_FOUND');
        return;
      }

      // Try to read overlay body text
      cy.wrap($iframes[0]).its('0.contentDocument.body').then((body) => {
        const text = body ? body.innerText : '(no body)';
        Cypress.log({ name: 'overlay', message: text });
        // also expose as a test assertion so the text appears in the run output
        expect(text).to.be.a('string');
      });
    });
  });
});
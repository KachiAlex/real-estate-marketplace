describe('Escrow payment flow (Paystack) - E2E', () => {
  it('initializes payment and triggers Paystack (stubbed)', () => {
    // Intercept initialize call and return a successful backend-shaped response
    cy.intercept('POST', '**/api/payments/initialize', (req) => {
      // ensure frontend attempted to send Authorization or mock header
      expect(req.headers).to.satisfy((h) => Boolean(h.authorization) || Boolean(h['x-mock-user-email']) );

      req.reply({
        statusCode: 200,
        body: {
          success: true,
          data: {
            payment: { id: 'cypress-pay-1', reference: 'PSK_CYPRESS_1' },
            providerData: { txRef: 'PSK_CYPRESS_1', authorizationUrl: '' }
          }
        }
      });
    }).as('initPayment');

    // Intercept verification to immediately succeed
    cy.intercept('POST', '**/api/payments/*/verify', {
      statusCode: 200,
      body: { success: true, data: { id: 'cypress-pay-1', status: 'completed' } }
    }).as('verifyPayment');

    // Visit a mock property detail page with mocked auth and stubbed PaystackPop
    cy.visit('/property/prop_001', {
      onBeforeLoad(win) {
        // Mock authentication for protected endpoints
        win.localStorage.setItem('accessToken', 'mock-access-token');
        win.localStorage.setItem('currentUser', JSON.stringify({ id: 'buyer', email: 'buyer@example.com', role: 'buyer' }));

        // Stub Paystack SDK so it immediately calls the callback
        win.PaystackPop = {
          setup: (opts) => {
            // ensure reference present
            expect(opts.reference).to.be.a('string');
            // call success callback shortly after setup
            setTimeout(() => {
              opts.callback({ reference: opts.reference });
            }, 100);
            return { open: () => {} };
          }
        };
      }
    });

    // Sanity checks: ensure property title and purchase section rendered
    cy.contains('Beautiful Family Home in Lekki Phase 1', { timeout: 5000 }).should('be.visible');
    cy.contains('Purchase Information', { timeout: 5000 }).should('be.visible');

    // Log a small snippet of the page body to help debug missing elements
    cy.get('body').then($body => {
      const text = $body.text().replace(/\s+/g, ' ').slice(0, 1000);
      // output first 1k characters of body text into Cypress log
      cy.log('PAGE_BODY_START: ' + text);
    });

    // Click the Buy button (should be present in the Purchase Information block)
    cy.get('button').contains('Buy with Escrow Protection').first().should('be.visible').click();

    // Wait for initialize to be requested and assert not 404
    cy.wait('@initPayment').its('response.statusCode').should('not.equal', 404);

    // Wait for verification to be called and succeed
    cy.wait('@verifyPayment').its('response.statusCode').should('equal', 200);

    // Final UI confirmation (success toast / confirmation step)
    cy.contains(/Payment verified|Funds are now held securely in escrow/i, { timeout: 10000 }).should('be.visible');
  });
});

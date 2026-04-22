describe('Property direct route — purchase & Paystack init (regression)', () => {
  it('renders Purchase button on direct /property/:id and initializes Paystack', () => {
    // Intercept initialize call and return a successful backend-shaped response
    cy.intercept('POST', '**/api/payments/initialize', (req) => {
      // ensure frontend attempted to send Authorization or mock header
      expect(req.headers).to.satisfy((h) => Boolean(h.authorization) || Boolean(h['x-mock-user-email']) );

      req.reply({
        statusCode: 200,
        body: {
          success: true,
          data: {
            payment: { id: 'cypress-pay-2', reference: 'PSK_CYPRESS_2' },
            providerData: { txRef: 'PSK_CYPRESS_2', authorizationUrl: '' }
          }
        }
      });
    }).as('initPayment');

    // Intercept verification to immediately succeed
    cy.intercept('POST', '**/api/payments/*/verify', {
      statusCode: 200,
      body: { success: true, data: { id: 'cypress-pay-2', status: 'completed' } }
    }).as('verifyPayment');

    // Visit property detail directly with mocked auth and Paystack stub
    cy.visit('/property/prop_001', {
      onBeforeLoad(win) {
        win.localStorage.setItem('accessToken', 'mock-access-token');
        win.localStorage.setItem('currentUser', JSON.stringify({ id: 'buyer', email: 'buyer@example.com', role: 'buyer' }));

        win.PaystackPop = {
          setup: (opts) => {
            expect(opts.reference).to.be.a('string');
            setTimeout(() => opts.callback({ reference: opts.reference }), 50);
            return { open: () => {} };
          }
        };
      }
    });

    // Page should render property details and purchase info
    cy.contains('Beautiful Family Home in Lekki Phase 1').should('be.visible');
    cy.contains('Purchase Information').should('be.visible');

    // Click Buy and assert backend calls
    cy.get('button').contains('Buy with Escrow Protection').should('be.visible').click();

    cy.wait('@initPayment').its('response.statusCode').should('eq', 200);
    cy.wait('@verifyPayment').its('response.statusCode').should('eq', 200);

    // UI confirms payment verified
    cy.contains(/Payment verified|Funds are now held securely in escrow/i, { timeout: 10000 }).should('be.visible');
  });
});
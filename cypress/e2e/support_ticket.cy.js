describe('Support ticket flow (end-to-end)', () => {
  beforeEach(() => {
    // Simulate logged-in user by writing token + user into localStorage
    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.setItem('accessToken', 'fake-jwt-for-cypress');
        win.localStorage.setItem('currentUser', JSON.stringify({ id: 'cypress-user-1', email: 'cypress@example.com' }));
      }
    });
  });

  it('submits a support ticket and includes Authorization header', () => {
    // Intercept support inquiry and assert headers/payload
    cy.intercept('POST', '**/api/support/inquiry', (req) => {
      // Verify Authorization header exists and uses the token we set above
      expect(req.headers).to.have.property('authorization');
      expect(req.headers.authorization).to.match(/^Bearer\s+fake-jwt-for-cypress$/);

      // Verify payload contains expected fields
      expect(req.body).to.have.property('message');
      expect(req.body).to.have.property('category');

      // Respond with success to exercise UI success path
      req.reply({
        statusCode: 201,
        body: { success: true, message: 'Your inquiry has been submitted successfully.' }
      });
    }).as('createInquiry');

    // Navigate to Help & Support page
    cy.visit('/help-support');

    // Open the Create Support Ticket modal
    cy.contains('button', 'Create Support Ticket').should('be.visible').click();

    // Modal should appear
    cy.contains('Create Support Ticket').should('be.visible');

    // Fill in form
    cy.get('input[placeholder], input').filter(':visible').first();
    cy.get('input').filter(':visible').first().clear();
    cy.get('input').filter(':visible').first().type('E2E test subject');

    cy.get('select').filter(':visible').first().select('technical');

    cy.get('textarea').type('This is an automated test message from Cypress.');

    // Submit
    cy.get('button').contains('Submit Ticket').click();

    // Wait for intercepted API call
    cy.wait('@createInquiry');

    // Modal should close on success
    cy.contains('Create Support Ticket').should('not.exist');

    // Toast message should be visible (react-hot-toast text)
    cy.contains(/submitted/i).should('be.visible');
  });
});
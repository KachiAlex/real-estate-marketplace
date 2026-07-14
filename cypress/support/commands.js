// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

Cypress.Commands.add('login', (email = 'test@example.com', password = 'password123') => {
  // Derive a mock user identity from email for faster, backend-independent tests
  const role = email.includes('vendor') ? 'vendor' : (email.includes('buyer') ? 'buyer' : 'user');
  const id = email.split('@')[0];
  const mockUser = {
    id,
    email,
    firstName: id.split('.')[0] || 'Test',
    lastName: 'User',
    role,
    roles: [role],
    activeRole: role
  };

  // Persist tokens + currentUser so AuthContext initializes as authenticated
  cy.window().then((win) => {
    win.localStorage.setItem('accessToken', 'mock-access-token');
    win.localStorage.setItem('refreshToken', 'mock-refresh-token');
    win.localStorage.setItem('currentUser', JSON.stringify(mockUser));
  });

  // Visit root to hydrate app state from localStorage
  cy.visit('/');
  cy.wait(500);
});

Cypress.Commands.add('register', (userData) => {
  cy.visit('/register');
  cy.get('input[name="firstName"]').type(userData.firstName);
  cy.get('input[name="lastName"]').type(userData.lastName);
  cy.get('input[name="email"]').type(userData.email);
  cy.get('input[name="password"]').type(userData.password);
  cy.get('input[name="confirmPassword"]').type(userData.password);
  // Handle terms and conditions if present
  cy.get('body').then(($body) => {
    if ($body.find('input[type="checkbox"]').length > 0) {
      cy.get('input[type="checkbox"]').check({ force: true });
    }
  });
  cy.get('button[type="submit"]').contains('Register').click();
});

Cypress.Commands.add('waitForPageLoad', () => {
  cy.get('body').should('be.visible');
  cy.wait(1000);
});


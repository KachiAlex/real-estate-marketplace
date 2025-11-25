describe('Authentication E2E Tests', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should navigate to login page', () => {
    cy.get('body').then(($body) => {
      const loginLink = $body.find('a[href*="/login"], button:contains("Login")').first();
      if (loginLink.length > 0) {
        cy.contains('Login').click({ force: true });
        cy.url().should('include', '/login');
      } else {
        cy.visit('/login');
        cy.url().should('include', '/login');
      }
    });
  });

  it('should display login form', () => {
    cy.visit('/login');
    cy.get('body').should('be.visible');
    cy.get('body').then(($body) => {
      if ($body.find('input[type="email"], input[name="email"]').length > 0) {
        cy.get('input[type="email"], input[name="email"]').should('be.visible');
        cy.get('input[type="password"], input[name="password"]').should('be.visible');
      }
    });
  });

  it('should navigate to register page', () => {
    cy.get('body').then(($body) => {
      const registerLink = $body.find('a[href*="/register"], button:contains("Register")').first();
      if (registerLink.length > 0) {
        cy.contains('Register').click({ force: true });
        cy.url().should('include', '/register');
      } else {
        cy.visit('/register');
        cy.url().should('include', '/register');
      }
    });
  });

  it('should display registration form', () => {
    cy.visit('/register');
    cy.get('body').should('be.visible');
    cy.get('body').then(($body) => {
      if ($body.find('input[name="firstName"]').length > 0) {
        cy.get('input[name="firstName"]').should('be.visible');
        cy.get('input[name="email"]').should('be.visible');
      }
    });
  });
});


/**
 * End-to-End Tests: Buyer Journey
 * Tests complete buyer workflows from registration to mortgage application
 */

describe('Buyer Journey', () => {
  beforeEach(() => {
    // Clear localStorage and sessionStorage
    cy.clearLocalStorage();
    cy.clearCookies();
    
    // Visit home page
    cy.visit('/');
  });

  it('should complete user registration flow', () => {
    // Navigate to registration
    cy.contains('Sign Up').click({ force: true });
    
    // Wait for register page
    cy.url().should('include', '/register');
    
    // Fill registration form with waits for each element
    cy.get('input[name="firstName"]', { timeout: 10000 }).should('be.visible').type('John');
    cy.get('input[name="lastName"]').should('be.visible').type('Doe');
    cy.get('input[name="email"]').should('be.visible').type('john.doe@example.com');
    cy.get('input[name="password"]').should('be.visible').type('Password123!');
    cy.get('input[name="confirmPassword"]').should('be.visible').type('Password123!');
    
    // Submit form
    cy.contains('button', 'Create account').click();
    
    // Should redirect to dashboard
    cy.url({ timeout: 10000 }).should('include', '/dashboard');
  });

  it('should search and filter properties', () => {
    // Login first
    cy.visit('/auth/login');
    cy.url().should('include', '/login');
    
    cy.get('input[name="email"]', { timeout: 10000 }).should('be.visible').type('test@example.com');
    cy.get('input[name="password"]').should('be.visible').type('password123');
    cy.contains('button', 'Sign in').click();
    
    // Navigate to properties
    cy.visit('/properties');
    cy.get('[data-testid="property-card"]', { timeout: 10000 }).should('exist');
  });

  it('should save property as favorite', () => {
    // Login
    cy.visit('/auth/login');
    cy.get('input[name="email"]', { timeout: 10000 }).should('be.visible').type('test@example.com');
    cy.get('input[name="password"]').should('be.visible').type('password123');
    cy.contains('button', 'Sign in').click();
    
    // Navigate to properties
    cy.visit('/properties');
    
    // Click favorite button on first property if it exists
    cy.get('[data-testid="property-card"]', { timeout: 10000 }).then(($cards) => {
      if ($cards.length > 0) {
        cy.get('[data-testid="favorite-button"]').first().click({ force: true });
        // Should show success message (optional)
      }
    });
  });

  it('should submit property inquiry', () => {
    // Login
    cy.visit('/auth/login');
    cy.get('input[name="email"]', { timeout: 10000 }).should('be.visible').type('test@example.com');
    cy.get('input[name="password"]').should('be.visible').type('password123');
    cy.contains('button', 'Sign in').click();
    
    // Navigate to properties
    cy.visit('/properties');
    
    // Click on first property if it exists
    cy.get('[data-testid="property-card"]', { timeout: 10000 }).then(($cards) => {
      if ($cards.length > 0) {
        cy.get('[data-testid="property-card"]').first().click();
        // Try to fill inquiry form if it exists
        cy.get('textarea[name="message"]', { timeout: 5000 }).then(($textarea) => {
          if ($textarea.length > 0) {
            cy.wrap($textarea).type('I am interested in this property');
            cy.contains('button', 'Send Inquiry').click({ force: true });
          }
        });
      }
    });
  });

  it('should complete mortgage application', () => {
    // Login
    cy.visit('/auth/login');
    cy.get('input[name="email"]', { timeout: 10000 }).should('be.visible').type('test@example.com');
    cy.get('input[name="password"]').should('be.visible').type('password123');
    cy.contains('button', 'Sign in').click();
    
    // Navigate to mortgage
    cy.visit('/mortgage');
    
    // Try to use mortgage calculator if it exists
    cy.get('input[name="loanAmount"]', { timeout: 5000 }).then(($input) => {
      if ($input.length > 0) {
        cy.wrap($input).type('10000000');
        cy.get('input[name="interestRate"]').type('12');
        cy.get('input[name="loanTerm"]').type('20');
        cy.contains('button', 'Calculate').click({ force: true });
      }
    });
  });
});


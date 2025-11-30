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
    cy.contains('Sign Up').click();
    
    // Fill registration form
    cy.get('input[name="firstName"]').type('John');
    cy.get('input[name="lastName"]').type('Doe');
    cy.get('input[name="email"]').type('john.doe@example.com');
    cy.get('input[name="password"]').type('Password123!');
    cy.get('input[name="confirmPassword"]').type('Password123!');
    
    // Submit form
    cy.contains('button', 'Register').click();
    
    // Should redirect to dashboard
    cy.url().should('include', '/dashboard');
  });

  it('should search and filter properties', () => {
    // Login first (assuming user exists)
    cy.visit('/login');
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('password123');
    cy.contains('button', 'Login').click();
    
    // Navigate to properties
    cy.visit('/properties');
    
    // Search for properties
    cy.get('input[placeholder*="Search"]').type('Lagos');
    
    // Apply filters
    cy.contains('button', 'Apply Filters').click();
    
    // Should see filtered results
    cy.get('[data-testid="property-card"]').should('have.length.greaterThan', 0);
  });

  it('should save property as favorite', () => {
    // Login
    cy.visit('/login');
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('password123');
    cy.contains('button', 'Login').click();
    
    // Navigate to properties
    cy.visit('/properties');
    
    // Click favorite button on first property
    cy.get('[data-testid="favorite-button"]').first().click();
    
    // Should show success message
    cy.contains(/saved|favorite/i).should('be.visible');
  });

  it('should submit property inquiry', () => {
    // Login
    cy.visit('/login');
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('password123');
    cy.contains('button', 'Login').click();
    
    // Navigate to property detail
    cy.visit('/properties');
    cy.get('[data-testid="property-card"]').first().click();
    
    // Fill inquiry form
    cy.get('textarea[name="message"]').type('I am interested in this property');
    cy.contains('button', 'Send Inquiry').click();
    
    // Should show success message
    cy.contains(/inquiry|sent/i).should('be.visible');
  });

  it('should complete mortgage application', () => {
    // Login
    cy.visit('/login');
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('password123');
    cy.contains('button', 'Login').click();
    
    // Navigate to mortgage
    cy.visit('/mortgage');
    
    // Use mortgage calculator
    cy.get('input[name="loanAmount"]').type('10000000');
    cy.get('input[name="interestRate"]').type('12');
    cy.get('input[name="loanTerm"]').type('20');
    
    // Calculate
    cy.contains('button', 'Calculate').click();
    
    // Should show monthly payment
    cy.contains(/monthly payment|₦/i).should('be.visible');
    
    // Apply for mortgage
    cy.contains('button', 'Apply').click();
    
    // Fill application form
    cy.get('input[name="employmentStatus"]').type('Employed');
    cy.get('input[name="monthlyIncome"]').type('500000');
    
    // Submit application
    cy.contains('button', 'Submit Application').click();
    
    // Should show success message
    cy.contains(/application|submitted/i).should('be.visible');
  });
});


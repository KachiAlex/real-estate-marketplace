/**
 * End-to-End Tests: Vendor Journey
 * Tests complete vendor workflows from registration to property management
 */

describe('Vendor Journey', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  it('should complete vendor registration', () => {
    // Login as buyer first
    cy.visit('/login');
    cy.get('input[name="email"]').type('buyer@example.com');
    cy.get('input[name="password"]').type('password123');
    cy.contains('button', 'Login').click();
    
    // Switch to vendor role
    cy.get('[data-testid="user-menu"]').click();
    cy.contains('Switch to Vendor').click();
    
    // Fill vendor registration form
    cy.get('input[name="businessName"]').type('Test Properties Ltd');
    cy.get('input[name="businessType"]').type('Real Estate Agent');
    cy.get('input[name="licenseNumber"]').type('REA123456');
    
    // Submit registration
    cy.contains('button', 'Register as Vendor').click();
    
    // Should redirect to vendor dashboard
    cy.url().should('include', '/vendor/dashboard');
  });

  it('should add new property listing', () => {
    // Login as vendor
    cy.visit('/login');
    cy.get('input[name="email"]').type('vendor@example.com');
    cy.get('input[name="password"]').type('password123');
    cy.contains('button', 'Login').click();
    
    // Navigate to add property
    cy.visit('/add-property');
    
    // Fill property form
    cy.get('input[name="title"]').type('Beautiful Family Home');
    cy.get('textarea[name="description"]').type('Spacious 3-bedroom home');
    cy.get('input[name="price"]').type('50000000');
    cy.get('select[name="type"]').select('house');
    cy.get('select[name="status"]').select('for-sale');
    
    // Upload images
    cy.get('input[type="file"]').attachFile('test-image.jpg');
    
    // Submit property
    cy.contains('button', 'Submit Property').click();
    
    // Should show success message
    cy.contains(/property|submitted/i).should('be.visible');
  });

  it('should manage property listings', () => {
    // Login as vendor
    cy.visit('/login');
    cy.get('input[name="email"]').type('vendor@example.com');
    cy.get('input[name="password"]').type('password123');
    cy.contains('button', 'Login').click();
    
    // Navigate to vendor properties
    cy.visit('/vendor/properties');
    
    // Should see property list
    cy.get('[data-testid="property-item"]').should('have.length.greaterThan', 0);
    
    // Edit property
    cy.get('[data-testid="edit-button"]').first().click();
    cy.get('input[name="price"]').clear().type('55000000');
    cy.contains('button', 'Update').click();
    
    // Should show success message
    cy.contains(/updated|saved/i).should('be.visible');
  });

  it('should view earnings dashboard', () => {
    // Login as vendor
    cy.visit('/login');
    cy.get('input[name="email"]').type('vendor@example.com');
    cy.get('input[name="password"]').type('password123');
    cy.contains('button', 'Login').click();
    
    // Navigate to earnings
    cy.visit('/vendor/earnings');
    
    // Should see earnings summary
    cy.contains(/earnings|revenue|total/i).should('be.visible');
    
    // Should see transaction list
    cy.get('[data-testid="transaction-item"]').should('have.length.greaterThan', 0);
  });
});


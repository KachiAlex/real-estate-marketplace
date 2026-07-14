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
    // Login as buyer first (mocked)
    cy.login('buyer@example.com', 'password123');
    cy.log('login: done');

    // Open user menu and switch to vendor (should navigate to /vendor/register)
    cy.get('[data-testid="user-menu"]').click();
    cy.log('user-menu: opened');
    cy.contains('Switch to Vendor').click();
    cy.log('switch-to-vendor: clicked');

    // Ensure we reached onboarding page
    cy.url().should('include', '/vendor/register');
    cy.log('navigated: /vendor/register');

    // STEP 1 - Business Info
    cy.get('input[name="businessName"]').clear().type('Test Properties Ltd');
    cy.get('input[name="businessType"]').clear().type('Real Estate Agent');
    cy.get('input[name="licenseNumber"]').clear().type('REA123456');
    cy.get('input[name="contactEmail"]').clear().type('vendor@example.com');
    cy.get('input[name="contactPhone"]').clear().type('+1234567890');
    cy.log('step1: filled');

    // Go to KYC Documents step
    cy.contains('button', 'Next').click();
    cy.log('navigated: kyc step');

    // STEP 2 - Upload KYC docs
    cy.get('input[type="file"]').attachFile('test-image.jpg');
    cy.log('kyc: uploaded');

    // Review & Submit
    cy.contains('button', 'Next').click();
    cy.log('navigated: review step');

    // Final submit (Register as Vendor button appears on final step)
    cy.contains('button', 'Register as Vendor').click();
    cy.log('submitted: register as vendor');

    // Should redirect to vendor dashboard
    cy.url({ timeout: 10000 }).should('include', '/vendor/dashboard');
    cy.log('assert: on vendor dashboard');
  });

  it('should add new property listing', () => {
    // Login as vendor
    cy.login('vendor@example.com', 'password123');

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
    cy.login('vendor@example.com', 'password123');

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
    cy.login('vendor@example.com', 'password123');

    // Navigate to earnings
    cy.visit('/vendor/earnings');
    
    // Should see earnings summary
    cy.contains(/earnings|revenue|total/i).should('be.visible');
    
    // Should see transaction list
    cy.get('[data-testid="transaction-item"]').should('have.length.greaterThan', 0);
  });
});


describe('Public Vendor Onboarding (unauthenticated)', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  it('allows an unauthenticated user to register as a vendor and upload KYC', () => {
    // Visit public onboarding page
    cy.visit('/onboard-vendor');

    // Step 1: Business info
    cy.get('input[name="businessName"]').type('Test Properties Ltd');
    cy.get('input[name="businessType"]').type('Real Estate Agent');
    cy.get('input[name="licenseNumber"]').type('REA123456');
    cy.get('input[name="contactEmail"]').type('vendor-contact@example.com');
    cy.get('input[name="contactPhone"]').type('+2348000000000');

    cy.contains('button', 'Next').click();

    // Step 2: Upload KYC
    cy.get('input[type="file"]').attachFile('test-image.jpg');
    cy.contains('button', 'Next').click();

    // Step 3: Review & Submit
    cy.contains('button', 'Register as Vendor').click();

    // Should navigate to vendor dashboard (local/persisted for unauthenticated user)
    cy.url({ timeout: 10000 }).should('include', '/vendor/dashboard');

    // Persisted onboarded vendor should exist in localStorage
    cy.window().then((win) => {
      const onboarded = JSON.parse(win.localStorage.getItem('onboardedVendor') || 'null');
      expect(onboarded).to.not.be.null;
      expect(onboarded.businessName).to.equal('Test Properties Ltd');
      expect(onboarded.licenseNumber).to.equal('REA123456');
    });

    // Dashboard overview should be visible (renamed to Overview)
    cy.contains(/^Overview$/i, { timeout: 10000 }).should('be.visible');

    // Now simulate user logging in with the same email and assert auto-sync occurs
    // We'll use the login page and a test account that the app treats as mock-auth
    cy.visit('/auth/login');
    cy.get('input[name="email"]').type('vendor-contact@example.com');
    cy.get('input[name="password"]').type('password123');
    cy.contains('button', 'Sign in').click();

    // After login the vendor dashboard should still be accessible and the onboarded vendor should be removed from localStorage
    cy.url({ timeout: 10000 }).should('include', '/vendor/dashboard');
    cy.window().then((win) => {
      const onboarded = JSON.parse(win.localStorage.getItem('onboardedVendor') || 'null');
      expect(onboarded).to.be.null;
    });

    // My Properties should show at least one property for this vendor (auto-synced)
    cy.contains('Total Properties', { timeout: 10000 }).should('be.visible');
    cy.get('[data-testid="property-item"]').should('have.length.greaterThan', 0);
  });
});
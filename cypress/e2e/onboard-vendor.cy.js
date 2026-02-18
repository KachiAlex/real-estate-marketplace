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

    // Dashboard overview should be visible
    cy.contains(/Dashboard Overview|Properties/i, { timeout: 10000 }).should('be.visible');
  });
});
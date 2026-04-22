describe('Onboarding → Login → Auto-sync → My Properties', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  it('auto-syncs a locally onboarded vendor when they later log in', () => {
    // 1) Public vendor onboarding (creates local onboardedVendor)
    cy.visit('/onboard-vendor');

    cy.get('input[name="businessName"]').type('Sync Test Properties');
    cy.get('input[name="businessType"]').type('Real Estate Agency');
    cy.get('input[name="licenseNumber"]').type('REA-SYNC-001');
    cy.get('input[name="contactEmail"]').type('sync-vendor@example.com');
    cy.get('input[name="contactPhone"]').type('+2348000000001');

    cy.contains('button', 'Next').click();
    // skip file upload complexity in e2e for now
    cy.contains('button', 'Next').click();
    cy.contains('button', 'Register as Vendor').click();

    cy.url({ timeout: 10000 }).should('include', '/vendor/dashboard');

    // Ensure onboardedVendor exists in localStorage
    cy.window().then((win) => {
      const onboarded = JSON.parse(win.localStorage.getItem('onboardedVendor') || 'null');
      expect(onboarded).to.not.be.null;
      expect(onboarded.contactInfo.email).to.equal('sync-vendor@example.com');
    });

    // 2) Now log in with the same email (mock login should succeed in test env)
    cy.visit('/auth/login');
    cy.get('input[name="email"]').type('sync-vendor@example.com');
    cy.get('input[name="password"]').type('password123');
    cy.contains('button', 'Sign in').click();

    // After login, onboardedVendor should be removed and Overview should show vendor stats
    cy.url({ timeout: 10000 }).should('include', '/vendor/dashboard');
    cy.window().then((win) => {
      const onboarded = JSON.parse(win.localStorage.getItem('onboardedVendor') || 'null');
      expect(onboarded).to.be.null;
    });

    // new heading + stats
    cy.contains(/^Overview$/i, { timeout: 10000 }).should('be.visible');
    cy.contains('Properties', { timeout: 10000 }).should('be.visible');
    cy.get('[data-testid="property-item"]').should('have.length.greaterThan', 0);
  });
});
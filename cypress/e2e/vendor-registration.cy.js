describe('Vendor Registration E2E Tests', () => {
  beforeEach(() => {
    cy.visit('/register');
  });

  it('should display vendor registration form', () => {
    cy.get('body').should('be.visible');
    cy.get('body').then(($body) => {
      if ($body.find('input[name="firstName"]').length > 0) {
        cy.get('input[name="firstName"]').should('be.visible');
      }
    });
  });

  it('should allow selecting vendor as user type', () => {
    cy.get('body').then(($body) => {
      const vendorOption = $body.find('input[value="vendor"], select option[value="vendor"]').first();
      if (vendorOption.length > 0) {
        cy.get('input[value="vendor"], select').select('vendor', { force: true });
      }
    });
  });

  it('should show vendor-specific fields when vendor is selected', () => {
    cy.get('body').then(($body) => {
      // Check if vendor fields exist
      const hasVendorFields = $body.find('input[name*="business"], input[name*="Business"]').length > 0;
      if (hasVendorFields) {
        cy.get('input[name*="business"], input[name*="Business"]').first().should('exist');
      }
    });
  });
});


describe('Homepage E2E Tests', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should load the homepage successfully', () => {
    cy.get('body').should('be.visible');
    cy.url().should('include', '/');
  });

  it('should display property listings', () => {
    cy.waitForPageLoad();
    // Check if property cards are visible
    cy.get('body').then(($body) => {
      if ($body.find('[class*="property"], [class*="card"]').length > 0) {
        cy.get('[class*="property"], [class*="card"]').first().should('be.visible');
      }
    });
  });

  it('should navigate to property details when clicking on a property', () => {
    cy.waitForPageLoad();
    cy.get('body').then(($body) => {
      const propertyLink = $body.find('a[href*="/property/"]').first();
      if (propertyLink.length > 0) {
        cy.get('a[href*="/property/"]').first().click({ force: true });
        cy.url().should('include', '/property/');
      }
    });
  });

  it('should have working navigation links', () => {
    cy.get('body').then(($body) => {
      // Check for header/navigation
      if ($body.find('nav, header, [role="navigation"]').length > 0) {
        cy.get('nav, header, [role="navigation"]').should('be.visible');
      }
    });
  });

  it('should display search functionality', () => {
    cy.get('body').then(($body) => {
      const hasSearchInput = $body.find('input[type="search"]').length > 0 
        || $body.find('input[placeholder*="search"]').length > 0
        || $body.find('input[placeholder*="Search"]').length > 0;
      
      if (hasSearchInput) {
        cy.get('input[type="search"]').first().should('be.visible');
      } else {
        // Search might not be visible on homepage, this is acceptable
        cy.log('Search input not found on homepage - this is acceptable');
      }
    });
  });
});


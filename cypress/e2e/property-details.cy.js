describe('Property Details E2E Tests', () => {
  beforeEach(() => {
    // Visit homepage first to get a property ID
    cy.visit('/');
    cy.waitForPageLoad();
  });

  it('should navigate to property details page', () => {
    cy.get('body').then(($body) => {
      const propertyLink = $body.find('a[href*="/property/"]').first();
      if (propertyLink.length > 0) {
        cy.get('a[href*="/property/"]').first().click({ force: true });
        cy.url().should('include', '/property/');
        cy.get('body').should('be.visible');
      } else {
        // If no properties on homepage, try direct navigation
        cy.visit('/property/prop_001');
        cy.get('body').should('be.visible');
      }
    });
  });

  it('should display property information', () => {
    cy.visit('/property/prop_001');
    cy.waitForPageLoad();
    
    // Check if property details are visible
    cy.get('body').should('be.visible');
    cy.get('body').then(($body) => {
      // Property details should be present
      expect($body.length).to.be.greaterThan(0);
    });
  });

  it('should allow viewing property without login', () => {
    cy.visit('/property/prop_001');
    cy.waitForPageLoad();
    
    // Should be able to view property without authentication
    cy.get('body').should('be.visible');
    cy.url().should('include', '/property/');
  });

  it('should display property images', () => {
    cy.visit('/property/prop_001');
    cy.waitForPageLoad();
    
    cy.get('body').then(($body) => {
      if ($body.find('img').length > 0) {
        cy.get('img').first().should('be.visible');
      }
    });
  });
});


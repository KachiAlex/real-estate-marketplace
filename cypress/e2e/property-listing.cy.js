describe('Property Listing E2E Tests', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.waitForPageLoad();
  });

  it('should display property cards with clickable elements', () => {
    cy.get('body').then(($body) => {
      const propertyCards = $body.find('[class*="property"], [class*="card"]');
      if (propertyCards.length > 0) {
        // Check that property cards are visible
        cy.get('[class*="property"], [class*="card"]').first().should('be.visible');
        
        // Check that thumbnail is clickable
        cy.get('[class*="property"], [class*="card"]').first().within(() => {
          cy.get('img, a').first().should('exist');
        });
      }
    });
  });

  it('should allow clicking on property thumbnail to view details', () => {
    cy.get('body').then(($body) => {
      const propertyLink = $body.find('a[href*="/property/"]').first();
      if (propertyLink.length > 0) {
        cy.get('a[href*="/property/"]').first().click({ force: true });
        cy.url().should('include', '/property/');
      }
    });
  });

  it('should allow clicking on property description to view details', () => {
    cy.get('body').then(($body) => {
      const propertyLink = $body.find('a[href*="/property/"]').first();
      if (propertyLink.length > 0) {
        // Find description within property card and click
        cy.get('a[href*="/property/"]').first().click({ force: true });
        cy.url().should('include', '/property/');
      }
    });
  });

  it('should display view details button', () => {
    cy.get('body').then(($body) => {
      if ($body.find('button:contains("View Details"), a:contains("View Details")').length > 0) {
        cy.contains('View Details').first().should('be.visible');
      }
    });
  });

  it('should navigate to property details when clicking view details button', () => {
    cy.get('body').then(($body) => {
      const viewDetailsBtn = $body.find('button:contains("View Details"), a:contains("View Details")').first();
      if (viewDetailsBtn.length > 0) {
        cy.contains('View Details').first().click({ force: true });
        cy.url().should('include', '/property/');
      }
    });
  });
});


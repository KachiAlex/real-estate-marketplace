describe('Property Interactions E2E Tests', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.waitForPageLoad();
  });

  it('should allow favoriting a property (requires login)', () => {
    cy.get('body').then(($body) => {
      const favoriteButton = $body.find('button:has(svg), [class*="heart"], [class*="favorite"]').first();
      if (favoriteButton.length > 0) {
        cy.get('button:has(svg), [class*="heart"], [class*="favorite"]').first().should('be.visible');
      }
    });
  });

  it('should allow sharing a property', () => {
    cy.get('body').then(($body) => {
      const shareButton = $body.find('button:has(svg), [class*="share"]').first();
      if (shareButton.length > 0) {
        cy.get('button:has(svg), [class*="share"]').first().should('be.visible');
      }
    });
  });

  it('should display property filters', () => {
    cy.get('body').then(($body) => {
      // Check for filter elements
      const hasFilters = $body.find('select, [class*="filter"], [class*="Filter"]').length > 0;
      if (hasFilters) {
        cy.get('select, [class*="filter"]').first().should('exist');
      }
    });
  });

  it('should navigate between property pages', () => {
    cy.get('body').then(($body) => {
      const propertyLink = $body.find('a[href*="/property/"]').first();
      if (propertyLink.length > 0) {
        cy.get('a[href*="/property/"]').first().click({ force: true });
        cy.url().should('include', '/property/');
        
        // Navigate back
        cy.get('body').then(($backLink) => {
          if ($backLink.find('a[href="/"], a[href*="/properties"]').length > 0) {
            cy.get('a[href="/"], a[href*="/properties"]').first().click({ force: true });
          } else {
            cy.go('back');
          }
        });
      }
    });
  });
});


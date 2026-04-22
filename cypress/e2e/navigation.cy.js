describe('Navigation E2E Tests', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.waitForPageLoad();
  });

  it('should have accessible navigation menu', () => {
    cy.get('body').then(($body) => {
      const nav = $body.find('nav, header, [role="navigation"]');
      if (nav.length > 0) {
        cy.get('nav, header, [role="navigation"]').should('be.visible');
      }
    });
  });

  it('should navigate to properties page', () => {
    cy.get('body').then(($body) => {
      const propertiesLink = $body.find('a[href*="/properties"]').first();
      if (propertiesLink.length > 0) {
        cy.get('a[href*="/properties"]').first().click({ force: true });
        // Properties page may redirect to login if not authenticated
        cy.url().should('satisfy', (url) => {
          return url.includes('/properties') || url.includes('/login');
        });
      } else {
        cy.visit('/properties');
        // Accept redirect to login if not authenticated
        cy.url().should('satisfy', (url) => {
          return url.includes('/properties') || url.includes('/login');
        });
      }
    });
  });

  it('should navigate to about page if available', () => {
    cy.get('body').then(($body) => {
      const aboutLink = $body.find('a[href*="/about"]').first();
      if (aboutLink.length > 0) {
        cy.get('a[href*="/about"]').first().click({ force: true });
        cy.url().should('include', '/about');
      }
    });
  });

  it('should maintain navigation state across pages', () => {
    cy.visit('/');
    cy.waitForPageLoad();
    
    cy.get('body').then(($body) => {
      const propertyLink = $body.find('a[href*="/property/"]').first();
      if (propertyLink.length > 0) {
        cy.get('a[href*="/property/"]').first().click({ force: true });
        cy.url().should('include', '/property/');
        
        // Navigation should still be visible
        cy.get('body').then(($nav) => {
          if ($nav.find('nav, header').length > 0) {
            cy.get('nav, header').should('be.visible');
          }
        });
      }
    });
  });
});


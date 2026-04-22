describe('Token refresh flow (apiClient)', () => {
  beforeEach(() => {
    // nothing here — tokens injected during cy.visit via onBeforeLoad
  });

  const seedAdminStorage = (win) => {
    win.localStorage.setItem('accessToken', 'expired-access-token');
    win.localStorage.setItem('refreshToken', 'valid-refresh-token');
    const admin = {
      id: 'admin1',
      email: 'admin@propertyark.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      roles: ['admin'],
      activeRole: 'admin'
    };
    win.localStorage.setItem('currentUser', JSON.stringify(admin));
  };

  it('refreshes an expired access token and retries the original request', () => {
    // Track number of times the admin/settings endpoint is called
    let settingsCalls = 0;

    cy.intercept('GET', '**/api/admin/properties/status-summary', (req) => {
      settingsCalls += 1;
      // First call -> simulate expired access token (401)
      if (settingsCalls === 1) {
        req.reply({ statusCode: 401, body: { success: false, message: 'Unauthorized' } });
        return;
      }

      // Subsequent call(s) -> return success (non-zero totals so chart renders)
      req.reply({
        statusCode: 200,
        body: {
          success: true,
          data: { total: 3, pending: 1, approved: 1, rejected: 1 }
        }
      });
    }).as('getAdminStatusSummary');

    // Intercept the refresh endpoint and return a fresh access token
    cy.intercept('POST', '**/auth/jwt/refresh', (req) => {
      // validate refresh token present in request body
      expect(req.body).to.have.property('refreshToken', 'valid-refresh-token');
      req.reply({ statusCode: 200, body: { accessToken: 'new-access-token' } });
    }).as('postRefresh');

    // Visit admin dashboard (seed localStorage *before* the app loads so AuthContext hydrates)
    cy.visit('/admin', {
      onBeforeLoad: (win) => {
        seedAdminStorage(win);
      }
    });

    // Wait for the status-summary retry (the successful call after refresh)
    cy.wait('@getAdminStatusSummary');

    // Ensure refresh endpoint was called
    cy.wait('@postRefresh').its('response.statusCode').should('equal', 200);

    // Verify localStorage was updated with the new access token
    cy.window().then((win) => {
      const token = win.localStorage.getItem('accessToken');
      expect(token).to.equal('new-access-token');
    });

    // Verify the chart rendered (canvas present) and chart data isn't empty
    cy.get('canvas').should('exist');
    // Also assert the "No property data available yet" message is not present
    cy.contains('No property data available yet').should('not.exist');
  });
});
const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    // Prefer local dev server by default; CI may override via CYPRESS_BASE_URL
    baseUrl: process.env.CYPRESS_BASE_URL || 'http://localhost:3001',
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.js',
  },
  component: {
    devServer: {
      framework: 'create-react-app',
      bundler: 'webpack',
    },
  },
});


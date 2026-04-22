module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)'],
  verbose: false,
  testTimeout: 10000,
  // Ensure test environment before anything else loads
  setupFiles: ['<rootDir>/setupTest.js'],
  globalTeardown: '<rootDir>/teardownTest.js',
  moduleNameMapper: {
    "^uuid$": "<rootDir>/mocks/uuid.cjs"
  },
  // Keep CI output concise for this suite.
  silent: true
};


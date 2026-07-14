module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/src/utils/**/*.test.ts', '**/src/utils/**/*.properties.test.ts'],
  preset: 'ts-jest',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testTimeout: 30000,
  collectCoverageFrom: [
    'src/utils/**/*.ts',
    '!src/utils/**/*.test.ts',
    '!src/utils/**/*.properties.test.ts',
  ],
};

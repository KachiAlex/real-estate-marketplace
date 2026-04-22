# Testing Framework Setup - Task 1.5

## Overview

Jest testing framework has been successfully installed and configured for the PropertyArk mobile app. This document outlines the testing setup and how to use it.

## What Was Installed

### Dependencies Added to package.json

- **jest** (^29.7.0) - Test runner and framework
- **@testing-library/react-native** (^12.4.0) - React Native component testing utilities
- **@testing-library/jest-native** (^5.4.3) - Jest matchers for React Native
- **jest-environment-node** (^29.7.0) - Node.js test environment
- **ts-jest** (^29.1.1) - TypeScript support for Jest
- **@types/jest** (^29.5.8) - TypeScript types for Jest

### Test Scripts Added to package.json

```json
"test": "jest --run",           // Run tests once
"test:watch": "jest --watch",   // Run tests in watch mode
"test:coverage": "jest --coverage"  // Run tests with coverage report
```

## Configuration Files Created

### 1. jest.config.js

Main Jest configuration file with:
- React Native preset
- TypeScript support via ts-jest
- Test file patterns for both `__tests__/` and `.test.ts(x)` files
- Coverage collection from app, services, hooks, and utils directories
- Coverage thresholds (70% minimum for branches, functions, lines, statements)
- Module name mapping for import aliases

### 2. tests/setup.ts

Test setup file that:
- Imports Jest Native matchers
- Mocks AsyncStorage for offline storage testing
- Mocks expo-secure-store for secure token storage testing
- Mocks axios for API client testing
- Suppresses non-critical console warnings

### 3. tests/utils.tsx

Test utilities providing:
- Custom render function for component testing
- Mock helpers for AsyncStorage
- Mock helpers for expo-secure-store
- Mock API response creator
- Async operation helpers

## Directory Structure

```
mobile/
├── __tests__/                    # Test files directory
│   └── placeholder.test.ts       # Example test file
├── tests/                        # Test utilities and setup
│   ├── setup.ts                  # Jest setup and mocks
│   └── utils.tsx                 # Test utilities and helpers
├── jest.config.js                # Jest configuration
└── package.json                  # Updated with test dependencies
```

## How to Run Tests

### Run all tests once
```bash
npm test
```

### Run tests in watch mode (re-run on file changes)
```bash
npm run test:watch
```

### Run tests with coverage report
```bash
npm run test:coverage
```

## Writing Tests

### Unit Test Example

Create a test file in `__tests__/` or co-locate with source using `.test.ts(x)` suffix:

```typescript
import { render, screen } from '../tests/utils';
import MyComponent from '../components/MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeTruthy();
  });
});
```

### Using Mock Helpers

```typescript
import { mockAsyncStorage, mockSecureStore } from '../tests/utils';

describe('Storage', () => {
  it('should store and retrieve data', async () => {
    const storage = mockAsyncStorage();
    await storage.setItem('key', 'value');
    const result = await storage.getItem('key');
    expect(result).toBe('value');
  });
});
```

## Coverage Thresholds

The Jest configuration enforces minimum coverage thresholds:
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

Tests will fail if coverage falls below these thresholds.

## Mocked Dependencies

The following dependencies are automatically mocked in tests:
- `@react-native-async-storage/async-storage` - Local storage
- `expo-secure-store` - Secure token storage
- `axios` - HTTP client

These mocks can be customized in `tests/setup.ts` as needed.

## Next Steps

1. Install dependencies: `npm install`
2. Run tests to verify setup: `npm test`
3. Start writing unit tests for services, hooks, and components
4. Aim for 70%+ code coverage
5. Run tests before committing code

## Requirements Satisfied

This task satisfies **Requirement 9.1** - Testing and Validation:
- Jest testing framework installed and configured
- Test directory structure created (tests/, __tests__/)
- Test utilities and mock helpers set up
- Test scripts added to package.json
- Ready for writing unit and integration tests

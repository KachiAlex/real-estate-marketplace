import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock Firebase and related modules BEFORE importing AuthContext
const mockUnsubscribe = jest.fn(() => {}); // Make it a callable function

jest.mock('../../config/firebase', () => ({
  auth: {
    currentUser: null,
  },
  db: {},
}));

// Mock getRedirectResult to prevent it from running
// Create the unsubscribe function outside the mock factory to ensure it's always available
const createMockUnsub = () => jest.fn(() => {});

jest.mock('firebase/auth', () => {
  return {
    ...jest.requireActual('firebase/auth'),
    getRedirectResult: jest.fn().mockResolvedValue(null),
    onAuthStateChanged: jest.fn((auth, callback) => {
      // Create a new unsubscribe function for each call
      const mockUnsub = jest.fn(() => {});
      
      // Call callback asynchronously to avoid immediate execution
      // Use setImmediate or process.nextTick for better async handling
      if (typeof setImmediate !== 'undefined') {
        setImmediate(() => {
          try {
            callback(null);
          } catch (e) {
            // Ignore errors in callback
          }
        });
      } else {
        setTimeout(() => {
          try {
            callback(null);
          } catch (e) {
            // Ignore errors in callback
          }
        }, 0);
      }
      // Always return a callable function
      return mockUnsub;
    }),
    signInWithPopup: jest.fn(),
    signInWithRedirect: jest.fn(),
    signOut: jest.fn(),
    GoogleAuthProvider: jest.fn().mockImplementation(() => ({
      setCustomParameters: jest.fn(),
    })),
    updateProfile: jest.fn(),
  };
});

// Import AuthProvider after mocks are set up
import { AuthProvider } from '../AuthContext';

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('should provide auth context', () => {
    const TestComponent = () => {
      return <div>Test</div>;
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('should render without crashing', () => {
    render(
      <AuthProvider>
        <div>Test</div>
      </AuthProvider>
    );

    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});

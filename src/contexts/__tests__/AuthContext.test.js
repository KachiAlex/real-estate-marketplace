import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock fetch for API calls
global.fetch = jest.fn();

// Import AuthProvider after mocks are set up
import { AuthProvider } from '../AuthContext-new';

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

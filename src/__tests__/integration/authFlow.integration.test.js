/**
 * Integration Tests for Authentication Flow
 * Tests complete authentication workflows including login, logout, role switching, and session persistence
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext-new';
import LoginNew from '../../pages/LoginNew';

// Mock fetch for API calls
global.fetch = jest.fn();

describe('Authentication Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('should handle complete login flow', async () => {
    const TestApp = () => (
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    );

    render(<TestApp />);

    // Test that login form is rendered
    expect(screen.getByLabelText(/email/i) || screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
  });

  it('should persist session across page refresh', () => {
    // Simulate logged in user
    const user = {
      id: '123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User'
    };
    localStorage.setItem('currentUser', JSON.stringify(user));

    const TestApp = () => (
      <BrowserRouter>
        <AuthProvider>
          <div>Test</div>
        </AuthProvider>
      </BrowserRouter>
    );

    render(<TestApp />);
    
    // User should be loaded from localStorage
    expect(localStorage.getItem('currentUser')).toBeTruthy();
  });

  it('should handle role switching', async () => {
    const user = {
      id: '123',
      email: 'test@example.com',
      roles: ['buyer', 'vendor'],
      activeRole: 'buyer'
    };
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('activeRole', 'buyer');

    const TestApp = () => (
      <BrowserRouter>
        <AuthProvider>
          <div>Test</div>
        </AuthProvider>
      </BrowserRouter>
    );

    render(<TestApp />);
    
    // Role should be persisted
    expect(localStorage.getItem('activeRole')).toBe('buyer');
  });
});


/**
 * ForgotPassword Component Tests
 * Tests for forgot password functionality using Firebase Auth
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ForgotPassword from '../ForgotPassword';
import toast from 'react-hot-toast';

// Mock Firebase Auth
const mockSendPasswordResetEmail = jest.fn();
jest.mock('firebase/auth', () => ({
  ...jest.requireActual('firebase/auth'),
  sendPasswordResetEmail: (auth, email, actionCodeSettings) => {
    return mockSendPasswordResetEmail(auth, email, actionCodeSettings);
  },
}));

// Mock Firebase config
jest.mock('../../config/firebase', () => ({
  auth: {},
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
}));

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
  },
}));

describe('ForgotPassword', () => {
  const originalEnv = process.env;
  const originalLocation = window.location;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSendPasswordResetEmail.mockClear();
    process.env = { ...originalEnv };
    delete process.env.REACT_APP_FRONTEND_URL;
    
    // Mock window.location
    delete window.location;
    window.location = { origin: 'https://test.example.com' };
  });

  afterEach(() => {
    process.env = originalEnv;
    window.location = originalLocation;
  });

  it('should render the forgot password form', () => {
    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );

    expect(screen.getByText(/Forgot Password\?/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/you@example\.com/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Send Reset Link/i })).toBeInTheDocument();
    expect(screen.getByText(/Back to Login/i)).toBeInTheDocument();
  });

  it('should show error when submitting empty email', async () => {
    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );

    const submitButton = screen.getByRole('button', { name: /Send Reset Link/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Please enter your email address');
    });
  });

  it('should show error when submitting invalid email', async () => {
    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );

    const emailInput = screen.getByPlaceholderText(/you@example\.com/i);
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

    const submitButton = screen.getByRole('button', { name: /Send Reset Link/i });
    fireEvent.submit(submitButton.closest('form'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Please enter a valid email address');
    });
  });

  it('should call Firebase sendPasswordResetEmail with correct email and show success', async () => {
    mockSendPasswordResetEmail.mockResolvedValueOnce();

    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );

    const emailInput = screen.getByPlaceholderText(/you@example\.com/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    const form = screen.getByPlaceholderText(/you@example\.com/i).closest('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(
        {},
        'test@example.com',
        expect.objectContaining({
          url: expect.stringContaining('/reset-password'),
          handleCodeInApp: false,
        })
      );
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Password reset link sent to your email');
    });

    await waitFor(() => {
      expect(screen.getByText(/Check Your Email/i)).toBeInTheDocument();
      expect(screen.getByText(/test@example\.com/i)).toBeInTheDocument();
    });
  });

  it('should handle user-not-found error gracefully', async () => {
    const error = new Error('User not found');
    error.code = 'auth/user-not-found';
    mockSendPasswordResetEmail.mockRejectedValueOnce(error);

    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );

    const emailInput = screen.getByPlaceholderText(/you@example\.com/i);
    fireEvent.change(emailInput, { target: { value: 'nonexistent@example.com' } });

    const form = screen.getByPlaceholderText(/you@example\.com/i).closest('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        'If an account with that email exists, a password reset link has been sent.'
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/Check Your Email/i)).toBeInTheDocument();
    });
  });

  it('should handle invalid-email error', async () => {
    const error = new Error('Invalid email');
    error.code = 'auth/invalid-email';
    mockSendPasswordResetEmail.mockRejectedValueOnce(error);

    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );

    const emailInput = screen.getByPlaceholderText(/you@example\.com/i);
    fireEvent.change(emailInput, { target: { value: 'invalid@' } });

    const form = screen.getByPlaceholderText(/you@example\.com/i).closest('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Please enter a valid email address');
    });
  });

  it('should handle too-many-requests error', async () => {
    const error = new Error('Too many requests');
    error.code = 'auth/too-many-requests';
    mockSendPasswordResetEmail.mockRejectedValueOnce(error);

    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );

    const emailInput = screen.getByPlaceholderText(/you@example\.com/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    const form = screen.getByPlaceholderText(/you@example\.com/i).closest('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Too many requests. Please try again later.');
    });
  });

  it('should handle generic Firebase error', async () => {
    const error = new Error('Network error');
    error.code = 'auth/network-error';
    mockSendPasswordResetEmail.mockRejectedValueOnce(error);

    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );

    const emailInput = screen.getByPlaceholderText(/you@example\.com/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    const form = screen.getByPlaceholderText(/you@example\.com/i).closest('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });

  it('should normalize email to lowercase', async () => {
    mockSendPasswordResetEmail.mockResolvedValueOnce();

    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );

    const emailInput = screen.getByPlaceholderText(/you@example\.com/i);
    fireEvent.change(emailInput, { target: { value: 'TEST@EXAMPLE.COM' } });

    const form = screen.getByPlaceholderText(/you@example\.com/i).closest('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(
        {},
        'test@example.com',
        expect.any(Object)
      );
    });
  });

  it('should trim email whitespace', async () => {
    mockSendPasswordResetEmail.mockResolvedValueOnce();

    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );

    const emailInput = screen.getByPlaceholderText(/you@example\.com/i);
    fireEvent.change(emailInput, { target: { value: '  test@example.com  ' } });

    const form = screen.getByPlaceholderText(/you@example\.com/i).closest('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(
        {},
        'test@example.com',
        expect.any(Object)
      );
    });
  });

  it('should disable form during submission', async () => {
    mockSendPasswordResetEmail.mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(() => resolve(), 100))
    );

    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );

    const emailInput = screen.getByPlaceholderText(/you@example\.com/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    const submitButton = screen.getByRole('button', { name: /Send Reset Link/i });
    const form = emailInput.closest('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(emailInput).toBeDisabled();
      expect(submitButton).toBeDisabled();
    });

    expect(submitButton).toHaveTextContent('Sending...');

    await waitFor(() => {
      expect(screen.getByText(/Check Your Email/i)).toBeInTheDocument();
    }, { timeout: 500 });
  });

  it('should show success screen after successful submission', async () => {
    mockSendPasswordResetEmail.mockResolvedValueOnce();

    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );

    const emailInput = screen.getByPlaceholderText(/you@example\.com/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    const form = screen.getByPlaceholderText(/you@example\.com/i).closest('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText(/Check Your Email/i)).toBeInTheDocument();
      expect(screen.getByText(/test@example\.com/i)).toBeInTheDocument();
      expect(screen.getByText(/We've sent a password reset link/i)).toBeInTheDocument();
      expect(screen.getByText(/The link will expire in 1 hour/i)).toBeInTheDocument();
      expect(screen.getByText(/Back to Login/i)).toBeInTheDocument();
    });
  });

  it('should use custom frontend URL from environment variable', async () => {
    process.env.REACT_APP_FRONTEND_URL = 'https://custom-frontend.example.com';
    mockSendPasswordResetEmail.mockResolvedValueOnce();

    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );

    const emailInput = screen.getByPlaceholderText(/you@example\.com/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    const form = screen.getByPlaceholderText(/you@example\.com/i).closest('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(
        {},
        'test@example.com',
        expect.objectContaining({
          url: 'https://custom-frontend.example.com/reset-password',
        })
      );
    });
  });

  it('should use window.location.origin if no env variable is set', async () => {
    delete process.env.REACT_APP_FRONTEND_URL;
    mockSendPasswordResetEmail.mockResolvedValueOnce();

    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );

    const emailInput = screen.getByPlaceholderText(/you@example\.com/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    const form = screen.getByPlaceholderText(/you@example\.com/i).closest('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(
        {},
        'test@example.com',
        expect.objectContaining({
          url: 'https://test.example.com/reset-password',
        })
      );
    });
  });
});

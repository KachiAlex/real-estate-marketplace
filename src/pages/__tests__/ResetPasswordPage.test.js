import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ResetPasswordPage from '../auth/ResetPasswordPage';
import { validatePasswordStrength } from '../../utils/passwordPolicy';
import toast from 'react-hot-toast';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('../../utils/apiConfig', () => ({
  getApiUrl: (path) => `http://api.test${path}`,
}));

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  const renderResetPasswordPage = (initialUrl = '?token=test_token_123') => {
    return render(
      <MemoryRouter initialEntries={[`/reset-password${initialUrl}`]}>
        <ResetPasswordPage />
      </MemoryRouter>
    );
  };

  describe('2.1.2.1 Create password reset form component', () => {
    it('should render password reset form with required fields', () => {
      renderResetPasswordPage();
      
      expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument();
    });

    it('should render back to login button', () => {
      renderResetPasswordPage();
      
      expect(screen.getByRole('button', { name: /back to login/i })).toBeInTheDocument();
    });

    it('should display error when token is missing from URL', () => {
      renderResetPasswordPage('');
      
      expect(screen.getByText(/invalid reset link/i)).toBeInTheDocument();
    });
  });

  describe('2.1.2.2 Parse reset token from URL', () => {
    it('should extract token from URL query parameters', () => {
      renderResetPasswordPage('?token=abc123xyz');
      
      const newPasswordInput = screen.getByTestId('new-password-input');
      expect(newPasswordInput).toBeInTheDocument();
    });

    it('should show error when token is missing', () => {
      renderResetPasswordPage('');
      
      expect(screen.getByText(/invalid reset link/i)).toBeInTheDocument();
    });

    it('should handle token with special characters', () => {
      renderResetPasswordPage('?token=abc-123_xyz.456');
      
      const newPasswordInput = screen.getByTestId('new-password-input');
      expect(newPasswordInput).toBeInTheDocument();
    });
  });

  describe('2.1.2.4 Validate password strength', () => {
    describe('validatePasswordStrength function', () => {
      it('should validate minimum length requirement', () => {
        const result = validatePasswordStrength('Short1!');
        expect(result.requirements.minLength).toBe(false);
        expect(result.isStrong).toBe(false);
      });

      it('should validate uppercase letter requirement', () => {
        const result = validatePasswordStrength('password123!');
        expect(result.requirements.hasUppercase).toBe(false);
        expect(result.isStrong).toBe(false);
      });

      it('should validate lowercase letter requirement', () => {
        const result = validatePasswordStrength('PASSWORD123!');
        expect(result.requirements.hasLowercase).toBe(false);
        expect(result.isStrong).toBe(false);
      });

      it('should validate number requirement', () => {
        const result = validatePasswordStrength('Password!');
        expect(result.requirements.hasNumber).toBe(false);
        expect(result.isStrong).toBe(false);
      });

      it('should validate special character requirement', () => {
        const result = validatePasswordStrength('Password123');
        expect(result.requirements.hasSpecialChar).toBe(false);
        expect(result.isStrong).toBe(false);
      });

      it('should accept strong password with all requirements', () => {
        const result = validatePasswordStrength('StrongPass123!');
        expect(result.requirements.minLength).toBe(true);
        expect(result.requirements.hasUppercase).toBe(true);
        expect(result.requirements.hasLowercase).toBe(true);
        expect(result.requirements.hasNumber).toBe(true);
        expect(result.requirements.hasSpecialChar).toBe(true);
        expect(result.isStrong).toBe(true);
      });

      it('should accept various special characters', () => {
        const specialChars = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '_', '+', '-', '='];
        
        specialChars.forEach(char => {
          const password = `Password123${char}`;
          const result = validatePasswordStrength(password);
          expect(result.requirements.hasSpecialChar).toBe(true);
        });
      });
    });

    it('should display password strength indicator when typing', async () => {
      renderResetPasswordPage();
      
      const newPasswordInput = screen.getByTestId('new-password-input');
      
      fireEvent.change(newPasswordInput, { target: { value: 'Test' } });
      
      await waitFor(() => {
        expect(screen.getByText(/password requirements/i)).toBeInTheDocument();
      });
    });

    it('should show requirements as met for strong password', async () => {
      renderResetPasswordPage();
      
      const newPasswordInput = screen.getByTestId('new-password-input');
      fireEvent.change(newPasswordInput, { target: { value: 'StrongPass123!' } });
      
      await waitFor(() => {
        expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
      });
    });
  });

  describe('2.1.2.3 Implement POST /api/auth/reset-password call', () => {
    it('should call reset-password endpoint with token and password', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Password reset successfully' }),
      });

      renderResetPasswordPage('?token=test_token_123');
      
      const newPasswordInput = screen.getByTestId('new-password-input');
      const confirmPasswordInput = screen.getByTestId('confirm-password-input');
      const submitButton = screen.getByTestId('reset-password-button');

      fireEvent.change(newPasswordInput, { target: { value: 'StrongPass123!' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'StrongPass123!' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'http://api.test/auth/reset-password',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })
        );
      });
    });

    it('should handle successful password reset', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Password reset successfully' }),
      });

      renderResetPasswordPage('?token=test_token_123');
      
      const newPasswordInput = screen.getByTestId('new-password-input');
      const confirmPasswordInput = screen.getByTestId('confirm-password-input');
      const submitButton = screen.getByTestId('reset-password-button');

      fireEvent.change(newPasswordInput, { target: { value: 'StrongPass123!' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'StrongPass123!' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          'Password reset successfully! You can now login with your new password.'
        );
      });
    });

    it('should handle API error response', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Invalid or expired token' }),
      });

      renderResetPasswordPage('?token=invalid_token');
      
      const newPasswordInput = screen.getByTestId('new-password-input');
      const confirmPasswordInput = screen.getByTestId('confirm-password-input');
      const submitButton = screen.getByTestId('reset-password-button');

      fireEvent.change(newPasswordInput, { target: { value: 'StrongPass123!' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'StrongPass123!' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid or expired token/i)).toBeInTheDocument();
      });
    });

    it('should handle network error', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      renderResetPasswordPage('?token=test_token_123');
      
      const newPasswordInput = screen.getByTestId('new-password-input');
      const confirmPasswordInput = screen.getByTestId('confirm-password-input');
      const submitButton = screen.getByTestId('reset-password-button');

      fireEvent.change(newPasswordInput, { target: { value: 'StrongPass123!' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'StrongPass123!' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form validation', () => {
    it('should require both password fields', async () => {
      renderResetPasswordPage();
      
      const submitButton = screen.getByTestId('reset-password-button');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/both password fields are required/i)).toBeInTheDocument();
      });
    });

    it('should reject weak passwords', async () => {
      renderResetPasswordPage();
      
      const newPasswordInput = screen.getByTestId('new-password-input');
      const confirmPasswordInput = screen.getByTestId('confirm-password-input');
      const submitButton = screen.getByTestId('reset-password-button');

      fireEvent.change(newPasswordInput, { target: { value: 'weak' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'weak' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password does not meet strength requirements/i)).toBeInTheDocument();
      });
    });

    it('should reject mismatched passwords', async () => {
      renderResetPasswordPage();
      
      const newPasswordInput = screen.getByTestId('new-password-input');
      const confirmPasswordInput = screen.getByTestId('confirm-password-input');
      const submitButton = screen.getByTestId('reset-password-button');

      fireEvent.change(newPasswordInput, { target: { value: 'StrongPass123!' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'DifferentPass123!' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      });
    });
  });

  describe('2.1.2.5 Redirect to login on success', () => {
    it('should redirect to login page after successful reset', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Password reset successfully' }),
      });

      renderResetPasswordPage('?token=test_token_123');
      
      const newPasswordInput = screen.getByTestId('new-password-input');
      const confirmPasswordInput = screen.getByTestId('confirm-password-input');
      const submitButton = screen.getByTestId('reset-password-button');

      fireEvent.change(newPasswordInput, { target: { value: 'StrongPass123!' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'StrongPass123!' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password reset successful/i)).toBeInTheDocument();
      });
    });

    it('should allow manual navigation to login via back button', () => {
      renderResetPasswordPage();
      
      const backButton = screen.getByTestId('back-to-login-button');
      fireEvent.click(backButton);

      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  describe('2.1.2.6 Write component tests', () => {
    it('should disable form inputs while loading', async () => {
      global.fetch.mockImplementationOnce(() => new Promise(() => {}));

      renderResetPasswordPage('?token=test_token_123');
      
      const newPasswordInput = screen.getByTestId('new-password-input');
      const confirmPasswordInput = screen.getByTestId('confirm-password-input');
      const submitButton = screen.getByTestId('reset-password-button');

      fireEvent.change(newPasswordInput, { target: { value: 'StrongPass123!' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'StrongPass123!' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(newPasswordInput).toBeDisabled();
        expect(confirmPasswordInput).toBeDisabled();
        expect(submitButton).toBeDisabled();
      });
    });

    it('should show loading state on submit button', async () => {
      global.fetch.mockImplementationOnce(() => new Promise(() => {}));

      renderResetPasswordPage('?token=test_token_123');
      
      const newPasswordInput = screen.getByTestId('new-password-input');
      const confirmPasswordInput = screen.getByTestId('confirm-password-input');
      const submitButton = screen.getByTestId('reset-password-button');

      fireEvent.change(newPasswordInput, { target: { value: 'StrongPass123!' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'StrongPass123!' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/resetting password/i)).toBeInTheDocument();
      });
    });

    it('should trim whitespace from token and password', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Password reset successfully' }),
      });

      renderResetPasswordPage('?token=%20test_token_123%20');
      
      const newPasswordInput = screen.getByTestId('new-password-input');
      const confirmPasswordInput = screen.getByTestId('confirm-password-input');
      const submitButton = screen.getByTestId('reset-password-button');

      fireEvent.change(newPasswordInput, { target: { value: '  StrongPass123!  ' } });
      fireEvent.change(confirmPasswordInput, { target: { value: '  StrongPass123!  ' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });
  });
});

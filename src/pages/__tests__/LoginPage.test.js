import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from '../auth/LoginPage';

const mockNavigate = jest.fn();
const mockLogin = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../../contexts/AuthContext-new', () => ({
  useAuth: () => ({
    login: mockLogin,
    loading: false,
  }),
}));

const mockGetPostLoginRoute = jest.fn(() => '/dashboard');
jest.mock('../../utils/getPostLoginRoute', () => ({
  __esModule: true,
  default: (...args) => mockGetPostLoginRoute(...args),
}));

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('LoginPage email/password flow', () => {
  const renderLogin = () =>
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
    mockLogin.mockResolvedValue({ id: 'user-1', roles: ['user'] });
    mockGetPostLoginRoute.mockReturnValue('/dashboard');
  });

  it('renders sign-in form and no Google auth button', () => {
    renderLogin();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /continue with google/i })).not.toBeInTheDocument();
  });

  it('redirects to stored authRedirect after successful sign-in', async () => {
    sessionStorage.setItem('authRedirect', '/saved-path');

    renderLogin();
    fireEvent.change(screen.getByPlaceholderText('you@email.com'), {
      target: { value: 'john@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(mockLogin).toHaveBeenCalledWith('john@example.com', 'password123'));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/saved-path', { replace: true }));
    expect(sessionStorage.getItem('authRedirect')).toBeNull();
  });

  it('falls back to getPostLoginRoute when no redirect is set', async () => {
    mockGetPostLoginRoute.mockReturnValue('/dashboard-from-mock');

    renderLogin();
    fireEvent.change(screen.getByPlaceholderText('you@email.com'), {
      target: { value: 'john@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(mockLogin).toHaveBeenCalledWith('john@example.com', 'password123'));
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard-from-mock', { replace: true })
    );
    expect(mockGetPostLoginRoute).toHaveBeenCalledWith({ id: 'user-1', roles: ['user'] });
  });
});

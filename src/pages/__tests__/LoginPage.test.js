import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Link as RouterLink } from 'react-router-dom';
import LoginPage from '../auth/LoginPage';

const mockNavigate = jest.fn();
const mockLogin = jest.fn();
const mockSignInWithGoogle = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  Link: ({ children, ...props }) => <RouterLink {...props}>{children}</RouterLink>,
}));

jest.mock('../../contexts/AuthContext-new', () => ({
  useAuth: () => ({
    login: mockLogin,
    loading: false,
    signInWithGoogle: mockSignInWithGoogle,
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

describe('LoginPage Google sign-in flow', () => {
  const renderLogin = () =>
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
    mockSignInWithGoogle.mockResolvedValue({ id: 'user-1', roles: ['user'] });
    mockGetPostLoginRoute.mockReturnValue('/dashboard');
  });

  it('renders the Google auth button', () => {
    renderLogin();
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
  });

  it('redirects to stored authRedirect after Google login', async () => {
    sessionStorage.setItem('authRedirect', '/saved-path');

    renderLogin();
    fireEvent.click(screen.getByRole('button', { name: /continue with google/i }));

    await waitFor(() => expect(mockSignInWithGoogle).toHaveBeenCalled());
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/saved-path', { replace: true }));
    expect(sessionStorage.getItem('authRedirect')).toBeNull();
  });

  it('falls back to getPostLoginRoute when no redirect is set', async () => {
    mockGetPostLoginRoute.mockReturnValue('/dashboard-from-mock');

    renderLogin();
    fireEvent.click(screen.getByRole('button', { name: /continue with google/i }));

    await waitFor(() => expect(mockSignInWithGoogle).toHaveBeenCalled());
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard-from-mock', { replace: true })
    );
    expect(mockGetPostLoginRoute).toHaveBeenCalledWith({ id: 'user-1', roles: ['user'] });
  });
});

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Link as RouterLink } from 'react-router-dom';
import RegisterPage from '../auth/RegisterPage';

const mockNavigate = jest.fn();
const mockRegister = jest.fn();
const mockSignInWithGoogle = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  Link: ({ children, ...props }) => <RouterLink {...props}>{children}</RouterLink>,
}));

jest.mock('../../components/layout/AuthLayout', () => ({ children, ...rest }) => (
  <div data-testid="auth-layout" {...rest}>
    {children}
  </div>
));

jest.mock('../../components/StaticHeroBanner', () => () => <div data-testid="static-hero" />);

jest.mock('../../contexts/AuthContext-new', () => ({
  useAuth: () => ({
    register: mockRegister,
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

describe('RegisterPage Google sign-up flow', () => {
  const renderRegister = (props = {}) =>
    render(
      <MemoryRouter>
        <RegisterPage {...props} />
      </MemoryRouter>
    );

  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
    mockSignInWithGoogle.mockResolvedValue({ id: 'user-2', roles: ['vendor'] });
    mockGetPostLoginRoute.mockReturnValue('/vendor/dashboard');
  });

  it('shows the Google sign-up button', () => {
    renderRegister();
    expect(screen.getByRole('button', { name: /sign up with google/i })).toBeInTheDocument();
  });

  it('redirects to stored authRedirect after Google sign-up', async () => {
    sessionStorage.setItem('authRedirect', '/escrow/payment-flow');

    renderRegister();
    fireEvent.click(screen.getByRole('button', { name: /sign up with google/i }));

    await waitFor(() => expect(mockSignInWithGoogle).toHaveBeenCalled());
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith('/escrow/payment-flow', { replace: true })
    );
    expect(sessionStorage.getItem('authRedirect')).toBeNull();
  });

  it('falls back to getPostLoginRoute when no redirect exists', async () => {
    mockGetPostLoginRoute.mockReturnValue('/vendor/dashboard');

    renderRegister();
    fireEvent.click(screen.getByRole('button', { name: /sign up with google/i }));

    await waitFor(() => expect(mockSignInWithGoogle).toHaveBeenCalled());
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith('/vendor/dashboard', { replace: true })
    );
    expect(mockGetPostLoginRoute).toHaveBeenCalledWith({ id: 'user-2', roles: ['vendor'] });
  });

  it('closes the modal when Google sign-up succeeds in modal mode', async () => {
    const onClose = jest.fn();

    renderRegister({ isModal: true, onClose });
    fireEvent.click(screen.getByRole('button', { name: /sign up with google/i }));

    await waitFor(() => expect(mockSignInWithGoogle).toHaveBeenCalled());
    await waitFor(() => expect(onClose).toHaveBeenCalledWith({ type: 'navigate' }));
  });
});

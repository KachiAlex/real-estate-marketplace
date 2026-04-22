import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RegisterPage from '../auth/RegisterPage';

const mockNavigate = jest.fn();
const mockRegister = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
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

describe('RegisterPage email/password flow', () => {
  const renderRegister = (props = {}) =>
    render(
      <MemoryRouter>
        <RegisterPage {...props} />
      </MemoryRouter>
    );

  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
    mockRegister.mockResolvedValue({ id: 'user-2', roles: ['vendor'] });
  });

  it('shows create account button and no Google sign-up button', () => {
    renderRegister();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /sign up with google/i })).not.toBeInTheDocument();
  });

  it('redirects to stored authRedirect after successful registration', async () => {
    sessionStorage.setItem('authRedirect', '/escrow/payment-flow');

    renderRegister();
    fireEvent.change(screen.getByPlaceholderText('Jane'), { target: { value: 'Jane' } });
    fireEvent.change(screen.getByPlaceholderText('Doe'), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByPlaceholderText('you@email.com'), { target: { value: 'jane@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Create a password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByPlaceholderText('Re-enter password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => expect(mockRegister).toHaveBeenCalled());
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith('/escrow/payment-flow', { replace: true })
    );
    expect(sessionStorage.getItem('authRedirect')).toBeNull();
  });

  it('falls back to dashboard when no redirect exists', async () => {

    renderRegister();
    fireEvent.change(screen.getByPlaceholderText('Jane'), { target: { value: 'Jane' } });
    fireEvent.change(screen.getByPlaceholderText('Doe'), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByPlaceholderText('you@email.com'), { target: { value: 'jane@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Create a password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByPlaceholderText('Re-enter password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => expect(mockRegister).toHaveBeenCalled());
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true })
    );
  });

  it('does not call onClose after successful registration in modal mode', async () => {
    const onClose = jest.fn();

    renderRegister({ isModal: true, onClose });
    fireEvent.change(screen.getByPlaceholderText('Jane'), { target: { value: 'Jane' } });
    fireEvent.change(screen.getByPlaceholderText('Doe'), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByPlaceholderText('you@email.com'), { target: { value: 'jane@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Create a password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByPlaceholderText('Re-enter password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => expect(mockRegister).toHaveBeenCalled());
    expect(onClose).not.toHaveBeenCalled();
  });
});

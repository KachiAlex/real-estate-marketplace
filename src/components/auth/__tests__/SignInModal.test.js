import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SignInModal from '../SignInModal';

const mockNavigate = jest.fn();
const mockLogin = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../../../contexts/AuthContext-new', () => ({
  useAuth: () => ({
    login: mockLogin,
    loading: false,
  }),
}));

const mockGetPostLoginRoute = jest.fn(() => '/dashboard');
jest.mock('../../../utils/getPostLoginRoute', () => ({
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

describe('SignInModal email/password flow', () => {
  const renderModal = (props = {}) => render(<SignInModal {...props} />);

  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
    mockLogin.mockResolvedValue({ id: 'user-3', roles: ['buyer'] });
    mockGetPostLoginRoute.mockReturnValue('/dashboard');
  });

  it('renders the sign-in form and no Google button', () => {
    renderModal();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /continue with google/i })).not.toBeInTheDocument();
  });

  it('navigates to saved redirect and closes modal after sign-in', async () => {
    const onClose = jest.fn();
    sessionStorage.setItem('authRedirect', '/wishlist');

    renderModal({ onClose });
    fireEvent.change(screen.getByPlaceholderText('you@email.com'), {
      target: { value: 'john@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(mockLogin).toHaveBeenCalledWith('john@example.com', 'password123'));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/wishlist', { replace: true }));
    expect(onClose).toHaveBeenCalled();
    expect(sessionStorage.getItem('authRedirect')).toBeNull();
  });

  it('falls back to getPostLoginRoute when redirect is missing', async () => {
    mockGetPostLoginRoute.mockReturnValue('/dashboard-buyer');

    renderModal();
    fireEvent.change(screen.getByPlaceholderText('you@email.com'), {
      target: { value: 'john@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(mockLogin).toHaveBeenCalledWith('john@example.com', 'password123'));
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard-buyer', { replace: true })
    );
    expect(mockGetPostLoginRoute).toHaveBeenCalledWith({ id: 'user-3', roles: ['buyer'] });
  });
});

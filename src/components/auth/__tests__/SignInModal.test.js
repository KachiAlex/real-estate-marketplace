import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SignInModal from '../SignInModal';

const mockNavigate = jest.fn();
const mockLogin = jest.fn();
const mockSignInWithGoogle = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../../../contexts/AuthContext-new', () => ({
  useAuth: () => ({
    login: mockLogin,
    loading: false,
    signInWithGoogle: mockSignInWithGoogle,
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

describe('SignInModal Google integration', () => {
  const renderModal = (props = {}) => render(<SignInModal {...props} />);

  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
    mockSignInWithGoogle.mockResolvedValue({ id: 'user-3', roles: ['buyer'] });
    mockGetPostLoginRoute.mockReturnValue('/dashboard');
  });

  it('renders the Google auth button inside the modal', () => {
    renderModal();
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
  });

  it('navigates to saved redirect and closes modal after Google sign-in', async () => {
    const onClose = jest.fn();
    sessionStorage.setItem('authRedirect', '/wishlist');

    renderModal({ onClose });
    fireEvent.click(screen.getByRole('button', { name: /continue with google/i }));

    await waitFor(() => expect(mockSignInWithGoogle).toHaveBeenCalled());
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/wishlist', { replace: true }));
    expect(onClose).toHaveBeenCalled();
    expect(sessionStorage.getItem('authRedirect')).toBeNull();
  });

  it('falls back to getPostLoginRoute when redirect missing', async () => {
    mockGetPostLoginRoute.mockReturnValue('/dashboard-buyer');

    renderModal();
    fireEvent.click(screen.getByRole('button', { name: /continue with google/i }));

    await waitFor(() => expect(mockSignInWithGoogle).toHaveBeenCalled());
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard-buyer', { replace: true })
    );
    expect(mockGetPostLoginRoute).toHaveBeenCalledWith({ id: 'user-3', roles: ['buyer'] });
  });
});

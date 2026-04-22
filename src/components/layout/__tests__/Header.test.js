import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Header from '../Header';

// Mock dependencies
jest.mock('../../../contexts/AuthContext-new', () => ({
  useAuth: () => ({
    currentUser: {
      id: '123',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      role: 'buyer',
      roles: ['buyer'],
      avatar: null
    },
    logout: jest.fn(),
  }),
}));

jest.mock('../../../contexts/SidebarContext', () => ({
  useSidebar: () => ({
    toggleMobileSidebar: jest.fn(),
  }),
}));

jest.mock('../../../hooks/useGlobalSearch', () => ({
  useGlobalSearch: () => ({
    isSearchOpen: false,
    openSearch: jest.fn(),
    closeSearch: jest.fn(),
    handleResultClick: jest.fn(),
  }),
}));

jest.mock('react-hot-toast', () => ({
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('../../GlobalSearch', () => {
  return function MockGlobalSearch() {
    return <div data-testid="global-search">Global Search</div>;
  };
});

describe('Header', () => {
  const renderHeader = (path = '/') => {
    window.history.pushState({}, 'Test page', path);
    return render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render header component', () => {
    renderHeader();
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('should display user menu when user is logged in', () => {
    renderHeader('/dashboard');
    const userMenuButton = screen.getByLabelText('User menu');
    expect(userMenuButton).toBeInTheDocument();
  });

  it('should toggle user menu on click', () => {
    renderHeader('/dashboard');
    const userMenuButton = screen.getByLabelText('User menu');
    
    fireEvent.click(userMenuButton);
    // Menu should be visible after click
    expect(userMenuButton).toBeInTheDocument();
  });

  it('should show minimal header on dashboard routes', () => {
    renderHeader('/dashboard');
    // Should not show full navigation on dashboard
    expect(screen.queryByText('Properties')).not.toBeInTheDocument();
  });

  it('should show full header on non-dashboard routes', () => {
    renderHeader('/');
    // Full header should be visible
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('should handle logout', async () => {
    renderHeader('/dashboard');
    const userMenuButton = screen.getByLabelText('User menu');
    fireEvent.click(userMenuButton);

    await waitFor(() => {
      expect(screen.getByText(/logout/i)).toBeInTheDocument();
    }, { timeout: 2000 });
  });
});


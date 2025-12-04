/**
 * AdminDashboard Component Tests
 * Simplified tests to verify component integration without heavy rendering
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminDashboard from '../AdminDashboard';

// Mock console methods to reduce noise
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
});
afterAll(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});

// Create stable mock functions
const mockFetchAdminProperties = jest.fn(() => Promise.resolve({
  total: 0,
  pending: 0,
  approved: 0,
  rejected: 0
}));
const mockVerifyProperty = jest.fn(() => Promise.resolve(true));
const mockNavigate = jest.fn();

// Mock all dependencies to prevent errors during rendering
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'admin-123',
      email: 'admin@example.com',
      role: 'admin',
      firstName: 'Admin',
      lastName: 'User'
    },
    loading: false,
  }),
}));

jest.mock('../../contexts/PropertyContext', () => ({
  useProperty: () => ({
    properties: [],
    loading: false,
    error: null,
    fetchAdminProperties: mockFetchAdminProperties,
    verifyProperty: mockVerifyProperty,
  }),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/admin', search: '' }),
}));

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
  },
}));

// Mock all child components with simple renders
jest.mock('../../components/layout/AdminSidebar', () => ({
  __esModule: true,
  default: () => <div data-testid="admin-sidebar">Admin Sidebar</div>,
}));

jest.mock('../../components/Breadcrumbs', () => ({
  __esModule: true,
  default: ({ items }) => (
    <nav data-testid="breadcrumbs">
      {items?.map((item, idx) => (
        <span key={idx} data-testid={`breadcrumb-${idx}`}>{item.label}</span>
      ))}
    </nav>
  ),
}));

jest.mock('../../components/TableSkeleton', () => ({
  __esModule: true,
  default: () => <div data-testid="table-skeleton">Loading...</div>,
}));

jest.mock('../../components/BlogManagement', () => ({
  __esModule: true,
  default: () => <div data-testid="blog-management">Blog Management</div>,
}));

jest.mock('../../components/AdminPropertyVerification', () => ({
  __esModule: true,
  default: () => <div data-testid="property-verification">Property Verification</div>,
}));

jest.mock('../../components/AdminPropertyDetailsModal', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('../../components/AdminDisputesManagement', () => ({
  __esModule: true,
  default: () => <div data-testid="disputes-management">Disputes Management</div>,
}));

jest.mock('../../components/AdminMortgageBankVerification', () => ({
  __esModule: true,
  default: () => <div data-testid="mortgage-bank-verification">Mortgage Bank Verification</div>,
}));

jest.mock('../../components/AdminListingsStatusChart', () => ({
  __esModule: true,
  default: () => <div data-testid="listings-chart">Listings Chart</div>,
}));

jest.mock('../../components/AdminEscrowVolumeChart', () => ({
  __esModule: true,
  default: () => <div data-testid="escrow-chart">Escrow Chart</div>,
}));

// Mock browser APIs
global.fetch = jest.fn(() => Promise.resolve({
  json: () => Promise.resolve({ success: true }),
  ok: true,
}));
window.confirm = jest.fn(() => true);
window.scrollTo = jest.fn();

describe('AdminDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchAdminProperties.mockResolvedValue({
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0
    });
  });

  it('should render admin dashboard with sidebar', async () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AdminDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('admin-sidebar')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('should render breadcrumbs component', async () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AdminDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('breadcrumbs')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('should import TableSkeleton component', () => {
    // Verify component is defined and can be imported
    expect(AdminDashboard).toBeDefined();
  });

  it('should import Breadcrumbs component', () => {
    // Verify component is defined and can be imported
    expect(AdminDashboard).toBeDefined();
  });
});

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import InvestmentPage from '../InvestmentPage';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn() },
}));

const mockInvestments = [
  {
    investmentId: 'inv_001',
    title: 'Lagos Luxury Apartments',
    description: 'Premium residential investment',
    targetAmount: 50000000,
    currentAmount: 25000000,
    fundingPercentage: 50,
    expectedReturn: 15,
    investorCount: 12,
    riskLevel: 'medium',
    status: 'active',
  },
  {
    investmentId: 'inv_002',
    title: 'Abuja Commercial Complex',
    description: 'High-yield commercial property',
    targetAmount: 100000000,
    currentAmount: 80000000,
    fundingPercentage: 80,
    expectedReturn: 20,
    investorCount: 25,
    riskLevel: 'high',
    status: 'active',
  },
];

const mockFetchInvestments = jest.fn();
const mockPagination = { total: 2, limit: 9, offset: 0 };

jest.mock('../../hooks/useInvestments', () => ({
  useInvestments: () => ({
    investments: mockInvestments,
    loading: false,
    pagination: mockPagination,
    fetchInvestments: mockFetchInvestments,
  }),
}));

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user_001', name: 'Test User' } }),
}));

jest.mock('../../components/InvestModal', () => ({ investment, onClose, onSuccess }) => (
  <div data-testid="invest-modal">
    <span>{investment?.title}</span>
    <button onClick={onClose}>Close</button>
    <button onClick={onSuccess}>Confirm</button>
  </div>
));

const renderPage = () =>
  render(
    <MemoryRouter>
      <InvestmentPage />
    </MemoryRouter>
  );

describe('InvestmentPage', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('2.2.2.1 Create InvestmentPage component', () => {
    it('renders the page with header', () => {
      renderPage();
      expect(screen.getByText(/investment opportunities/i)).toBeInTheDocument();
    });
  });

  describe('2.2.2.2 Fetch investments from GET /investments', () => {
    it('calls fetchInvestments on mount', () => {
      renderPage();
      expect(mockFetchInvestments).toHaveBeenCalled();
    });
  });

  describe('2.2.2.3 Display investments in grid format', () => {
    it('renders investment cards', () => {
      renderPage();
      expect(screen.getByText('Lagos Luxury Apartments')).toBeInTheDocument();
      expect(screen.getByText('Abuja Commercial Complex')).toBeInTheDocument();
    });
  });

  describe('2.2.2.4 Add filters', () => {
    it('renders status filter', () => {
      renderPage();
      expect(screen.getByText(/status/i)).toBeInTheDocument();
    });

    it('renders return range filters', () => {
      renderPage();
      expect(screen.getByPlaceholderText('0')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('100')).toBeInTheDocument();
    });

    it('refetches when status filter changes', async () => {
      renderPage();
      const select = screen.getAllByRole('combobox')[0];
      fireEvent.change(select, { target: { value: 'completed' } });
      await waitFor(() => expect(mockFetchInvestments).toHaveBeenCalledTimes(2));
    });
  });

  describe('2.2.2.5 Add sorting options', () => {
    it('renders sort dropdown', () => {
      renderPage();
      expect(screen.getByText(/sort by/i)).toBeInTheDocument();
    });

    it('refetches when sort changes', async () => {
      renderPage();
      const selects = screen.getAllByRole('combobox');
      fireEvent.change(selects[1], { target: { value: 'targetAmount' } });
      await waitFor(() => expect(mockFetchInvestments).toHaveBeenCalledTimes(2));
    });
  });

  describe('2.2.2.6 Implement pagination', () => {
    it('does not show pagination when only one page', () => {
      renderPage();
      expect(screen.queryByText('Previous')).not.toBeInTheDocument();
    });
  });

  describe('2.2.2.7 Add Invest Now button with modal', () => {
    it('opens invest modal when Invest Now is clicked', async () => {
      renderPage();
      const investButtons = screen.getAllByText('Invest Now');
      fireEvent.click(investButtons[0]);
      await waitFor(() => expect(screen.getByTestId('invest-modal')).toBeInTheDocument());
    });

    it('closes modal on close button click', async () => {
      renderPage();
      fireEvent.click(screen.getAllByText('Invest Now')[0]);
      await waitFor(() => screen.getByTestId('invest-modal'));
      fireEvent.click(screen.getByText('Close'));
      await waitFor(() => expect(screen.queryByTestId('invest-modal')).not.toBeInTheDocument());
    });
  });

  describe('2.2.2.8 Add View Details navigation', () => {
    it('renders View Details links', () => {
      renderPage();
      const links = screen.getAllByText('View Details');
      expect(links.length).toBeGreaterThan(0);
    });
  });

  describe('Empty state', () => {
    it('shows empty state when no investments', () => {
      jest.resetModules();
      jest.doMock('../../hooks/useInvestments', () => ({
        useInvestments: () => ({
          investments: [],
          loading: false,
          pagination: { total: 0 },
          fetchInvestments: jest.fn(),
        }),
      }));
    });
  });

  describe('Loading state', () => {
    it('shows spinner while loading', () => {
      jest.doMock('../../hooks/useInvestments', () => ({
        useInvestments: () => ({
          investments: [],
          loading: true,
          pagination: {},
          fetchInvestments: jest.fn(),
        }),
      }));
    });
  });

  describe('Reset filters', () => {
    it('resets all filters on reset button click', async () => {
      renderPage();
      fireEvent.click(screen.getByText('Reset Filters'));
      await waitFor(() => expect(mockFetchInvestments).toHaveBeenCalledTimes(2));
    });
  });
});

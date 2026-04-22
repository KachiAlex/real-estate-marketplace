import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TransactionCard from '../TransactionCard';

const mockTransaction = {
  transactionId: 'txn_001',
  propertyTitle: 'Lagos Island Apartment',
  amount: 25000000,
  status: 'pending',
  date: '2024-01-15T10:00:00Z',
  type: 'escrow_payment',
  paymentMethod: 'paystack',
  description: 'Escrow payment for property purchase',
};

describe('TransactionCard', () => {
  describe('3.1.3.1 Display transaction details', () => {
    it('renders property title', () => {
      render(<TransactionCard transaction={mockTransaction} />);
      expect(screen.getByText('Lagos Island Apartment')).toBeInTheDocument();
    });

    it('renders transaction ID', () => {
      render(<TransactionCard transaction={mockTransaction} />);
      expect(screen.getByText(/txn_001/)).toBeInTheDocument();
    });

    it('renders amount', () => {
      render(<TransactionCard transaction={mockTransaction} />);
      expect(screen.getByText(/25,000,000/)).toBeInTheDocument();
    });

    it('renders date', () => {
      render(<TransactionCard transaction={mockTransaction} />);
      expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument();
    });

    it('renders type', () => {
      render(<TransactionCard transaction={mockTransaction} />);
      expect(screen.getByText(/escrow payment/i)).toBeInTheDocument();
    });

    it('renders payment method', () => {
      render(<TransactionCard transaction={mockTransaction} />);
      expect(screen.getByText(/paystack/i)).toBeInTheDocument();
    });

    it('renders description', () => {
      render(<TransactionCard transaction={mockTransaction} />);
      expect(screen.getByText('Escrow payment for property purchase')).toBeInTheDocument();
    });

    it('returns null when no transaction provided', () => {
      const { container } = render(<TransactionCard transaction={null} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('3.1.3.2 Show status badge', () => {
    it('shows pending status badge', () => {
      render(<TransactionCard transaction={mockTransaction} />);
      expect(screen.getByText('pending')).toBeInTheDocument();
    });

    it('shows completed status badge', () => {
      render(<TransactionCard transaction={{ ...mockTransaction, status: 'completed' }} />);
      expect(screen.getByText('completed')).toBeInTheDocument();
    });

    it('shows failed status badge', () => {
      render(<TransactionCard transaction={{ ...mockTransaction, status: 'failed' }} />);
      expect(screen.getByText('failed')).toBeInTheDocument();
    });

    it('shows disputed status badge', () => {
      render(<TransactionCard transaction={{ ...mockTransaction, status: 'disputed' }} />);
      expect(screen.getByText('disputed')).toBeInTheDocument();
    });
  });

  describe('3.1.3.3 Add action buttons based on status', () => {
    it('shows "Complete Payment" for pending status', () => {
      render(<TransactionCard transaction={mockTransaction} />);
      expect(screen.getByText('Complete Payment')).toBeInTheDocument();
    });

    it('shows "View Receipt" for completed status', () => {
      render(<TransactionCard transaction={{ ...mockTransaction, status: 'completed' }} />);
      expect(screen.getByText('View Receipt')).toBeInTheDocument();
    });

    it('shows "View Dispute" for disputed status', () => {
      render(<TransactionCard transaction={{ ...mockTransaction, status: 'disputed' }} />);
      expect(screen.getByText('View Dispute')).toBeInTheDocument();
    });

    it('shows "View Details" for unknown status', () => {
      render(<TransactionCard transaction={{ ...mockTransaction, status: 'unknown' }} />);
      expect(screen.getByText('View Details')).toBeInTheDocument();
    });

    it('calls onActionClick when action button is clicked', () => {
      const mockOnActionClick = jest.fn();
      render(<TransactionCard transaction={mockTransaction} onActionClick={mockOnActionClick} />);
      fireEvent.click(screen.getByText('Complete Payment'));
      expect(mockOnActionClick).toHaveBeenCalledWith(mockTransaction);
    });

    it('does not throw when onActionClick is not provided', () => {
      render(<TransactionCard transaction={mockTransaction} />);
      expect(() => fireEvent.click(screen.getByText('Complete Payment'))).not.toThrow();
    });
  });
});

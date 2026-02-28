import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import EscrowPaymentFlow from '../EscrowPaymentFlow';

// Mock contexts used inside the component
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'u1', uid: 'u1', email: 'buyer@example.com' },
    clearAuthRedirect: jest.fn(),
    setAuthRedirect: jest.fn(),
    getAuthRedirect: jest.fn(() => null)
  })
}));

jest.mock('../../contexts/EscrowContext', () => ({
  useEscrow: () => ({ createEscrowTransaction: jest.fn(async () => ({ success: true, id: 'escrow-1' })) })
}));

// Mock PropertyContext used inside the component
jest.mock('../../contexts/PropertyContext', () => ({
  useProperty: () => ({
    fetchProperty: jest.fn(async () => ({ id: 'prop-1' })),
    getPropertyById: jest.fn(() => null)
  })
}));

// Mock InvestmentContext used inside the component
jest.mock('../../contexts/InvestmentContext', () => ({
  useInvestment: () => ({ investments: [], getInvestmentById: jest.fn(() => null) })
}));

// Mock paystack initializer
jest.mock('../../services/paystackService', () => ({
  initializePaystackPayment: jest.fn()
}));

describe('EscrowPaymentFlow (Paystack)', () => {
  it('calls PaystackPop initializer when Paystack is selected and user continues to payment', async () => {
    const property = { id: 'prop-1', title: 'Test Property', price: 1000000, owner: { id: 'vendor-1' } };

    // Mock network response for payments initialize and verify
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: {
          payment: { id: 'payment-1', reference: 'ref-1' },
          providerData: { txRef: 'ref-1', authorizationUrl: '' }
        }
      })
    });

    render(
      <MemoryRouter>
        <EscrowPaymentFlow property={property} transactionType="purchase" onClose={() => {}} />
      </MemoryRouter>
    );

    // Should show review step
    expect(screen.getByText(/Review Purchase/i)).toBeInTheDocument();

    // Continue to payment (step 2)
    fireEvent.click(screen.getByRole('button', { name: /Continue to Payment/i }));

    // Wait for payment options to render and then select Paystack (should already be default)
    await waitFor(() => expect(screen.getByRole('heading', { name: /Paystack Checkout/i })).toBeInTheDocument());

    // Click the Launch Paystack Checkout button
    const launchBtn = screen.getByRole('button', { name: /Launch Paystack Checkout/i });
    fireEvent.click(launchBtn);

    // assert the mocked initializer was invoked
    const { initializePaystackPayment } = require('../../services/paystackService');
    await waitFor(() => expect(initializePaystackPayment).toHaveBeenCalled());
  });
});

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EscrowPaymentFlow from '../EscrowPaymentFlow';

// Mock contexts used inside the component
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'u1', uid: 'u1', email: 'buyer@example.com' }, clearAuthRedirect: jest.fn() })
}));

jest.mock('../../contexts/EscrowContext', () => ({
  useEscrow: () => ({ createEscrowTransaction: jest.fn(async () => ({ success: true, id: 'escrow-1' })) })
}));

// Mock paystack initializer
jest.mock('../../services/paystackService', () => ({
  initializePaystackPayment: jest.fn()
}));

describe('EscrowPaymentFlow (Paystack)', () => {
  it('calls PaystackPop initializer when Paystack is selected and user continues to payment', async () => {
    const property = { id: 'prop-1', title: 'Test Property', price: 1000000, owner: { id: 'vendor-1' } };

    render(
      <EscrowPaymentFlow property={property} transactionType="purchase" onClose={() => {}} />
    );

    // Should show review step
    expect(screen.getByText(/Review Purchase/i)).toBeInTheDocument();

    // Continue to payment (step 2)
    fireEvent.click(screen.getByRole('button', { name: /Continue to Payment/i }));

    // Wait for payment options to render and then select Paystack (should already be default)
    await waitFor(() => expect(screen.getByText(/Paystack Checkout/i)).toBeInTheDocument());

    // Click "Re-launch Paystack Checkout" button
    const launchBtn = screen.getByRole('button', { name: /Re-launch Paystack Checkout/i });
    fireEvent.click(launchBtn);

    // assert the mocked initializer was invoked
    const { initializePaystackPayment } = require('../../services/paystackService');
    await waitFor(() => expect(initializePaystackPayment).toHaveBeenCalled());
  });
});

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PropertyPurchaseButton from '../PropertyPurchaseButton';

// Mock AuthContext to simulate a signed-in user
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1', uid: 'user-1', email: 'test@example.com' },
    setAuthRedirect: jest.fn()
  })
}));

// Mock EscrowContext to intercept escrow creation
jest.mock('../../contexts/EscrowContext', () => ({
  useEscrow: () => ({ createEscrowTransaction: jest.fn(async () => ({ success: true, id: 'escrow-1' })) })
}));

// Mock Paystack initializer so we can assert it was invoked by the auto-start flow
jest.mock('../../services/paystackService', () => ({
  initializePaystackPayment: jest.fn()
}));

describe('PropertyPurchaseButton', () => {
  afterEach(() => jest.clearAllMocks());

  it('opens EscrowPaymentFlow modal and defaults to Paystack when user is signed in', async () => {
    const property = { id: 'prop-1', title: 'Test Property', price: 500000 };

    render(
      <BrowserRouter>
        <PropertyPurchaseButton property={property} />
      </BrowserRouter>
    );

    const btn = screen.getByRole('button', { name: /Buy with Escrow Protection/i });
    expect(btn).toBeInTheDocument();

    fireEvent.click(btn);

    // Modal should open and show review step
    await waitFor(() => expect(screen.getByText(/Review Purchase/i)).toBeInTheDocument());

    // Auto-start payment should trigger Paystack initializer (one-click flow)
    const { initializePaystackPayment } = require('../../services/paystackService');
    await waitFor(() => expect(initializePaystackPayment).toHaveBeenCalled());

    // (Also verify UI still allows manual proceed-to-payment)
    fireEvent.click(screen.getByRole('button', { name: /Continue to Payment/i }));
    await waitFor(() => expect(screen.getByText(/Paystack Checkout/i)).toBeInTheDocument());
  });
});

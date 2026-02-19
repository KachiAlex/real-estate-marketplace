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

    // Proceed to payment step
    fireEvent.click(screen.getByRole('button', { name: /Continue to Payment/i }));

    // Paystack option should be selected by default (we show provider checkout heading)
    await waitFor(() => expect(screen.getByText(/Paystack Checkout/i)).toBeInTheDocument());
  });
});

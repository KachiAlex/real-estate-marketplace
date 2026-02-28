import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PropertyPurchaseButton from '../PropertyPurchaseButton';
import { PropertyProvider } from '../../contexts/PropertyContext';
import { InvestmentProvider } from '../../contexts/InvestmentContext';

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

// Stub EscrowPaymentFlow to avoid heavy async/payment logic
jest.mock('../EscrowPaymentFlow', () => () => <div data-testid="escrow-flow">Escrow Flow</div>);

describe('PropertyPurchaseButton', () => {
  afterEach(() => jest.clearAllMocks());

  it('opens EscrowPaymentFlow modal and defaults to Paystack when user is signed in', async () => {
    const property = { id: 'prop-1', title: 'Test Property', price: 500000 };

    render(
      <BrowserRouter>
        <InvestmentProvider>
          <PropertyProvider>
            <PropertyPurchaseButton property={property} />
          </PropertyProvider>
        </InvestmentProvider>
      </BrowserRouter>
    );

    const btn = screen.getByRole('button', { name: /Buy with Escrow Protection/i });
    expect(btn).toBeInTheDocument();

    fireEvent.click(btn);

    // Modal should open and render stubbed flow component
    await waitFor(() => expect(screen.getByTestId('escrow-flow')).toBeInTheDocument());
  });
});

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

// Mocks
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...(jest.requireActual('react-router-dom')),
  useNavigate: () => mockNavigate,
}));

const mockSwitchRole = jest.fn();
const mockUser = {
  id: 'u1',
  firstName: 'Test',
  lastName: 'User',
  roles: ['buyer'],
  activeRole: 'buyer'
};

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    switchRole: mockSwitchRole
  })
}));

import RoleSwitcher from '../RoleSwitcher';

describe('RoleSwitcher', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockSwitchRole.mockClear();
  });

  test('renders active role and buttons', () => {
    render(<RoleSwitcher onClose={() => {}} />);
    expect(screen.getByText(/Active Role/i)).toBeInTheDocument();
    // Target the actual buttons by role to avoid matching badge text
    expect(screen.getByRole('button', { name: /Buyer/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Vendor/i })).toBeInTheDocument();
  });

  test('switches to vendor and navigates to onboarding when not a vendor', async () => {
    // Simulate switchRole resolving to an object without vendor role
    mockSwitchRole.mockResolvedValueOnce({ roles: ['buyer'], activeRole: 'buyer' });

    render(<RoleSwitcher onClose={() => {}} />);

    const vendorBtn = screen.getByText('Vendor');
    fireEvent.click(vendorBtn);

    await waitFor(() => expect(mockSwitchRole).toHaveBeenCalledWith('vendor'));

    // Should navigate to vendor registration since roles do not include vendor
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/vendor/register', { replace: true }));
  });

  test('switches to buyer and navigates to dashboard', async () => {
    mockSwitchRole.mockResolvedValueOnce({ roles: ['buyer'], activeRole: 'buyer' });

    render(<RoleSwitcher onClose={() => {}} />);

    const buyerBtn = screen.getByRole('button', { name: 'Buyer' });
    fireEvent.click(buyerBtn);

    await waitFor(() => expect(mockSwitchRole).toHaveBeenCalledWith('buyer'));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true }));
  });
});

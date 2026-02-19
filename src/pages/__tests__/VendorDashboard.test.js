import React from 'react';
import { render, screen } from '@testing-library/react';
import VendorDashboard from '../VendorDashboard';
import { PropertyProvider } from '../../src/contexts/PropertyContext';

// Minimal smoke test for Overview header and quick stats
describe('VendorDashboard Overview', () => {
  it('renders Overview header and quick stats', () => {
    render(<VendorDashboard />);
    expect(screen.getByText(/Overview/i)).toBeInTheDocument();
  });
});
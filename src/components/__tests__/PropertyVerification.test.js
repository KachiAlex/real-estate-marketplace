import { render, screen, fireEvent } from '@testing-library/react';
import PropertyVerification from '../PropertyVerification';

describe('PropertyVerification Flow', () => {
  it('renders verification form and submits successfully', () => {
    render(<PropertyVerification propertyId="test123" />);
    // Check for form fields
    expect(screen.getByLabelText(/Document Type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Upload Document/i)).toBeInTheDocument();
    // Simulate file upload
    const fileInput = screen.getByLabelText(/Upload Document/i);
    fireEvent.change(fileInput, { target: { files: [new File(['dummy'], 'test.pdf', { type: 'application/pdf' })] } });
    // Simulate submit
    fireEvent.click(screen.getByText(/Submit/i));
    // Check for success message
    expect(screen.findByText(/Verification submitted/i)).resolves.toBeTruthy();
  });

  it('shows error for missing document', () => {
    render(<PropertyVerification propertyId="test123" />);
    fireEvent.click(screen.getByText(/Submit/i));
    expect(screen.findByText(/Please upload a document/i)).resolves.toBeTruthy();
  });
});

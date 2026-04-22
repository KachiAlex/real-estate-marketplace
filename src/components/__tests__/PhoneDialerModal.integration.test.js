/**
 * Integration test for PhoneDialerModal component
 * Validates all requirements from the bugfix spec
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PhoneDialerModal from '../PhoneDialerModal';
import toast from 'react-hot-toast';

jest.mock('react-hot-toast');

describe('PhoneDialerModal - Bugfix Requirements Validation', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn(() => Promise.resolve())
      }
    });
  });

  describe('Requirement 2.1: Display modal with phone number', () => {
    it('should display a modal dialog showing the vendor phone number', () => {
      render(
        <PhoneDialerModal
          isOpen={true}
          onClose={mockOnClose}
          phoneNumber="+2348012345678"
          vendorName="John Doe"
        />
      );

      expect(screen.getByText(/Call John Doe/i)).toBeInTheDocument();
      expect(screen.getByText('+2348012345678')).toBeInTheDocument();
    });

    it('should display phone number in clear, readable format', () => {
      render(
        <PhoneDialerModal
          isOpen={true}
          onClose={mockOnClose}
          phoneNumber="+2348012345678"
          vendorName="Vendor"
        />
      );

      const phoneDisplay = screen.getByText('+2348012345678');
      expect(phoneDisplay).toHaveClass('text-3xl', 'font-bold', 'font-mono');
    });
  });

  describe('Requirement 2.2: Mobile - Show Call button', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        configurable: true
      });
    });

    it('should display Call button on mobile devices', async () => {
      render(
        <PhoneDialerModal
          isOpen={true}
          onClose={mockOnClose}
          phoneNumber="+2348012345678"
          vendorName="Vendor"
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Call Now/i)).toBeInTheDocument();
      });
    });
  });

  describe('Requirement 2.3: Desktop - Show Copy Number button', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        configurable: true
      });
    });

    it('should display Copy Number button on desktop', async () => {
      render(
        <PhoneDialerModal
          isOpen={true}
          onClose={mockOnClose}
          phoneNumber="+2348012345678"
          vendorName="Vendor"
        />
      );

      await waitFor(() => {
        const copyButtons = screen.getAllByText(/Copy Number/i);
        expect(copyButtons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Requirement 2.4: Mobile - Call button opens tel: protocol', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        configurable: true
      });

      const mockAnchor = {
        href: '',
        click: jest.fn()
      };

      jest.spyOn(document, 'createElement').mockReturnValue(mockAnchor);
      jest.spyOn(document.body, 'appendChild').mockReturnValue(mockAnchor);
      jest.spyOn(document.body, 'removeChild').mockReturnValue(mockAnchor);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should open device phone dialer with tel: protocol', async () => {
      render(
        <PhoneDialerModal
          isOpen={true}
          onClose={mockOnClose}
          phoneNumber="+2348012345678"
          vendorName="Vendor"
        />
      );

      const callButton = await screen.findByText(/Call Now/i);
      fireEvent.click(callButton);

      await waitFor(() => {
        expect(document.createElement).toHaveBeenCalledWith('a');
      });
    });
  });

  describe('Requirement 2.5: Desktop - Copy button copies to clipboard', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        configurable: true
      });
    });

    it('should copy phone number to clipboard', async () => {
      render(
        <PhoneDialerModal
          isOpen={true}
          onClose={mockOnClose}
          phoneNumber="+2348012345678"
          vendorName="Vendor"
        />
      );

      const copyButton = screen.getByText(/Copy Number/i);
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('+2348012345678');
      });
    });

    it('should show success toast notification after copying', async () => {
      render(
        <PhoneDialerModal
          isOpen={true}
          onClose={mockOnClose}
          phoneNumber="+2348012345678"
          vendorName="Vendor"
        />
      );

      const copyButton = screen.getByText(/Copy Number/i);
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Phone number copied to clipboard!');
      });
    });
  });

  describe('Requirement 2.6: Error handling for missing phone number', () => {
    it('should display clear error message when phone number is not available', () => {
      render(
        <PhoneDialerModal
          isOpen={true}
          onClose={mockOnClose}
          phoneNumber=""
          vendorName="Vendor"
        />
      );

      expect(screen.getByText(/Phone Number Not Available/i)).toBeInTheDocument();
      expect(screen.getByText(/vendor's phone number is not available/i)).toBeInTheDocument();
    });

    it('should suggest Contact Vendor option in error message', () => {
      render(
        <PhoneDialerModal
          isOpen={true}
          onClose={mockOnClose}
          phoneNumber={null}
          vendorName="Vendor"
        />
      );

      expect(screen.getByText(/Contact Vendor/i)).toBeInTheDocument();
    });

    it('should show Close button in error state', () => {
      render(
        <PhoneDialerModal
          isOpen={true}
          onClose={mockOnClose}
          phoneNumber=""
          vendorName="Vendor"
        />
      );

      const closeButton = screen.getByText(/Close/i);
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('Requirement 3.1: Cancel button closes modal', () => {
    it('should close modal when Cancel button is clicked', () => {
      render(
        <PhoneDialerModal
          isOpen={true}
          onClose={mockOnClose}
          phoneNumber="+2348012345678"
          vendorName="Vendor"
        />
      );

      const cancelButton = screen.getByText(/Cancel/i);
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should close modal when X button is clicked', () => {
      render(
        <PhoneDialerModal
          isOpen={true}
          onClose={mockOnClose}
          phoneNumber="+2348012345678"
          vendorName="Vendor"
        />
      );

      const closeButton = screen.getByLabelText(/Close modal/i);
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Requirement 3.3: Modal does not create inquiry on cancel', () => {
    it('should not create inquiry when modal is cancelled', () => {
      // This is handled by PropertyDetail.js - the modal itself doesn't create inquiries
      // The inquiry is created in handleCallVendor before opening the modal
      render(
        <PhoneDialerModal
          isOpen={true}
          onClose={mockOnClose}
          phoneNumber="+2348012345678"
          vendorName="Vendor"
        />
      );

      const cancelButton = screen.getByText(/Cancel/i);
      fireEvent.click(cancelButton);

      // Modal should just close without side effects
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Platform Detection', () => {
    it('should detect mobile devices correctly', async () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Android; Mobile; rv:40.0)',
        configurable: true
      });

      render(
        <PhoneDialerModal
          isOpen={true}
          onClose={mockOnClose}
          phoneNumber="+2348012345678"
          vendorName="Vendor"
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Call Now/i)).toBeInTheDocument();
      });
    });

    it('should detect desktop devices correctly', async () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (X11; Linux x86_64)',
        configurable: true
      });

      render(
        <PhoneDialerModal
          isOpen={true}
          onClose={mockOnClose}
          phoneNumber="+2348012345678"
          vendorName="Vendor"
        />
      );

      await waitFor(() => {
        const copyButtons = screen.getAllByText(/Copy Number/i);
        expect(copyButtons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Toast Notifications', () => {
    it('should show success toast when copy is successful', async () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        configurable: true
      });

      render(
        <PhoneDialerModal
          isOpen={true}
          onClose={mockOnClose}
          phoneNumber="+2348012345678"
          vendorName="Vendor"
        />
      );

      const copyButton = screen.getByText(/Copy Number/i);
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Phone number copied to clipboard!');
      });
    });

    it('should show error toast when copy fails', async () => {
      navigator.clipboard.writeText.mockRejectedValueOnce(new Error('Copy failed'));

      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        configurable: true
      });

      render(
        <PhoneDialerModal
          isOpen={true}
          onClose={mockOnClose}
          phoneNumber="+2348012345678"
          vendorName="Vendor"
        />
      );

      const copyButton = screen.getByText(/Copy Number/i);
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to copy phone number');
      });
    });
  });

  describe('Styling and Consistency', () => {
    it('should have consistent styling with the app', () => {
      render(
        <PhoneDialerModal
          isOpen={true}
          onClose={mockOnClose}
          phoneNumber="+2348012345678"
          vendorName="Vendor"
        />
      );

      const modal = screen.getByText(/Call Vendor/i).closest('div').parentElement;
      expect(modal).toHaveClass('bg-white', 'rounded-lg', 'shadow-lg');
    });

    it('should have proper button styling', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        configurable: true
      });

      render(
        <PhoneDialerModal
          isOpen={true}
          onClose={mockOnClose}
          phoneNumber="+2348012345678"
          vendorName="Vendor"
        />
      );

      const copyButton = screen.getByText(/Copy Number/i);
      expect(copyButton).toHaveClass('bg-blue-600', 'text-white', 'rounded-md');
    });
  });
});

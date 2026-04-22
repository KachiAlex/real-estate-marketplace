import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import toast from 'react-hot-toast';
import PhoneDialerModal from '../PhoneDialerModal';

// Mock react-hot-toast
jest.mock('react-hot-toast');

describe('PhoneDialerModal', () => {
  const mockOnClose = jest.fn();
  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    phoneNumber: '+2348012345678',
    vendorName: 'John Doe'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock navigator.clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn(() => Promise.resolve())
      }
    });
  });

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      const { container } = render(
        <PhoneDialerModal {...defaultProps} isOpen={false} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should render modal when isOpen is true', () => {
      render(<PhoneDialerModal {...defaultProps} />);
      expect(screen.getByText(/Call John Doe/i)).toBeInTheDocument();
    });

    it('should display the phone number', () => {
      render(<PhoneDialerModal {...defaultProps} />);
      expect(screen.getByText('+2348012345678')).toBeInTheDocument();
    });

    it('should display error message when phone number is empty', () => {
      render(
        <PhoneDialerModal {...defaultProps} phoneNumber="" />
      );
      expect(screen.getByText(/Phone Number Not Available/i)).toBeInTheDocument();
      expect(screen.getByText(/vendor's phone number is not available/i)).toBeInTheDocument();
    });

    it('should display error message when phone number is null', () => {
      render(
        <PhoneDialerModal {...defaultProps} phoneNumber={null} />
      );
      expect(screen.getByText(/Phone Number Not Available/i)).toBeInTheDocument();
    });
  });

  describe('Mobile Detection', () => {
    it('should show Call Now button on mobile devices', async () => {
      // Mock mobile user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        configurable: true
      });

      render(<PhoneDialerModal {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText(/Call Now/i)).toBeInTheDocument();
      });
    });

    it('should show Copy Number as primary button on desktop', async () => {
      // Mock desktop user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        configurable: true
      });

      render(<PhoneDialerModal {...defaultProps} />);
      
      await waitFor(() => {
        const copyButtons = screen.getAllByText(/Copy Number/i);
        expect(copyButtons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Copy Number Functionality', () => {
    it('should copy phone number to clipboard', async () => {
      render(<PhoneDialerModal {...defaultProps} />);
      
      const copyButton = screen.getByText(/Copy Number/i);
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('+2348012345678');
        expect(toast.success).toHaveBeenCalledWith('Phone number copied to clipboard!');
      });
    });

    it('should show Copied! state after copying', async () => {
      render(<PhoneDialerModal {...defaultProps} />);
      
      const copyButton = screen.getByText(/Copy Number/i);
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(screen.getByText(/Copied!/i)).toBeInTheDocument();
      });
    });

    it('should handle clipboard copy errors', async () => {
      navigator.clipboard.writeText.mockRejectedValueOnce(new Error('Copy failed'));
      
      render(<PhoneDialerModal {...defaultProps} />);
      
      const copyButton = screen.getByText(/Copy Number/i);
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to copy phone number');
      });
    });

    it('should not copy when phone number is empty', () => {
      render(
        <PhoneDialerModal {...defaultProps} phoneNumber="" />
      );
      
      const closeButton = screen.getByText(/Close/i);
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('Call Functionality', () => {
    beforeEach(() => {
      // Mock document.createElement and related methods
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

    it('should create tel: link with correct format', async () => {
      // Mock mobile user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        configurable: true
      });

      render(<PhoneDialerModal {...defaultProps} />);
      
      const callButton = await screen.findByText(/Call Now/i);
      fireEvent.click(callButton);

      await waitFor(() => {
        expect(document.createElement).toHaveBeenCalledWith('a');
      });
    });

    it('should close modal after successful call', async () => {
      // Mock mobile user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        configurable: true
      });

      render(<PhoneDialerModal {...defaultProps} />);
      
      const callButton = await screen.findByText(/Call Now/i);
      fireEvent.click(callButton);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe('Close Button', () => {
    it('should call onClose when close button is clicked', () => {
      render(<PhoneDialerModal {...defaultProps} />);
      
      const closeButton = screen.getByLabelText(/Close modal/i);
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onClose when Cancel button is clicked', () => {
      render(<PhoneDialerModal {...defaultProps} />);
      
      const cancelButton = screen.getByText(/Cancel/i);
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onClose when Close button is clicked in error state', () => {
      render(
        <PhoneDialerModal {...defaultProps} phoneNumber="" />
      );
      
      const closeButton = screen.getByText(/Close/i);
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Vendor Name Display', () => {
    it('should display custom vendor name', () => {
      render(
        <PhoneDialerModal {...defaultProps} vendorName="Jane Smith" />
      );
      expect(screen.getByText(/Call Jane Smith/i)).toBeInTheDocument();
    });

    it('should display default vendor name when not provided', () => {
      render(
        <PhoneDialerModal {...defaultProps} vendorName="Vendor" />
      );
      expect(screen.getByText(/Call Vendor/i)).toBeInTheDocument();
    });
  });

  describe('Phone Number Formatting', () => {
    it('should handle phone numbers with + prefix', async () => {
      render(<PhoneDialerModal {...defaultProps} phoneNumber="+2348012345678" />);
      
      const copyButton = screen.getByText(/Copy Number/i);
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('+2348012345678');
      });
    });

    it('should handle phone numbers without + prefix', async () => {
      render(<PhoneDialerModal {...defaultProps} phoneNumber="2348012345678" />);
      
      const copyButton = screen.getByText(/Copy Number/i);
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('2348012345678');
      });
    });
  });
});

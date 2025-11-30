import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Pagination, { PaginationInfo, ItemsPerPageSelector } from '../Pagination';

// Mock window.scrollTo
window.scrollTo = jest.fn();

describe('Pagination', () => {
  const defaultProps = {
    currentPage: 1,
    totalPages: 10,
    onPageChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not render when totalPages is 1 or less', () => {
    const { container } = render(<Pagination currentPage={1} totalPages={1} onPageChange={jest.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render pagination component', () => {
    render(<Pagination {...defaultProps} />);
    const prevButton = screen.getByLabelText('Previous page');
    expect(prevButton).toBeInTheDocument();
  });

  it('should display current page', () => {
    render(<Pagination {...defaultProps} currentPage={5} />);
    const currentPageButton = screen.getByLabelText('Page 5');
    expect(currentPageButton).toBeInTheDocument();
    expect(currentPageButton).toHaveClass('bg-blue-600');
  });

  it('should call onPageChange when next button is clicked', () => {
    const onPageChange = jest.fn();
    render(<Pagination {...defaultProps} onPageChange={onPageChange} />);
    
    const nextButton = screen.getByLabelText('Next page');
    fireEvent.click(nextButton);
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('should call onPageChange when previous button is clicked', () => {
    const onPageChange = jest.fn();
    render(<Pagination {...defaultProps} currentPage={2} onPageChange={onPageChange} />);
    
    const prevButton = screen.getByLabelText('Previous page');
    fireEvent.click(prevButton);
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it('should disable previous button on first page', () => {
    render(<Pagination {...defaultProps} currentPage={1} />);
    const prevButton = screen.getByLabelText('Previous page');
    expect(prevButton).toBeDisabled();
  });

  it('should disable next button on last page', () => {
    render(<Pagination {...defaultProps} currentPage={10} totalPages={10} />);
    const nextButton = screen.getByLabelText('Next page');
    expect(nextButton).toBeDisabled();
  });

  it('should scroll to top when page changes', () => {
    const onPageChange = jest.fn();
    render(<Pagination {...defaultProps} currentPage={2} onPageChange={onPageChange} />);
    
    const nextButton = screen.getByLabelText('Next page');
    fireEvent.click(nextButton);
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });

  it('should show first and last page buttons when showFirstLast is true', () => {
    render(<Pagination {...defaultProps} currentPage={5} showFirstLast={true} />);
    const firstButton = screen.getByLabelText('First page');
    const lastButton = screen.getByLabelText('Last page');
    expect(firstButton).toBeInTheDocument();
    expect(lastButton).toBeInTheDocument();
  });
});

describe('PaginationInfo', () => {
  it('should display pagination information', () => {
    render(<PaginationInfo currentPage={2} totalPages={10} totalItems={100} itemsPerPage={12} />);
    expect(screen.getByText(/Showing/i)).toBeInTheDocument();
    expect(screen.getByText(/13/i)).toBeInTheDocument();
    expect(screen.getByText(/24/i)).toBeInTheDocument();
    expect(screen.getByText(/100/i)).toBeInTheDocument();
  });
});

describe('ItemsPerPageSelector', () => {
  it('should render items per page selector', () => {
    const onChange = jest.fn();
    render(<ItemsPerPageSelector value={12} onChange={onChange} />);
    
    const select = screen.getByLabelText(/Items per page/i);
    expect(select).toBeInTheDocument();
    expect(select).toHaveValue('12');
  });

  it('should call onChange when selection changes', () => {
    const onChange = jest.fn();
    render(<ItemsPerPageSelector value={12} onChange={onChange} />);
    
    const select = screen.getByLabelText(/Items per page/i);
    fireEvent.change(select, { target: { value: '24' } });
    expect(onChange).toHaveBeenCalledWith(24);
  });
});


import React from 'react';
import { render, screen } from '@testing-library/react';
import TableSkeleton from '../TableSkeleton';

describe('TableSkeleton', () => {
  it('should render table skeleton with default rows and columns', () => {
    const { container } = render(<TableSkeleton />);
    
    // Should render skeleton structure
    const skeleton = container.querySelector('.bg-white.rounded-lg');
    expect(skeleton).toBeInTheDocument();
  });

  it('should render with custom number of rows', () => {
    const { container } = render(<TableSkeleton rows={10} />);
    
    // Check for skeleton structure
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('should render with custom number of columns', () => {
    const { container } = render(<TableSkeleton columns={6} />);
    
    // Should render with correct column count
    expect(container.querySelector('.grid')).toBeInTheDocument();
  });

  it('should render with custom rows and columns', () => {
    const { container } = render(<TableSkeleton rows={8} columns={5} />);
    
    expect(container.querySelector('.bg-white')).toBeInTheDocument();
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('should have correct CSS classes for styling', () => {
    const { container } = render(<TableSkeleton />);
    
    const skeleton = container.firstChild;
    expect(skeleton).toHaveClass('bg-white', 'rounded-lg', 'shadow-sm');
  });

  it('should render table header skeleton', () => {
    const { container } = render(<TableSkeleton />);
    
    // Check for header structure
    const header = container.querySelector('.bg-gray-50');
    expect(header).toBeInTheDocument();
  });

  it('should render table body with rows', () => {
    const { container } = render(<TableSkeleton rows={3} />);
    
    // Check for body structure
    const body = container.querySelector('.divide-y');
    expect(body).toBeInTheDocument();
  });
});


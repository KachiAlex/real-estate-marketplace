import React from 'react';
import { render, screen } from '@testing-library/react';
import PropertyCardSkeleton from '../PropertyCardSkeleton';

describe('PropertyCardSkeleton', () => {
  it('should render property card skeleton', () => {
    render(<PropertyCardSkeleton />);
    
    // Should render skeleton structure
    const skeleton = document.querySelector('.animate-pulse');
    expect(skeleton).toBeInTheDocument();
  });

  it('should render with default count of 1', () => {
    const { container } = render(<PropertyCardSkeleton />);
    
    const skeletons = container.querySelectorAll('.bg-white.rounded-xl');
    expect(skeletons.length).toBe(1);
  });

  it('should render multiple skeletons when count prop is provided', () => {
    const { container } = render(<PropertyCardSkeleton count={6} />);
    
    const skeletons = container.querySelectorAll('.bg-white.rounded-xl');
    expect(skeletons.length).toBe(6);
  });

  it('should render image skeleton', () => {
    const { container } = render(<PropertyCardSkeleton />);
    
    const imageSkeleton = container.querySelector('.h-48.bg-gray-300');
    expect(imageSkeleton).toBeInTheDocument();
  });

  it('should render content skeleton sections', () => {
    const { container } = render(<PropertyCardSkeleton />);
    
    // Check for price skeleton
    expect(container.querySelector('.h-8')).toBeInTheDocument();
    // Check for title skeleton
    expect(container.querySelector('.h-6')).toBeInTheDocument();
    // Check for button skeleton
    expect(container.querySelector('.h-10')).toBeInTheDocument();
  });

  it('should have correct CSS classes for styling', () => {
    const { container } = render(<PropertyCardSkeleton />);
    
    const skeleton = container.querySelector('.bg-white.rounded-xl');
    expect(skeleton).toHaveClass('shadow-md', 'overflow-hidden', 'animate-pulse');
  });

  it('should render features skeleton section', () => {
    const { container } = render(<PropertyCardSkeleton />);
    
    const features = container.querySelector('.flex.items-center.space-x-4');
    expect(features).toBeInTheDocument();
  });
});


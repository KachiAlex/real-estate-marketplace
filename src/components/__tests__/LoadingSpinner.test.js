import React from 'react';
import { render } from '@testing-library/react';
import LoadingSpinner from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  it('should render loading spinner', () => {
    const { container } = render(<LoadingSpinner />);
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeTruthy();
  });

  it('should render with default size', () => {
    const { container } = render(<LoadingSpinner />);
    const spinner = container.querySelector('.h-8');
    expect(spinner).toBeTruthy();
  });

  it('should render with custom size', () => {
    const { container } = render(<LoadingSpinner size="lg" />);
    const spinner = container.querySelector('.h-12');
    expect(spinner).toBeTruthy();
  });

  it('should apply custom className', () => {
    const { container } = render(<LoadingSpinner className="custom-class" />);
    const wrapper = container.querySelector('.custom-class');
    expect(wrapper).toBeTruthy();
  });

  it('should render with different sizes', () => {
    const sizes = ['sm', 'md', 'lg', 'xl'];
    sizes.forEach(size => {
      const { container } = render(<LoadingSpinner size={size} />);
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeTruthy();
    });
  });
});


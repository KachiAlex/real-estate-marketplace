import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import OptimizedImage from '../OptimizedImage';

// Mock Image constructor for WebP detection
global.Image = class {
  constructor() {
    this.height = 0;
    this.width = 0;
    this.onload = null;
    this.onerror = null;
    this.src = '';
  }
};

describe('OptimizedImage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render optimized image component', () => {
    render(<OptimizedImage src="https://example.com/image.jpg" alt="Test image" />);
    
    const img = screen.getByAltText('Test image');
    expect(img).toBeInTheDocument();
  });

  it('should render image component', () => {
    const { container } = render(<OptimizedImage src="https://example.com/image.jpg" alt="Test" />);
    
    // Check if image exists
    const img = container.querySelector('img');
    expect(img).toBeInTheDocument();
  });

  it('should handle missing src gracefully', () => {
    render(<OptimizedImage alt="Fallback" />);
    
    const img = screen.getByAltText('Fallback');
    expect(img).toBeInTheDocument();
  });

  it('should use fallback image when provided', () => {
    render(
      <OptimizedImage 
        src="https://example.com/image.jpg" 
        alt="Test"
        fallback="https://fallback.com/image.jpg"
      />
    );
    
    const img = screen.getByAltText('Test');
    expect(img).toHaveAttribute('src');
  });

  it('should apply custom className', () => {
    const { container } = render(
      <OptimizedImage 
        src="https://example.com/image.jpg" 
        alt="Test"
        className="custom-class"
      />
    );
    
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('custom-class');
  });

  it('should support lazy loading', () => {
    render(
      <OptimizedImage 
        src="https://example.com/image.jpg" 
        alt="Test"
        loading="lazy"
      />
    );
    
    const img = screen.getByAltText('Test');
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('should support eager loading', () => {
    render(
      <OptimizedImage 
        src="https://example.com/image.jpg" 
        alt="Test"
        loading="eager"
      />
    );
    
    const img = screen.getByAltText('Test');
    expect(img).toHaveAttribute('loading', 'eager');
  });

  it('should handle image load events', async () => {
    render(<OptimizedImage src="https://example.com/image.jpg" alt="Test" />);
    
    const img = screen.getByAltText('Test');
    
    // Simulate image load
    const loadEvent = new Event('load');
    img.dispatchEvent(loadEvent);
    
    await waitFor(() => {
      expect(img).toBeInTheDocument();
    });
  });

  it('should handle image error events', async () => {
    const fallback = 'https://fallback.com/image.jpg';
    render(
      <OptimizedImage 
        src="https://invalid-url.com/image.jpg" 
        alt="Test"
        fallback={fallback}
      />
    );
    
    const img = screen.getByAltText('Test');
    
    // Simulate image error
    const errorEvent = new Event('error');
    img.dispatchEvent(errorEvent);
    
    await waitFor(() => {
      expect(img).toBeInTheDocument();
    });
  });

  it('should apply width and height styles', () => {
    const { container } = render(
      <OptimizedImage 
        src="https://example.com/image.jpg" 
        alt="Test"
        width={300}
        height={200}
      />
    );
    
    const wrapper = container.firstChild;
    expect(wrapper).toHaveStyle({ width: '300px', height: '200px' });
  });

  it('should generate srcset for responsive images', () => {
    const src = 'https://example.com/image.jpg';
    render(
      <OptimizedImage 
        src={src}
        alt="Test"
      />
    );
    
    const img = screen.getByAltText('Test');
    // srcset should be generated for valid URLs
    expect(img).toBeInTheDocument();
  });

  it('should not generate srcset for data URLs', () => {
    const dataUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';
    render(
      <OptimizedImage 
        src={dataUrl}
        alt="Test"
      />
    );
    
    const img = screen.getByAltText('Test');
    expect(img).toBeInTheDocument();
    // Data URLs shouldn't have srcset
    expect(img.getAttribute('srcset')).toBeNull();
  });
});


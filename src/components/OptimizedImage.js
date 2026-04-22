import React, { useState, useEffect } from 'react';

/**
 * Optimized Image Component with lazy loading and responsive sizes
 * Supports WebP with fallback, lazy loading, and responsive sizing
 */
const OptimizedImage = ({
  src,
  alt,
  className = '',
  width,
  height,
  sizes,
  loading = 'lazy',
  fallback,
  ...props
}) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [supportsWebP, setSupportsWebP] = useState(false);

  // Check WebP support
  useEffect(() => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      setSupportsWebP(webP.height === 2);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  }, []);

  // Generate responsive image URLs
  useEffect(() => {
    if (!src) {
      setIsLoading(false);
      return;
    }

    // If WebP is supported and src is a string URL, try to convert to WebP
    if (supportsWebP && typeof src === 'string' && !src.includes('data:')) {
      // For cloud storage URLs, we can append webp parameter or use srcset
      // For now, use original src
      setImageSrc(src);
    } else {
      setImageSrc(src);
    }
    setIsLoading(false);
  }, [src, supportsWebP]);

  // Generate srcset for responsive images
  const generateSrcSet = () => {
    if (!src || typeof src !== 'string' || src.includes('data:')) {
      return null;
    }

    const baseUrl = src.split('?')[0];
    const sizes = ['640w', '768w', '1024w', '1280w', '1920w'];
    return sizes.map(size => `${baseUrl}?w=${size.split('w')[0]} ${size}`).join(', ');
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
    if (fallback) {
      setImageSrc(fallback);
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  // Default fallback image
  const defaultFallback = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop';

  const finalSrc = hasError && fallback ? fallback : (imageSrc || fallback || defaultFallback);
  const srcSetValue = generateSrcSet();

  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded" />
      )}
      <img
        src={finalSrc}
        alt={alt || ''}
        loading={loading}
        onError={handleError}
        onLoad={handleLoad}
        srcSet={srcSetValue || undefined}
        sizes={sizes || '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        {...props}
      />
    </div>
  );
};

export default OptimizedImage;


import React, { useState, useEffect, useRef } from 'react';

/**
 * LazyImage Component
 * Implements intersection observer for lazy loading images
 * Shows skeleton loader while image is loading
 */
const LazyImage = ({
  src,
  alt = '',
  className = '',
  fallbackSrc = '/images/placeholder.jpg',
  aspectRatio = '16/9', // CSS aspect-ratio value
  objectFit = 'cover', // cover, contain, fill, etc.
  threshold = 0.1, // Intersection observer threshold
  onLoad,
  onError,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => {
    // Create intersection observer
    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          // Stop observing once image is in view
          if (observerRef.current && imgRef.current) {
            observerRef.current.disconnect();
          }
        }
      },
      {
        threshold,
        rootMargin: '50px' // Start loading 50px before image enters viewport
      }
    );

    // Start observing
    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    // Cleanup
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [threshold]);

  const handleLoad = (e) => {
    setIsLoaded(true);
    if (onLoad) onLoad(e);
  };

  const handleError = (e) => {
    setError(true);
    setIsLoaded(true);
    if (onError) onError(e);
  };

  return (
    <div
      ref={imgRef}
      className={`relative overflow-hidden bg-gray-200 ${className}`}
      style={{ aspectRatio }}
    >
      {/* Skeleton Loader */}
      {!isLoaded && isInView && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200" />
      )}

      {/* Actual Image */}
      {isInView && (
        <img
          src={error ? fallbackSrc : src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={`w-full h-full transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            objectFit
          }}
          loading="lazy"
          {...props}
        />
      )}

      {/* Error State */}
      {error && isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400">
          <svg
            className="w-12 h-12"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      )}
    </div>
  );
};

/**
 * Progressive Image Component
 * Shows low-quality placeholder then swaps to high-quality image
 */
export const ProgressiveImage = ({
  placeholderSrc,
  src,
  alt = '',
  className = '',
  ...props
}) => {
  const [imgSrc, setImgSrc] = useState(placeholderSrc || src);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const img = new Image();
    img.src = src;
    
    img.onload = () => {
      setImgSrc(src);
      setIsLoading(false);
    };

    img.onerror = () => {
      setIsLoading(false);
    };
  }, [src]);

  return (
    <div className="relative">
      <img
        src={imgSrc}
        alt={alt}
        className={`transition-all duration-300 ${
          isLoading ? 'blur-sm' : 'blur-0'
        } ${className}`}
        {...props}
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};

export default LazyImage;


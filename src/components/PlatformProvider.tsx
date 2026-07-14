/**
 * Platform Provider Component
 * 
 * Applies platform-specific styles and provides platform information
 * to the entire application.
 */

import React, { useEffect } from 'react';
import { applyPlatformStyles, getPlatformInfo, addOrientationChangeListener } from '../utils/platform';

/**
 * Platform Provider Props
 */
interface PlatformProviderProps {
  children: React.ReactNode;
}

/**
 * Platform Provider Component
 * 
 * This component:
 * 1. Applies platform-specific CSS classes to the document
 * 2. Handles orientation changes
 * 3. Provides platform information to child components
 */
export const PlatformProvider: React.FC<PlatformProviderProps> = ({ children }) => {
  useEffect(() => {
    // Apply platform styles on mount
    applyPlatformStyles();

    // Add orientation change listener
    const unsubscribe = addOrientationChangeListener((orientation) => {
      console.log(`[PlatformProvider] Orientation changed to: ${orientation}`);
    });

    // Cleanup on unmount
    return () => {
      unsubscribe();
    };
  }, []);

  return <>{children}</>;
};

/**
 * Hook to get platform information
 */
export const usePlatform = () => {
  return getPlatformInfo();
};

export default PlatformProvider;

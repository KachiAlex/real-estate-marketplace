/**
 * Platform Detection Utilities
 * 
 * Provides utilities for detecting the current platform (iOS, Android, or Web)
 * and adapting the app behavior accordingly.
 */

import { Capacitor } from '@capacitor/core';

/**
 * Platform type
 */
export type Platform = 'ios' | 'android' | 'web';

/**
 * Platform information
 */
export interface PlatformInfo {
  platform: Platform;
  isNative: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isWeb: boolean;
  osVersion?: string;
  appVersion?: string;
}

/**
 * Get the current platform
 */
export function getPlatform(): Platform {
  const platform = Capacitor.getPlatform();
  
  if (platform === 'ios') {
    return 'ios';
  }
  if (platform === 'android') {
    return 'android';
  }
  return 'web';
}

/**
 * Check if running on iOS
 */
export function isIOS(): boolean {
  return getPlatform() === 'ios';
}

/**
 * Check if running on Android
 */
export function isAndroid(): boolean {
  return getPlatform() === 'android';
}

/**
 * Check if running on web
 */
export function isWeb(): boolean {
  return getPlatform() === 'web';
}

/**
 * Check if running on native platform (iOS or Android)
 */
export function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Get platform information
 */
export function getPlatformInfo(): PlatformInfo {
  const platform = getPlatform();
  const isNativePlatform = isNative();

  return {
    platform,
    isNative: isNativePlatform,
    isIOS: platform === 'ios',
    isAndroid: platform === 'android',
    isWeb: platform === 'web',
  };
}

/**
 * Get device information
 */
export async function getDeviceInfo(): Promise<any> {
  try {
    if (!isNative()) {
      return {
        platform: getPlatform(),
        userAgent: navigator.userAgent,
      };
    }

    // Try to get device info from Capacitor Device plugin
    try {
      // @ts-ignore - Device plugin may not be installed
      const { Device } = await import('@capacitor/device');
      if (Device && Device.getInfo) {
        return await Device.getInfo();
      }
    } catch (error) {
      console.warn('Device plugin not available:', error);
    }

    return {
      platform: getPlatform(),
      userAgent: navigator.userAgent,
    };
  } catch (error) {
    console.error('Failed to get device info:', error);
    return {
      platform: getPlatform(),
      userAgent: navigator.userAgent,
    };
  }
}

/**
 * Check if device has notch (safe area)
 */
export async function hasNotch(): Promise<boolean> {
  try {
    if (!isNative()) {
      return false;
    }

    try {
      // @ts-ignore - SafeArea plugin may not be installed
      const { SafeArea } = await import('@capacitor/safe-area');
      if (SafeArea && SafeArea.getInsets) {
        const insets = await SafeArea.getInsets();
        return (insets.top || 0) > 0 || (insets.bottom || 0) > 0;
      }
    } catch (error) {
      console.warn('SafeArea plugin not available:', error);
    }

    return false;
  } catch (error) {
    console.warn('Failed to check for notch:', error);
    return false;
  }
}

/**
 * Get safe area insets
 */
export async function getSafeAreaInsets(): Promise<{
  top: number;
  bottom: number;
  left: number;
  right: number;
}> {
  try {
    if (!isNative()) {
      return { top: 0, bottom: 0, left: 0, right: 0 };
    }

    try {
      // @ts-ignore - SafeArea plugin may not be installed
      const { SafeArea } = await import('@capacitor/safe-area');
      if (SafeArea && SafeArea.getInsets) {
        return await SafeArea.getInsets();
      }
    } catch (error) {
      console.warn('SafeArea plugin not available:', error);
    }

    return { top: 0, bottom: 0, left: 0, right: 0 };
  } catch (error) {
    console.warn('Failed to get safe area insets:', error);
    return { top: 0, bottom: 0, left: 0, right: 0 };
  }
}

/**
 * Get screen dimensions
 */
export function getScreenDimensions(): {
  width: number;
  height: number;
  scale: number;
} {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    scale: window.devicePixelRatio,
  };
}

/**
 * Check if device is in landscape orientation
 */
export function isLandscape(): boolean {
  return window.innerWidth > window.innerHeight;
}

/**
 * Check if device is in portrait orientation
 */
export function isPortrait(): boolean {
  return window.innerHeight > window.innerWidth;
}

/**
 * Get orientation
 */
export function getOrientation(): 'portrait' | 'landscape' {
  return isPortrait() ? 'portrait' : 'landscape';
}

/**
 * Add orientation change listener
 */
export function addOrientationChangeListener(
  callback: (orientation: 'portrait' | 'landscape') => void
): () => void {
  const handleOrientationChange = () => {
    callback(getOrientation());
  };

  window.addEventListener('orientationchange', handleOrientationChange);
  window.addEventListener('resize', handleOrientationChange);

  return () => {
    window.removeEventListener('orientationchange', handleOrientationChange);
    window.removeEventListener('resize', handleOrientationChange);
  };
}

/**
 * Check if device supports touch
 */
export function supportsTouchEvents(): boolean {
  return (
    typeof window !== 'undefined' &&
    ('ontouchstart' in window ||
      (navigator as any).maxTouchPoints > 0 ||
      (navigator as any).msMaxTouchPoints > 0)
  );
}

/**
 * Check if device is mobile
 */
export function isMobileDevice(): boolean {
  const userAgent = navigator.userAgent.toLowerCase();
  return /mobile|android|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(
    userAgent
  );
}

/**
 * Get platform-specific CSS class
 */
export function getPlatformCssClass(): string {
  const platform = getPlatform();
  return `platform-${platform}`;
}

/**
 * Apply platform-specific styles
 */
export function applyPlatformStyles(): void {
  const platform = getPlatform();
  const cssClass = getPlatformCssClass();

  // Add platform class to document element
  document.documentElement.classList.add(cssClass);

  // Add native class if on native platform
  if (isNative()) {
    document.documentElement.classList.add('platform-native');
  }

  // Add mobile class if on mobile device
  if (isMobileDevice()) {
    document.documentElement.classList.add('platform-mobile');
  }

  // Add touch class if device supports touch
  if (supportsTouchEvents()) {
    document.documentElement.classList.add('platform-touch');
  }
}

/**
 * Get platform-specific user agent string
 */
export function getPlatformUserAgent(): string {
  if (isNative()) {
    return `PropertyArk/${getPlatform()}`;
  }
  return navigator.userAgent;
}

export default {
  getPlatform,
  isIOS,
  isAndroid,
  isWeb,
  isNative,
  getPlatformInfo,
  getDeviceInfo,
  hasNotch,
  getSafeAreaInsets,
  getScreenDimensions,
  isLandscape,
  isPortrait,
  getOrientation,
  addOrientationChangeListener,
  supportsTouchEvents,
  isMobileDevice,
  getPlatformCssClass,
  applyPlatformStyles,
  getPlatformUserAgent,
};

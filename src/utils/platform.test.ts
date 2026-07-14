/**
 * Platform Detection Utilities Tests
 */

import {
  getPlatform,
  isIOS,
  isAndroid,
  isWeb,
  isNative,
  getPlatformInfo,
  getScreenDimensions,
  isLandscape,
  isPortrait,
  getOrientation,
  supportsTouchEvents,
  isMobileDevice,
  getPlatformCssClass,
  applyPlatformStyles,
  getPlatformUserAgent,
} from './platform';
import { Capacitor } from '@capacitor/core';

// Mock Capacitor
jest.mock('@capacitor/core', () => ({
  Capacitor: {
    getPlatform: jest.fn(() => 'web'),
    isNativePlatform: jest.fn(() => false),
    getPlugin: jest.fn(),
  },
}));

describe('Platform Detection Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.documentElement.className = '';
  });

  describe('getPlatform', () => {
    it('should return web platform by default', () => {
      expect(getPlatform()).toBe('web');
    });

    it('should return ios platform', () => {
      (Capacitor.getPlatform as jest.Mock).mockReturnValue('ios');
      expect(getPlatform()).toBe('ios');
    });

    it('should return android platform', () => {
      (Capacitor.getPlatform as jest.Mock).mockReturnValue('android');
      expect(getPlatform()).toBe('android');
    });
  });

  describe('Platform checks', () => {
    it('should check if iOS', () => {
      (Capacitor.getPlatform as jest.Mock).mockReturnValue('ios');
      expect(isIOS()).toBe(true);
      expect(isAndroid()).toBe(false);
      expect(isWeb()).toBe(false);
    });

    it('should check if Android', () => {
      (Capacitor.getPlatform as jest.Mock).mockReturnValue('android');
      expect(isAndroid()).toBe(true);
      expect(isIOS()).toBe(false);
      expect(isWeb()).toBe(false);
    });

    it('should check if Web', () => {
      (Capacitor.getPlatform as jest.Mock).mockReturnValue('web');
      expect(isWeb()).toBe(true);
      expect(isIOS()).toBe(false);
      expect(isAndroid()).toBe(false);
    });

    it('should check if native', () => {
      (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
      expect(isNative()).toBe(true);

      (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);
      expect(isNative()).toBe(false);
    });
  });

  describe('getPlatformInfo', () => {
    it('should return platform info', () => {
      (Capacitor.getPlatform as jest.Mock).mockReturnValue('ios');
      (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);

      const info = getPlatformInfo();

      expect(info.platform).toBe('ios');
      expect(info.isNative).toBe(true);
      expect(info.isIOS).toBe(true);
      expect(info.isAndroid).toBe(false);
      expect(info.isWeb).toBe(false);
    });
  });

  describe('Screen dimensions', () => {
    it('should get screen dimensions', () => {
      const dimensions = getScreenDimensions();

      expect(dimensions.width).toBe(window.innerWidth);
      expect(dimensions.height).toBe(window.innerHeight);
      expect(dimensions.scale).toBe(window.devicePixelRatio);
    });

    it('should detect landscape orientation', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 768,
      });

      expect(isLandscape()).toBe(true);
      expect(isPortrait()).toBe(false);
      expect(getOrientation()).toBe('landscape');
    });

    it('should detect portrait orientation', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      expect(isPortrait()).toBe(true);
      expect(isLandscape()).toBe(false);
      expect(getOrientation()).toBe('portrait');
    });
  });

  describe('Orientation change listener', () => {
    it('should add and remove orientation change listener', () => {
      const callback = jest.fn();
      const unsubscribe = require('./platform').addOrientationChangeListener(callback);

      expect(typeof unsubscribe).toBe('function');
    });
  });

  describe('Touch support', () => {
    it('should detect touch support', () => {
      const hasTouch = supportsTouchEvents();
      expect(typeof hasTouch).toBe('boolean');
    });
  });

  describe('Mobile device detection', () => {
    it('should detect mobile device', () => {
      const isMobile = isMobileDevice();
      expect(typeof isMobile).toBe('boolean');
    });
  });

  describe('Platform CSS class', () => {
    it('should get platform CSS class', () => {
      (Capacitor.getPlatform as jest.Mock).mockReturnValue('ios');
      expect(getPlatformCssClass()).toBe('platform-ios');

      (Capacitor.getPlatform as jest.Mock).mockReturnValue('android');
      expect(getPlatformCssClass()).toBe('platform-android');

      (Capacitor.getPlatform as jest.Mock).mockReturnValue('web');
      expect(getPlatformCssClass()).toBe('platform-web');
    });

    it('should apply platform styles', () => {
      (Capacitor.getPlatform as jest.Mock).mockReturnValue('ios');
      (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);

      applyPlatformStyles();

      expect(document.documentElement.classList.contains('platform-ios')).toBe(true);
      expect(document.documentElement.classList.contains('platform-native')).toBe(true);
    });
  });

  describe('Platform user agent', () => {
    it('should get platform user agent for native', () => {
      (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
      (Capacitor.getPlatform as jest.Mock).mockReturnValue('ios');

      const userAgent = getPlatformUserAgent();
      expect(userAgent).toContain('PropertyArk');
      expect(userAgent).toContain('ios');
    });

    it('should get platform user agent for web', () => {
      (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);

      const userAgent = getPlatformUserAgent();
      expect(userAgent).toBe(navigator.userAgent);
    });
  });
});

/**
 * Capacitor Initialization Integration Tests
 * 
 * These tests verify that Capacitor initializes correctly on both native and web platforms,
 * that plugins are available, and that the app doesn't crash on startup.
 * 
 * Test Coverage:
 * - Initialization on native platform (iOS/Android)
 * - Initialization on web platform
 * - Plugin availability verification
 * - Error handler setup and functionality
 * - Graceful degradation when plugins fail
 * - Platform detection accuracy
 */

import {
  initializeCapacitor,
  getPlatform,
  isNativePlatform,
  isIOS,
  isAndroid,
  isWeb,
  getDeviceInfo,
  setupCapacitorErrorHandler,
} from './capacitor-init';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

// Mock Capacitor
jest.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: jest.fn(),
    getPlatform: jest.fn(),
    getPlugin: jest.fn(),
  },
}));

// Mock StatusBar
jest.mock('@capacitor/status-bar', () => ({
  StatusBar: {
    setStyle: jest.fn(),
    setBackgroundColor: jest.fn(),
  },
  Style: {
    Dark: 'DARK',
    Light: 'LIGHT',
  },
}));

describe('Capacitor Initialization Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.documentElement.style.cssText = '';
    // Clear any console logs
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Native Platform Initialization', () => {
    describe('iOS Platform', () => {
      beforeEach(() => {
        (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
        (Capacitor.getPlatform as jest.Mock).mockReturnValue('ios');
      });

      it('should initialize Capacitor on iOS without crashing', async () => {
        (Capacitor.getPlugin as jest.Mock).mockReturnValue(null);

        await expect(initializeCapacitor()).resolves.toBeUndefined();
      });

      it('should configure status bar for iOS', async () => {
        (Capacitor.getPlugin as jest.Mock).mockReturnValue(null);

        await initializeCapacitor();

        expect(StatusBar.setStyle).toHaveBeenCalledWith({ style: 'DARK' });
        expect(StatusBar.setBackgroundColor).toHaveBeenCalledWith({ color: '#f97316' });
      });

      it('should set safe area CSS variables on iOS', async () => {
        const mockSafeAreaPlugin = {
          getInsets: jest.fn().mockResolvedValue({
            top: 44,
            bottom: 34,
            left: 0,
            right: 0,
          }),
        };

        (Capacitor.getPlugin as jest.Mock).mockImplementation((name) => {
          if (name === 'SafeArea') return mockSafeAreaPlugin;
          return null;
        });

        await initializeCapacitor();

        expect(document.documentElement.style.getPropertyValue('--safe-area-inset-top')).toBe('44px');
        expect(document.documentElement.style.getPropertyValue('--safe-area-inset-bottom')).toBe('34px');
      });

      it('should handle SafeArea plugin errors gracefully on iOS', async () => {
        const mockSafeAreaPlugin = {
          getInsets: jest.fn().mockRejectedValue(new Error('SafeArea error')),
        };

        (Capacitor.getPlugin as jest.Mock).mockImplementation((name) => {
          if (name === 'SafeArea') return mockSafeAreaPlugin;
          return null;
        });

        await expect(initializeCapacitor()).resolves.toBeUndefined();

        // Should set default values on error
        expect(document.documentElement.style.getPropertyValue('--safe-area-inset-top')).toBe('0px');
      });

      it('should verify HTTP plugin is available on iOS', async () => {
        const mockHttpPlugin = {};

        (Capacitor.getPlugin as jest.Mock).mockImplementation((name) => {
          if (name === 'CapacitorHttp') return mockHttpPlugin;
          return null;
        });

        await initializeCapacitor();

        expect(Capacitor.getPlugin).toHaveBeenCalledWith('CapacitorHttp');
      });

      it('should verify Cookies plugin is available on iOS', async () => {
        const mockCookiesPlugin = {};

        (Capacitor.getPlugin as jest.Mock).mockImplementation((name) => {
          if (name === 'CapacitorCookies') return mockCookiesPlugin;
          return null;
        });

        await initializeCapacitor();

        expect(Capacitor.getPlugin).toHaveBeenCalledWith('CapacitorCookies');
      });
    });

    describe('Android Platform', () => {
      beforeEach(() => {
        (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
        (Capacitor.getPlatform as jest.Mock).mockReturnValue('android');
      });

      it('should initialize Capacitor on Android without crashing', async () => {
        (Capacitor.getPlugin as jest.Mock).mockReturnValue(null);

        await expect(initializeCapacitor()).resolves.toBeUndefined();
      });

      it('should configure status bar for Android', async () => {
        (Capacitor.getPlugin as jest.Mock).mockReturnValue(null);

        await initializeCapacitor();

        expect(StatusBar.setStyle).toHaveBeenCalledWith({ style: 'LIGHT' });
        expect(StatusBar.setBackgroundColor).toHaveBeenCalledWith({ color: '#f97316' });
      });

      it('should set safe area CSS variables on Android', async () => {
        const mockSafeAreaPlugin = {
          getInsets: jest.fn().mockResolvedValue({
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
          }),
        };

        (Capacitor.getPlugin as jest.Mock).mockImplementation((name) => {
          if (name === 'SafeArea') return mockSafeAreaPlugin;
          return null;
        });

        await initializeCapacitor();

        expect(document.documentElement.style.getPropertyValue('--safe-area-inset-top')).toBe('0px');
      });

      it('should handle SafeArea plugin errors gracefully on Android', async () => {
        const mockSafeAreaPlugin = {
          getInsets: jest.fn().mockRejectedValue(new Error('SafeArea error')),
        };

        (Capacitor.getPlugin as jest.Mock).mockImplementation((name) => {
          if (name === 'SafeArea') return mockSafeAreaPlugin;
          return null;
        });

        await expect(initializeCapacitor()).resolves.toBeUndefined();

        // Should set default values on error
        expect(document.documentElement.style.getPropertyValue('--safe-area-inset-top')).toBe('0px');
      });

      it('should verify HTTP plugin is available on Android', async () => {
        const mockHttpPlugin = {};

        (Capacitor.getPlugin as jest.Mock).mockImplementation((name) => {
          if (name === 'CapacitorHttp') return mockHttpPlugin;
          return null;
        });

        await initializeCapacitor();

        expect(Capacitor.getPlugin).toHaveBeenCalledWith('CapacitorHttp');
      });

      it('should verify Cookies plugin is available on Android', async () => {
        const mockCookiesPlugin = {};

        (Capacitor.getPlugin as jest.Mock).mockImplementation((name) => {
          if (name === 'CapacitorCookies') return mockCookiesPlugin;
          return null;
        });

        await initializeCapacitor();

        expect(Capacitor.getPlugin).toHaveBeenCalledWith('CapacitorCookies');
      });
    });
  });

  describe('Web Platform Initialization', () => {
    beforeEach(() => {
      (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);
      (Capacitor.getPlatform as jest.Mock).mockReturnValue('web');
    });

    it('should skip initialization on web platform', async () => {
      await expect(initializeCapacitor()).resolves.toBeUndefined();

      expect(StatusBar.setStyle).not.toHaveBeenCalled();
      expect(StatusBar.setBackgroundColor).not.toHaveBeenCalled();
    });

    it('should not set safe area CSS variables on web platform', async () => {
      await initializeCapacitor();

      expect(document.documentElement.style.getPropertyValue('--safe-area-inset-top')).toBe('');
    });

    it('should log that it is running in web mode', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log');

      await initializeCapacitor();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[Capacitor\].*web mode/)
      );
    });
  });

  describe('Plugin Availability Verification', () => {
    beforeEach(() => {
      (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
      (Capacitor.getPlatform as jest.Mock).mockReturnValue('ios');
    });

    it('should verify all required plugins are available', async () => {
      const mockPlugins = {
        CapacitorHttp: {},
        CapacitorCookies: {},
        SafeArea: { getInsets: jest.fn().mockResolvedValue({ top: 0, bottom: 0, left: 0, right: 0 }) },
      };

      (Capacitor.getPlugin as jest.Mock).mockImplementation((name) => mockPlugins[name as keyof typeof mockPlugins]);

      await initializeCapacitor();

      expect(Capacitor.getPlugin).toHaveBeenCalledWith('CapacitorHttp');
      expect(Capacitor.getPlugin).toHaveBeenCalledWith('CapacitorCookies');
      expect(Capacitor.getPlugin).toHaveBeenCalledWith('SafeArea');
    });

    it('should handle missing HTTP plugin gracefully', async () => {
      (Capacitor.getPlugin as jest.Mock).mockReturnValue(null);

      await expect(initializeCapacitor()).resolves.toBeUndefined();

      // Should not crash
      expect(Capacitor.getPlugin).toHaveBeenCalledWith('CapacitorHttp');
    });

    it('should handle missing Cookies plugin gracefully', async () => {
      (Capacitor.getPlugin as jest.Mock).mockReturnValue(null);

      await expect(initializeCapacitor()).resolves.toBeUndefined();

      // Should not crash
      expect(Capacitor.getPlugin).toHaveBeenCalledWith('CapacitorCookies');
    });

    it('should handle missing SafeArea plugin gracefully', async () => {
      (Capacitor.getPlugin as jest.Mock).mockReturnValue(null);

      await expect(initializeCapacitor()).resolves.toBeUndefined();

      // Should set default safe area values
      expect(document.documentElement.style.getPropertyValue('--safe-area-inset-top')).toBe('0px');
    });
  });

  describe('Error Handler Setup', () => {
    it('should set up error handlers without crashing', () => {
      expect(() => {
        setupCapacitorErrorHandler();
      }).not.toThrow();
    });

    it('should register global error listener', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

      setupCapacitorErrorHandler();

      expect(addEventListenerSpy).toHaveBeenCalledWith('error', expect.any(Function));
    });

    it('should register unhandled rejection listener', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

      setupCapacitorErrorHandler();

      expect(addEventListenerSpy).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));
    });

    it('should handle global errors without crashing', () => {
      setupCapacitorErrorHandler();

      const errorEvent = new ErrorEvent('error', {
        message: 'Test error',
        filename: 'test.js',
        lineno: 10,
        colno: 5,
        error: new Error('Test error'),
      });

      expect(() => {
        window.dispatchEvent(errorEvent);
      }).not.toThrow();
    });

    it('should handle unhandled promise rejections without crashing', () => {
      setupCapacitorErrorHandler();

      const mockEvent = {
        type: 'unhandledrejection',
        reason: new Error('Test rejection'),
        promise: Promise.resolve(),
      };

      expect(() => {
        window.dispatchEvent(new Event('unhandledrejection'));
      }).not.toThrow();
    });
  });

  describe('Platform Detection', () => {
    it('should correctly detect iOS platform', () => {
      (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
      (Capacitor.getPlatform as jest.Mock).mockReturnValue('ios');

      expect(isIOS()).toBe(true);
      expect(isAndroid()).toBe(false);
      expect(isWeb()).toBe(false);
      expect(isNativePlatform()).toBe(true);
    });

    it('should correctly detect Android platform', () => {
      (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
      (Capacitor.getPlatform as jest.Mock).mockReturnValue('android');

      expect(isAndroid()).toBe(true);
      expect(isIOS()).toBe(false);
      expect(isWeb()).toBe(false);
      expect(isNativePlatform()).toBe(true);
    });

    it('should correctly detect web platform', () => {
      (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);
      (Capacitor.getPlatform as jest.Mock).mockReturnValue('web');

      expect(isWeb()).toBe(true);
      expect(isIOS()).toBe(false);
      expect(isAndroid()).toBe(false);
      expect(isNativePlatform()).toBe(false);
    });

    it('should return correct device info for each platform', () => {
      (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
      (Capacitor.getPlatform as jest.Mock).mockReturnValue('ios');

      const info = getDeviceInfo();

      expect(info.platform).toBe('ios');
      expect(info.isNative).toBe(true);
      expect(info.isIOS).toBe(true);
      expect(info.isAndroid).toBe(false);
      expect(info.isWeb).toBe(false);
    });
  });

  describe('Graceful Degradation', () => {
    beforeEach(() => {
      (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
      (Capacitor.getPlatform as jest.Mock).mockReturnValue('ios');
    });

    it('should continue initialization if StatusBar plugin fails', async () => {
      (StatusBar.setStyle as jest.Mock).mockRejectedValue(new Error('StatusBar error'));
      (Capacitor.getPlugin as jest.Mock).mockReturnValue(null);

      await expect(initializeCapacitor()).resolves.toBeUndefined();
    });

    it('should continue initialization if SafeArea plugin fails', async () => {
      const mockSafeAreaPlugin = {
        getInsets: jest.fn().mockRejectedValue(new Error('SafeArea error')),
      };

      (Capacitor.getPlugin as jest.Mock).mockImplementation((name) => {
        if (name === 'SafeArea') return mockSafeAreaPlugin;
        return null;
      });

      await expect(initializeCapacitor()).resolves.toBeUndefined();
    });

    it('should continue initialization if HTTP plugin is unavailable', async () => {
      (Capacitor.getPlugin as jest.Mock).mockReturnValue(null);

      await expect(initializeCapacitor()).resolves.toBeUndefined();
    });

    it('should continue initialization if Cookies plugin is unavailable', async () => {
      (Capacitor.getPlugin as jest.Mock).mockReturnValue(null);

      await expect(initializeCapacitor()).resolves.toBeUndefined();
    });

    it('should set default safe area values if plugin is unavailable', async () => {
      (Capacitor.getPlugin as jest.Mock).mockReturnValue(null);

      await initializeCapacitor();

      expect(document.documentElement.style.getPropertyValue('--safe-area-inset-top')).toBe('0px');
      expect(document.documentElement.style.getPropertyValue('--safe-area-inset-bottom')).toBe('0px');
      expect(document.documentElement.style.getPropertyValue('--safe-area-inset-left')).toBe('0px');
      expect(document.documentElement.style.getPropertyValue('--safe-area-inset-right')).toBe('0px');
    });
  });

  describe('Startup Crash Prevention', () => {
    it('should not crash on iOS startup', async () => {
      (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
      (Capacitor.getPlatform as jest.Mock).mockReturnValue('ios');
      (Capacitor.getPlugin as jest.Mock).mockReturnValue(null);

      await expect(initializeCapacitor()).resolves.toBeUndefined();
    });

    it('should not crash on Android startup', async () => {
      (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
      (Capacitor.getPlatform as jest.Mock).mockReturnValue('android');
      (Capacitor.getPlugin as jest.Mock).mockReturnValue(null);

      await expect(initializeCapacitor()).resolves.toBeUndefined();
    });

    it('should not crash on web startup', async () => {
      (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);

      await expect(initializeCapacitor()).resolves.toBeUndefined();
    });

    it('should not crash when all plugins fail', async () => {
      (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
      (Capacitor.getPlatform as jest.Mock).mockReturnValue('ios');
      (StatusBar.setStyle as jest.Mock).mockRejectedValue(new Error('StatusBar error'));
      (StatusBar.setBackgroundColor as jest.Mock).mockRejectedValue(new Error('StatusBar error'));

      const mockSafeAreaPlugin = {
        getInsets: jest.fn().mockRejectedValue(new Error('SafeArea error')),
      };

      (Capacitor.getPlugin as jest.Mock).mockImplementation((name) => {
        if (name === 'SafeArea') return mockSafeAreaPlugin;
        return null;
      });

      await expect(initializeCapacitor()).resolves.toBeUndefined();
    });
  });

  describe('Console Logging', () => {
    beforeEach(() => {
      (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
      (Capacitor.getPlatform as jest.Mock).mockReturnValue('ios');
      (Capacitor.getPlugin as jest.Mock).mockReturnValue(null);
    });

    it('should log initialization start', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log');

      await initializeCapacitor();

      // Check if any call contains the initialization message
      const calls = consoleLogSpy.mock.calls.map(call => call.join(' '));
      expect(calls.some(call => call.includes('[Capacitor]') && call.includes('Initializing'))).toBe(true);
    });

    it('should log initialization completion', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log');

      await initializeCapacitor();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[Capacitor\].*completed successfully/)
      );
    });

    it('should log status bar configuration', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log');

      await initializeCapacitor();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[Capacitor\].*Status Bar/)
      );
    });

    it('should log safe area configuration', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log');

      await initializeCapacitor();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[Capacitor\].*Safe Area/)
      );
    });
  });
});

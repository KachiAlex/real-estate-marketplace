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

describe('Capacitor Initialization Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear CSS variables
    document.documentElement.style.cssText = '';
  });

  describe('initializeCapacitor', () => {
    it('should skip initialization when running in web mode', async () => {
      (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);

      await initializeCapacitor();

      expect(Capacitor.isNativePlatform).toHaveBeenCalled();
      expect(StatusBar.setStyle).not.toHaveBeenCalled();
    });

    it('should initialize Capacitor on native platform', async () => {
      (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
      (Capacitor.getPlatform as jest.Mock).mockReturnValue('ios');
      (Capacitor.getPlugin as jest.Mock).mockReturnValue(null);

      await initializeCapacitor();

      expect(Capacitor.isNativePlatform).toHaveBeenCalled();
      expect(Capacitor.getPlatform).toHaveBeenCalled();
      expect(StatusBar.setStyle).toHaveBeenCalled();
      expect(StatusBar.setBackgroundColor).toHaveBeenCalled();
    });

    it('should configure status bar for iOS', async () => {
      (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
      (Capacitor.getPlatform as jest.Mock).mockReturnValue('ios');
      (Capacitor.getPlugin as jest.Mock).mockReturnValue(null);

      await initializeCapacitor();

      expect(StatusBar.setStyle).toHaveBeenCalledWith({ style: 'DARK' });
      expect(StatusBar.setBackgroundColor).toHaveBeenCalledWith({ color: '#f97316' });
    });

    it('should configure status bar for Android', async () => {
      (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
      (Capacitor.getPlatform as jest.Mock).mockReturnValue('android');
      (Capacitor.getPlugin as jest.Mock).mockReturnValue(null);

      await initializeCapacitor();

      expect(StatusBar.setStyle).toHaveBeenCalledWith({ style: 'LIGHT' });
      expect(StatusBar.setBackgroundColor).toHaveBeenCalledWith({ color: '#f97316' });
    });

    it('should set safe area CSS variables when SafeArea plugin is available', async () => {
      const mockSafeAreaPlugin = {
        getInsets: jest.fn().mockResolvedValue({
          top: 44,
          bottom: 34,
          left: 0,
          right: 0,
        }),
      };

      (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
      (Capacitor.getPlatform as jest.Mock).mockReturnValue('ios');
      (Capacitor.getPlugin as jest.Mock).mockReturnValue(mockSafeAreaPlugin);

      await initializeCapacitor();

      expect(document.documentElement.style.getPropertyValue('--safe-area-inset-top')).toBe('44px');
      expect(document.documentElement.style.getPropertyValue('--safe-area-inset-bottom')).toBe('34px');
      expect(document.documentElement.style.getPropertyValue('--safe-area-inset-left')).toBe('0px');
      expect(document.documentElement.style.getPropertyValue('--safe-area-inset-right')).toBe('0px');
    });

    it('should set default safe area values when SafeArea plugin is not available', async () => {
      (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
      (Capacitor.getPlatform as jest.Mock).mockReturnValue('ios');
      (Capacitor.getPlugin as jest.Mock).mockReturnValue(null);

      await initializeCapacitor();

      expect(document.documentElement.style.getPropertyValue('--safe-area-inset-top')).toBe('0px');
      expect(document.documentElement.style.getPropertyValue('--safe-area-inset-bottom')).toBe('0px');
      expect(document.documentElement.style.getPropertyValue('--safe-area-inset-left')).toBe('0px');
      expect(document.documentElement.style.getPropertyValue('--safe-area-inset-right')).toBe('0px');
    });

    it('should handle errors gracefully during initialization', async () => {
      (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
      (Capacitor.getPlatform as jest.Mock).mockReturnValue('ios');
      (StatusBar.setStyle as jest.Mock).mockRejectedValue(new Error('Status bar error'));
      (Capacitor.getPlugin as jest.Mock).mockReturnValue(null);

      // Should not throw
      await expect(initializeCapacitor()).resolves.toBeUndefined();
    });
  });

  describe('Platform Detection Functions', () => {
    describe('getPlatform', () => {
      it('should return the current platform', () => {
        (Capacitor.getPlatform as jest.Mock).mockReturnValue('ios');

        expect(getPlatform()).toBe('ios');
      });

      it('should return android platform', () => {
        (Capacitor.getPlatform as jest.Mock).mockReturnValue('android');

        expect(getPlatform()).toBe('android');
      });

      it('should return web platform', () => {
        (Capacitor.getPlatform as jest.Mock).mockReturnValue('web');

        expect(getPlatform()).toBe('web');
      });
    });

    describe('isNativePlatform', () => {
      it('should return true when on native platform', () => {
        (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);

        expect(isNativePlatform()).toBe(true);
      });

      it('should return false when on web platform', () => {
        (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);

        expect(isNativePlatform()).toBe(false);
      });
    });

    describe('isIOS', () => {
      it('should return true when on iOS', () => {
        (Capacitor.getPlatform as jest.Mock).mockReturnValue('ios');

        expect(isIOS()).toBe(true);
      });

      it('should return false when not on iOS', () => {
        (Capacitor.getPlatform as jest.Mock).mockReturnValue('android');

        expect(isIOS()).toBe(false);
      });
    });

    describe('isAndroid', () => {
      it('should return true when on Android', () => {
        (Capacitor.getPlatform as jest.Mock).mockReturnValue('android');

        expect(isAndroid()).toBe(true);
      });

      it('should return false when not on Android', () => {
        (Capacitor.getPlatform as jest.Mock).mockReturnValue('ios');

        expect(isAndroid()).toBe(false);
      });
    });

    describe('isWeb', () => {
      it('should return true when on web platform', () => {
        (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);

        expect(isWeb()).toBe(true);
      });

      it('should return false when on native platform', () => {
        (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);

        expect(isWeb()).toBe(false);
      });
    });
  });

  describe('getDeviceInfo', () => {
    it('should return device information for iOS', () => {
      (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
      (Capacitor.getPlatform as jest.Mock).mockReturnValue('ios');

      const info = getDeviceInfo();

      expect(info).toEqual({
        platform: 'ios',
        isNative: true,
        isIOS: true,
        isAndroid: false,
        isWeb: false,
      });
    });

    it('should return device information for Android', () => {
      (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
      (Capacitor.getPlatform as jest.Mock).mockReturnValue('android');

      const info = getDeviceInfo();

      expect(info).toEqual({
        platform: 'android',
        isNative: true,
        isIOS: false,
        isAndroid: true,
        isWeb: false,
      });
    });

    it('should return device information for web', () => {
      (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);
      (Capacitor.getPlatform as jest.Mock).mockReturnValue('web');

      const info = getDeviceInfo();

      expect(info).toEqual({
        platform: 'web',
        isNative: false,
        isIOS: false,
        isAndroid: false,
        isWeb: true,
      });
    });
  });

  describe('setupCapacitorErrorHandler', () => {
    it('should set up global error listener', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

      setupCapacitorErrorHandler();

      expect(addEventListenerSpy).toHaveBeenCalledWith('error', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));

      addEventListenerSpy.mockRestore();
    });

    it('should handle global errors', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      setupCapacitorErrorHandler();

      const errorEvent = new ErrorEvent('error', {
        message: 'Test error',
        filename: 'test.js',
        lineno: 10,
        colno: 5,
        error: new Error('Test error'),
      });

      window.dispatchEvent(errorEvent);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[Capacitor Error Handler] Global error caught:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle unhandled promise rejections', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      setupCapacitorErrorHandler();

      // Simulate an unhandled rejection by creating a mock event
      const mockReason = new Error('Test rejection');
      const mockEvent = {
        type: 'unhandledrejection',
        reason: mockReason,
        promise: Promise.resolve(),
      };

      // Get the unhandledrejection listener and call it directly
      let unhandledRejectionHandler: any = null;
      const originalAddEventListener = window.addEventListener;
      window.addEventListener = jest.fn((event, handler) => {
        if (event === 'unhandledrejection') {
          unhandledRejectionHandler = handler;
        }
        originalAddEventListener.call(window, event, handler);
      });

      setupCapacitorErrorHandler();

      if (unhandledRejectionHandler) {
        unhandledRejectionHandler(mockEvent);
      }

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[Capacitor Error Handler] Unhandled promise rejection:',
        mockReason
      );

      consoleErrorSpy.mockRestore();
      window.addEventListener = originalAddEventListener;
    });
  });
});

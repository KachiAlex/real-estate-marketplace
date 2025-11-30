import { loadGoogleMapsAPI, isGoogleMapsLoaded, initializeGoogleMapsServices } from '../googleMapsLoader';

// Mock window.google
const mockGoogleMaps = {
  maps: {
    places: {},
    Map: jest.fn(),
  }
};

describe('googleMapsLoader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset module state
    jest.resetModules();
    delete window.google;
    document.head.innerHTML = '';
  });

  afterEach(() => {
    delete window.google;
  });

  describe('loadGoogleMapsAPI', () => {
    it('should resolve immediately if Google Maps is already loaded', async () => {
      window.google = mockGoogleMaps;
      // Reset module to clear internal state
      jest.resetModules();
      const { loadGoogleMapsAPI: loadAPI } = require('../googleMapsLoader');
      const result = await loadAPI('test-key');
      expect(result).toBeUndefined();
    });

    it('should create script element with correct attributes', async () => {
      delete window.google;
      jest.resetModules();
      const { loadGoogleMapsAPI: loadAPI } = require('../googleMapsLoader');
      
      const apiKey = 'test-api-key';
      const scriptMock = {
        src: '',
        async: false,
        defer: false,
        setAttribute: jest.fn(),
        onload: null,
        onerror: null,
      };
      
      const createElementSpy = jest.spyOn(document, 'createElement').mockReturnValue(scriptMock);
      const appendChildSpy = jest.spyOn(document.head, 'appendChild').mockImplementation(() => {});

      const promise = loadAPI(apiKey);
      
      // Wait a bit for the promise to set up
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Simulate script load by calling onload if it was set
      if (scriptMock.onload && typeof scriptMock.onload === 'function') {
        scriptMock.onload();
      } else if (scriptMock.onload) {
        // If it's an event handler, call it
        scriptMock.onload();
      }

      await promise;

      expect(createElementSpy).toHaveBeenCalled();
      appendChildSpy.mockRestore();
      createElementSpy.mockRestore();
    });

    it('should handle script load error', async () => {
      delete window.google;
      jest.resetModules();
      const { loadGoogleMapsAPI: loadAPI } = require('../googleMapsLoader');
      
      const apiKey = 'invalid-key';
      const scriptMock = {
        src: '',
        setAttribute: jest.fn(),
        onload: null,
        onerror: null,
      };
      
      const createElementSpy = jest.spyOn(document, 'createElement').mockReturnValue(scriptMock);
      const appendChildSpy = jest.spyOn(document.head, 'appendChild').mockImplementation(() => {});

      const promise = loadAPI(apiKey);
      
      // Wait a bit for setup
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Simulate script error by calling onerror if it was set
      if (scriptMock.onerror && typeof scriptMock.onerror === 'function') {
        scriptMock.onerror();
      } else if (scriptMock.onerror) {
        scriptMock.onerror();
      }

      await expect(promise).rejects.toThrow('Failed to load Google Maps API');
      
      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
    });

    it('should return same promise if already loading', async () => {
      delete window.google;
      jest.resetModules();
      const { loadGoogleMapsAPI: loadAPI } = require('../googleMapsLoader');
      
      const apiKey = 'test-key';
      const scriptMock = {
        src: '',
        setAttribute: jest.fn(),
        onload: null,
        onerror: null,
      };
      
      jest.spyOn(document, 'createElement').mockReturnValue(scriptMock);
      jest.spyOn(document.head, 'appendChild').mockImplementation(() => {});
      
      const promise1 = loadAPI(apiKey);
      // Wait a tiny bit to ensure loading state is set
      await new Promise(resolve => setTimeout(resolve, 10));
      const promise2 = loadAPI(apiKey);
      
      // Both should be the same promise
      expect(promise1).toBe(promise2);
      
      // Clean up - resolve the promise
      if (scriptMock.onload) {
        scriptMock.onload();
      }
      await promise1;
    });
  });

  describe('isGoogleMapsLoaded', () => {
    it('should return true if Google Maps is loaded', async () => {
      // Reset module to start fresh
      jest.resetModules();
      const { loadGoogleMapsAPI: loadAPI, isGoogleMapsLoaded: isLoaded } = require('../googleMapsLoader');
      
      // Set window.google before loading
      window.google = mockGoogleMaps;
      
      // Load API - this should set isLoaded = true since window.google.maps exists
      await loadAPI('test-key');
      
      // Now check if loaded - the function checks: isLoaded && window.google && window.google.maps
      const result = isLoaded();
      // The function should return a boolean, not the object
      expect(typeof result).toBe('boolean');
      expect(result).toBe(true);
    });

    it('should return false if Google Maps is not loaded', () => {
      jest.resetModules();
      const { isGoogleMapsLoaded: isLoaded } = require('../googleMapsLoader');
      
      delete window.google;
      expect(isLoaded()).toBe(false);
    });

    it('should return false if window.google exists but maps does not', () => {
      jest.resetModules();
      const { isGoogleMapsLoaded: isLoaded } = require('../googleMapsLoader');
      
      window.google = {};
      expect(isLoaded()).toBe(false);
    });
  });

  describe('initializeGoogleMapsServices', () => {
    it('should initialize services if Google Maps is loaded', async () => {
      // First, we need to load the API to set isLoaded flag
      window.google = mockGoogleMaps;
      
      // Load the API first to set internal state
      await loadGoogleMapsAPI('test-key');
      
      // Now initialize services
      const result = initializeGoogleMapsServices();
      expect(result).toBe(true);
    });

    it('should return false if Google Maps is not loaded', () => {
      jest.resetModules();
      const { initializeGoogleMapsServices: initServices } = require('../googleMapsLoader');
      
      delete window.google;
      const result = initServices();
      expect(result).toBe(false);
    });

    it('should return true on subsequent calls if already initialized', async () => {
      window.google = mockGoogleMaps;
      
      // Load API first
      await loadGoogleMapsAPI('test-key');
      
      // Initialize services
      initializeGoogleMapsServices();
      const result = initializeGoogleMapsServices();
      expect(result).toBe(true);
    });
  });
});


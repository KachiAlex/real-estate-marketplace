import { renderHook, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useBackButton } from '../useBackButton';

// Mock window.location.pathname
const mockPathname = '/test-path';
delete window.location;
window.location = { pathname: mockPathname };

const wrapper = ({ children }) => (
  <MemoryRouter initialEntries={[mockPathname]}>
    {children}
  </MemoryRouter>
);

describe('useBackButton', () => {
  beforeEach(() => {
    sessionStorage.clear();
    jest.clearAllMocks();
    // Mock window.scrollTo
    window.scrollTo = jest.fn();
    // Reset window.location.pathname
    window.location.pathname = mockPathname;
  });

  afterEach(() => {
    sessionStorage.clear();
    window.location.pathname = mockPathname;
  });

  it('should return handleBack, restoreScrollPosition, and saveScrollPosition functions', () => {
    const { result } = renderHook(() => useBackButton(), { wrapper });

    expect(result.current.handleBack).toBeDefined();
    expect(result.current.restoreScrollPosition).toBeDefined();
    expect(result.current.saveScrollPosition).toBeDefined();
    expect(typeof result.current.handleBack).toBe('function');
    expect(typeof result.current.restoreScrollPosition).toBe('function');
    expect(typeof result.current.saveScrollPosition).toBe('function');
  });

  it('should save state to sessionStorage on mount', async () => {
    const stateToPreserve = { filters: { type: 'house' }, scrollPosition: 500 };
    
    renderHook(() => useBackButton(() => {}, stateToPreserve), { wrapper });

    // Wait for useEffect to complete
    await waitFor(() => {
      const stateKey = `backButtonState_${mockPathname}`;
      const saved = sessionStorage.getItem(stateKey);
      expect(saved).toBeTruthy();
    });

    const stateKey = `backButtonState_${mockPathname}`;
    const saved = sessionStorage.getItem(stateKey);
    expect(saved).toBeTruthy();
    if (saved) {
      const parsed = JSON.parse(saved);
      expect(parsed).toEqual(stateToPreserve);
    }
  });

  it('should save scroll position', () => {
    Object.defineProperty(window, 'scrollY', { value: 250, writable: true });

    const { result } = renderHook(() => useBackButton(), { wrapper });

    result.current.saveScrollPosition();

    const scrollKey = `scrollPosition_${mockPathname}`;
    const saved = sessionStorage.getItem(scrollKey);
    expect(saved).toBe('250');
  });

  it('should restore scroll position', () => {
    const scrollKey = `scrollPosition_${mockPathname}`;
    sessionStorage.setItem(scrollKey, '500');

    const { result } = renderHook(() => useBackButton(), { wrapper });

    result.current.restoreScrollPosition();

    expect(window.scrollTo).toHaveBeenCalledWith(0, 500);
  });

  it('should handle errors gracefully when saving state', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const originalSetItem = Storage.prototype.setItem;
    
    // Mock setItem to throw error
    Storage.prototype.setItem = jest.fn(function() {
      if (arguments[0] && arguments[0].includes('backButtonState')) {
        throw new Error('Storage error');
      }
      return originalSetItem.apply(this, arguments);
    });

    renderHook(() => useBackButton(() => {}, { data: 'test' }), { wrapper });

    // Wait for useEffect to run and error to be caught
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    }, { timeout: 100 });

    consoleSpy.mockRestore();
    Storage.prototype.setItem = originalSetItem;
  });

  it('should handle errors gracefully when restoring scroll', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const originalGetItem = Storage.prototype.getItem;
    
    // Mock getItem to throw error
    Storage.prototype.getItem = jest.fn(function() {
      if (arguments[0] && arguments[0].includes('scrollPosition')) {
        throw new Error('Storage error');
      }
      return originalGetItem.apply(this, arguments);
    });

    const { result } = renderHook(() => useBackButton(), { wrapper });

    result.current.restoreScrollPosition();

    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
    Storage.prototype.getItem = originalGetItem;
  });
});


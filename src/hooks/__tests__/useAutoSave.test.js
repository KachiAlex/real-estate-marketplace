import { renderHook, act, waitFor } from '@testing-library/react';
import { useAutoSave } from '../useAutoSave';

describe('useAutoSave', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    localStorage.clear();
    jest.useRealTimers();
  });

  it('should return clearSavedData and loadSavedData functions', () => {
    const { result } = renderHook(() => useAutoSave('test-key', {}));
    
    expect(result.current.clearSavedData).toBeDefined();
    expect(result.current.loadSavedData).toBeDefined();
    expect(typeof result.current.clearSavedData).toBe('function');
    expect(typeof result.current.loadSavedData).toBe('function');
  });

  it('should auto-save form data to localStorage after debounce', async () => {
    const storageKey = 'test-form';
    let formData = { name: 'John', email: 'john@example.com' };
    
    const { rerender } = renderHook(({ data }) => useAutoSave(storageKey, data, 100), {
      initialProps: { data: formData }
    });
    
    // Change formData to trigger auto-save (skips initial mount)
    act(() => {
      formData = { name: 'Jane', email: 'jane@example.com' };
      rerender({ data: formData });
    });
    
    // Wait for debounce
    act(() => {
      jest.advanceTimersByTime(100);
    });
    
    await waitFor(() => {
      const saved = localStorage.getItem(storageKey);
      expect(saved).toBeTruthy();
      const parsed = JSON.parse(saved);
      expect(parsed).toEqual(formData);
    });
  });

  it('should load saved data from localStorage', () => {
    const storageKey = 'test-form';
    const savedData = { name: 'John', email: 'john@example.com' };
    localStorage.setItem(storageKey, JSON.stringify(savedData));
    
    const { result } = renderHook(() => useAutoSave(storageKey, {}));
    
    const loaded = result.current.loadSavedData();
    expect(loaded).toEqual(savedData);
  });

  it('should clear saved data from localStorage', () => {
    const storageKey = 'test-form';
    const savedData = { name: 'John' };
    localStorage.setItem(storageKey, JSON.stringify(savedData));
    
    const { result } = renderHook(() => useAutoSave(storageKey, {}));
    
    act(() => {
      result.current.clearSavedData();
    });
    
    expect(localStorage.getItem(storageKey)).toBeNull();
  });

  it('should debounce auto-save calls', async () => {
    const storageKey = 'test-form';
    let formData = { name: 'John' };
    
    const { rerender } = renderHook(({ data }) => useAutoSave(storageKey, data, 500), {
      initialProps: { data: formData }
    });
    
    // Update form data multiple times quickly
    act(() => {
      formData = { name: 'Jane' };
      rerender({ data: formData });
    });
    
    act(() => {
      formData = { name: 'Bob' };
      rerender({ data: formData });
    });
    
    // Should not have saved yet
    expect(localStorage.getItem(storageKey)).toBeNull();
    
    // Advance timers past debounce
    act(() => {
      jest.advanceTimersByTime(500);
    });
    
    await waitFor(() => {
      const saved = localStorage.getItem(storageKey);
      expect(saved).toBeTruthy();
      const parsed = JSON.parse(saved);
      expect(parsed.name).toBe('Bob'); // Should have last value
    });
  });

  it('should handle localStorage errors gracefully', async () => {
    const storageKey = 'test-form';
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock localStorage.setItem to throw error
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = jest.fn(function(key, value) {
      if (key === storageKey) {
        throw new Error('QuotaExceededError');
      }
      return originalSetItem.call(this, key, value);
    });
    
    let formData = { name: 'John' };
    const { rerender } = renderHook(({ data }) => useAutoSave(storageKey, data, 10), {
      initialProps: { data: formData }
    });
    
    // Trigger change to cause save (skip initial mount)
    act(() => {
      formData = { name: 'Jane' };
      rerender({ data: formData });
    });
    
    // Advance timers to trigger the save
    act(() => {
      jest.advanceTimersByTime(10);
    });
    
    // Wait for error to be logged
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    }, { timeout: 100 });
    
    consoleSpy.mockRestore();
    Storage.prototype.setItem = originalSetItem;
  });

  it('should skip auto-save on initial mount', () => {
    const storageKey = 'test-form';
    const formData = { name: 'John' };
    
    renderHook(() => useAutoSave(storageKey, formData, 10));
    
    // Should not save on mount
    expect(localStorage.getItem(storageKey)).toBeNull();
  });

  it('should return null when loading non-existent data', () => {
    const { result } = renderHook(() => useAutoSave('non-existent-key', {}));
    
    const loaded = result.current.loadSavedData();
    expect(loaded).toBeNull();
  });
});


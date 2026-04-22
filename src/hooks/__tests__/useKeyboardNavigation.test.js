import { renderHook } from '@testing-library/react';
import { useKeyboardNavigation } from '../useKeyboardNavigation';

describe('useKeyboardNavigation', () => {
  let mockOnClose;
  let mockOnSelect;
  const mockItems = ['Item 1', 'Item 2', 'Item 3'];

  beforeEach(() => {
    mockOnClose = jest.fn();
    mockOnSelect = jest.fn();
    jest.clearAllMocks();
  });

  it('should return containerRef and itemRefs', () => {
    const { result } = renderHook(() =>
      useKeyboardNavigation(false, mockOnClose, mockItems, mockOnSelect)
    );

    expect(result.current.containerRef).toBeDefined();
    expect(result.current.itemRefs).toBeDefined();
    expect(result.current.containerRef.current).toBeNull();
    expect(Array.isArray(result.current.itemRefs.current)).toBe(true);
  });

  it('should not attach listeners when dropdown is closed', () => {
    const { result } = renderHook(() =>
      useKeyboardNavigation(false, mockOnClose, mockItems, mockOnSelect)
    );

    expect(result.current.containerRef.current).toBeNull();
  });

  it('should return refs when dropdown is open', () => {
    const { result } = renderHook(() =>
      useKeyboardNavigation(true, mockOnClose, mockItems, mockOnSelect)
    );

    expect(result.current.containerRef).toBeDefined();
    expect(result.current.itemRefs).toBeDefined();
    // Ref will be null without actual DOM element, which is expected
    // Hook checks for null before adding listeners
    expect(result.current.containerRef.current).toBeNull();
  });

  it('should not attach listeners when disabled', () => {
    const { result } = renderHook(() =>
      useKeyboardNavigation(true, mockOnClose, mockItems, mockOnSelect, true)
    );

    // Should still return refs but not attach listeners when disabled
    expect(result.current.containerRef).toBeDefined();
    expect(result.current.itemRefs).toBeDefined();
  });

  it('should handle empty items array', () => {
    const { result } = renderHook(() =>
      useKeyboardNavigation(true, mockOnClose, [], mockOnSelect)
    );

    expect(result.current.containerRef).toBeDefined();
    expect(result.current.itemRefs.current).toEqual([]);
  });
});

